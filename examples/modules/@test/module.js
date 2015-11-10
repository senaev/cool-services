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
        passageWithOneChild: {
            isPublic: true,
            method: function() {
                this.call('returnHelloWorld', 'some_param').then(str => {
                    this.resolve(str + ' Hello, everybody!')
                });
            }
        },
        passageWithOneChildReturnsError: {
            isPublic: true,
            method: function() {
                this.call('returnHelloWorld', 'some_param').then(str => {
                    throw '123';
                });
            }
        },
        returnHelloWorld: function() {
            return 'Wello, world!';
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
        }
    },
    helpers: {
        //TODO: to make helpers
    }
};