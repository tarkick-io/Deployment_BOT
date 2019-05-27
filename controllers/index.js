var router = require("express").Router(),
    fs = require("fs");

// Setup routes
fs.readdir("./controllers", (err, files) => {
    files.forEach(file => {
      splitFile = file.split(".");
      if (file !== "index.js" && splitFile[1] == "js") {
        router.use(
          "/" + splitFile[0].toLowerCase(),
          require("./" + splitFile[0].toLowerCase())
        );
      }
  
      // Handle validation errors
      router.use(function(err, req, res, next) {
        if (err.name === "ValidationError") {
          return res.status(422).json({
            errors: Object.keys(err.errors).reduce(function(errors, key) {
              errors[key] = err.errors[key].message;
  
              return errors;
            }, {})
          });
        }
  
        return next(err);
      });
    });
  });

  module.exports = router;