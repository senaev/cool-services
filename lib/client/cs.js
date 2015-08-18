var Cs = function() {
};

//вызов метода бизнес-логики
Cs.prototype.call = function(method, params) {
    var deferred = $.Deferred();
    //провер€ем какие-то параметры сразу на входе, чтобы не было проблем в дальнейшем
    if (method && typeof method === 'string' && /^[\w\d]{1,}\.[\w\d]{1,}$/.test(method)) {
        $.ajax({
            method: "POST",
            url: "/request/bl",
            data: {
                'method': method,
                'params': JSON.stringify(params),
                'socketId': (function() {
                    if (window.socket && typeof window.socket.id === 'string') {
                        return window.socket.id;
                    } else {
                        return null;
                    }
                })()
            },
            success: function(a) {
                if (a.status && a.status === 'ok') {
                    deferred.resolve(a.data);
                } else if (a.status === 'error' && a.info) {
                    deferred.reject(a.info);
                } else {
                    deferred.reject({
                        code: 0,
                        message: 'ѕроизошла ошибка в ходе выполнени€ метода бизнес-логики на сервере',
                        details: {
                            message: '— сервера пришел ответ, не соответствующий стандартам методов бизнес-логики',
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
                    message: 'ѕроизошла ошибка в ходе выполнени€ запроса к методу бизнес-логики',
                    details: {
                        message: 'ѕроизошел AJAX-error в ходе выполнени€ запроса к методу бизнес-логики на сервере',
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
            message: 'Ќазвание метода бизнес-логики указано в неверном формате',
            details: {
                message: 'Ћибо вы не передали в функцию название метода бизнес логики, либо оно не €вл€етс€ строкой, ' +
                'либо передано в неверном формате.Ќазвание метода бизнес логики должно состо€ть из латинских символов, цифр и точки. ' +
                'ѕри этом точка должна быть одна и должна раздел€ть две части - им€ модул€ бизнес-логики и им€ метода. ' +
                'ќба имени должны состо€ть из минимум одного латинского символа, или цифры',
                method: method
            }
        });
    }
    return deferred.promise();
};

var bl = new Cs();
