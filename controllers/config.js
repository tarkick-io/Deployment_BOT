var router = require("express").Router(),
    nodegit = require("nodegit"),
    config = require('../core/config'),
    fs = require('fs');

var authenticationCallbacks = {
    certificateCheck: function skipCertCheck() { return 1; },
    credentials: onCredentialCheck,
};

function onCredentialCheck() {
    return nodegit.Cred.userpassPlaintextNew(config.GITHUB_USERNAME, config.GITHUB_ACCESS_TOKEN);;
}

router.post("/", function(req, res, next) {
    var actionType = req.body.action;
    var repoName = req.body.repository.full_name;
    var repo, index, oid, remote;

    if (actionType == 'created') {
        var repoLocalPath = `/tmp/${repoName}` 
        nodegit.Clone(`https://github.com/${repoName}`, repoLocalPath).then(function (repoResult) {
            repo = repoResult;
            if (!fs.existsSync(repoLocalPath + '/deploy')) {

                // Create deployment config folder
                fs.mkdirSync(repoLocalPath + '/deploy');

                var currentDir = __dirname

                // Copy apache DEV config
                fs.copyFileSync(`${currentDir}/../deployment_files/dev.conf`, `${repoLocalPath}/deploy/dev.conf`)

                // Copy apache PROD config
                fs.copyFileSync(`${currentDir}/../deployment_files/prod.conf`, `${repoLocalPath}/deploy/prod.conf`)

                // Add files, commit and push to git
                repo.refreshIndex().then(function (indexResult) {
                    index = indexResult;
                    return index.addAll();
                }).then(function () {
                    return index.write()
                }).then(function () {
                    return index.writeTree()
                }).then(function(oidResult) {
                    var author = nodegit.Signature.create("Tarkick.io BOT", "tarkick_bot@tarkick.io", 123456789, 60);
                    var committer = nodegit.Signature.create("Tarkick.io BOT", "tarkick_bot@tarkick.io", 987654321, 90);
                  
                    return repo.createCommit('HEAD', author, committer, 'Create deployment config', oidResult, []);
                })
                .done(function(commitId) {
                    
                    console.log("New Commit: ", commitId);

                     /// PUSH
                     repo.getRemote('origin').then(function(remoteResult) {
                        return remoteResult.push(
                        ['refs/heads/master:refs/heads/master'], {
                            callbacks: authenticationCallbacks
                        })
                    })
                    .then(function() {
                        console.log('remote Pushed!')
                    })
                    .catch(function(reason) {
                        console.log(reason);
                    })
                });
            }
        })
    }

    res.status(200)
    res.json({})
});
  
module.exports = router;