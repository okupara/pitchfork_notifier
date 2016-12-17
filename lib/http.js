'use strict';

import { promisify } from 'bluebird';
import http from 'http';
import request from 'request';

/**
 * This is my own original function of http get method.
 * The name is wired because 'get' is reserved by Babel.
 * @param {String} url
 * @param {Function} callback
 * TODO: I want to change the return value of this method to Promise.
 */
const getRequest = (url) => {
  return new Promise (function (resolv, reject){
    http.get(url, function (res) {
      res.setEncoding('utf8');
      let data = '';
      if (!(res.statusCode >= 200 && res.statusCode <= 299) && 
      !(res.statusCode > 300 && res.statusCode <= 309)) {
        return callback('HTTP Error: ' + new Error(res.statusCode));
      }
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function () {
        resolv({ headers: res.headers, body: data });
      });
    })
    .on('error', error => reject(error));
  });
}

/**
 * A callback style of request.post is little bit special so wrapping the function by promise uses own way.
 * @param {Object} options It is the same of parameter of the request module.
 * @return {Promise}
 */
export const postRequest = (options) => {
  return new Promise(function (resolv, reject) {
    request.post(options, function (error, response, body) {
      if (!error && response.statusCode === 200){
        return resolv(body);
      }
      else {
        if (!error) {
          const error = new Error('HTTP Error: ' + response.statusCode);
          return reject(error);
        }
        return reject(error);
      }
    });
  });
};

export default { getRequest, postRequest };
