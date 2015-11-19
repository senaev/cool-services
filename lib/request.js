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

        if (module.isExternal || method.isPublic || this.isInternal) {
            try {
                let call = new this.service.Call({
                    moduleMethod: this.moduleMethod,
                    params: this.params,
                    request: this
                });
                return call.callSelf()
                    .then(() =>  call.toObject())
                    .catch(() => Promise.reject(call.toObject()));
            } catch (e) {
                return Promise.reject({
                    error: new ServiceError(e),
                    name: this.moduleMethod
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
