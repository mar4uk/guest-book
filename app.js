var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');

fs.readFile('messages.txt', {'encoding': 'utf-8'}, function (err, data) {
    var messages = [];
    if (!err && data.length !=0) {
        messages = parser(data);
    }

    app.use(bodyParser.urlencoded());
    app.engine('jade', require('jade').__express);

    app.get('/', function(req, res) {
        var arr = messages.map(function (item) {
            return '<p>'+ item.user + ': ' + item.message+'</p>'
        });
        res.render('start.jade', {messages: arr.join('')}, function (err, data) {
            res.send(data);
        });
    });

    app.post('/submit', function(req, res) {
        messages.push({
            user: escapeSymbols(req.body.user),
            message: escapeSymbols(req.body.message)
        });
        fs.writeFile('messages.txt', JSON.stringify(messages), function (err) {
            if (err) throw err;
            res.redirect('/');
        });
    });

    var server = app.listen(3000, function() {
        console.log('listened on localhost:3000');
    });
});

function parser(str) {
    return JSON.parse(str);
}

function escapeSymbols(msg) {
    return msg
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '\'')
            .replace(/"/g, '&quot;');
}

