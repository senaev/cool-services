'use strict';

var ServiceError;
module.exports = {
    init: function(resolve) {
        ServiceError = this.ServiceError;
        this.set('array', [1, 2, 3]).set('object', {param: 'param'});
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
        asyncPassageWith4ChildsAnd1ErrorWithDifBegin: {
            isPublic: true,
            method: function() {
                var promises = [];
                let methods = ['asyncString0', 'asyncString1', 'asyncString2', 'throwError1'];
                return new Promise(resolve => {
                    methods.forEach((methodName, i) => {
                        setTimeout(() => {
                            promises.push(this.call(methodName).catch(error => {
                                return Promise.resolve(error);
                            }));
                            i === 3 && resolve(Promise.all(promises));
                        }, (i + 1) * 100)
                    });
                });
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
        returnCircular: {
            isPublic: true,
            method: function() {
                let x = {};
                x.x = x;
                return x;
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
        },
        circle1: {
            isPublic: true,
            method: function() {
                return this.call('circle2');
            }
        },
        circle2: function() {
            setTimeout(() => {
                this.resolve(this.call('circle1'));
            }, 1);
        },
        publicMethod: {
            isPublic: true,
            method: function() {
                return 'is public method';
            }
        },
        apiMethod: {
            isApi: true,
            method: function() {
                return 'is api method';
            }
        },
        privateMethod: function() {
            return 'is private method';
        },
        getModuleParam: {
            isPublic: true,
            method: function(str) {
                let arr = this.get('array');
                arr.push(this.get('object'), str);
                this.get('object').param = 123;

                this.data.lalala = 555;
                this.data.lololo = 777;

                this.data.array.push(this.data.lalala, this.data.lololo);

                return arr;
            }
        }
    },
    helpers: {
        //TODO: to make helpers
    }
};