//создаём приложение
const app = require('express')();
const path = require('path');

//создаём сервис
const servicePath = '/service';
const Service = require(path.normalize(__dirname + '/..'));
const service = new Service();

//добавляем модули бизнес-логики
service.addSource(__dirname);

//пути для сервиса
app.post(servicePath, service.call());

app.get('/service/service.js', service.client());

//страница для тестов
app.get('/', function(req, res) {
    res.send('<html><head><meta charset="utf-8"></head><body>' +
        '<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>' +
        '<script src="/service/service.js"></script>' +
        '<script>cool.setEntryPoint("/service")</script>' +
        '</body></html>');
});

//слушаем порт
const port = 80;
app.listen(port);
console.log('Application listen port: ' + port);