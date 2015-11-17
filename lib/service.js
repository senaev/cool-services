'use strict';

const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const Module = require('./module');
const ServiceError = require('./service-error');
const parseModuleMethod = require('./helpers/parse-module-method');

module.exports = class Service {
    constructor() {
        this.Request = require('./request');
        this.Call = require('./call');
    }

    //ищем и инициализируем модули
    addSource(sourcePath) {
        return this.findModulesPaths(sourcePath)
            .then(paths => {
                if (!paths.length) {
                    throw 'Directory ' + sourcePath + ' has not service modules';
                }
                return paths;
            })
            .then(this.initModulesByPaths.bind(this))
            .then(modules => {
                console.log('All service modules has been initialized.');
                this.modules = modules;
            })
            .catch(error => {
                console.error(error);
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
        return new Promise(resolve => {
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

            //find duplicate modules
            var duplicates = {};
            paths.forEach(strPath => {
                let name = path.basename(strPath).substr(1);
                if (duplicates[name]) {
                    duplicates[name].push(strPath);
                } else {
                    duplicates[name] = [strPath];
                }
            });

            let duplicatesCount = 0;
            for (let name in duplicates) {
                if (duplicates.hasOwnProperty(name)) {
                    if (duplicates[name].length < 2) {
                        delete duplicates[name];
                    } else {
                        duplicatesCount ++;
                    }
                }
            }

            if (duplicatesCount) {
                let error = 'Defined duplicate modules in service:\n';
                for (let name in duplicates) {
                    if (duplicates.hasOwnProperty(name)) {
                        error += `module --> ${name} in:\n`;
                        duplicates[name].forEach(pathName => error += pathName + '\n');
                    }
                }

                throw error;
            }

            resolve(paths);
        });
    }

    //выдаём клиентский яваскрипт файл
    client() {
        return (req, res) => {
            res.sendFile(path.join(__dirname, '../client/cool.js'), {}, function(err) {
                if (err) {
                    console.error(err);
                    res.status(err.status).end();
                }
            });
        };
    }

    //вызов метода бизнес-логики
    call(moduleMethod, params) {
        if (!arguments.length) {
            //for express.js
            return (req, res) => {
                var service = this;
                bodyParser.json()(req, res, function() {
                    var moduleMethod = req.body.method;
                    var params = req.body.params;

                    service.callInternal(moduleMethod, params)
                        .then(callResult => res.send(callResult))
                        .catch(callResult => res.status(500).send(callResult));
                });
            };
        } else {
            return this.callInternal(moduleMethod, params)
                .then(callResult => callResult.result)
                .catch(callResult => Promise.reject(callResult.error));
        }
    }

    //создание объекта запроса
    callInternal(moduleMethod, params) {
        var request = new this.Request(this, moduleMethod, params);
        return request.call();
    }

    //проверка модуля на существование по имени
    getModule(moduleName) {
        for (let key in this.modules) {
            if (this.modules.hasOwnProperty(key)) {
                if (this.modules[key].name === moduleName) {
                    return this.modules[key];
                }
            }
        }

        throw new ServiceError({
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
