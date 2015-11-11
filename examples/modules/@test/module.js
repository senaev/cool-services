'use strict';

var ServiceError;
module.exports = {
    init: function(resolve) {
        ServiceError = this.ServiceError;
        resolve();
    },
    methods: {
        returnParamsWithAddValue: {
            isPublic: true,
            method: function(params) {
                params.add = 'add';
                return params;
            }
        },
        returnParamAsync: {
            isPublic: true,
            method: function(params) {
                setTimeout(this.resolve, 500, params);
            }
        },
        passageWithOneChild: {
            isPublic: true,
            method: function() {
                this.call('returnHelloWorld', 'some_param').then(str => {
                    this.resolve(str + ' Hello, everybody!')
                });
            }
        },
        asyncPassageWith4ChildsAnd1Error: {
            isPublic: true,
            method: function() {
                this.call('throwError1');
                Promise.all([
                    this.call('asyncString0'),
                    this.call('asyncString1'),
                    this.call('asyncString2')
                ]).then(results => {
                    this.resolve(results.join(','));
                })
            }
        },
        passageWithOneChildReturnsError: {
            isPublic: true,
            method: function() {
                this.call('returnHelloWorld', 'some_param').then(str => {
                    this.reject('123');
                });
            }
        },
        throwAsyncErrorInCallCallback: {
            isPublic: true,
            method: function() {
                return this.call('returnHelloWorld', 'some_param').then(str => {
                    throw 123;
                });
            }
        },
        returnHelloWorld: function() {
            return 'Hello, world!';
        },
        throwError1: {
            isPublic: true,
            method: function() {
                let hello = 'hello';
                hello();
            }
        },
        throwError2: {
            isPublic: true,
            method: function() {
                throw 123;
            }
        },
        throwError3: {
            isPublic: true,
            method: function() {
                throw '123'
            }
        },
        throwError4: {
            isPublic: true,
            method: function() {
                throw new Error('123');
            }
        },
        throwError5: {
            isPublic: true,
            method: function() {
                throw new ServiceError('123');
            }
        },
        asyncString0: function() {
            setTimeout(() => {
                this.resolve('0');
            }, 50);
        },
        asyncString1: function() {
            setTimeout(() => {
                this.resolve('1');
            }, 60);
        },
        asyncString2: function() {
            setTimeout(() => {
                this.resolve('2');
            }, 40);
        }
    },
    helpers: {
        //TODO: to make helpers
    }
};