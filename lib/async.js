'use strict';


const co = require('co');
const promisify = require('bluebird').promisify;

const slice = Array.prototype.slice;

exports.wait = promisify(function (time, callback) {
  setTimeout(function () {
    callback();
  }, time);
});

const TYPE_STRING = 'string';
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

