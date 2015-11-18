'use strict';

//TODO: callTimeout have to be variable
var CALL_TIMEOUT = 10000;

var ServiceError = require('./service-error');
var promiseFunction = require('./promise-function');
var request = require('request');

module.exports = class Call {
    constructor(o) {
        this.moduleMethod = o.moduleMethod;
        this.params = o.params;
        this.request = o.request;

        let moduleAndMethodObj = this.request.service.getModuleAndMethod(this.moduleMethod);
        this.module = moduleAndMethodObj.module;

        this.request.callsCount++;

        //if to many calls in request
        if (this.request.maxCallCount <= this.request.callsCount) {
            throw this.formalizeResult(undefined, new ServiceError({
                code: 507,
                details: `Request call count exceeded in ${this.moduleMethod} ` +
                `(${this.request.callsCount}th calls)`
            }));
        }

        //save input params
        if (this.params !== undefined) {
            try {
                this.paramsClone = JSON.parse(JSON.stringify(this.params));
            } catch (e) {
                throw this.formalizeResult(undefined, new ServiceError({
                    code: 508,
                    details: `Method ${this.moduleMethod} has been called with circular params`
                }));
            }
        }

        this.childs = [];

        if (this.isExternal) {
            this.entryPoint = this.module.entryPoint;
        } else {
            this.method = moduleAndMethodObj.method;
        }
    }

    /**
     * self call start
     */
    callSelf() {
        if (this.isExternal) {
            return new Promise((resolve, reject) => {
                request.post({
                    url: this.entryPoint,
                    json: {
                        method: this.moduleMethod,
                        params: this.params
                    }
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        resolve(body);
                    } else {
                        if (error) {
                            reject(error);
                        } else {
                            reject(new ServiceError({
                                code: response.statusCode,
                                message: `Invalid response from external module ${this.moduleMethod}`
                            }));
                        }
                    }
                });
            });
        } else {
            this.timeBegin = Date.now();
            return this.callBefore(this.params)
                .then(this.callMethod.bind(this))
                .then(this.callAfter.bind(this))
                .then(this.formalizeResult.bind(this))
                .catch(error => {
                    return Promise.reject(this.formalizeResult(undefined, error));
                });
        }
    }

    /**
     * call other methods
     */
    call(name, params) {
        let moduleMethod;
        let isNearby;
        let start = Date.now() - this.timeBegin;

        if (name.indexOf('.') === -1) {
            isNearby = true;
            moduleMethod = this.module.name + '.' + name;
        } else {
            isNearby = this.service.constructor.parseModuleMethod(name).moduleName === this.module.name;
            moduleMethod = name;
        }

        let moduleAndMethodObj = this.service.getModuleAndMethod(moduleMethod);
        let module = moduleAndMethodObj.module;

        let call = new Call({
            moduleMethod: moduleMethod,
            params: params,
            request: this.request
        });

        let childNumber = this.childs.length;
        this.childs.push(childNumber);

        if (module.isExternal) {
            return Promise.resolve('all_right');
        } else {
            let method = moduleAndMethodObj.method;
            return (new Promise((resolve, reject)  => {
                if (!isNearby && !method.isApi && !method.isPublic) {
                    reject(this.formalizeResult(undefined, new ServiceError({
                        code: 405,
                        details: `Method is not part of the API: ${moduleMethod}`
                    })));
                } else {
                    call.callSelf()
                        .then(result => resolve(result))
                        .catch(error => reject(error));
                }
            })).then(result => {
                this.childs[childNumber] = result;
                this.childs[childNumber].start = start;
                return Promise.resolve(result.result);
            }).catch(error => {
                this.childs[childNumber] = call.formalizeResult(undefined, error);
                this.childs[childNumber].start = start;
                return Promise.reject(error.error);
            });
        }
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
            new ServiceError({
                details: 'Service method can not return undefined value: ' + this.moduleMethod
            });
        } else if (error !== undefined) {
            return {
                error: new ServiceError(error),
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
                throw new ServiceError({
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

    get(paramName) {
        return this.module.get(paramName);
    }

    set(paramName, val) {
        this.module.set(paramName, val);
        return this;
    }

    get service() {
        return this.module.service;
    }

    get isExternal() {
        return this.module.isExternal;
    }
}
;