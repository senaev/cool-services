'use strict';

module.exports = class Method {
    constructor(rawMethod, module) {
        this.module = module;

        var func;
        var isPublic = false;
        var isApi = false;
        var before;
        var after;

        if (typeof rawMethod === 'function') {
            func = rawMethod;
        } else if (typeof rawMethod === 'object') {
            if (typeof rawMethod.method === 'function') {
                //function
                func = rawMethod.method;

                //is public
                rawMethod.isPublic && (isPublic = true);

                //is api
                (rawMethod.isApi || rawMethod.isPublic) && (isApi = true);

                //before function
                if (typeof rawMethod.before === 'function') {
                    before = rawMethod.before;
                }

                //after function
                if (typeof rawMethod.after === 'function') {
                    after = rawMethod.after;
                }
            } else {
                console.error(rawMethod);
                throw '↑ Method object has not method function';
            }
        } else {
            console.error(rawMethod);
            throw '↑ Method is not function or object';
        }

        this.func = func;
        this.isPublic = isPublic;
        this.isApi = isApi;
        this.before = before;
        this.after = after;
    }

    getName() {
        return this.module.getMethodName(this);
    }

    getModule() {
        return this.module;
    }
};