var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var serveStatic = require('serve-static');

fs.readFile('messages.txt', {'encoding': 'utf-8'}, function (err, data) {
    var messages = [];

    if (!err && data.length !=0) {
        messages = parser(data);
    }

    app.use(bodyParser.urlencoded());
    app.use(cookieParser());
    app.use(serveStatic('public'));

    app.engine('jade', require('jade').__express);

    app.get('/', function(req, res) {
        var userAgent = req.get('User-Agent');
        var isYaBrowser = userAgent.indexOf('YaBrowser') == -1
            ? false
            : true;
        var yandexUser = isYaBrowser && 'Пользователь Яндекс Браузера';
        var adminNameFromCookie = req.cookies.authorized || yandexUser;

        res.render('start.jade', { messages: messages, admin: adminNameFromCookie}, function (err, data) {
            res.send(data);
        });
    });

    app.get('/remove*', function(req, res) {
        var msgIdToRemove = req.param('id');
        var arr = removeById(messages, msgIdToRemove);
        fs.writeFile('messages.txt', JSON.stringify(arr), function (err) {
            if (err) throw err;
            res.redirect('/');
        });
    });


    fs.readFile('admin.txt', {'encoding': 'utf-8'}, function (err, data) {
        var admins = [];
        if (!err && data.length !=0) {
            admins = parser(data);
        }

        app.get('/admin', function(req, res) {
            var userAgent = req.get('User-Agent');
            var isYaBrowser = userAgent.indexOf('YaBrowser') == -1
                ? false
                : true;

            var adminNameFromCookie = req.cookies.authorized;

            res.render('admin.jade', {admin: adminNameFromCookie, isYaUser: isYaBrowser}, function (err, data) {
                res.send(data);
            });

        });

        app.post('/authorize', function(req, res) {
            var flag = true;
            if (!err && data.length !=0) {
                admins.forEach(function (admin) {
                    if (admin.login == req.body.login && admin.password == req.body.password) {
                        flag = false;
                        res.cookie('authorized', admin.login);
                        res.redirect('/');
                    }
                });
                if (flag) {res.send("wrong login or/and password");}
            } else {
                res.send("wrong login or/and password");
            }
        });
        app.get('/signout', function(req, res) {
            res.clearCookie('authorized');
            res.redirect('/');
        });
    });

    app.post('/submit', function(req, res) {
        var date = new Date();
        var etaloneDate = new Date(3600*24*1000);
        var id = (date - etaloneDate).toString();
        messages.push({
            user: escapeSymbols(req.body.user),
            message: escapeSymbols(req.body.message),
            id: id
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

function removeById(arr, id) {
    return arr.forEach(function (item, i) {
        if (item.id == id) {
            arr.splice(i, 1);
        }
    });
}
