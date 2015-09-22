module.exports = {
    //функция, выполняемая до загрузки методов бизнес-логики
    //в конце должна быть выполнена функция done(result, error)
    //в случае возвращения результата с ошибкой эта ошибка упадёт в консоль
    //и модуль бизнес-логики загружен не будет
    //выполняетя в контексте модуля бизнес-логики
    init: function(resolve, reject) {
        setTimeout(function() {
            resolve(123);
        }, 2000);
    },
    /**
     * методы бизнес логики: возможны два варианта исполнения:
     * 1) просто имяМетода: метод
     * 2) имяМетода: {
    *        //является ли метод публичным - может ли быть корневым методом при вызове через post-запрос... по умолчанию - false
    *        isPublic: true,
    *        //является ли метод частью API - есть ли к нему доступ из других модулей бизнес-логики... по умолчанию - false
    *        //!!!ВСЕ публичные методы по умолчанию являются частью API
    *        isApi: true,
    *        //сам метод бизнес-логики, в который передаются параметры и функцию done()
    *        method: function(params, done) {
    *            var result = 'результат выполнения метода бизнес-логики';
    *            done(result);
    *        }
    *    }
     */
    methods: {
        ReturnParams: {
            isPublic: true,
            method: function(params, done) {
                done([5, 4, 3, 2, 1, 'params: ', params]);
            }
        },
        Passage: {
            isPublic: true,
            method: function(params, done) {
                var self = this,
                    done1 = false,
                    done2 = false;

                params.Passage = 'Passage!!!';
                this.call('Test.Passage1', params, function(result, error) {
                    done1 = true;
                    params.Passage1 = error;
                    checkDone();
                });
                this.call('Test.Passage2', null, function(result, error) {
                    for (var key in result) {
                        params[key] = result[key];
                    }
                    done2 = true;
                    checkDone();
                });
                function checkDone() {
                    if (done1 && done2) {
                        done(params);
                    }
                }
            }
        },
        Passage1: function(params, done) {
            done(null, 'eeeeroroororororor');
        },
        Passage2: function(params, done) {
            this.call('Test.Passage3', null, function(result, error) {
                done({
                    Passage3: result,
                    Passage2: 'Passage2!!!'
                });
            });
        },
        Passage3: function(params, done) {
            var self = this;
            setTimeout(function() {
                done(self.getSocketId());
            }, 1234);
        }
    }
};