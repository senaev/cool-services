'use strict';

const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const ServiceError = require('./service-error');


module.exports = class Service {
    constructor() {
        this.Request = require('./request');
        this.Call = require('./call');
        this.Module = require('./module');

        this.modules = [];
        this.externals = {};
    }

    //ищем и инициализируем модули
    addSource(sourcePath) {
        const paths = this.findModulesPaths(sourcePath);
        if (!paths.length) {
            throw 'Directory ' + sourcePath + ' has not service modules';
        }

        return this.initModulesByPaths(paths)
            .then(modules => {
                for (let key in modules) {
                    if (modules.hasOwnProperty(key)) {
                        let module = modules[key];
                        if (this.hasInternalModule(module.name)) {
                            throw new Error(`Module is already in service: ${module.name}. Path: ${module.path}`);
                        } else {
                            this.modules.push(module)
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
                return Promise.reject(error);
            });
    }

    //добавляем внешне модули
    addExternal(externals) {
        for (let entryPoint in externals) {
            if (externals.hasOwnProperty(entryPoint)) {
                let moduleNamesArr = typeof externals[entryPoint] === 'string'
                    ? [externals[entryPoint]]
                    : externals[entryPoint];

                for (let key in moduleNamesArr) {
                    if (moduleNamesArr.hasOwnProperty(key)) {
                        let moduleName = moduleNamesArr[key];
                        if (!this.externals.hasOwnProperty(moduleName)) {
                            this.externals[moduleName] = entryPoint;
                        } else {
                            throw new Error(`Module ${moduleName} is already defined in service externals`);
                        }
                    }
                }
            }
        }
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
        var module = new this.Module({
            service: this,
            modulePath: modulePath
        });
        return module.init();
    }

    //ищем все модули в одной директории
    findModulesPaths(sourcePath) {
        var paths = [];

        (function recursiveSearch(rootPath) {
            var dirs = searchInOneDir(rootPath);
            dirs.forEach(function (dir) {
                recursiveSearch(dir);
            });
        })(sourcePath);

        function searchInOneDir(rootPath) {
            var dirs = [];

            var list = fs.readdirSync(rootPath);
            list.map(function (name) {
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
                    duplicatesCount++;
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

        return paths;
    }

    //выдаём клиентский яваскрипт файл
    client() {
        return (req, res) => {
            res.sendFile(path.join(__dirname, '../client/cool.js'), {}, function (err) {
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
                bodyParser.json()(req, res, function () {
                    var moduleMethod = req.body.method;
                    var params = req.body.params;

                    service.callRequest(moduleMethod, params, true)
                        .then(callResult => res.send(callResult))
                        .catch(callResult => res.status(500).send(callResult));
                });
            };
        } else {
            return this.callRequest(moduleMethod, params)
                .then(callResult => callResult.result)
                .catch(callResult => Promise.reject(callResult.error));
        }
    }

    //создание объекта запроса
    callRequest(moduleMethod, params, isInternal) {
        var request = new this.Request({
            service: this,
            moduleMethod: moduleMethod,
            params: params,
            isInternal: isInternal
        });

        return request.call()
            .then(result => JSON.parse(JSON.stringify(result)))
            .catch(error => Promise.reject(JSON.parse(JSON.stringify(error))));
    }

    //проверка на существование интернал-модуля
    hasInternalModule(moduleName) {
        for (let key in this.modules) {
            if (this.modules.hasOwnProperty(key)) {
                if (this.modules[key].name === moduleName) {
                    return true;
                }
            }
        }

        return false;
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

        if (this.externals.hasOwnProperty(moduleName)) {
            return new this.Module({
                isExternal: true,
                service: this,
                moduleName: moduleName,
                entryPoint: this.externals[moduleName]
            });
        }

        throw new ServiceError({
            code: 400,
            message: `Module ${moduleName} has not found in service`,
            details: 'На сервисе не найден запрашиваемый модуль бизнес-логики'
        });
    }

    //получаем модуль и метод по строке moduleMethod
    getModuleAndMethod(moduleMethod) {
        var moduleMethodNamesObj = Service.parseModuleMethod(moduleMethod);

        let module = this.getModule(moduleMethodNamesObj.moduleName);
        let method;
        if (!module.isExternal) {
            method = module.getMethod(moduleMethodNamesObj.methodName);
        }

        return {
            module: module,
            method: method
        };
    }

    get modulesNames() {
        let o = {};
        if (this.hasInternalModules) {
            o.internal = [];
            this.modules.forEach(module => o.internal.push(module.name));
        }

        if (this.hasExternalModules) {
            o.external = [];
            for (let key in this.externals) {
                if (this.externals.hasOwnProperty(key)) {
                    o.external.push(key);
                }
            }
        }

        return o;
    }

    get hasInternalModules() {
        return this.modules && this.modules.length;
    }

    get hasExternalModules() {
        for (let key in this.externals) {
            if (this.externals.hasOwnProperty(key)) {
                return true;
            }
        }

        return false;
    }

    get callInternal() {
        return this.callRequest;
    };

    static parseModuleMethod(moduleMethod) {
        if (typeof moduleMethod !== 'string') {
            throw 'ModuleMethod MUST be a string.';
        }

        const pointIndex = moduleMethod.lastIndexOf('.');

        if (pointIndex === -1) {
            throw 'ModuleMethod must have dot: ' + moduleMethod;
        }

        const moduleName = moduleMethod.substr(0, pointIndex);
        const methodName = moduleMethod.substr(pointIndex + 1);

        const modulePartsArray = moduleName.split('.');
        for (let key in modulePartsArray) {
            if (modulePartsArray.hasOwnProperty(key)) {
                if (!(/^[\w\d]+[\w\d\-]*[\w\d]+$/.test(modulePartsArray[key]))) {
                    throw 'Invalid module name: ' + moduleName;
                }
            }
        }

        if (!(/^[\w\d]+[\w\d\-]*[\w\d]+$/.test(methodName))) {
            throw 'Invalid method name: ' + methodName;
        }

        return {
            moduleName: moduleName,
            methodName: methodName
        }
    };
};
