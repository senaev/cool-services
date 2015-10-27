'use strict';

var stackTrace = require('stack-trace');

module.exports = class ServiceError {
    constructor(o) {
        if (o) {
            this.code = o.code;
            this.message = o.message;
            this.details = o.details;
        }

        var error = new Error((o && o.message) ? o.message : 'Internal Server Error');
        var trace = stackTrace.parse(error);
        trace.shift();
        this.trace = trace;
    }
};
