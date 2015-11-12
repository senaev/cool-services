'use strict';

module.exports = class Method {
    constructor(rawMethod, module) {
        this.module = module;
        this.rawMethod = rawMethod;

        var func;
        var isPublic = false;
        var isApi = false;
        var before;
        var after;

        if (typeof this.rawMethod === 'function') {
            func = this.rawMethod;
        } else if (typeof this.rawMethod === 'object') {
            if (typeof this.rawMethod.method === 'function') {
                //function
                func = this.rawMethod.method;

                //is public
                this.rawMethod.isPublic && (isPublic = true);

                //is api
                (this.rawMethod.isApi || this.rawMethod.isPublic) && (isApi = true);

                //before function
                if (typeof this.rawMethod.before === 'function') {
                    before = this.rawMethod.before;
                }

                //after function
                if (typeof this.rawMethod.after === 'function') {
                    after = this.rawMethod.after;
                }
            } else {
                throw `Method object has not method function in ${this.moduleName}.${this.rawMethodName}`;
            }
        } else {
            console.error(this.rawMethod);
            throw '↑ Method is not function or object';
        }

        this.func = func;
        this.isPublic = isPublic;
        this.isApi = isApi;
        this.before = before;
        this.after = after;
    }

    get rawMethodName() {
        return this.module.getMethodNameByRaw(this.rawMethod);
    }

    get name() {
        return this.module.getMethodName(this);
    }

    get moduleName() {
        return this.module.name;
    }
};