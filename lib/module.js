'use strict';

var fs = require('fs');
var path = require('path');
var Method = require('./method');
var Error = require('./error')

module.exports = class Module {
    constructor(modulePath, service) {
        this.service = service;
        this.methods = {};

        var rawModule;

        this.path = modulePath;

        //забираем имя сервисного модуля
        this.name = path.basename(this.path).substr(1);

        //в корне должен лежать файлик с самим модулем - module.js
        fs.readdirSync(this.path).forEach(name => {
            var filePath = path.join(this.path, name);
            if (fs.lstatSync(filePath).isFile()) {
                if (name === 'module.js') {
                    rawModule = require(path.relative(__dirname, filePath));
                }
            }
        });

        if (rawModule === undefined) {
            throw "Cannot find module file in module directory: " + this.path;
        }

        //find init function
        if (typeof rawModule === 'object') {
            if (typeof rawModule.init === 'function') {
                this.initFunction = rawModule.init;
            }
        } else {
            throw 'Service module init need to be an object with methods.';
        }


        //init methods
        var methodsCount = 0;
        for (let methodName in rawModule.methods) {
            if (rawModule.methods.hasOwnProperty(methodName)) {
                methodsCount++;
                this.methods[methodName] = new Method(rawModule.methods[methodName], this);
            }
        }

        if (methodsCount === 0) {
            throw new Error('Module ' + this.name + ' hasn`t methods');
        }
    }

    init() {
        if (this.initFunction) {
            return new Promise(this.initFunction.bind(this))
                .then(() => {
                    console.log('Module ' + this.name + ' successfully initialized.');
                    return Promise.resolve(this);
                })
                .catch(error => {
                    console.error('Module ' + this.name + ' init error:', error);
                    return Promise.reject(this);
                });
        } else {
            console.log('Modile ' + this.name + ' successfully initialized without init function');
            return Promise.resolve(this);
        }
    }

    hasMethod(methodName) {
        return this.methods.hasOwnProperty(methodName);
    }

    getMethod(methodName) {
        if (this.hasMethod(methodName)) {
            return this.methods[methodName];
        } else {
            throw new Error({
                code: 405,
                message: `Method '${methodName}' has not found in module '${this.name}'`
            });
        }
    }

    getMethodName(method) {
        for (let methodName in this.methods) {
            if (this.methods.hasOwnProperty(methodName)) {
                if (this.methods[methodName] === method) {
                    return methodName;
                }
            }
        }

        throw new Error({
            code: 502,
            message: `MethodName has not found by method in module: ${this.name}`,
            details: 'В указанном модуле по экземпляру метода не удалось найти его имя. Сообщить администратору!'
        });
    }

    get ServiceError() {
        return Error;
    }
};
