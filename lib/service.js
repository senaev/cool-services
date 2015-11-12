'use strict';

var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var Promise = require('promise');
var rmdir = require('rimraf');
var Request = require('./request');
var Module = require('./module');
var Error = require('./error');
var stackTrace = require('stack-trace');
var parseModuleMethod = require('./helpers/parse-module-method');
var ServiceError = require('./error');

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});

module.exports = class Service {
    //ищем и инициализируем модули
    addSource(sourcePath) {
        var self = this;
        return this.findModulesPaths(sourcePath)
            .then(function(paths) {
                if (!paths.length) {
                    throw 'Directory ' + sourcePath + ' has not service modules';
                }
                return paths;
            })
            .then(this.initModulesByPaths.bind(this))
            .then(function(modules) {
                console.log('All service modules has been initialized.');
                self.modules = modules;
            })
            .catch(function(error) {
                console.error(error.stack);
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

    //инициализируем один модуль по пути к нету
    initModuleByPath(modulePath) {
        var module = new Module(modulePath, this);
        return module.init();
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
    call(moduleMethod, params) {
        //TODO: Add ability to call method from code
        /*
         app.post('/service', service.call());
         */
        if (!arguments.length) {
            //for express.js
            return function(req, res) {
                var service = this;
                bodyParser.json()(req, res, function() {
                    var moduleMethod = req.body.method;
                    var params = req.body.params;

                    service.callInternal(moduleMethod, params)
                        .then(function(callResult) {
                            res.send(callResult);
                        })
                        .catch(function(callResult) {
                            if (callResult instanceof Error || callResult instanceof ServiceError) {
                                res.status(500).send({
                                    error: new ServiceError(callResult)
                                });
                            } else {
                                res.status(500).send(callResult);
                            }
                        });
                });
            }.bind(this);
        } else {
            return this.callInternal(moduleMethod, params)
                .then(callResult => callResult.result)
                .catch(callResult => {
                    return Promise.reject(callResult.error);
                });
        }
    }

    //создание объекта запроса
    callInternal(moduleMethod, params) {
        var request = new Request(this, moduleMethod, params);
        return request.call();
    }

    //проверка модуля на существование по имени
    getModule(moduleName) {
        var module;
        for (let key in this.modules) {
            if (this.modules.hasOwnProperty(key)) {
                if (this.modules[key].name === moduleName) {
                    return this.modules[key];
                }
            }
        }

        throw new Error({
            code: 400,
            message: `Module '${moduleName}' has not found in service`,
            details: 'На сервисе не найден запрашиваемый модуль бизнес-логики'
        });
    }

    //получаем метод по строке moduleMethod
    getMethod(moduleMethod) {
        var moduleMethodNamesObj = parseModuleMethod(moduleMethod);

        return this.getModule(moduleMethodNamesObj.moduleName)
            .getMethod(moduleMethodNamesObj.methodName);
    }
};
