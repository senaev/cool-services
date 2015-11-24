'use strict';

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const request = require('request');

const express = require('express');
const app = express();
const app1 = express();
const app2 = express();

//создаём сервис
const Service = require(path.normalize(__dirname + '/..'));
const service = new Service();
const service1 = new Service();
const service2 = new Service();

app.post('/service', service.call());
app.post('/test', (req, res) => {
    res.send('all_right');
});

app1.post('/service', service1.call());
app1.post('/test', (req, res) => {
    res.send('all_right');
});

app2.post('/service', service2.call());
app2.post('/test', (req, res) => {
    res.send('all_right');
});

let server;
let server1;
let server2;
before(() => {
    return new Promise((resolve => {
        server = app.listen(34679, () => {
            server1 = app1.listen(45973, () => {
                server2 = app2.listen(12795, resolve)
            });
        });
    })).then(Promise.all([
        service1.addSource(path.normalize(__dirname + '/../examples/modules/test')),
        service2.addSource(path.normalize(__dirname + '/../examples/modules/test2')),
        service2.addSource(path.normalize(__dirname + '/../examples/modules/test3'))
    ]));
});

service.addExternal({
    'http://localhost:45973/service/': ['test', 'test1', 'test3'],
    'http://localhost:12795/service/': ['test2', 'undefinedModule']
});

service1.addExternal({
    'http://localhost:12795/service/': ['test2', 'test3']
});

service2.addExternal({
    'http://localhost:34679/service/': ['test1']
});

after(() => {
    server.close();
    server1.close();
    server2.close();
});

describe('service', function () {
    describe('external call', () => {
        describe('express server', () => {
            it('app is listening', done => {
                request.post('http://localhost:34679/test/', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        expect(body).eql('all_right');
                        done();
                    }
                })
            });

            it('app1 is listening', done => {
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
                        expect(o).property('external').an('array').length(1);
                        expect(o.external[0]).property('entryPoint').eql('http://localhost:12795/service/');
                        expect(o.external[0]).property('time').least(0);
                        expect(o).property('error').an('object').property('message')
                            .eql('Module undefinedModule has not found in service');
                    });
            });

            it('method not found', () => {
                return service.callInternal('test.undefinedMethod', {lala: 'lolo'})
                    .then(assert.fail)
                    .catch(o => {
                        expect(o).property('name').eql('test.undefinedMethod');
                        expect(o).property('external').an('array').length(1);
                        expect(o.external[0]).property('entryPoint').eql('http://localhost:45973/service/');
                        expect(o.external[0]).property('time').a('number').least(0);
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
                    expect(o).property('external').an('array').length(1).property(0)
                        .an('object').property('time').an('number');
                    expect(o.external[0].time).least(0);
                    expect(o.external[0].entryPoint).eql('http://localhost:45973/service/');
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
                        expect(o).an('object').property('time').a('number').least(0);
                        expect(o).property('params').eql('returnParamAsync');
                        expect(o).property('external').an('array').length(1);
                        expect(o.external[0]).property('time').a('number').least(0);
                        expect(o.external[0]).property('entryPoint').eql('http://localhost:45973/service/');
                        expect(o).property('error').an('object').property('code').eql(123);
                        expect(o.error).property('details').eql('Service method error: test.throwError2');
                        expect(o.error).property('trace').an('array');
                        expect(o.error).property('message').eql('Internal server error');
                    });
            });

            it('call api method', () => {
                return service.callInternal('test1.callMethodReturnsComplicatedTree').then(o => {
                    expect(o).an('object').property('time').a('number').least(448);
                    expect(o).property('external').an('array').length(1);
                    expect(o.external[0]).property('time').a('number').least(448);
                    expect(o.external[0]).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('result').eql('0,1,2 and 0-1-2');
                    expect(o).property('childs').an('array').length(2);

                    const first = o.childs[0];
                    expect(first).property('name').eql('test.asyncPassageWith4ChildsAnd1Error');
                    expect(first).property('time').a('number').least(59);
                    expect(first).property('result').eql('0,1,2');
                    expect(first).property('start').a('number').least(0);
                    expect(first).property('childs').an('array').length(4);

                    const second = o.childs[1];
                    expect(second).property('name').eql('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin');
                    expect(second).property('time').a('number').least(398);
                    expect(second).property('start').a('number').least(48);
                    expect(second).property('childs').an('array').length(4);
                    expect(second).property('result').an('array').length(4);
                });
            });

            it('call with childs', () => {
                return service.callInternal('test1.callMethodReturnsComplicatedTree').then(o => {
                    expect(o).an('object').property('time').a('number').least(448);
                    expect(o).property('external').an('array').length(1);
                    expect(o.external[0]).property('time').a('number').least(448);
                    expect(o.external[0]).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o).property('result').eql('0,1,2 and 0-1-2');
                    expect(o).property('childs').an('array').length(2);

                    const first = o.childs[0];
                    expect(first).property('name').eql('test.asyncPassageWith4ChildsAnd1Error');
                    expect(first).property('time').a('number').least(59);
                    expect(first).property('result').eql('0,1,2');
                    expect(first).property('start').a('number').least(0);
                    expect(first).property('childs').an('array').length(4);

                    const second = o.childs[1];
                    expect(second).property('name').eql('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin');
                    expect(second).property('time').a('number').least(398);
                    expect(second).property('start').a('number').least(48);
                    expect(second).property('childs').an('array').length(4);
                    expect(second).property('result').an('array').length(4);
                });
            });

            it('call external', () => {
                return service.callInternal('test1.callExternal').then(o => {
                    expect(o).property('name').eql('test1.callExternal');
                    expect(o).property('time').a('number').least(0);
                    expect(o).property('external').an('array').length(1);
                    expect(o.external[0]).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o.external[0]).property('time').a('number').least(0);
                    expect(o).property('result').eql('returning_string');
                    expect(o).property('childs').an('array').length(1);

                    const child = o.childs[0];
                    expect(child).property('name').eql('test2.returnString');
                    expect(child).property('time').a('number').least(0);
                    expect(child).property('external').an('array').length(1);
                    expect(child.external[0]).property('entryPoint').eql('http://localhost:12795/service/');
                    expect(child.external[0]).property('time').a('number').least(0);
                    expect(child).property('result').eql('returning_string');
                });
            });

            it('call external returns error', () => {
                return service.callInternal('test1.callExternalReturnsError')
                    .then(assert.fail)
                    .catch(o => {
                        expect(o).property('name').eql('test1.callExternalReturnsError');
                        expect(o).property('time').a('number').least(0);
                        expect(o).property('external').an('array').length(1);
                        expect(o.external[0]).property('entryPoint').eql('http://localhost:45973/service/');
                        expect(o.external[0]).property('time').a('number').least(0);
                        expect(o).property('error').an('object');
                        expect(o).property('childs').an('array').length(1);

                        const error = o.error;
                        expect(error).property('details').eql('Service method error: test2.throwError');
                        expect(error).property('trace').an('array');
                        expect(error).property('message').eql('ERRROOOOORRRR!!!');

                        const errorChild = o.childs[0];
                        expect(errorChild).property('name').eql('test2.throwError');
                        expect(errorChild).property('time').a('number').least(0);
                        expect(errorChild).property('external').an('array').length(1);
                        expect(errorChild.external[0]).property('time').an('number').least(0);
                        expect(errorChild.external[0]).property('entryPoint').eql('http://localhost:12795/service/');
                        expect(errorChild).property('time').a('number').least(0);
                        expect(errorChild).property('error').an('object');

                        expect(errorChild.error).eql(error)
                    });
            });

            it('twice proxy', () => {
                return service.callInternal('test3.returnString', 'with params').then(o => {
                    expect(o).property('name').eql('test3.returnString');
                    expect(o).property('params').eql('with params');
                    expect(o).property('external').an('array').length(2);
                    expect(o.external[0]).property('time').a('number').least(499);
                    expect(o.external[0]).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o.external[1]).property('time').a('number').least(499);
                    expect(o.external[1]).property('entryPoint').eql('http://localhost:12795/service/');
                    expect(o).property('time').a('number').least(499);
                    expect(o).property('result').eql('is test3 module with params');
                });
            });

            it('twice proxy with child with proxy', () => {
                return service.callInternal('test3.callTest3ReturnStringFromTest1', 'with params').then(o => {
                    expect(o).property('name').eql('test3.callTest3ReturnStringFromTest1');
                    expect(o).property('params').eql('with params');
                    expect(o).property('external').an('array').length(2);
                    expect(o.external[0]).property('time').a('number').least(499);
                    expect(o.external[0]).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(o.external[1]).property('time').a('number').least(499);
                    expect(o.external[1]).property('entryPoint').eql('http://localhost:12795/service/');
                    expect(o).property('time').a('number').least(499);
                    expect(o).property('result').eql('is test3 module with params');
                    expect(o).property('childs').an('array').length(1);

                    const child = o.childs[0];
                    expect(child).property('name').eql('test1.callTest3ReturnString');
                    expect(child).property('params').eql('with params');
                    expect(child).property('external').an('array').length(2);
                    expect(child.external[0]).property('time').a('number').least(499);
                    expect(child.external[0]).property('entryPoint').eql('http://localhost:34679/service/');
                    expect(child.external[1]).property('time').a('number').least(499);
                    expect(child.external[1]).property('entryPoint').eql('http://localhost:45973/service/');
                    expect(child).property('time').a('number').least(499);
                    expect(child).property('result').eql('is test3 module with params');
                    expect(child).property('start').a('number').least(0);

                    const deepChild = child.childs[0];
                    expect(deepChild).property('name').eql('test3.returnString');
                    expect(deepChild).property('params').eql('with params');
                    expect(deepChild).property('external').an('array').length(1);
                    expect(deepChild.external[0]).property('time').a('number').least(499);
                    expect(deepChild.external[0]).property('entryPoint').eql('http://localhost:12795/service/');
                    expect(deepChild).property('time').a('number').least(499);
                    expect(deepChild).property('result').eql('is test3 module with params');
                    expect(deepChild).property('start').a('number').least(0);
                });
            });
        });
    });

    describe('external requests', () => {
        /*it('simple', done => {
            request.post({
                url: 'http://localhost:34679/service/',
                json: {
                    method: 'test1.callMethodReturnsComplicatedTree',
                    params: 'params'
                }
            }, (error, response, body) => {
                expect(body).property('name').eql('test1.callMethodReturnsComplicatedTree');
                expect(body).property('params').eql('params');
                done();
            });
        });*/

        /*it('resurls comparation', () => {
         return service.callInternal('test1.callMethodReturnsComplicatedTree').then(o => {
         console.log(o);
         });
         });*/
    });
});
