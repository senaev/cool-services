'use strict';

//TODO: callTimeout have to be variable
var CALL_TIMEOUT = 10000;

var Error = require('./error');
var promiseFunction = require('./promise-function');
var parseModuleMethod = require('./helpers/parse-module-method');

module.exports = class Call {
    constructor(method, params, request) {
        //save input params
        if (params !== undefined) {
            try {
                this.paramsClone = JSON.parse(JSON.stringify(params));
            } catch (e) {
                console.log(params);
                /*throw new Error({
                 details: `Method ${this.getModuleMethod()} has been called with `
                 });*/
            }
        }

        this.params = params;
        this.method = method;
        this.request = request;

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
                //console.error('121212:', error);
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

        if (name.indexOf('.') === -1) {
            methodName = name;
            isNearby = true;
        } else {
            let moduleMethodNameObj = parseModuleMethod(name);
            moduleName = moduleMethodNameObj.moduleName;
            methodName = moduleMethodNameObj.methodName;
            isNearby = moduleName === this.getModule().getName();
        }

        let call;
        let method;
        if (isNearby) {
            method = this.getModule().getMethod(methodName);
        } else {
            method = this.getService().getMethod(moduleName + '.' + methodName);

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
                return result.result;
            })
            .catch(error => {
                this.childs[childNumber] = call.formalizeResult(undefined, error);
                return Promise.reject(error);
            });
    }

    /**
     * Вызывается перед вызовом метода, в неё приходят параметры изначального запроса, результат будет передан
     * напрямую в метод без клонирования
     */
    callBefore(params) {
        if (this.getMethod().before) {
            return promiseFunction(this.getMethod().before, params, this, CALL_TIMEOUT);
        } else {
            return Promise.resolve(params);
        }
    }

    /**
     * Непосредственно вызов метода бизнес-логики
     */
    callMethod(params) {
        return promiseFunction(this.getMethod().func, params, this, CALL_TIMEOUT);
    }

    /**
     * Вызывается после метода бизнес-логики, сюда приходят параметры которые прошли через before и method,
     * без клонирования. Также вмотрым параметром приходит результат из функции
     * method. Результат будет склонирован только после вызова данной функции,
     * эта функция предназначена для того,
     * чтобы повлиять на выходные данные.
     * */
    callAfter(result) {
        if (this.getMethod().after) {
            return promiseFunction(this.getMethod().after, result, this, CALL_TIMEOUT);
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
            throw new Error({
                details: 'Service method can not return undefined value: ' + this.getModuleMethod()
            });
        } else if (error !== undefined) {
            return {
                error: new Error(error),
                time: Date.now() - this.timeBegin,
                name: this.getModuleMethod(),
                params: this.paramsClone,
                childs: this.childs.length ? this.childs : undefined
            };
        } else {
            var resultClone = JSON.parse(JSON.stringify(result));
            return {
                result: resultClone,
                time: Date.now() - this.timeBegin,
                name: this.getModuleMethod(),
                params: this.paramsClone,
                childs: this.childs.length ? this.childs : undefined
            };
        }
    }

    getMethod() {
        return this.method;
    }

    getModule() {
        return this.getMethod().getModule();
    }

    getService() {
        return this.getModule().getService();
    }

    getModuleMethod() {
        return this.getModule().getName() + '.' + this.getMethod().getName();
    }
};