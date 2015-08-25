(function() {
    var servicePath = '/service';

    //after this string will be pasted servicePath variable value
    //service_path_string

    var Cool = function() {
    };

    Cool.prototype.call = function(method, params) {
        var deferred = $.Deferred();

        //проверяем какие-то параметры сразу на входе, чтобы не было проблем в дальнейшем
        if (method && typeof method === 'string' && /^[\w\d]{1,}\.[\w\d]{1,}$/.test(method)) {
            $.ajax({
                method: 'POST',
                url: servicePath,
                data: {
                    method: method,
                    params: JSON.stringify(params)
                },
                success: function(a) {
                    if (a.status && a.status === 'ok') {
                        deferred.resolve(a.data);
                    } else if (a.status === 'error' && a.info) {
                        deferred.reject(a.info);
                    } else {
                        deferred.reject({
                            code: 0,
                            message: 'Произошла ошибка в ходе выполнения метода бизнес-логики на сервере',
                            details: {
                                message: 'С сервера пришел ответ, не соответствующий стандартам методов бизнес-логики',
                                method: method,
                                data: params,
                                answer: a
                            }
                        });
                    }
                },
                error: function(err, textStatus, errorName) {
                    deferred.reject({
                        code: 0,
                        message: 'Произошла ошибка в ходе выполнения запроса к методу бизнес-логики',
                        details: {
                            message: 'Произошел AJAX-error в ходе выполнения запроса к методу бизнес-логики на сервере',
                            method: method,
                            data: params,
                            error: err,
                            textStatus: textStatus,
                            errorName: errorName
                        }
                    });
                }
            });
        } else {
            deferred.reject({
                code: 0,
                message: 'Название метода бизнес-логики указано в неверном формате',
                details: {
                    message: 'Либо вы не передали в функцию название метода бизнес логики, либо оно не является ' +
                    'строкой, либо передано в неверном формате.Название метода бизнес логики должно состоять из ' +
                    'латинских символов, цифр и точки. При этом точка должна быть одна и должна разделять две ' +
                    'части - имя модуля бизнес-логики и имя метода. Оба имени должны состоять из минимум одного ' +
                    'латинского символа, или цифры',
                    method: method
                }
            });
        }

        return deferred.promise();
    };

    //load libraries anr init Cool
    if (!window.jQuery) {
        console.error('The Cool client library needs to load jQuery. Jquery will be loaded from Google CDN.');
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js';
        document.getElementsByTagName('body')[0].appendChild(script);
        script.onload = initCool;
    } else {
        initCool();
    }

    function initCool() {
        window.cool = new Cool();
    }
})();
