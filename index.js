'use strict';

/*var async = require('asyncawait/async');
var await = require('asyncawait/await');*/

module.exports = require('./lib/service.js');

/*async (() => {
    console.log('begin');
    let first = await (callback => setTimeout(() => callback('first'), 1000));
    console.log(first);
    let second = await (new Promise(resolve => {setTimeout(() => resolve('second'))}));
    console.log(second);
});*/