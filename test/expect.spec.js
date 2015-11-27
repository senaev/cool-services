'use strict';

const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

//создаём сервис
const Service = require(path.normalize(__dirname + '/..'));
const service = new Service();

before(function() {
    return service.addSource(path.normalize(__dirname + '/../examples/modules/test3'));
});

describe('expect', function() {
    it('string check in function', () => {
        return service.call('test3.expectString', 'string').then(str => {
            expect(str).eql('string: is_string');
        });
    });

    it('string check in function error', () => {
        return service.call('test3.expectString', 123).then(assert.fail).catch(e => {
            expect(e).property('code').eql(417);
            expect(e).an('object').property('message')
                .eql('Expectanion error in test3.expectString');
            expect(e).property('details').eql(`<PARAMS>: (param => typeof param === 'string')(123) != true`);
        });
    });

    it('compare string with string', () => {
        return service.call('test3.expectString1', 'string1').then(str => {
            expect(str).eql('string1: is_string');
        });
    });

    it('compare string with string error', () => {
        return service.call('test3.expectString1', 'string11').then(assert.fail).catch(e => {
            expect(e).property('code').eql(417);
            expect(e).an('object').property('message')
                .eql('Expectanion error in test3.expectString1');
            expect(e).property('details').eql(`<PARAMS>: 'string11' != 'string1'`);
        });
    });

    it('number', () => {
        return service.call('test3.expectNumber', 123).then(o => {
            expect(o).eql(123);
        });
    });

    it('number error', () => {
        return service.call('test3.expectNumber', 122).then(assert.fail).catch(e => {
            expect(e).property('code').eql(417);
            expect(e).an('object').property('message')
                .eql('Expectanion error in test3.expectNumber');
            expect(e).property('details').eql('<PARAMS>: 122 != 123');
        });
    });

    it('boolean', () => {
        return service.call('test3.expectBoolean', false).then(o => {
            expect(o).eql('all_ok');
        });
    });

    it('boolean error', () => {
        return service.call('test3.expectBoolean', 'kjhjh').then(assert.fail).catch(e => {
            expect(e).property('code').eql(417);
            expect(e).an('object').property('message')
                .eql('Expectanion error in test3.expectBoolean');
            expect(e).property('details').eql(`<PARAMS>: 'kjhjh' != false`);
        });
    });

    it('null', () => {
        return service.call('test3.expectNull', null).then(o => {
            expect(o).eql(null);
        });
    });

    it('null error', () => {
        return service.call('test3.expectNull', 'kjhjh').then(assert.fail).catch(e => {
            expect(e).property('code').eql(417);
            expect(e).an('object').property('message')
                .eql('Expectanion error in test3.expectNull');
            expect(e).property('details').eql(`<PARAMS>: 'kjhjh' != null`);
        });
    });

    it('regexp1', () => {
        return service.call('test3.expectRegExp', 'begin lskdfjl end').then(o => {
            expect(o).eql(null);
        });
    });

    it('regexp', () => {
        return service.call('test3.expectRegExp', 'beginend').then(o => {
            expect(o).eql(null);
        });
    });

    it('regexp error', () => {
        return service.call('test3.expectRegExp', 'beend').then(assert.fail).catch(e => {
            expect(e).property('code').eql(417);
            expect(e).an('object').property('message')
                .eql('Expectanion error in test3.expectRegExp');
            expect(e).property('details').eql(`<PARAMS>: /^begin.*end$/.test('beend') != true`);
        });
    });

    it('array two functions error', () => {
        return service.call('test3.expectErrorInArray', [1, 2, 3, 4, 5, 6, 7, 8]).then(assert.fail).catch(e => {
            expect(e).property('details')
                .eql('Bad expectation in test3.expectErrorInArray: array may have just one function');
            expect(e).property('code').eql(500);
        });
    });

    it('expected array length', () => {
        return service.call('test3.expectArray', [1, 2, 3, 4, 5, 6, 7]).then(assert.fail).catch(e => {
            expect(e).property('details').eql('<PARAMS>: expected array length');
            expect(e).property('code').eql(417);
        });
    });

    it('array', () => {
        return service.call('test3.expectArray', [1, 2, 3, 4, 5, 5, 5, 8, 9, 10]).then(o => {
            expect(o).eql(null);
        });
    });

    it('array 1', () => {
        return service.call('test3.expectArray1', ['1', 2, '3', 234, 234, 234, 9, 9, 9, 9, 9, 9, 9]).then(o => {
            expect(o).eql(null);
        });
    });

    it('array 2', () => {
        return service.call('test3.expectArray2', [234, 234, 234, 9, 9, 9, 9, 9, 9, 9, '1', 2, '3']).then(o => {
            expect(o).eql(null);
        });
    });

    it('array 3', () => {
        return service.call('test3.expectArray3', [7, 8, 9, 8, 7, 8, 9, 87, 8, 9]).then(o => {
            expect(o).eql(null);
        });
    });

    it('any array', () => {
        return Promise.all([
            service.call('test3.expectAnyArray', []),
            service.call('test3.expectAnyArray', [1, 2, 3, 4, 5]),
            service.call('test3.expectAnyArray', ['2', null])
        ]).then(o => expect(o).eql([null, null, null]));
    });

    it('any array error', () => {
        return service.call('test3.expectAnyArray', {}).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectAnyArray');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>: [object Object] is not an array');
        });
    });

    it('array with similar params', () => {
        return Promise.all([
            service.call('test3.expectArrayWithSimilarParams', []),
            service.call('test3.expectArrayWithSimilarParams', [5, 5, 5, 5, 5]),
            service.call('test3.expectArrayWithSimilarParams', [5])
        ]).then(o => expect(o).eql([null, null, null]));
    });

    it('array with similar params error', () => {
        return service.call('test3.expectArrayWithSimilarParams', [5, 5, 5, 4, 5]).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArrayWithSimilarParams');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>[3]: 4 != 5');
        });
    });

    it('array with similar params 1', () => {
        return Promise.all([
            service.call('test3.expectArrayWithSimilarParams1', []),
            service.call('test3.expectArrayWithSimilarParams1', [{
                hello: 'string',
                qwe: 'qwe'
            }, {
                hello: 'qweqweqweqw',
                qwe: 'qwe'
            }, {
                hello: 'lkjhjklhk',
                qwe: 'qwe'
            }]),
            service.call('test3.expectArrayWithSimilarParams1', [{
                hello: 'string',
                qwe: 'qwe'
            }])
        ]).then(o => expect(o).eql([null, null, null]));
    });

    it('array with constantly params', () => {
        return service.call('test3.expectArrayWithConstantlyParams', [1, 2, 3, 4, '5', 6])
            .then(o => expect(o).eql(null));
    });

    it('array with constantly params error', () => {
        return service.call('test3.expectArrayWithConstantlyParams', [1, 2, 3, 4, '5', 7])
            .then(assert.fail).catch(e => {
                expect(e).property('message').eql('Expectanion error in test3.expectArrayWithConstantlyParams');
                expect(e).property('details').eql('<PARAMS>[5]: 7 != 6');
            });
    });

    it('array with constantly params length error', () => {
        return service.call('test3.expectArrayWithConstantlyParams', [1, 2, 3, 4, '5', 7, 8])
            .then(assert.fail).catch(e => {
                expect(e).property('message').eql('Expectanion error in test3.expectArrayWithConstantlyParams');
                expect(e).property('details').eql('<PARAMS>: expected array length');
            });
    });

    it('array with similar params error 1', () => {
        return service.call('test3.expectArrayWithSimilarParams1', [{
            hello: 'lkjhjklhk',
            qwe: 'qwe'
        }, {
            hello: 'lkjhjklhk',
            qwe: 'qwe'
        }, {
            hello: 'lkjhjklhk',
            qwe: 'qwe'
        }, {
            hello: 'lkjhjklhk',
            qwe: 'qwe'
        }, {
            hello: '',
            qwe: 'qw'
        }]).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArrayWithSimilarParams1');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql(`<PARAMS>[4].qwe: 'qw' != 'qwe'`);
        });
    });

    it('array first error', () => {
        return service.call('test3.expectArray', [1, 2, 5, 4, 5, 6, 7, 8, 9, 10]).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArray');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>[2]: 5 != 3');
        });
    });

    it('array last error', () => {
        return service.call('test3.expectArray', [1, 2, 3, 4, 5, 6, 7, 8, 9, 11]).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArray');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>[9]: 11 != 10');
        });
    });

    it('array last error 1', () => {
        return service.call('test3.expectArray', [1, 2, 3, 4, 4, 6, 7, 8, 9, 11]).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArray');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>[4]: (o => o > 4)(4) != true');
        });
    });

    it('array error 1', () => {
        return service.call('test3.expectArray1', ['1', 2, '3', 4]).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArray1');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>[3]: (o => o > 4)(4) != true');
        });
    });

    it('array error 2', () => {
        return service.call('test3.expectArray1', ['1', 2, '3', 9, 9, '9', 4, 9, 9]).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArray1');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>[6]: (o => o > 4)(4) != true');
        });
    });

    it('array error 3', () => {
        return service.call('test3.expectArray2', [4, '1', 2, '3']).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArray2');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>[0]: (o => o > 4)(4) != true');
        });
    });

    it('array error 4', () => {
        return service.call('test3.expectArray2', [9, 9, '9', 4, 9, 9, '1', 2, '3']).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArray2');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>[3]: (o => o > 4)(4) != true');
        });
    });

    it('array error 5', () => {
        return service.call('test3.expectArray3', [5, 8, 7, 9, 9, 8, 7, 8, 9, 9, 2]).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectArray3');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql('<PARAMS>[10]: (o => o > 4)(2) != true');
        });
    });

    it('object', () => {
        return service.call('test3.expectObject', {hello: 'world'}).then(o => {
            expect(o).eql(null);
        });
    });

    it('object error in param', () => {
        return service.call('test3.expectObject', {hello: 'world1'}).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectObject');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql(`<PARAMS>.hello: (o => o === 'world')('world1') != true`);
        });
    });

    it('object redudant parameter', () => {
        return service.call('test3.expectObject', {hello: 'world', qwe: 'qwe'}).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectObject');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql(`<PARAMS>.qwe: is redundant parameter`);
        });
    });

    it('object required parameter', () => {
        return service.call('test3.expectObject', {}).then(assert.fail).catch(e => {
            expect(e).property('message')
                .eql('Expectanion error in test3.expectObject');
            expect(e).property('code').eql(417);
            expect(e).property('details').eql(`<PARAMS>.hello: is required parameter`);
        });
    });
});