'use strict';

//TODO: callTimeout have to be variable
var CALL_TIMEOUT = 10000;

var Error = require('./service-error');
var promiseFunction = require('./promise-function');
var parseModuleMethod = require('./helpers/parse-module-method');

module.exports = class Call {
    constructor(method, params, request) {
        this.params = params;
        this._method = method;
        this.request = request;

        this.request.callsCount++;

        //if to many calls in request
        if (this.request.maxCallCount <= this.request.callsCount) {
            throw this.formalizeResult(undefined, new Error({
                code: 507,
                details: `Request call count exceeded in ${this.moduleMethod} ` +
                `(${this.request.callsCount}th calls)`
            }));
        }

        //save input params
        if (params !== undefined) {
            try {
                this.paramsClone = JSON.parse(JSON.stringify(params));
            } catch (e) {
                throw this.formalizeResult(undefined, new Error({
                    code: 508,
                    details: `Method ${this.moduleMethod} has been called with circular params`
                }));
            }
        }

        this.childs = [];
    }

    /**
     * self call start
     */
    callSelf() {
        this.timeBegin = Date.now();
        return this.callBefore(this.params)
            .then(this.callMethod.bind(this))
            .then(this.callAfter.bind(this))
            .then(this.formalizeResult.bind(this))
            .catch(error => {
                return Promise.reject(this.formalizeResult(undefined, error));
            });
    }

    /**
     * call other methods
     */
    call(name, params) {
        let moduleName;
        let methodName;
        let isNearby;
        let start = Date.now() - this.timeBegin;

        if (name.indexOf('.') === -1) {
            methodName = name;
            isNearby = true;
        } else {
            let moduleMethodNameObj = parseModuleMethod(name);
            moduleName = moduleMethodNameObj.moduleName;
            methodName = moduleMethodNameObj.methodName;
            isNearby = moduleName === this.module.name;
        }

        let call;
        let method;
        if (isNearby) {
            method = this.module.getMethod(methodName);
        } else {
            method = this.service.getMethod(moduleName + '.' + methodName);

            if (!(method.isPublic || method.isApi)) {
                throw new Error({
                    code: 405,
                    details: `Method is not part of the API: ${moduleName}.${methodName}`
                });
            }
        }

        call = new Call(method, params, this.request);

        let childNumber = this.childs.length;
        this.childs.push(childNumber);

        return call.callSelf()
            .then(result => {
                this.childs[childNumber] = result;
                this.childs[childNumber].start = start;
                return result.result;
            })
            .catch(error => {
                this.childs[childNumber] = call.formalizeResult(undefined, error);
                this.childs[childNumber].start = start;
                return Promise.reject(error);
            });
    }

    /**
     * Вызывается перед вызовом метода, в неё приходят параметры изначального запроса, результат будет передан
     * напрямую в метод без клонирования
     */
    callBefore(params) {
        if (this.method.before) {
            return promiseFunction(this.method.before, params, this, CALL_TIMEOUT);
        } else {
            return Promise.resolve(params);
        }
    }

    /**
     * Непосредственно вызов метода бизнес-логики
     */
    callMethod(params) {
        return promiseFunction(this.method.func, params, this, CALL_TIMEOUT);
    }

    /**
     * Вызывается после метода бизнес-логики, сюда приходят параметры которые прошли через before и method,
     * без клонирования. Также вмотрым параметром приходит результат из функции
     * method. Результат будет склонирован только после вызова данной функции,
     * эта функция предназначена для того,
     * чтобы повлиять на выходные данные.
     * */
    callAfter(result) {
        if (this.method.after) {
            return promiseFunction(this.method.after, result, this, CALL_TIMEOUT);
        } else {
            return Promise.resolve(result);
        }
    }

    /**
     * В этот метод приходят данные, полученные непосредственно в результате работы метода, нам нужно
     * добавить к этим данным служебную составляющую (прохождение, время выполнения и т.п.).
     * Здесь-же мы проверяем валидность данных и прочую чепуху.
     */
    formalizeResult(result, error) {
        if (result === undefined && error === undefined) {
            new Error({
                details: 'Service method can not return undefined value: ' + this.moduleMethod
            });
        } else if (error !== undefined) {
            return {
                error: new Error(error),
                time: this.timeBegin ? (Date.now() - this.timeBegin) : undefined,
                name: this.moduleMethod,
                params: this.paramsClone,
                childs: (this.childs && this.childs.length) ? this.childs : undefined
            };
        } else {
            let resultClone;
            try {
                resultClone = JSON.parse(JSON.stringify(result));
            } catch (e) {
                throw new Error({
                    code: 508,
                    details: `Method ${this.moduleMethod} returns circular result`
                });
            }

            return {
                result: resultClone,
                time: Date.now() - this.timeBegin,
                name: this.moduleMethod,
                params: this.paramsClone,
                childs: this.childs.length ? this.childs : undefined
            };
        }
    }

    get method() {
        return this._method;
    }

    get module() {
        return this.method.module;
    }

    get service() {
        return this.module.service;
    }

    get moduleMethod() {
        return this.module.name + '.' + this.method.name;
    }
}
;