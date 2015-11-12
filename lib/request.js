'use strict';

const Call = require('./call');
const Error = require('./service-error');
const maxCallCount = 512;

//TODO: пока просто обёртка для корневого вызова метода бизнес-логики, в дальнейшем может быть дополнена другим
module.exports =
class Request {
    constructor(service, moduleMethod, params) {
        this.service = service;
        this.moduleMethod = moduleMethod;
        this.params = params;

        this.callsCount = 0;
        this.maxCallCount = maxCallCount;
    }

    call() {
        try {
            var method = this.getService().getMethod(this.moduleMethod);
        } catch (e) {
            return Promise.reject(e);
        }

        if (method.isPublic) {
            try {
                let call = new Call(method, this.params, this);
                return call.callSelf();
            } catch (e) {
                  return Promise.reject(e);
            }
        } else {
            return Promise.reject(Error({
                code: 405,
                message: `Method had not found: ${this.moduleMethod}`,
                details: `Метод не является публичным: ${this.moduleMethod}`
            }));
        }
    }

    getService() {
        return this.service;
    }
}
;
