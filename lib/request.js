'use strict';

const ServiceError = require('./service-error');
const maxCallCount = 512;

//TODO: пока просто обёртка для корневого вызова метода бизнес-логики, в дальнейшем может быть дополнена другим
module.exports = class Request {
    constructor(o) {
        this.service = o.service;
        this.isInternal = o.isInternal;
        this.moduleMethod = o.moduleMethod;
        this.params = o.params;

        this.callsCount = 0;
        this.maxCallCount = maxCallCount;
    }

    call() {
        let module;
        let method;
        try {
            let moduleAndMethodObj = this.service.getModuleAndMethod(this.moduleMethod);

            module = moduleAndMethodObj.module;
            method = moduleAndMethodObj.method;
        } catch (e) {
            return Promise.reject({error: new ServiceError(e)});
        }


        if (method.isPublic || this.isInternal) {
            try {
                let call = new this.service.Call(method, this.params, this);
                return call.callSelf().catch(error => {
                    if (error instanceof Error || error instanceof ServiceError) {
                        return Promise.reject({error: new ServiceError(error)});
                    } else {
                        return Promise.reject(call.formalizeResult(undefined, error));
                    }
                });
            } catch (e) {
                return Promise.reject({
                    error: new ServiceError(e),
                    name: method.moduleName + '.' + method.name
                });
            }
        } else {
            return Promise.reject({
                error: new ServiceError({
                    code: 405,
                    message: `Method has not found: ${this.moduleMethod}`,
                    details: `Метод не является публичным: ${this.moduleMethod}`
                })
            });
        }
    }
};
