var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var Promise = require('promise');
var rmdir = require('rimraf');
var Request = require('./request');

var Service = module.exports = function(o) {
    var _this = this;

    this.tempDataDir = path.normalize(__dirname + '/../' + (o.tempDataDir || '_temp'));
    if (!o.sourcePath) {
        throw 'sourcePath is required parameter for service.';
    } else {
        this.sourcePath = o.sourcePath;
    }

    this.modules = {};
    this.findAndInitModules();

    //remove old and create new template directories
    rmdir(this.tempDataDir, function(err) {
        if (err) {
            throw err;
        }

        _this.createDirectoriesStructure();
        _this.createClientFile();
    });
};

Service.prototype.findAndInitModules = function() {
    var _this = this;
    this.findModulesPaths();
    if (!this.serviceModulesPaths.length) {
        throw 'В каталоге ' + this.sourcePath + ' не найдены модули бизнес-логики';
    }

    this.initModulesByPaths(function() {
        console.log('Modiles were init.');
    });
};

Service.prototype.initModulesByPaths = function(done) {
    this.serviceModulesPaths.forEach(function(modulePath) {
        var module;
        var modules = [];
        fs.readdirSync(modulePath).forEach(function(name) {
            var filePath = path.join(modulePath, name);
            if (fs.lstatSync(filePath).isFile()) {
                if (name.indexOf('$') === 0) {
                    modules.push(require(path.relative(__dirname, filePath)));
                } else if (name === 'module.js') {
                    console.log(require(path.relative(__dirname, filePath)));
                }
            }
        });

        console.log(module)
    });
};

Service.prototype.findModulesPaths = function() {
    var _this = this;
    this.interfaceModulesPaths = [];
    this.serviceModulesPaths = [];

    (function recursiveSearch(rootPath) {
        var dirs = searchInOneDir(rootPath);
        dirs.forEach(function(dir) {
            recursiveSearch(dir);
        });
    }) (this.sourcePath);

    function searchInOneDir(rootPath) {
        var dirs = [];

        var list = fs.readdirSync(rootPath);
        list.map(function(name) {
            var filePath = path.join(rootPath, name);
            if (fs.lstatSync(filePath).isDirectory()) {
                if (name.indexOf('@') === 0) {
                    _this.serviceModulesPaths.push(filePath);
                } else if (name.indexOf('#') === 0) {
                    _this.interfaceModulesPaths.push(filePath);
                } else {
                    dirs.push(filePath);
                }
            }
        });

        return dirs;
    }
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
        var servicePathStringName = '//service_path_string';
        var servicePathStringIndex = strFile.indexOf(servicePathStringName);
        var outStr = strFile.substr(0, servicePathStringIndex) + 'servicePath = \'' + _this.servicePath + '\';' +
            strFile.substr(servicePathStringIndex + servicePathStringName.length);

        fs.writeFile(_this.tempDataDir + '/client/service.js', outStr, function(err) {
            if (err) {
                throw err;
            }

            console.log('Client script file created!');
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
                res.status(err.status).end();
            }
        });
    }.bind(this);
};

//точка входа для вызова метода бизнес-логики
Service.prototype.call = function() {
    //for express.js
    return function(req, res) {
        var service = this;
        bodyParser.json()(req, res, function() {
            var moduleMethod = req.body.method;
            var params = req.body.params;

            service.createRequest(moduleMethod, params)
                .then(function(data) {
                    res.send(data);
                })
                .catch(function(err) {
                    var code = err.code || 500;
                    res.status(code).send({
                        message: err.message,
                        details: err.details
                    });
                });
        });
    }.bind(this);
};

//создаём объект запроса к бизнес-логике
Service.prototype.createRequest = function(moduleMethod, params) {
    return new Promise(function(resolve, reject) {
        //если метод бизнес-логики передан в неверном формате - информируем об этом пользователя
        if (!moduleMethod || typeof moduleMethod !== 'string' || !(/^[\w\d]+\.[\w\d]+$/.test(moduleMethod))) {
            throw ({
                code: 400,
                message: 'Ошибка при передаче данных на сервер, ' +
                'метод бизнес-логики имеет неверный формат: ' + moduleMethod,
                details: 'Ошибка в самом формате имени метода бизнес-логики'
            });
        }

        var moduleName = moduleMethod.split('.')[0];
        var methodName = moduleMethod.split('.')[1];

        //TODO: тут нам нужно проверить метод на существование и является ли он публичным
        resolve({
            module: moduleName,
            method: methodName,
            data: params
        });
    });
};
