module.exports = {
    init: function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, 1000);
    },
    methods: {
        current: {
            isPublic: true,
            method: function(params, done) {
                done([5, 4, 3, 2, 1, 'params: ', params]);
            }
        },
        local: {
            isPublic: true,
            before: function(params) {
                params.cookieUser = 'GeT uSeR By CoOkIe';
                setTimeout(function() {
                    this.resolve(params);
                }.bind(this), 500);
            },
            method: function(params) {
                return new Promise(function(resolve, reject) {
                    if (params.login === 'sacryfice' && params.password === 'qwerty') {
                        resolve('authorized');
                    } else {
                        reject('not authorized');
                    }
                }.bind(this));
            },
            after: function(result) {
                 result.resultArter = 'AdDeD iN rEsUlT aFtEr PaRaMeTeR';
            }
        },
        notPublic: function() {
            return 'ThIs MeThOd Is NoT pUbLiC';
        }
    },
    helpers: {

    }
};