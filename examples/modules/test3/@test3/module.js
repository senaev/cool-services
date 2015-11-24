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
        }
    }
};