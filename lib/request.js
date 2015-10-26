'use strict';

//TODO: пока просто обёртка для корневого вызова метода бизнес-логики, в дальнейшем может быть дополнена другим
module.exports = class Request {
    constructor(service, moduleMethod, params) {
        this.service = service;
        this.moduleMethod = moduleMethod;
        this.params = params;
    }

    call() {
        return Promise.resolve('called');
    }
};
