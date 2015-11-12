'use strict';

module.exports = {
    methods: {
        callPublicMethodInTest: {
            isPublic: true,
            method: function() {
                return this.call('test.returnParamsWithAddValue', {first: 'first'});
            }
        }
    }
};