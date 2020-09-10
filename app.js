var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var router = require('./router');
var session = require('express-session');
var cookieParser = require('cookie-parser');

var app = express();
app.use('/node_modules', express.static('./node_modules'));
app.use('/public/', express.static('./public/'))

app.engine('html', require('express-art-template'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    name: 'sid',
    secret: 'cw-app-2020',
    resave: false,
    saveUninitialized: true,
    cookie: {path: '/', httpOnly: true},
}));

app.use(cookieParser());

app.use(router);

var server = app.listen(1608, '0.0.0.0', function () {
    console.log("Seriver is running at port 1608");
    var host = server.address().address;
    var port = server.address().port;
    console.log("Adress: http://%s:%s", host, port);
})
