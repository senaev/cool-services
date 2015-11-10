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
        it('Add param', function () {
            return (service.call('test.returnParamsWithAddValue', {})).then(function (o) {
                expect(o).to.have.property('result');
                expect(o).to.have.property('time');
                expect(o).to.have.property('params');
                expect(o).to.have.property('name');
                expect(o.result).to.have.property('add');
                expect(o.result.add).to.equal('add');
                expect(o.time).that.is.an('number');
            });
        });
    });

    describe('Passage', () => {
        it('With one child', function () {
            return (service.call('test.passageWithOneChild')).then(function (o) {
                expect(o).to.have.property('childs')
                    .that.is.an('array')
                    .to.have.length(1)
                    .with.deep.property('[0]');

                expect(o).to.have.property('name')
                    .to.equal('test.passageWithOneChild');

                expect(o).to.have.property('result')
                    .to.equal('Wello, world! Hello, everybody!');

                expect(o).to.have.property('time')
                    .that.is.an('number');

                let child = o.childs[0];
                expect(child).to.have.property('name')
                    .to.equal('test.returnHelloWorld');

                expect(child).to.have.property('params')
                    .to.equal('some_param');

                expect(child).to.have.property('result')
                    .to.equal('Wello, world!');

                expect(child).to.have.property('time')
                    .that.is.an('number');
            });
        });

        it('With one child returns error', function () {
            return (service.call('test.passageWithOneChildReturnsError')).catch(function (o) {
                expect(o).to.have.property('error');
                expect(o.error).to.have.property('message');
                expect(o.error.message).to.be.equal('123');
                expect(o.error).to.have.property('trace')
                    .that.is.an('array')
                    .with.deep.property('[0]')
                    .with.deep.property('fileName')
                    .to.contain('@test\\module.js');
            });
        });
    });

    describe('Return error', () => {
        it('String is not a function', function () {
            return (service.call('test.throwError1', 'qwe')).catch(function (o) {
                expect(o).to.have.property('error');
                expect(o).to.have.property('time');
                expect(o).to.have.property('name');
                expect(o.name).to.be.equal('test.throwError1');
                expect(o).to.have.property('params');
                expect(o.params).to.be.equal('qwe');
                expect(o.error).to.have.property('message');
                expect(o.error.message).to.contain('is not a function');
                expect(o.error).to.have.property('trace');
                expect(o.error.trace).to.be.instanceof(Array);
            });
        });

        it('Throw number', function () {
            return (service.call('test.throwError2')).catch(function (o) {
                expect(o).to.have.property('error');
                expect(o).to.have.property('time');
                expect(o).to.have.property('name');
                expect(o.error).to.have.property('message');
                expect(o.error.message).to.be.equal(123);
                expect(o.error).to.have.property('trace');
                expect(o.error.trace).to.be.instanceof(Array);
            });
        });

        it('Throw string', function () {
            return (service.call('test.throwError3')).catch(function (o) {
                expect(o).to.have.property('error');
                expect(o.error).to.have.property('message');
                expect(o.error.message).to.be.equal('123');
                expect(o.error).to.have.property('details');
                expect(o.error.details).to.be.equal('Service method error: test.throwError3');
            });
        });

        it('Throw new error', function () {
            return (service.call('test.throwError4')).catch(function (o) {
                expect(o).to.have.property('error');
                expect(o.error).to.have.property('message');
                expect(o.error.message).to.be.equal('123');
                expect(o.error).to.have.property('trace')
                    .that.is.an('array')
                    .with.deep.property('[0]')
                    .with.deep.property('fileName')
                    .to.contain('@test\\module.js');
            });
        });

        it('Throw new service error', function () {
            return (service.call('test.throwError5')).catch(function (o) {
                expect(o).to.have.property('error');
                expect(o.error).to.have.property('message');
                expect(o.error.message).to.be.equal('123');
                expect(o.error).to.have.property('trace')
                    .that.is.an('array')
                    .with.deep.property('[0]')
                    .with.deep.property('fileName')
                    .to.contain('@test\\module.js');
            });
        });
    });
});
