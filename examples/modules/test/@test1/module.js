'use strict';

module.exports = {
    methods: {
        returnString: {
            isPublic: true,
            method: function () {
                return 'is test1 module'
            }
        },
        callPublicMethodInTest: {
            isPublic: true,
            method: function () {
                return this.call('test.returnParamsWithAddValue', {first: 'first'});
            }
        },
        callPublicMethodReturnsError: {
            isPublic: true,
            method: function () {
                return this.call('test.throwError5');
            }
        },
        callMethodReturnsComplicatedTree: {
            isPublic: true,
            method: function () {
                return Promise.all([
                    this.call('test.asyncPassageWith4ChildsAnd1Error'),
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            this.call('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin')
                                .then(result => resolve(result
                                    .filter(item => typeof item === 'string')
                                    .join('-')
                                ))
                                .catch(error => reject(error))
                        }, 50);
                    })
                ]).then(result => result.join(' and '));
            }
        },
        checkToAccessible: {
            isPublic: true,
            method: function () {
                return Promise.all([
                    this.call('test.publicMethod'),
                    this.call('test.apiMethod'),
                    this.call('test.privateMethod').catch(error => Promise.resolve(error))
                ]);
            }
        },
        callExternal:  {
            isPublic: true,
            method: function () {
                return this.call('test2.returnString');
            }
        },
        callExternalReturnsError: {
            isPublic: true,
            method: function () {
                return this.call('test2.throwError');
            }
        },
        callTest3ReturnString: {
            isPublic: true,
            method: function(params) {
                return this.call('test3.returnString', params);
            }
        }
    }
};