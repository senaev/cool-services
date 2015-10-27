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
        var self = this;
        //call before
        return this.callBefore()
            //call method
            .then(this.callMethod.bind(this))
            .then(function(result) {
                self.result = result;
                return result;
            })
            //call after
            .then(self.callAfter.bind(this));

        //TODO: проверять выходные параметры на undefined
    }

    /**
     * Вызывается перед вызовом метода, в неё приходят параметры изначального запроса, результат будет передан
     * напрямую в метод без клонирования
     */
    callBefore() {
        if (this.method.before) {
            return promiseFunction(this.method.before, this.params, this, CALL_TIMEOUT);
        } else {
            return Promise.resolve(this.params);
        }
    }

    /**
     * Непосредственно вызов метода бизнес-логики
     */
    callMethod() {
        return promiseFunction(this.method.func, this.params, this, CALL_TIMEOUT);
    }

    /**
     * Вызывается после метода бизнес-логики, сюда приходят параметры, с которыми вызвался изначально метод
     * и которые прошли через before и method, без клонирования. Также вмотрым параметром приходит результат из функции
     * method. Результат будет склонирован только после вызова данной функции, эта функция предназначена для того,
     * чтобы повлиять на выходные данные.
     * */
    callAfter() {
        if (this.method.after) {
            return promiseFunction(this.method.after, this.result, this, CALL_TIMEOUT);
        } else {
            return Promise.resolve(result);
        }
    }

    getModuleMethod() {
        return this.method.getName();
    }
};