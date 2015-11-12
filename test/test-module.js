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
            return (service.callInternal('test.returnParamsWithAddValue', {})).then(o => {
                expect(o).to.have.property('result');
                expect(o).to.have.property('time')
                    .that.is.an('number');
                expect(o).to.have.property('params');
                expect(o).to.have.property('name');
                expect(o.result).to.have.property('add')
                    .to.equal('add');
            });
        });

        it('Return param async', () => {
            return (service.callInternal('test.returnParamAsync', 'hello')).then(o => {
                expect(o).to.have.property('name')
                    .to.be.equal('test.returnParamAsync');

                expect(o).to.have.property('params')
                    .to.be.equal('hello');

                expect(o).to.have.property('result')
                    .to.be.equal('hello');

                expect(o).to.have.property('time')
                    .that.is.an('number')
                    .to.be.above(499);
            });
        });
    });

    describe('Passage', () => {
        it('With one child', () => {
            return service.callInternal('test.passageWithOneChild').then(o => {
                expect(o).to.have.property('childs')
                    .that.is.an('array')
                    .to.have.length(1)
                    .with.deep.property('[0]');

                expect(o).to.have.property('name')
                    .to.equal('test.passageWithOneChild');

                expect(o).to.have.property('result')
                    .to.equal('Hello, world! Hello, everybody!');

                expect(o).to.have.property('time')
                    .that.is.an('number');

                let child = o.childs[0];
                expect(child).to.have.property('name')
                    .to.equal('test.returnHelloWorld');

                expect(child).to.have.property('params')
                    .to.equal('some_param');

                expect(child).to.have.property('result')
                    .to.equal('Hello, world!');

                expect(child).to.have.property('time')
                    .that.is.an('number');
            });
        });

        it('With one child returns error', () => {
            return service.callInternal('test.passageWithOneChildReturnsError').catch(o => {
                expect(o).to.have.property('childs')
                    .that.is.an('array')
                    .to.have.length(1)
                    .with.deep.property('[0]');

                expect(o).to.have.property('error');

                expect(o).to.have.property('name')
                    .to.equal('test.passageWithOneChildReturnsError');

                expect(o).to.have.property('time')
                    .that.is.an('number');

                let child = o.childs[0];
                expect(child).to.have.property('name')
                    .to.equal('test.returnHelloWorld');

                expect(child).to.have.property('params')
                    .to.equal('some_param');

                expect(child).to.have.property('result')
                    .to.equal('Hello, world!');

                expect(child).to.have.property('time')
                    .that.is.an('number');

                let error = o.error;
                expect(error).to.have.property('message');
                expect(error.message).to.be.equal('123');
                expect(error).to.have.property('trace');
                expect(error.trace).to.be.instanceof(Array);
            });
        });

        it('Async with 4 childs and 1 error', () => {
            return service.callInternal('test.asyncPassageWith4ChildsAnd1Error').then(o => {
                expect(o).to.have.property('childs')
                    .that.is.an('array')
                    .to.have.length(4);
                expect(o).to.have.property('name')
                    .to.equal('test.asyncPassageWith4ChildsAnd1Error');
                expect(o).to.have.property('result')
                    .to.equal('0,1,2');
                expect(o).to.have.property('time')
                    .that.is.an('number')
                    .to.be.above(60);

                let errorChild = o.childs[0];
                expect(errorChild).to.have.property('name');
                expect(errorChild).to.have.property('time');
                expect(errorChild).to.have.property('error');

                let error = errorChild.error;
                expect(error).to.have.property('message')
                    .to.contain('is not a function');
                expect(error).to.have.property('trace')
                    .that.is.an('array');

                let first = o.childs[1];
                expect(first).to.have.property('name')
                    .to.be.equal('test.asyncString0');
                expect(first).to.have.property('result')
                    .to.be.equal('0');
                expect(first).to.have.property('time')
                    .that.is.an('number')
                    .to.be.above(49);

                let second = o.childs[2];
                expect(second).to.have.property('name')
                    .to.be.equal('test.asyncString1');
                expect(second).to.have.property('result')
                    .to.be.equal('1');
                expect(second).to.have.property('time')
                    .that.is.an('number')
                    .to.be.above(59);

                let third = o.childs[3];
                expect(third).to.have.property('name')
                    .to.be.equal('test.asyncString2');
                expect(third).to.have.property('result')
                    .to.be.equal('2');
                expect(third).to.have.property('time')
                    .that.is.an('number')
                    .to.be.above(39);
            });
        });

        it('Different childs begin time', () => {
            return service.callInternal('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin').then(o => {
                expect(o).to.have.property('childs')
                    .that.is.an('array')
                    .to.have.length(4);
                expect(o).to.have.property('name')
                    .to.equal('test.asyncPassageWith4ChildsAnd1ErrorWithDifBegin');
                expect(o).to.have.property('result')
                    .that.is.an('array')
                    .to.have.length(4);
                expect(o).to.have.property('time')
                    .that.is.an('number')
                    .to.be.above(399);

                let first = o.childs[0];
                expect(first).to.have.property('name')
                    .to.be.equal('test.asyncString0');
                expect(first).to.have.property('result')
                    .to.be.equal('0');
                expect(first).to.have.property('time')
                    .that.is.an('number')
                    .to.be.above(49);
                expect(first).to.have.property('start')
                    .that.is.an('number')
                    .to.be.above(99);

                let second = o.childs[1];
                expect(second).to.have.property('name')
                    .to.be.equal('test.asyncString1');
                expect(second).to.have.property('result')
                    .to.be.equal('1');
                expect(second).to.have.property('time')
                    .that.is.an('number')
                    .to.be.above(59);
                expect(second).to.have.property('start')
                    .that.is.an('number')
                    .to.be.above(199);

                let third = o.childs[2];
                expect(third).to.have.property('name')
                    .to.be.equal('test.asyncString2');
                expect(third).to.have.property('result')
                    .to.be.equal('2');
                expect(third).to.have.property('time')
                    .that.is.an('number')
                    .to.be.above(39);
                expect(third).to.have.property('start')
                    .that.is.an('number')
                    .to.be.above(299);

                let error = o.childs[3];
                expect(error).to.have.property('error')
                    .to.have.property('message')
                    .to.contain('is not a function');
                expect(error).to.have.property('start')
                    .that.is.an('number')
                    .to.be.above(399);

                expect([o.result[0], o.result[1], o.result[2]]).to.eql(['0', '1', '2']);
                expect(JSON.stringify(o.childs[3].error))
                    .to.equal(JSON.stringify(o.result[3].error));
            });
        });
    });

    describe('Return error', () => {
        it('String is not a function', () => {
            return (service.callInternal('test.throwError1', 'qwe')).catch(o => {
                expect(o).to.have.property('error');
                expect(o).to.have.property('time');
                expect(o).to.have.property('name')
                    .to.be.equal('test.throwError1');
                expect(o).to.have.property('params')
                    .to.be.equal('qwe');
                expect(o.error).to.have.property('message')
                    .to.contain('is not a function');
                expect(o.error).to.have.property('trace')
                    .to.be.instanceof(Array);
            });
        });

        it('Throw number', () => {
            return (service.callInternal('test.throwError2')).catch(o => {
                expect(o).to.have.property('error');
                expect(o).to.have.property('time');
                expect(o).to.have.property('name');
                expect(o.error).to.have.property('code')
                    .to.be.equal(123);
                expect(o.error).to.have.property('message')
                    .to.be.equal('Internal server error');
                expect(o.error).to.have.property('trace')
                    .to.be.instanceof(Array);
            });
        });

        it('Throw string', () => {
            return (service.callInternal('test.throwError3')).catch(o => {
                expect(o).to.have.property('error');
                expect(o.error).to.have.property('message')
                    .to.be.equal('123');
                expect(o.error).to.have.property('details')
                    .to.be.equal('Service method error: test.throwError3');
            });
        });

        it('Throw new error', () => {
            return (service.callInternal('test.throwError4')).catch(o => {
                expect(o).to.have.property('error');
                expect(o.error).to.have.property('message')
                    .to.be.equal('123');
                expect(o.error).to.have.property('trace')
                    .that.is.an('array')
                    .with.deep.property('[0]')
                    .with.deep.property('fileName')
                    .to.contain('@test\\module.js');
            });
        });

        it('Throw new service error', () => {
            return (service.callInternal('test.throwError5')).catch(o => {
                expect(o).to.have.property('error');
                expect(o.error).to.have.property('message')
                    .to.be.equal('123');
                expect(o.error).to.have.property('trace')
                    .that.is.an('array')
                    .with.deep.property('[0]')
                    .with.deep.property('fileName')
                    .to.contain('@test\\module.js');
            });
        });

        it('Throw async error in call callback', () => {
            return (service.callInternal('test.throwAsyncErrorInCallCallback')).catch(o => {
                expect(o).to.have.property('childs')
                    .that.is.an('array')
                    .to.have.length(1);
                expect(o).to.have.property('error');
            });
        });

        it('Undefined method', () => {
            return (service.callInternal('test.undefinedMethod')).catch(o => {
                expect(o).to.have.property('code')
                    .to.be.equal(405);
                expect(o).to.have.property('message')
                    .to.be.equal(`Method 'undefinedMethod' has not found in module 'test'`);
                expect(o).to.have.property('trace')
                    .that.is.an('array');
            });
        });
    });
});
