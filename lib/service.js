'use strict';

var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var Promise = require('promise');
var rmdir = require('rimraf');
var Request = require('./request');
var Module = require('./module');

module.exports = class Service {
    //ищем и инициализируем модули
    addSource(sourcePath) {
        var self = this;
        this.findModulesPaths(sourcePath)
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
            .catch(function(err) {
                console.error(err.stack);
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
    call() {
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

                    service.createRequest(moduleMethod, params)
                        .then(function(data) {
                            res.send({data: data});
                        })
                        .catch(function(err) {
                            if (typeof err === 'string') {
                                err = {message: err};
                            }

                            var code = err.code !== undefined ? err.code : 500;

                            var message;
                            if (err.message !== undefined) {
                                message = err.message;
                            } else {
                                message = 'Internal Server Error'
                            }

                            var details;
                            if (err.details !== undefined) {
                                details = err.details;
                            } else if (err.stack !== undefined) {
                                details = err.stack;
                            }

                            res.send({error: {
                                code: code,
                                message: message,
                                details: details
                            }});
                        });
                });
            }.bind(this);
        }
    }

    //создание объекта запроса
    createRequest(moduleMethod, params) {
        var self = this;
        var request = new Request(this, moduleMethod, params);
        return request.call();
    }

    //проверка модуля на существование по имени
    getModule(moduleName) {
        var module;
        for (let key in this.modules) {
            if (this.modules.hasOwnProperty(key)) {
                if (this.modules[key].getName() === moduleName) {
                    return module;
                }
            }
        }

        throw {
            code: 400,
            message: 'Module ' + moduleName + ' has not found in service',
            details: 'На сервисе не найден запрашиваемый модуль бизнес-логики'
        }
    }
};
