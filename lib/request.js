'use strict';

var Call = require('./call');
var Error = require('./error');

//TODO: пока просто обёртка для корневого вызова метода бизнес-логики, в дальнейшем может быть дополнена другим
module.exports = class Request {
    constructor(service, moduleMethod, params) {
        this.service = service;
        this.moduleMethod = moduleMethod;
        this.params = params;
    }

    call() {
        var method = this.getService().getMethod(this.moduleMethod);

        if (method.isPublic) {
            var call = new Call(method, this.params, this);
            return call.callSelf();
        } else {
            throw new Error({
                code: 405,
                message: `Method has not found: ${this.moduleMethod}`,
                details: `Метод не является публичным: ${this.moduleMethod}`
            });
        }
    }

    getService() {
        return this.service;
    }
};
