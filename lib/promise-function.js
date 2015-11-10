'use strict';

var ServiceError = require('./error');

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

    var timeoutError = new ServiceError({
        details: 'Promise-function call timeout in method: ' + call.getModuleMethod()
    });
    timeoutError.code = 504;

    var timeoutId = setTimeout(function() {
        rejecter(timeoutError);
    }, (timeout || (24 * 60 * 60 * 1000)));

    try {
        result = f.apply(call, [param]);
    } catch (e) {
        error = e;
    }

    if (error) {
        return Promise.reject(new ServiceError(error));
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
