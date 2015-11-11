'use strict';

var stackTrace = require('stack-trace');

module.exports = class ServiceError {
    constructor(o) {
        if (o instanceof ServiceError) {
            return o;
        }

        if (o.hasOwnProperty('error') && o.error instanceof ServiceError) {
            return o.error;
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
                details = o.details;

                if (o.message) {
                    message = o.message;
                } else if (o.error) {
                    switch (typeof o.error) {
                        case 'string':
                            message = o.error;
                            break;
                        case 'number':
                            code = o.error;
                            break;
                        default:
                            throw new Error('Unused variable type');
                            break;
                    }
                }

                if (o instanceof Error) {
                    error = o;

                    if (error.code) {
                        code = error.code;
                    }

                    shiftTrace = false;
                }
                break;
            case 'number':
                code = o;
                break;
            case 'string':
                message = o;
                break;
            default:
                throw new Error('Unused variable type');
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
        this.details = details;
        this.trace = trace;
        this.message = message === undefined ? 'Internal server error' : message;
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
