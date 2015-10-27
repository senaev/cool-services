'use strict';

//TODO: callTimeout have to be variable
var CALL_TIMEOUT = 10000;

var promiseFunction = require('promise-function');

module.exports = class Call {
    constructor(method, params, request) {
        //save input params
        this.input = JSON.parse(JSON.stringify(params));

        this.params = params;
        this.method = method;
        this.request = request;
    }

    call() {
        return this.callBefore();
    }

    callBefore() {
        if (this.method.before) {
            return promiseFunction(this.method.before, this.params, this, CALL_TIMEOUT);
        } else {
            return Promise.resolve(this.params);
        }
    }

    getModuleMethod() {
        return this.method.getName();
    }
};