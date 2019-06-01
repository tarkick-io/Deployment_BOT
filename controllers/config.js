var router = require("express").Router(),
  nodegit = require("nodegit"),
  config = require("../core/config"),
  fs = require("fs"),
  ncp = require("ncp").ncp;

var authenticationCallbacks = {
  certificateCheck: function skipCertCheck() {
    return 1;
  },
  credentials: function() {
    return nodegit.Cred.userpassPlaintextNew(
      config.GITHUB_USERNAME,
      config.GITHUB_ACCESS_TOKEN
    );
  }
};

router.post("/", function(req, res, next) {
  var actionType = req.body.action;
  var repoName = req.body.repository.full_name;
  var repo, index, oid, remote;

  if (actionType == "created") {
    var repoLocalPath = `./${repoName}`;
    nodegit
      .Clone(`https://github.com/${repoName}`, repoLocalPath)
      .then(function(repoResult) {
        repo = repoResult;

        var currentDir = __dirname;

        // Copy all config files to the repo folder
        ncp(`./deployment_files/`, `${repoLocalPath}/`, function(err) {
          if (err) {
            return console.error(err);
          }

          // Add files, commit and push to git
          repo
            .refreshIndex()
            .then(function(indexResult) {
              index = indexResult;
              return index.addAll();
            })
            .then(function() {
              return index.write();
            })
            .then(function() {
              return index.writeTree();
            })
            .then(function(oidResult) {
              var author = nodegit.Signature.create(
                "Tarkick.io BOT",
                "tarkick_bot@tarkick.io",
                123456789,
                60
              );
              var committer = nodegit.Signature.create(
                "Tarkick.io BOT",
                "tarkick_bot@tarkick.io",
                987654321,
                90
              );

              return repo.createCommit(
                "HEAD",
                author,
                committer,
                "Create deployment config",
                oidResult,
                []
              );
            })
            .done(function(commitId) {
              /// PUSH
              repo
                .getRemote("origin")
                .then(function(remoteResult) {
                  return remoteResult.push(
                    ["refs/heads/master:refs/heads/master"],
                    {
                      callbacks: authenticationCallbacks
                    }
                  );
                })
                .then(function() {
                  console.log("remote Pushed!");
                })
                .catch(function(reason) {
                  console.log(reason);
                });
            });
        });
      });
  }

  res.status(200);
  res.json({});
});

module.exports = router;
