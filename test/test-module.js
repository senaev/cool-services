'use strict';

let path = require('path');
let chai = require('chai');
require("mocha-as-promised")();
let expect = chai.expect;

//создаём сервис
let Service = require(path.normalize(__dirname + '/..'));
let service = new Service();

before(function () {
    return service.addSource(path.normalize(__dirname + '/../examples/modules'));
});

describe('Service', function () {
    describe('Return simple results', () => {
        it('Add param', () => {
            return service.callInternal('test.returnParamsWithAddValue', {}).then(o => {
                expect(o).property('result');
                expect(o).property('time').an('number');
                expect(o).property('params');
                expect(o).property('name');
                expect(o.result).property('add').eql('add');
            });
        });

        it('Return param async', () => {
            return service.callInternal('test.returnParamAsync', 'hello').then(o => {
                expect(o).property('name').eql('test.returnParamAsync');
                expect(o).property('params').eql('hello');
                expect(o).property('result').eql('hello');
                expect(o).property('time').an('number').above(497);
            });
        });
    });

    describe('Passage', () => {
        it('With one child', () => {
            return service.callInternal('test.passageWithOneChild').then(o => {
                expect(o).property('childs').an('array').length(1);
                expect(o).property('name').eql('test.passageWithOneChild');
                expect(o).property('result').eql('Hello, world! Hello, everybody!');
                expect(o).property('time').an('number');

                let child = o.childs[0];
                expect(child).property('name').eql('test.returnHelloWorld');
                expect(child).property('params').eql('some_param');
                expect(child).property('result').eql('Hello, world!');
                expect(child).property('time').an('number');
            });
        });

        it('With one child returns error', () => {
            return service.callInternal('test.passageWithOneChildReturnsError').catch(o => {
                expect(o).property('childs').an('array').length(1);
                expect(o).property('error');
                expect(o).property('name').eql('test.passageWithOneChildReturnsError');
                expect(o).property('time').an('number');

                let child = o.childs[0];
                expect(child).property('name').eql('test.returnHelloWorld');
                expect(child).property('params').eql('some_param');
                expect(child).property('result').eql('Hello, world!');
                expect(child).property('time').an('number');

                let error = o.error;
                expect(error).property('message').eql('123');
                expect(error).property('trace').an('array');
            });
        });

        it('Async with 4 childs and 1 error', () => {
            return service.callInternal('test.asyncPassageWith4ChildsAnd1Error').then(o => {
                expect(o).property('childs').an('array').length(4);
                expect(o).property('name').eql('test.asyncPassageWith4ChildsAnd1Error');
                expect(o).property('result').eql('0,1,2');
                expect(o).property('time').an('number').above(57);

                let errorChild = o.childs[0];
                expect(errorChild).property('name');
                expect(errorChild).property('time');
                expect(errorChild).property('error');

                let error = errorChild.error;
                expect(error).property('message').contain('is not a function');
                expect(error).property('trace').an('array');

                let first = o.childs[1];
                expect(first).property('name').eql('test.asyncString0');
                expect(first).property('result').eql('0');
                expect(first).property('time').an('number').above(47);

                let second = o.childs[2];
                expect(second).property('name').eql('test.asyncString1');
                expect(second).property('result').eql('1');
                expect(second).property('time').an('number').above(57);

                let third = o.childs[3];
                expect(third).property('name').eql('test.asyncString2');
                expect(third).property('result').eql('2');
                expect(third).property('time').an('number').above(37);
            });
        });

        it('Different childs begin time', () => {
            return service.callInternal('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin').then(o => {
                expect(o).property('childs').an('array').length(4);
                expect(o).property('name').eql('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin');
                expect(o).property('result').an('array').length(4);
                expect(o).property('time').an('number').above(397);

                let first = o.childs[0];
                expect(first).property('name').eql('test.asyncString0');
                expect(first).property('result').eql('0');
                expect(first).property('time').an('number').above(47);
                expect(first).property('start').an('number').above(97);

                let second = o.childs[1];
                expect(second).property('name').eql('test.asyncString1');
                expect(second).property('result').eql('1');
                expect(second).property('time').an('number').above(57);
                expect(second).property('start').an('number').above(197);

                let third = o.childs[2];
                expect(third).property('name').eql('test.asyncString2');
                expect(third).property('result').eql('2');
                expect(third).property('time').an('number').above(39);
                expect(third).property('start').an('number').above(297);

                let error = o.childs[3];
                expect(error).property('error').property('message').contain('is not a function');
                expect(error).property('start').an('number').above(397);

                expect([o.result[0], o.result[1], o.result[2]]).eql(['0', '1', '2']);
                expect(JSON.stringify(o.childs[3].error)).eql(JSON.stringify(o.result[3].error));
            });
        });
    });

    describe('Return error', () => {
        it('String is not a function', () => {
            return service.callInternal('test.throwError1', 'qwe').catch(o => {
                expect(o).property('error').an('object');
                expect(o).property('time').an('number');
                expect(o).property('name').eql('test.throwError1');
                expect(o).property('params').eql('qwe');
                expect(o.error).property('message').contain('is not a function');
                expect(o.error).property('trace').an('array');
            });
        });

        it('Throw number', () => {
            return service.callInternal('test.throwError2').catch(o => {
                expect(o).property('error');
                expect(o).property('time');
                expect(o).property('name');
                expect(o.error).property('code').eql(123);
                expect(o.error).property('message').eql('Internal server error');
                expect(o.error).property('trace').an('array');
            });
        });

        it('Throw string', () => {
            return (service.callInternal('test.throwError3')).catch(o => {
                expect(o).property('error').property('message').eql('123');
                expect(o.error).property('details').eql('Service method error: test.throwError3');
            });
        });

        it('Throw new error', () => {
            return service.callInternal('test.throwError4').catch(o => {
                expect(o).property('error').property('message').eql('123');
                expect(o.error).property('trace').an('array').property(0)
                    .property('fileName').contain('@test\\module.js');
            });
        });

        it('Throw new service error', () => {
            return service.callInternal('test.throwError5').catch(o => {
                expect(o).property('error').property('message').eql('123');
                expect(o.error).property('trace').an('array').property(0)
                    .property('fileName').contain('@test\\module.js');
            });
        });

        it('Throw async error in call callback', () => {
            return service.callInternal('test.throwAsyncErrorInCallCallback').catch(o => {
                expect(o).property('childs').an('array').length(1);
                expect(o).property('error');
            });
        });

        it('Undefined method', () => {
            return service.callInternal('test.undefinedMethod').catch(o => {
                expect(o).property('code').eql(405);
                expect(o).property('message').eql(`Method 'undefinedMethod' has not found in module 'test'`);
                expect(o).property('trace').an('array');
            });
        });

        it('Undefined module', () => {
            return service.callInternal('undefinedModule.undefined').catch(o => {
                expect(o).property('code').eql(400);
                expect(o).property('message').eql(`Module 'undefinedModule' has not found in service`);
                expect(o).property('trace').an('array');
            });
        });

        it('Call with circle param', () => {
            let x = {};
            x.x = x;
            return service.callInternal('test.returnParamsWithAddValue', x).catch(o => {
                expect(o).property('name').eql('test.returnParamsWithAddValue');
                expect(o).property('error').an('object');

                let error = o.error;
                expect(error).property('message').eql('Internal server error');
                expect(error).property('code').eql(508);
                expect(error).property('details')
                    .eql('Method test.returnParamsWithAddValue has been called with circular params');
                expect(error).property('trace').an('array');
            });
        });

        it('Call returns circular result', () => {
            return service.callInternal('test.returnCircular', 'some_param').catch(o => {
                expect(o).property('name').eql('test.returnCircular');
                expect(o).property('error').an('object');
                expect(o).property('time').an('number').above(-1);
                expect(o).property('params').eql('some_param');

                let error = o.error;
                expect(error).property('code').eql(508);
                expect(error).property('details')
                    .eql('Method test.returnCircular returns circular result');
                expect(error).property('trace').an('array');
                expect(error).property('message').eql('Internal server error');
            });
        });
    });

    describe('Modules cooperation', () => {
        it ('Return value from other module', () => {
            return service.call('test1.callPublicMethodInTest').then(result => {
                expect(result).eql({first: 'first', add: 'add'});
            });
        });

        it ('Method in other module returns error', () => {
            return service.call('test1.callPublicMethodReturnsError').catch(error => {
                expect(error).property('message').eql('123');
                expect(error).property('trace').an('array')
            });
        });
    });
});
