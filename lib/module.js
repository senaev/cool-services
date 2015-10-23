'use strict';

var Method = require('./method');

module.exports = class Module {
    constructor (rawModule) {
        this.methods = {};

        for (let methodName in rawModule.methods) {
            if (rawModule.methods.hasOwnProperty(methodName)) {
                this.methods[methodName] = new Method(rawModule.methods[methodName]);
            }
        }
    }
};
