'use strict';

module.exports = {
    methods: {
        returnString: {
            isPublic: true,
            method: function (params) {
                setTimeout(() => this.resolve('is test3 module ' + params), 500);
            }
        },
        callTest3ReturnStringFromTest1: {
            isPublic: true,
            method: function (params) {
                return this.call('test1.callTest3ReturnString', params);
            }
        },
        expectString: {
            isPublic: true,
            expect: param => typeof param === 'string',
            method: function (string) {
                return string + ': is_string';
            }
        },
        expectString1: {
            isPublic: true,
            expect: 'string1',
            method: function (string) {
                return string + ': is_string';
            }
        },
        expectNumber: {
            isPublic: true,
            expect: 123,
            method: function () {
                return 123;
            }
        },
        expectBoolean: {
            isPublic: true,
            expect: false,
            method: function () {
                return 'all_ok';
            }
        },
        expectNull: {
            isPublic: true,
            expect: null,
            method: function () {
                return null;
            }
        },
        expectRegExp: {
            isPublic: true,
            expect: /^begin.*end$/,
            method: function () {
                return null;
            }
        },
        expectErrorInArray: {
            isPublic: true,
            expect: [o => o, o => o],
            method: function () {
                return null;
            }
        },
        expectArray: {
            isPublic: true,
            expect: [1, 2, 3, 4,
                o => o > 4,
                8, 9, 10],
            method: function () {
                return null;
            }
        },
        expectArray1: {
            isPublic: true,
            expect: ['1', 2, '3', o => o > 4],
            method: function () {
                return null;
            }
        },
        expectArray2: {
            isPublic: true,
            expect: [o => o > 4, '1', 2, '3'],
            method: function () {
                return null;
            }
        },
        expectArray3: {
            isPublic: true,
            expect: [o => o > 4],
            method: function () {
                return null;
            }
        },
        expectObject: {
            isPublic: true,
            expect: {
                hello: o => o === 'world'
            },
            method: function () {
                return null;
            }
        },
        expectAnyArray: {
            isPublic: true,
            expect: [],
            method: function() {
                return null;
            }
        },
        expectArrayWithSimilarParams: {
            isPublic: true,
            expect: [5],
            method: function() {
                return null;
            }
        },
        expectArrayWithSimilarParams1: {
            isPublic: true,
            expect: [{
                hello: o => typeof o === 'string',
                qwe: 'qwe'
            }],
            method: function() {
                return null;
            }
        }
    }
};