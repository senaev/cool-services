module.exports = {
    methods: {
        test: {
            isApi: true,
            method: function(params) {
                this.call('Passage').then(function() {
                    this.resolve([5, 4, 3, 2, 1, 'params: ', params]);
                }.bind(this));
            }
        },
        Passage: {
            isPublic: true,
            method: function(params) {
                var self = this,
                    done1 = false,
                    done2 = false;

                params = params || {};

                params.Passage = 'Passage!!!';
                this.call('Passage1', params).then(function(result, error) {
                    done1 = true;
                    params.Passage1 = error;
                    checkDone();
                }, function() {
                    done1 = true;
                    checkDone();
                });

                this.call('Passage2').then(function(result) {
                    for (var key in result) {
                        params[key] = result[key];
                    }
                    done2 = true;
                    checkDone();
                }, function() {
                    done2 = true;
                    checkDone();
                });

                function checkDone() {
                    if (done1 && done2) {
                        self.resolve(params);
                    }
                }
            },
            after: function() {
                throw 'qwe';
            }
        },
        Passage1: function(params) {
            this.error('qweeeeeeeeeeee')
        },
        Passage2: function(params, done) {
            var self = this;
            this.call('Passage3').then(function(result, error) {
                self.resolve({
                    Passage3: result,
                    Passage2: 'Passage2!!!'
                });
            });
        },
        Passage3: function(params, done) {
            var self = this;
            setTimeout(function() {
                self.resolve('Passage3333');
            }, 1234);
        }
    }
};