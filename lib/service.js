'use strict'

var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var Promise = require('promise');
var rmdir = require('rimraf');
var Request = require('./request');

module.exports = class Service {
    constructor(o) {
        this.modules = {};
    }

    //ищем и инициализируем модули
    addSource(sourcePath) {
        this.findModulesPaths(sourcePath)
            .then(function(paths) {
                if (!paths.length) {
                    throw 'Directory ' + sourcePath + ' has not service modules';
                }
                return paths;
            })
            .then(this.initModulesByPaths.bind(this))
            .then(function() {
                console.log(arguments);
            })
            .catch(function(err) {
                console.error('Service modules was not init because of module: ' + err);
            });
    }

    //функция - обёртка инициализации всех модулей бизнес-логики
    initModulesByPaths(paths) {
        var promises = [];
        for (var key in paths) {
            if (paths.hasOwnProperty(key)) {
                var modulePath = paths[key];
                promises.push(this.initModuleByPath(modulePath));
            }
        }

        return Promise.all(promises);
    }

    initModuleByPath(modulePath) {
        var module;

        //забираем имя сервисного модуля
        var moduleName = path.basename(modulePath).substr(1);

        //в корне должен лежать файлик с самим модулем - module.js
        fs.readdirSync(modulePath).forEach(function(name) {
            var filePath = path.join(modulePath, name);
            if (fs.lstatSync(filePath).isFile()) {
                if (name === 'module.js') {
                    module = require(path.relative(__dirname, filePath));
                }
            }
        });

        if (module === undefined) {
            throw "Cannot find module file in module directory: " + modulePath;
        }

        var init;
        if (typeof module === 'object') {
            if (typeof module.init === 'function') {
                init = module.init;
            }
        } else if (typeof module === 'function') {
            init = module;
        } else {
            throw 'Service module need to be a function or object with methods.';
        }

        //chech methods to valid
        for (var key in module.methods) {
            if (module.methods.hasOwnProperty(key)) {
                //if method isn`t a function, is must be a object with property "method"
                if (typeof module.methods[key] !== 'function') {
                    if (typeof module.methods[key] !== 'object') {
                        throw new Error('Method ne' + moduleName + '.' + key);
                    } else {
                        //if method is a object we need to check if method has a method function
                        if (typeof module.methods[key].method !== 'function') {
                            throw new Error('Method has not method function: ' + moduleName + '.' + key);
                        }
                    }
                }
            }
        }

        if (init) {
            return new Promise(init)
                .then(function() {
                    console.log('Module ' + moduleName + ' successfully initialized.');
                })
                .catch(function(error) {
                    console.error('Module ' + moduleName + ' init error:', error);
                    return Promise.reject(moduleName);
                });
        } else {
            console.log('Modile ' + moduleName + ' successfully initialized without init function');
        }
    }

    //ищем все модули в одной директории
    findModulesPaths(sourcePath) {
        return new Promise(function(resolve, reject) {
            var paths = [];

            (function recursiveSearch(rootPath) {
                var dirs = searchInOneDir(rootPath);
                dirs.forEach(function(dir) {
                    recursiveSearch(dir);
                });
            })(sourcePath);

            function searchInOneDir(rootPath) {
                var dirs = [];

                var list = fs.readdirSync(rootPath);
                list.map(function(name) {
                    var filePath = path.join(rootPath, name);
                    if (fs.lstatSync(filePath).isDirectory()) {
                        if (name.indexOf('@') === 0) {
                            paths.push(filePath);
                        } else {
                            dirs.push(filePath);
                        }
                    }
                });

                return dirs;
            }

            resolve(paths);
        });
    }

    //выдаём клиентский яваскрипт файл
    client() {
        return function() {
            var req = arguments[0];
            var res = arguments[1];
            var next = arguments[2];

            res.sendFile(path.join(__dirname, '../client/cool.js'), {}, function(err) {
                if (err) {
                    console.error(err);
                    res.status(err.status).end();
                }
            });
        }.bind(this);
    }

    //вызов метода бизнес-логики
    call() {
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
    }

    //создание объекта запроса
    createRequest(moduleMethod, params) {
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
    }
};
