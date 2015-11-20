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
            throw new ServiceError({
                code: 507,
                details: `Request call count exceeded in ${this.moduleMethod} ` +
                `(${this.request.callsCount}th calls)`
            });
        }

        //save input params
        if (this.params !== undefined) {
            try {
                this.paramsClone = JSON.parse(JSON.stringify(this.params));
            } catch (e) {
                throw new ServiceError({
                    code: 508,
                    details: `Method ${this.moduleMethod} has been called with circular params`
                });
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
        this.timeBegin = Date.now();
        if (this.isExternal) {
            return new Promise((resolve, reject) => {
                request.post({
                    url: this.entryPoint,
                    json: {
                        method: this.moduleMethod,
                        params: this.params
                    }
                }, (error, response, body) => {
                    if (error) {
                        reject(error);
                    } else {
                        if (response.statusCode == 200 || response.statusCode == 500) {
                            this.externalTime = body.time;
                            this.childs = body.childs;
                            if (response.statusCode == 200) {
                                this.result = body.result;
                                resolve(this.result);
                            } else {
                                this.error = body.error;
                                reject(this.error);
                            }
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
            return this.callBefore(this.params)
                .then(this.callMethod.bind(this))
                .then(this.callAfter.bind(this))
                .then(result => {
                    this.result = result;
                    return Promise.resolve(result);
                })
                .catch(error => {
                    this.error = error;
                    return Promise.reject(error);
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
        return (new Promise((resolve, reject)  => {
            if (module.isExternal) {
                call.callSelf().then(resolve).catch(reject);
            } else {
                let method = moduleAndMethodObj.method;
                if (!isNearby && !method.isApi && !method.isPublic) {
                    call.error = new ServiceError({
                        code: 405,
                        details: `Method is not part of the API: ${moduleMethod}`
                    });
                    reject(call.error);
                } else {
                    call.callSelf().then(resolve).catch(reject);
                }
            }
        })).then(result => {
            this.childs[childNumber] = call.toObject();
            this.childs[childNumber].start = start;
            return Promise.resolve(result);
        }).catch(error => {
            this.childs[childNumber] = call.toObject();
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

    toObject() {
        let callResult = {
            name: this.moduleMethod,
            params: this.paramsClone,
            childs: (this.childs && this.childs.length) ? this.childs : undefined,
            time: this.timeBegin ? (Date.now() - this.timeBegin) : undefined
        };

        if (this.isExternal) {
            callResult.external = true;
            callResult.externalTime = this.externalTime;
            callResult.entryPoint = this.entryPoint;
        }

        if (this.error) {
            callResult.error = new ServiceError(this.error);
        } else if (this.result) {
            let resultClone;
            try {
                resultClone = JSON.parse(JSON.stringify(this.result));
            } catch (e) {
                this.error = new ServiceError({
                    code: 508,
                    details: `Method ${this.moduleMethod} returns circular result`
                });
                throw this.error;
            }

            callResult.result = resultClone;
        } else {
            throw new ServiceError({
                details: 'Service method can not return undefined value: ' + this.moduleMethod
            });
        }

        return callResult;
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