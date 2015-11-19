'use strict';

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const request = require('request');

const express = require('express');
const app1 = express();
const app2 = express();

//создаём сервис
const Service = require(path.normalize(__dirname + '/..'));
const service = new Service();
const service1 = new Service();
const service2 = new Service();

app1.post('/service', service.call());
app1.post('/test', (req, res) => {
    res.send('all_right');
});

app2.post('/service', service.call());
app2.post('/test', (req, res) => {
    res.send('all_right');
});

let server1;
let server2;
before(() => {
    return new Promise((resolve => {
        server1 = app1.listen(45973, () => {
            server2 = app2.listen(12795, resolve)
        });
    })).then(Promise.all([
        service.addSource(path.normalize(__dirname + '/../examples/modules/test')),
        service1.addSource(path.normalize(__dirname + '/../examples/modules/test2'))
    ]));

});

after(() => {
    server1.close();
    server2.close();
});

service1.addExternal({
    'http://localhost:45973/service/': ['test', 'test1']
});

service2.addExternal({
    'http://localhost:12795/service/': 'test3'
});

describe('service', function() {
    describe('external call', () => {
        describe('service module and express server', () => {
            it('test test2 module', () => {
                return service1.call('test2.returnString', {}).then(str => {
                    expect(str).eql('returning_string');
                });
            });

            it('app is listening', done => {
                request.post('http://localhost:45973/test/', function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        expect(body).eql('all_right');
                        done();
                    }
                })
            });

            it('app2 is listening', done => {
                request.post('http://localhost:12795/test/', function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        expect(body).eql('all_right');
                        done();
                    }
                })
            });
        });

        describe('errors', () => {
            it('not available', () => {
                return service2.callInternal('test3.returnString').catch(o => {
                    expect(o).property('name').eql('test3.returnString');
                    expect(o).property('time').an('number').above(-1);
                    expect(o).property('external').eql(true);
                    expect(o).property('entryPoint').eql('http://localhost:12795/service/');
                    expect(o).property('error').an('object').property('message')
                        .eql('Module test3 has not found in service');
                });
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
                    expect(o).property('externalTime').an('number').above(-1);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('error').an('object').property('code').eql(123);
                    expect(o.error).property('details').eql('Service method error: test.throwError2');
                    expect(o.error).property('trace').an('array');
                    expect(o.error).property('message').eql('Internal server error');
                });
            });

            it('call api method', () => {
                return service1.callInternal('test1.callMethodReturnsComplicatedTree').then(o => {
                    expect(o).an('object').property('time').an('number').above(447);
                    expect(o).property('external').eql(true);
                    expect(o).property('externalTime').an('number').above(447);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('result').eql('0,1,2 and 0-1-2');
                    expect(o).property('childs').an('array').length(2);

                    const first = o.childs[0];
                    expect(first).property('name').eql('test.asyncPassageWith4ChildsAnd1Error');
                    expect(first).property('time').an('number').above(59);
                    expect(first).property('result').eql('0,1,2');
                    expect(first).property('start').an('number').above(-1);
                    expect(first).property('childs').an('array').length(4);

                    const second = o.childs[1];
                    expect(second).property('name').eql('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin');
                    expect(second).property('time').an('number').above(397);
                    expect(second).property('start').an('number').above(47);
                    expect(second).property('childs').an('array').length(4);
                    expect(second).property('result').an('array').length(4);
                });
            });

            it('call external in external', () => {
                return service1.callInternal('test1.callMethodReturnsComplicatedTree').then(o => {
                    expect(o).an('object').property('time').an('number').above(447);
                    expect(o).property('external').eql(true);
                    expect(o).property('externalTime').an('number').above(447);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('result').eql('0,1,2 and 0-1-2');
                    expect(o).property('childs').an('array').length(2);

                    const first = o.childs[0];
                    expect(first).property('name').eql('test.asyncPassageWith4ChildsAnd1Error');
                    expect(first).property('time').an('number').above(59);
                    expect(first).property('result').eql('0,1,2');
                    expect(first).property('start').an('number').above(-1);
                    expect(first).property('childs').an('array').length(4);

                    const second = o.childs[1];
                    expect(second).property('name').eql('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin');
                    expect(second).property('time').an('number').above(397);
                    expect(second).property('start').an('number').above(47);
                    expect(second).property('childs').an('array').length(4);
                    expect(second).property('result').an('array').length(4);
                });
            });
        });
    });
});
