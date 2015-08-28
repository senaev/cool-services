(function() {
    var servicePath = '/service';

    //after this string will be pasted servicePath variable value
    //service_path_string

    var Cool = function() {
    };

    Cool.prototype.call = function(method, params) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                method: 'POST',
                url: servicePath,
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({
                    method: method,
                    params: params
                }),
                success: function(data) {
                    resolve(data);
                },
                error: function(err, textStatus, errorName) {
                    reject(err.responseJSON);
                }
            });
        });
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
