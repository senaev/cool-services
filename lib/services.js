var Services = function(o) {
    var app = o.app;
    var servicesClientURI = o.clientURI || '/senaev/cs';

    app.get(servicesClientURI, function(req, res, next) {
        res.send('Hello Services')
    });
};

module.exports = Services;
