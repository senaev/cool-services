module.exports = {
    init: function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, 20);
    },
    methods: {
        current: {
            isPublic: true,
            method: function(params) {
                return this.call('local', params);
            }
        },
        local: {
            isPublic: true,
            before: function(o) {
                o.login = o.login.toLowerCase();
                o.password = o.password.toLowerCase();
                return o;
            },
            method: function(params) {
                return this.call('chat.test', params);
            },
            after: function(result) {
                result.isAuthorized = result.authorized ? 'Авторизован' : 'Не авторизован';
                return result;
            }
        },
        notPublic: function() {
            return 'ThIs MeThOd Is NoT pUbLiC';
        }
    },
    helpers: {}
};