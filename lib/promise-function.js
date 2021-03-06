'use strict';

var ServiceError = require('./service-error');

module.exports = function(f, param, call, timeout) {
    var result;
    var error;

    var resolver;
    var rejecter;
    var promise = new Promise(function(resolve, reject) {
        resolver = resolve;
        rejecter = reject;
    });

    if (call) {
        call.resolve = function(val) {
            resolver(val);
        };
        call.reject = function(error) {
            rejecter(error)
        };
    }

    var timeoutError = new Error({
        details: 'Promise-function call timeout in method: ' + call.moduleMethod
    });
    timeoutError.code = 504;

    var timeoutId = setTimeout(function() {
        rejecter(new ServiceError(timeoutError));
    }, (timeout || (24 * 60 * 60 * 1000)));

    try {
        result = f.apply(call, [param]);
    } catch (e) {
        error = e;
    }

    if (error) {
        if (typeof error !== 'object') {
            return Promise.reject(new ServiceError({
                error: error,
                details: 'Service method error: ' + call.moduleMethod
            }));
        } else {
            return Promise.reject(new ServiceError(error));
        }
    }

    if (result !== undefined) {
        clearTimeout(timeoutId);
        return Promise.resolve(result);
    } else if (result instanceof Promise) {
        promise = result;
    }

    return promise.then(function(data) {
        clearTimeout(timeoutId);
        return Promise.resolve(data);
    }, function(error) {
        clearTimeout(timeoutId);
        return Promise.reject(error);
    });
};
