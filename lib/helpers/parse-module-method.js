'use strict';

/**
 * @param moduleMethod string
 * @returns {{moduleName: string, methodName: string}}
 */
module.exports = function(moduleMethod) {
    if (typeof moduleMethod !== 'string') {
        throw 'ModuleMethod need to be a string.';
    }

    var pointIndex = moduleMethod.lastIndexOf('.');

    if (pointIndex === -1) {
        throw 'ModuleMethod need to have dot: ' + moduleMethod;
    }

    var moduleName = moduleMethod.substr(0, pointIndex);
    var methodName = moduleMethod.substr(pointIndex + 1);

    var modulePartsArray = moduleName.split('.');
    for(let key in modulePartsArray) {
        if (modulePartsArray.hasOwnProperty(key)) {
            if (!(/^[\w\d]+[\w\d\-]*[\w\d]+$/.test(modulePartsArray[key]))) {
                throw 'Invalid ModuleName: ' + moduleName;
            }
        }
    }

    if (!(/^[\w\d]+[\w\d\-]*[\w\d]+$/.test(methodName))) {
        throw 'MethodName is not valid: ' + methodName;
    }

    return {
        moduleName: moduleName,
        methodName: methodName
    }
};
