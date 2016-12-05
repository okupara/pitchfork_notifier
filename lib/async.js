'use strict';


const co = require('co');
const promisify = require('bluebird').promisify;

const slice = Array.prototype.slice;

/**
 * This function is the just timer.
 * @param {Number} The time how long we wait.
 * @param {Function} callback which is invoked after the time.
 */
exports.wait = promisify(function (time, callback) {
  setTimeout(function () {
    callback();
  }, time);
});

const TYPE_STRING = 'string';
/**
 * This function creates new object which consists of promised functions.
 * @param {Object} obj An object which has methods that you want to convert to Promise.
 * @param {Array} keys An array of method names which you want to convert to Promise.
 * @return {Object}
 */
exports.promisifyObj = function (obj, keys) {
  if (typeof(keys) === TYPE_STRING)
    return promisify(obj[keys].bind(obj));

  if (!Array.isArray(keys))
    throw new Error('The function allow only String and Array');

  let ret = {};
  for (let m of keys) {
    ret[m] = promisify(obj[m].bind(obj));
  }
  return ret;
};

