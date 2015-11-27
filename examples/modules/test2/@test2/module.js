'use strict';

module.exports = {
    methods: {
        returnString: {
            isPublic: true,
            method: function() {
                return 'returning_string';
            }
        },
        throwError: {
            isPublic: true,
            method: function() {
                throw 'ERRROOOOORRRR!!!';
            }
        }
    }
};