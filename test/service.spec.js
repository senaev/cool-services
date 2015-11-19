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
    describe('external call', () => {
        describe('service module and express server', () => {
            it('test test2 module', () => {
                return service1.call('test2.returnString', {}).then(str => {
                    expect(str).eql('returning_string');
                });
            });

            it('app is listening', (done) => {
                request.post('http://localhost:45973/test/', function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        expect(body).eql('all_right');
                        done();
                    }
                })
            });
        });

        describe('in root', () => {
            it('simple', () => {
                return service1.call('test.returnParamsWithAddValue', {one: 'two'}).then(o => {
                    expect(o).eql({one: 'two', add: 'add'});
                });
            });

            it('internal call', () => {
                return service1.callInternal('test.returnParamsWithAddValue', {one: 'two'}).then(o => {
                    expect(o).property('result').eql({one: 'two', add: 'add'});
                    expect(o).property('name').eql('test.returnParamsWithAddValue');
                    expect(o).property('time').an('number').above(-1);
                    expect(o).property('externalTime').an('number').above(-1);
                    expect(o).property('external').eql(true);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                });
            });

            it('async', () => {
                return service1.call('test.returnParamAsync', 'returnParamAsync').then(str => {
                    expect(str).eql('returnParamAsync');
                });
            });

            it('method with childs', () => {
                return service1.callInternal('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin').then(o => {
                    expect(o).an('object').property('time').an('number').above(397);
                    expect(o).property('name').eql('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin');
                    expect(o).property('result').an('array').length(4);
                    expect(o.result[0]).eql('0');
                    expect(o.result[3]).an('object').property('trace').an('array');
                    expect(o.result[3]).an('object').property('message').eql('hello is not a function');
                    expect(o).property('childs').an('array').length(4);
                    expect(o.childs[3]).property('error').eql(o.result[3]);
                });
            });

            it('returns error', () => {
                return service1.callInternal('test.throwError2', 'returnParamAsync').catch(o => {
                    expect(o).an('object').property('time').an('number').above(-1);
                    expect(o).property('params').eql('returnParamAsync');
                    expect(o).property('external').eql(true);
                    expect(o).property('externalTime').an('number').above(0);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('error').an('object').property('code').eql(123);
                    expect(o.error).property('details').eql('Service method error: test.throwError2');
                    expect(o.error).property('trace').an('array');
                    expect(o.error).property('message').eql('Internal server error');
                });
            });
        });
    });
});
