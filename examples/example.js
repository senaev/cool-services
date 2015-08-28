//создаём приложение
var express = require('express');
var app = express();
var path = require('path');

//создаём сервис
var servicePath = '/service';
var Service = require(path.normalize(__dirname + '/..'));
var service = new Service({sourcePath: __dirname});

//пути для сервиса
app.post(servicePath, service.call());
app.get(servicePath + '/service.js', service.client());

//страница для тестов
app.get('/', function(req, res) {
    res.send('<html><head><meta charset="utf-8"></head><body>' +
        '<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>' +
        '<script src="/service/service.js"></script>' +
        '</body></html>');
});

//слушаем порт
var port = 80;
app.listen(port);
console.log('Application listen port: ' + port);