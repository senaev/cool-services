module.exports = {
    init: function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, 1000);
    },
    methods: {
        'current': {
            isPublic: true,
            method: function(params, done) {
                done([5, 4, 3, 2, 1, 'params: ', params]);
            }
        },
        'local': {
            isPublic: true,
            before: function(params) {
                params.cookieUser = 'GeT uSeR By CoOkIe';
                return params;
            },
            method: function(params) {
                var self = this;
                setTimeout(function() {
                    params.methodParam = 'MeThOd PaRaM';
                    self.resolve(params);
                }, 3000);
            },
            after: function(result) {
                 result.resultArter = 'AdDeD iN rEsUlT aFtEr PaRaMeTeR';
            }
        }
    },
    helpers: {

    }
};