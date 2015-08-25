var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var Promise = require('promise');
var Request = require('./request');

var Service = module.exports = function(o) {
    var _this = this;
    this.servicePath = o.servicePath || '/service';
    this.tempDataDir = path.normalize(__dirname + '/../' + (o.tempDataDir || '_temp'));

    //remove old and create new template directories
    rmdir = require('rimraf');
    rmdir(this.tempDataDir, function(err) {
        if (err) {
            throw err;
        }

        _this.createDirectoriesStructure();
        _this.createClientFile();
    });
};

//создаём временные файл для отдачи на клиенте
Service.prototype.createClientFile = function() {
    var _this = this;
    fs.readFile(path.normalize(__dirname + '/../client/cool.js'), function read(err, buffer) {
        if (err) {
            res.status(err.status).end();
            throw err;
        }

        var strFile = buffer.toString();
        var servicePathStringName = 'service_path_string';
        var servicePathStringIndex = strFile.indexOf(servicePathStringName) + servicePathStringName.length;
        var outStr = strFile.substr(0, servicePathStringIndex) + '\nservicePath = \'' + _this.servicePath + '\';' +
            strFile.substr(servicePathStringIndex);

        fs.writeFile(_this.tempDataDir + '/client/service.js', outStr, function(err) {
            if (err) {
                throw err;
            }

            console.log('The client script was created!');
        });
    });
};

//удаляем все временные файлы
Service.prototype.createDirectoriesStructure = function() {
    if (!fs.existsSync(this.tempDataDir)) {
        fs.mkdirSync(this.tempDataDir);
    }

    if (!fs.existsSync(this.tempDataDir + '/client')) {
        fs.mkdirSync(this.tempDataDir + '/client');
    }
};

//отдаём клиентский скрипт
Service.prototype.client = function() {
    return function() {
        var req = arguments[0];
        var res = arguments[1];
        var next = arguments[2];

        res.sendFile(this.tempDataDir + '/client/service.js', {}, function(err) {
            if (err) {
                console.log(err);
                res.status(err.status).end();
            }
        });
    }.bind(this);
};

//точка входа для вызова метода бизнес-логики
Service.prototype.call = function() {
    return function(req, res) {
        var service = this;
        bodyParser.urlencoded({extended: false})(req, res, function() {
            var method = req.body.method;
            var params = req.body.params;

            service.createRequest(method, params)
                .then(function(data) {
                    res.send({
                        status: 'ok',
                        data: 'lalala'
                    });
                })
                .catch(function(err) {
                    console.log(err);
                    if (err.code) {
                        res.status(err.code).send({
                            info: err.message,
                            details: err.details
                        });
                    } else {
                        res.send({
                            status: 'error',
                            info: err
                        });
                    }
                });
        });
    }.bind(this);
};

//создаём объект запроса к бизнес-логике
Service.prototype.createRequest = function(method, params) {
    return new Promise(function(resolve, reject) {
        //если метод бизнес-логики передан в неверном формате - информируем об этом пользователя
        if (!method || typeof method !== 'string' || !(/^[\w\d]+\.[\w\d]+$/.test(method))) {
            throw ({
                code: 415,
                message: 'Ошибка при передаче данных на сервер, ' +
                'метод бизнес-логики имеет неверный формат: ' + method,
                details: {
                    message: 'Ошибка в самом формате имени метода бизнес-логики',
                }
            });
        }

        //проверяем на валидность параметры метода бизнес-логики
        var data = {method: method};
        //на входе проверяем параметры на валидность, распарсиваем эти параметры
        try {
            //необходимо предусмотреть случаей, когда методы бизнес-логики могут быть вызваны без параметров
            data.params = params === undefined ? null : JSON.parse(req.body.params);
        } catch (e) {
            //если JSON не валидный - информируем об этом конечного пользователя
            res.send({
                status: 'error',
                info: {
                    code: 0,
                    message: 'Ошибка при передаче данных на сервер в методе: ' + req.body.method,
                    details: {
                        message: 'Параметры были переданы в невалидном виде и из не смогла распарсить функция JSON.parse',
                        reqBody: req.body,
                        error: e
                    }
                }
            });
            return;
        }

        //тут нам нужно проверить метод на существование и является ли он публичным
        var module = req.body.method.split('.')[0],
            methodName = req.body.method.split('.')[1],
            isExistForExternal = this._modules[module] && this._modules[module].getMethod(methodName) && this._modules[module].getMethod(methodName).isPublic;
        if (!isExistForExternal) {
            //если метод не является публичным, отправляем соответствующую информацию пользователю
            res.send({
                status: 'error',
                info: {
                    code: 0,
                    message: 'Не найден метод бизнес-логики: ' + req.body.method,
                    details: {
                        message: 'Метод, который вызвали методом post не является публичным или вообще не существует в бизнес-логике',
                        method: req.body.method
                    }
                }
            });
            return;
        }
    });
};
