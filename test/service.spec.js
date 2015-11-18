'use strict';

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const request = require('request');

const express = require('express');
const app = express();

//создаём сервис
const Service = require(path.normalize(__dirname + '/..'));
const service = new Service();
const service1 = new Service();

app.post('/service', service.call());
app.post('/test', (req, res) => {
    res.send('all_right');
});

let server;
before(() => {
    return new Promise((resolve => {
        server = app.listen(45973, function() {
            resolve()
        });
    })).then(Promise.all([
        service.addSource(path.normalize(__dirname + '/../examples/modules/test')),
        service1.addSource(path.normalize(__dirname + '/../examples/modules/test2'))
    ]));

});

after(() => {
    server.close();
});

service1.addExternal({
    'http://localhost:45973/service/': ['test', 'test1']
});

describe('service', function() {
    describe('external calls', () => {
        it('test test2 module', () => {
            return service1.call('test2.returnString', {}).then(str => {
                expect(str).eql('returning_string');
            });
        });

        it('app is listening', (done) => {
            request.post('http://localhost:45973/test/', function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    expect(body).eql('all_right');
                    done();
                }
            })
        });

        it('call external method in root call', () => {
            return service1.call('test.returnParamsWithAddValue', {one: 'two'}).then(str => {
                expect(str).eql({one: 'two', add: 'add'});
            });
        });

        it('call external method in root call async', () => {
            return service1.call('test.returnParamAsync', 'returnParamAsync').then(str => {
                expect(str).eql('returnParamAsync');
            });
        });

        /*it('call external method with childs', () => {
            return service1.call('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin', 'returnParamAsync').then(o => {
                expect([o[0], o[1], o[2]].join()).eql('0,1,2');
            });
        });*/
    });
});
