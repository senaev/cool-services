'use strict';

//TODO: пока просто обёртка для корневого вызова метода бизнес-логики, в дальнейшем может быть дополнена другим
module.exports = class Request {
    constructor(service, moduleMethod, params) {
        this.service = service;
        this.moduleMethod = moduleMethod;
        this.params = params;
    }

    call() {
        var self = this;
        return new Promise(function(resolve, reject) {
            var moduleMethodNamesObj = self.parseModuleMethod(self.moduleMethod);
            var moduleName = moduleMethodNamesObj.moduleName;
            var methodName = moduleMethodNamesObj.methodName;

            var module = self.service.getModule(moduleName);

            return module.isPublic();
        });
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
