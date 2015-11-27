'use strict';

const ServiceError = require('./service-error');

module.exports = class Method {
    constructor(rawMethod, module) {
        this.module = module;
        this.rawMethod = rawMethod;

        let func;
        let isPublic = false;
        let isApi = false;
        let before;
        let after;
        let expect;

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

                //expect
                expect = this.rawMethod.expect;
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
        this.expect = expect;
    }

    meetExpectation(params) {
        try {
            this.checkToExpect(this.expect, params, '<PARAMS>');
        } catch (e) {
            if (e instanceof Array) {
                throw new ServiceError({
                    code: 417,
                    message: `Expectanion error in ${this.moduleMethod}`,
                    details: `${e[0]}: ${e[1]}`
                });
            } else {
                throw e;
            }
        }
    }

    checkToExpect(expect, param, addr) {
        if (typeof expect === 'function' && !expect(param)) {
            throw [addr, `(${expect})(${s(param)}) != true`];
        }

        if (['number', 'string', 'boolean'].indexOf(typeof expect) !== -1 && param !== expect) {
            throw [addr, `${s(param)} != ${s(expect)}`];
        }

        if (expect === null && param !== null) {
            throw [addr, `${s(param)} != null`];
        }

        if (expect instanceof RegExp) {
            if (!expect.test(param)) {
                throw [addr, `${expect}.test(${s(param)}) != true`];
            }
        } else if (expect instanceof Array) {
            if (!(param instanceof Array)) {
                throw [addr, `${param} is not an array`];
            }

            if (expect.length === 0) {
                return;
            }

            if (expect.length === 1) {
                param.forEach((val, i) => this.checkToExpect(expect[0], val, `${addr}[${i}]`));
                return;
            }

            if (expect.length > param.length) {
                throw [addr, 'expected array length'];
            }

            let fInd;
            if (expect.filter((val, i) => {
                    if (typeof val === 'function') {
                        fInd = i;
                        return true;
                    }
                }).length > 1) {

                throw new ServiceError({
                    details: `Bad expectation in ${this.moduleMethod}: array may have just one function`
                });
            }

            if (fInd === undefined) {
                if (expect.length !== param.length) {
                    throw [addr, 'expected array length'];
                }

                expect.forEach((val, i) => this.checkToExpect(val, param[i], `${addr}[${i}]`));
            } else {
                const lastFunc = param.length - (expect.length - fInd) + 1;
                const paramFunctionExpect = param.slice(fInd, lastFunc);
                const paramLast = param.slice(lastFunc);

                for (let key = 0; key < fInd; key++) {
                    this.checkToExpect(expect[key], param[key], `${addr}[${key}]`);
                }

                paramFunctionExpect.forEach((val, i) => this.checkToExpect(expect[fInd], val, `${addr}[${fInd + i}]`));

                paramLast.forEach((val, i) => this.checkToExpect(expect[i + fInd + 1], val, `${addr}[${i + lastFunc}]`));
            }
        } else if (typeof expect === 'object') {
            if (typeof param !== 'object') {
                throw [addr];
            }

            for (let key in param) {
                if (param.hasOwnProperty(key)) {
                    if (!expect.hasOwnProperty(key)) {
                        throw [`${addr}.${key}`, `is redundant parameter`];
                    }
                }
            }

            for (let key in expect) {
                if (expect.hasOwnProperty(key)) {
                    if (!param.hasOwnProperty(key)) {
                        throw [`${addr}.${key}`, `is required parameter`];
                    }

                    this.checkToExpect(expect[key], param[key], `${addr}.${key}`);
                }
            }
        }

        function s(o) {
            return typeof o === 'string' ? `'${o}'` : o;
        }
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

    get moduleMethod() {
        return this.moduleName + '.' + this.name;
    }
};