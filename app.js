var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var serveStatic = require('serve-static');
var vow = require('vow');

app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(serveStatic('public'));

app.engine('jade', require('jade').__express);

app.get('/', checkAuth, function (req, res) {

    fs.readdir('messages', function (err, files) {
        var messages = [];
        var userAgent = req.get('User-Agent');
        var isYaBrowser = userAgent.indexOf('YaBrowser') !== -1;
        var yandexUser = isYaBrowser && 'Пользователь Яндекс Браузера';
        var adminName = yandexUser || req.adminName;

        files = files.map(function (file) {
            return 'messages/' + file;
        });

        vow.all(readAllFiles(files, 'utf-8')).then(function (results) {
            res.render('start.jade', {isAdmin: req.isAdmin, messages: results, adminName: adminName}, function (err, data) {
                res.send(data);
            });
        });
    });
});

app.get('/remove*', function(req, res) {
    var msgIdToRemove = req.param('id');
    fs.unlink('messages/' + msgIdToRemove + '.txt', function (err) {
        res.redirect('/');
    });
});

app.post('/submit', function(req, res) {
    var date = new Date();
    var etaloneDate = new Date(3600*24*1000);
    var id = (date - etaloneDate).toString();

    var message = {
        user: escapeSymbols(req.body.user),
        message: escapeSymbols(req.body.message),
        id: id
    };

    fs.writeFile('messages/'+id+'.txt', JSON.stringify(message), function (err) {
        if (err) throw err;
        res.redirect('/');
    });
});

app.get('/admin', checkAuth, function(req, res) {
    var userAgent = req.get('User-Agent');
    var isYaBrowser = userAgent.indexOf('YaBrowser') !== -1;
    var adminName = req.adminName;

    res.render('admin.jade', {isAdmin: req.isAdmin, adminName: req.adminName, isYaUser: isYaBrowser}, function (err, data) {
        res.send(data);
    });
});

app.post('/authorize', function(req, res) {
    fs.readFile('admin.txt', {'encoding': 'utf-8'}, function (err, data) {
        var admins = [];
        if (!err && data.length !=0) {
            admins = parser(data);
        }
        var flag = true;
        if (!err && data.length !=0) {
            admins.forEach(function (admin) {
                if (admin.login == req.body.login && admin.password == req.body.password) {
                    flag = false;
                    res.cookie('auth', admin.login + ':' + admin.password);
                    res.redirect('/');
                }
            });
            if (flag) {res.send("wrong login or/and password");}
        } else {
            res.send("wrong login or/and password");
        }
    });
});
app.get('/signout', function(req, res) {
    console.log('bla');
    res.clearCookie('auth');
    res.redirect('/');
});

var server = app.listen(3000, function() {
    console.log('listened on localhost:3000');
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

function checkAuth(req, res, next) {
    var auth = req.cookies.auth;
    if (!auth) {
        next();
        return;
    }

    var authVal = auth.split(':');
    fs.readFile('admin.txt', {'encoding': 'utf-8'}, function (err, data) {
        req.isAdmin = false;
        if (!err && data.length !=0) {
            var admins = parser(data);
            admins.forEach(function (admin) {
                if (admin.login == authVal[0] && admin.password == authVal[1]) {
                    flag = false;
                    req.isAdmin = true;
                    req.adminName = authVal[0];
                }
            });
        }

        next();
    });
}

function readFile(filename, encoding) {
    var deffered = vow.defer();
    var promise = deffered.promise();

    fs.readFile(filename, encoding, function(err, data) {
        if (err) return deffered.reject(err);
        deffered.resolve(parser(data));
    });

    return promise;
}

function readAllFiles(files, encoding) {
    return files.map(function (file, i) {
        return readFile(file, encoding);
    });
}
