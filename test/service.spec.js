'use strict';

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const request = require('request');

const express = require('express');
const app1 = express();
const app2 = express();

//создаём сервис
const Service = require(path.normalize(__dirname + '/..'));
const service = new Service();
const service1 = new Service();
const service2 = new Service();

app1.post('/service', service1.call());
app1.post('/test', (req, res) => {
    res.send('all_right');
});

app2.post('/service', service2.call());
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
        service1.addSource(path.normalize(__dirname + '/../examples/modules/test')),
        service2.addSource(path.normalize(__dirname + '/../examples/modules/test2'))
    ]));
});

after(() => {
    server1.close();
    server2.close();
});

service.addExternal({
    'http://localhost:45973/service/': ['test', 'test1'],
    'http://localhost:12795/service/': ['test2', 'undefinedModule']
});

service1.addExternal({
    'http://localhost:12795/service/': ['test2']
});

describe('service', function () {
    describe('external call', () => {
        describe('express server', () => {
            it('app is listening', done => {
                request.post('http://localhost:45973/test/', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        expect(body).eql('all_right');
                        done();
                    }
                })
            });

            it('app2 is listening', done => {
                request.post('http://localhost:12795/test/', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        expect(body).eql('all_right');
                        done();
                    }
                })
            });
        });

        describe('connect to modules', () => {
            it('test', () => {
                return service.call('test.returnHelloWorld', {}).then(str => {
                    expect(str).eql('Hello, world!');
                });
            });

            it('test1', () => {
                return service.call('test1.returnString', {}).then(str => {
                    expect(str).eql('is test1 module');
                });
            });

            it('test2', () => {
                return service.call('test2.returnString', {}).then(str => {
                    expect(str).eql('returning_string');
                });
            });
        });

        describe('errors', () => {
            it('module not found', () => {
                return service.callInternal('undefinedModule.returnString')
                    .then(assert.fail)
                    .catch(o => {
                    expect(o).property('name').eql('undefinedModule.returnString');
                    expect(o).property('time').a('number').above(-1);
                    expect(o).property('external').eql(true);
                    expect(o).property('entryPoint').eql('http://localhost:12795/service/');
                    expect(o).property('error').an('object').property('message')
                        .eql('Module undefinedModule has not found in service');
                });
            });

            it('method not found', () => {
                return service.callInternal('test.undefinedMethod', {lala: 'lolo'})
                    .then(assert.fail)
                    .catch(o => {
                    expect(o).property('name').eql('test.undefinedMethod');
                    expect(o).property('time').a('number').above(-1);
                    expect(o).property('external').eql(true);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('error').an('object').property('message')
                        .eql('Method test.undefinedMethod has not found in module');
                    expect(o).property('params').eql({lala: 'lolo'});
                });
            });
        });

        describe('in root', () => {
            it('simple', () => {
                return service.call('test.returnParamsWithAddValue', {one: 'two'}).then(o => {
                    expect(o).eql({one: 'two', add: 'add'});
                });
            });

            it('internal call', () => {
                return service.callInternal('test.returnParamsWithAddValue', {one: 'two'}).then(o => {
                    expect(o).property('result').eql({one: 'two', add: 'add'});
                    expect(o).property('name').eql('test.returnParamsWithAddValue');
                    expect(o).property('time').a('number').above(-1);
                    expect(o).property('externalTime').a('number').above(-1);
                    expect(o).property('external').eql(true);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                });
            });

            it('async', () => {
                return service.call('test.returnParamAsync', 'returnParamAsync').then(str => {
                    expect(str).eql('returnParamAsync');
                });
            });

            it('method with childs', () => {
                return service.callInternal('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin').then(o => {
                    expect(o).an('object').property('time').a('number').above(397);
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
                return service.callInternal('test.throwError2', 'returnParamAsync')
                    .then(assert.fail)
                    .catch(o => {
                    expect(o).an('object').property('time').a('number').above(-1);
                    expect(o).property('params').eql('returnParamAsync');
                    expect(o).property('external').eql(true);
                    expect(o).property('externalTime').a('number').above(-1);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('error').an('object').property('code').eql(123);
                    expect(o.error).property('details').eql('Service method error: test.throwError2');
                    expect(o.error).property('trace').an('array');
                    expect(o.error).property('message').eql('Internal server error');
                });
            });

            it('call api method', () => {
                return service.callInternal('test1.callMethodReturnsComplicatedTree').then(o => {
                    expect(o).an('object').property('time').a('number').above(447);
                    expect(o).property('external').eql(true);
                    expect(o).property('externalTime').a('number').above(447);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('result').eql('0,1,2 and 0-1-2');
                    expect(o).property('childs').an('array').length(2);

                    const first = o.childs[0];
                    expect(first).property('name').eql('test.asyncPassageWith4ChildsAnd1Error');
                    expect(first).property('time').a('number').above(59);
                    expect(first).property('result').eql('0,1,2');
                    expect(first).property('start').a('number').above(-1);
                    expect(first).property('childs').an('array').length(4);

                    const second = o.childs[1];
                    expect(second).property('name').eql('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin');
                    expect(second).property('time').a('number').above(397);
                    expect(second).property('start').a('number').above(47);
                    expect(second).property('childs').an('array').length(4);
                    expect(second).property('result').an('array').length(4);
                });
            });

            it('call with childs', () => {
                return service.callInternal('test1.callMethodReturnsComplicatedTree').then(o => {
                    expect(o).an('object').property('time').a('number').above(447);
                    expect(o).property('external').eql(true);
                    expect(o).property('externalTime').a('number').above(447);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('result').eql('0,1,2 and 0-1-2');
                    expect(o).property('childs').an('array').length(2);

                    const first = o.childs[0];
                    expect(first).property('name').eql('test.asyncPassageWith4ChildsAnd1Error');
                    expect(first).property('time').a('number').above(59);
                    expect(first).property('result').eql('0,1,2');
                    expect(first).property('start').a('number').above(-1);
                    expect(first).property('childs').an('array').length(4);

                    const second = o.childs[1];
                    expect(second).property('name').eql('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin');
                    expect(second).property('time').a('number').above(397);
                    expect(second).property('start').a('number').above(47);
                    expect(second).property('childs').an('array').length(4);
                    expect(second).property('result').an('array').length(4);
                });
            });

            it('call external', () => {
                return service.callInternal('test1.callExternal').then(o => {
                    expect(o).property('name').eql('test1.callExternal');
                    expect(o).property('time').a('number').above(-1);
                    expect(o).property('external').eql(true);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('result').eql('returning_string');
                    expect(o).property('externalTime').a('number').above(-1);
                    expect(o).property('childs').an('array').length(1);

                    const child = o.childs[0];
                    expect(child).property('name').eql('test2.returnString');
                    expect(child).property('time').a('number').above(-1);
                    expect(child).property('external').eql(true);
                    expect(child).property('entryPoint').eql('http://localhost:12795/service/');
                    expect(child).property('result').eql('returning_string');
                    expect(child).property('externalTime').a('number').above(-1);
                });
            });

            it('call external returns error', () => {
                return service.callInternal('test1.callExternalReturnsError')
                    .then(assert.fail)
                    .catch(o => {
                    expect(o).property('name').eql('test1.callExternalReturnsError');
                    expect(o).property('time').a('number').above(-1);
                    expect(o).property('external').eql(true);
                    expect(o).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('error').an('object');
                    expect(o).property('externalTime').a('number').above(-1);
                    expect(o).property('childs').an('array').length(1);

                    const error = o.error;
                    expect(error).property('details').eql('Service method error: test2.throwError');
                    expect(error).property('trace').an('array');
                    expect(error).property('message').eql('ERRROOOOORRRR!!!');

                    const errorChild = o.childs[0];
                    expect(errorChild).property('name').eql('test2.throwError')
                    expect(errorChild).property('time').a('number').above(-1);
                    expect(errorChild).property('external').eql(true);
                    expect(errorChild).property('externalTime').a('number').above(-1);
                    expect(errorChild).property('entryPoint').eql('http://localhost:12795/service/');
                    expect(errorChild).property('time').a('number').above(-1);
                    expect(errorChild).property('error').an('object');

                    expect(errorChild.error).eql(error)
                });
            });
        });
    });
});
