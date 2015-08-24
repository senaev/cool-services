var path = require('path');
var fs = require('fs');

var Service = module.exports = function(o) {
    var _this = this;
    this.servicePath = o.servicePath || '/service';
    this.tempDataDir = path.normalize(__dirname + '/../' + (o.tempDataDir || '_temp'));

    //remove old and create new template directories
    rmdir = require('rimraf');
    rmdir(this.tempDataDir, function(err) {
        if (err) {
            throw err;
        }

        _this.createDirectoriesStructure();
        _this.createClientFile();
    });
};

//создаём временные файл для отдачи на клиенте
Service.prototype.createClientFile = function() {
    var _this = this;
    fs.readFile(path.normalize(__dirname + '/../client/cool.js'), function read(err, buffer) {
        if (err) {
            res.status(err.status).end();
            throw err;
        }

        var strFile = buffer.toString();
        var servicePathStringName = 'service_path_string';
        var servicePathStringIndex = strFile.indexOf(servicePathStringName) + servicePathStringName.length;
        var outStr = strFile.substr(0, servicePathStringIndex) + '\nservicePath = \'' + _this.servicePath + '\';' +
            strFile.substr(servicePathStringIndex);

        fs.writeFile(_this.tempDataDir + '/client/service.js', outStr, function(err) {
            if (err) {
                throw err;
            }

            console.log('The client script was created!');
        });
    });
};

//удаляем все временные файлы
Service.prototype.createDirectoriesStructure = function() {
    if (!fs.existsSync(this.tempDataDir)) {
        fs.mkdirSync(this.tempDataDir);
    }

    if (!fs.existsSync(this.tempDataDir + '/client')) {
        fs.mkdirSync(this.tempDataDir + '/client');
    }
};

//точка входа для вызова метода бизнес-логики
Service.prototype.call = function() {
    return function() {
        var req = arguments[0];
        var res = arguments[1];
        var next = arguments[2];

        res.send('CAAAAALLLL');
    }.bind(this);
};

//отдаём клиентский скрипт
Service.prototype.client = function() {
    return function() {
        var req = arguments[0];
        var res = arguments[1];
        var next = arguments[2];

        res.sendFile(this.tempDataDir + '/client/service.js', {}, function(err) {
            if (err) {
                console.log(err);
                res.status(err.status).end();
            }
        });
    }.bind(this);
};
