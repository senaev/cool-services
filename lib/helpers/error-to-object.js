/**
 *
 * @param err
 * @returns {{code: number, message: text, details: *, trace: object}}
 */
module.exports = function(err) {
    if (typeof err === 'string') {
        err = {message: err};
    } else if (err instanceof Error) {
        err = {
            message: err.message,
            trace: stackTrace.parse(err),
            code: err.code
        }
    }

    var code = err.code !== undefined ? err.code : 500;

    var message;
    if (err.message !== undefined) {
        message = err.message;
    } else {
        message = 'Internal Server Error'
    }

    var details;
    if (err.details !== undefined) {
        details = err.details;
    }

    var trace;
    if (err.trace) {
        trace = err.trace;
    }

    return {
        code: code,
        message: message,
        details: details,
        trace: trace
    };
};
