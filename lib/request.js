'use strict';

var Call = require('./call');

//TODO: пока просто обёртка для корневого вызова метода бизнес-логики, в дальнейшем может быть дополнена другим
module.exports = class Request {
    constructor(service, moduleMethod, params) {
        this.service = service;
        this.moduleMethod = moduleMethod;
        this.params = params;
    }

    call() {
        return new Promise(function(resolve) {
            var moduleMethodNamesObj = this.parseModuleMethod(this.moduleMethod);
            var moduleName = moduleMethodNamesObj.moduleName;
            var methodName = moduleMethodNamesObj.methodName;

            var module = this.service.getModule(moduleName);
            var method = module.getMethod(methodName);

            if (method.isPublic) {
                var call = new Call(method, this.params, this);
                resolve(call.call());
            } else {
                throw {
                    code: 405,
                    message: `Method has not found: ${this.moduleMethod}`,
                    details: `Метод не является публичным: ${this.moduleMethod}`
                }
            }
        }.bind(this));
    }

    parseModuleMethod(moduleMethod) {
        if (typeof moduleMethod !== 'string') {
            throw 'ModuleMethod need to be a string.';
        }

        var pointIndex = moduleMethod.lastIndexOf('.');

        if (pointIndex === -1) {
            throw 'ModuleMethod need to have dot: ' + moduleMethod;
        }

        var moduleName = moduleMethod.substr(0, pointIndex);
        var methodName = moduleMethod.substr(pointIndex + 1);

        var modulePartsArray = moduleName.split('.');
        for(let key in modulePartsArray) {
            if (modulePartsArray.hasOwnProperty(key)) {
                if (!(/^[\w\d]+[\w\d\-]*[\w\d]+$/.test(modulePartsArray[key]))) {
                    throw 'Invalid ModuleName: ' + moduleName;
                }
            }
        }

        if (!(/^[\w\d]+[\w\d\-]*[\w\d]+$/.test(methodName))) {
            throw 'MethodName is not valid: ' + methodName;
        }

        return {
            moduleName: moduleName,
            methodName: methodName
        }
    }
};
