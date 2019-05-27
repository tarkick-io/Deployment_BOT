var express = require('express'),
    fs = require('fs');
    bodyParser = require("body-parser")
    
    
var app = express();

app.use(bodyParser.json())

// Load endpoints 
app.use(require("./controllers"));

var server = app.listen( process.env.PORT || 3000, function(){
    console.log('Listening on port ' + server.address().port);
});

module.exports = app;