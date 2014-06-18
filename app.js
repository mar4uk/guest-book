var express = require('express');
var app = express();
var fs = require("fs");

var messages = [];

app.get("/", function(req, res) {
    res.redirect("start");
});

app.get("/submit", function(req, res) {
    messages.push(req.param('message'));
    res.redirect("start");
});

app.get("/start", function(req, res) {
    fs.readFile(__dirname + '/public/start.html', function (err, data) {
        if (err) throw err;
        data = data.toString().replace('$OUTPUT$', messages.join("\n"));
        res.send(data);
    });
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(3000, function() {
    console.log("listened on localhost:3000");
});