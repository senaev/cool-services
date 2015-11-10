'use strict';

var stackTrace = require('stack-trace');

module.exports = class ServiceError {
    constructor(o) {
        if (o instanceof ServiceError) {
            return o;
        }

        let error;
        let trace;
        
        let code;
        let message;
        let details;

        let shiftTrace = true;

        switch (typeof o) {
            case 'object':
                code = o.code;
                message = o.message;
                details = o.details;

                if (o instanceof Error) {
                    error = o;
                    shiftTrace = false;
                }
                break;
            case 'number':
                code = o;
                break;
            case 'string':
                message = o;
                break;
        }

        if (!error) {
            error = new Error(message || 'Internal Server Error');
        }

        trace = stackTrace.parse(error);
        if (shiftTrace) {
            trace.shift();
        }

        this.code = code;
        this.message = message;
        this.details = details;
        this.trace = trace;
    }

    toObject() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            trace: this.trace
        };
    }
};
