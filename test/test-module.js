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
    it('Add param', function () {
        return (service.call('test.returnParamsWithAddValue', {})).then(function (o) {
            expect(o).to.have.property('result');
            expect(o).to.have.property('time');
            expect(o).to.have.property('params');
            expect(o).to.have.property('name');
            expect(o.result).to.have.property('add');
            expect(o.result.add).to.equal('add');
        });
    });

    it('String is not a function', function () {
        return (service.call('test.throwError1')).catch(function (o) {
            expect(o).to.have.property('error');
            expect(o).to.have.property('time');
            expect(o).to.have.property('params');
            expect(o.error).to.have.property('message');
            expect(o.error.message).to.contain('is not a function');
            expect(o.error).to.have.property('trace');
            expect(o.error.trace).to.be.instanceof(Array);
        });
    });
});
