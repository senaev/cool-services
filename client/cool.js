(function() {
    var servicePath = '/service';
    var Cool = function() {
    };

    Cool.prototype.call = function(method, params) {
        var _this = this;

        return new Promise(function(resolve, reject) {
            $.ajax({
                method: 'POST',
                url: _this.entryPoint,
                contentType: 'application/json',
                data: JSON.stringify({
                    method: method,
                    params: params
                }),
                success: function(a) {
                    if (typeof a === 'object') {
                        if (a.error === undefined) {
                            if (a.data !== undefined) {
                                resolve(a.data);
                            } else {
                                reject('Bad answer from server. Data option is not defined: ', a);
                            }
                        } else {
                            reject(a.error);
                        }
                    } else {
                        reject('Bad answer from server: ' + a);
                    }
                },
                error: function(err, textStatus, errorName) {
                    reject(arguments);
                }
            });
        });
    };

    Cool.prototype.setEntryPoint = function(entryPoint) {
        this.entryPoint = entryPoint;
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

    function initPromise() {//load libraries anr init Cool
        if (!window.Promise) {
            console.error('The Promises not supported with your browser. Promises library will be loaded from');
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js';
            document.getElementsByTagName('body')[0].appendChild(script);
            script.onload = initCool;
        } else {
            initCool();
        }
    }

    function initCool() {
        window.cool = new Cool();
    }
})();
