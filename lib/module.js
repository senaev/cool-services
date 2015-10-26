'use strict';

var fs = require('fs');
var path = require('path');
var Method = require('./method');

module.exports = class Module {
    constructor(modulePath, service) {
        var self = this;

        this.service = service;
        this.methods = {};

        var rawModule;

        this.path = modulePath;

        //забираем имя сервисного модуля
        this.name = path.basename(this.path).substr(1);

        //в корне должен лежать файлик с самим модулем - module.js
        fs.readdirSync(this.path).forEach(function(name) {
            var filePath = path.join(self.path, name);
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
        this.initFunction;
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
        var self = this;
        if (this.initFunction) {
            return new Promise(this.initFunction.bind(this))
                .then(function() {
                    console.log('Module ' + self.getName() + ' successfully initialized.');
                    return Promise.resolve(self);
                })
                .catch(function(error) {
                    console.error('Module ' + self.getName() + ' init error:', error);
                    return Promise.reject(self);
                });
        } else {
            console.log('Modile ' + this.getName() + ' successfully initialized without init function');
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
            throw {
                code: 405,
                message: 'Method not found: ' + methodName + ' in module: ' + this.getName(),
                details: 'В данном модуле бизнес-логики отсутствует указанный метод'
            }
        }
    }

    getName() {
        return this.name;
    }

    //TODO: add helpers to module functional
};
