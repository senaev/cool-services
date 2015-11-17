'use strict';

const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const express = require('express');
const app = express();

//создаём сервис
const Service = require(path.normalize(__dirname + '/..'));
const service = new Service();
const service1 = new Service();

app.post('/service', service.call());

before(function() {
    return Promise.all([
        service.addSource(path.normalize(__dirname + '/../examples/modules/test')),
        service1.addSource(path.normalize(__dirname + '/../examples/modules/test2'))
    ]);
});

service1.addExternal({
    'localhost:45973/service': ['test', 'test1']
});

describe('Service', function() {
    describe('External calls in service', () => {
        it('Test test2 module', () => {
            return service1.call('test2.returnString', {}).then(str => {
                expect(str).eql('returning_string');
            });
        });

        it('Test external module', () => {
            return service1.call('test2.returnString', {}).then(str => {
                expect(str).eql('returning_string');
            });
        });
    });
});
