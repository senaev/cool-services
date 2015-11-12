'use strict';

module.exports = {
    methods: {
        callPublicMethodInTest: {
            isPublic: true,
            method: function() {
                return this.call('test.returnParamsWithAddValue', {first: 'first'});
            }
        },
        callPublicMethodReturnsError: {
            isPublic: true,
            method: function() {
                return this.call('test.throwError5');
            }
        }
    }
};