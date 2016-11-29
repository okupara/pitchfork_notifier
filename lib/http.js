'use strict';

const promisify = require('bluebird').promisify;
const http = require('http');
const request = require('request');
const cw = require('co').wrap;

exports.get = promisify(function (url, callback) {
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
      callback(null, {headers: res.headers, body: data});
    });
  })
  .on('error', function (error) {
    callback(error);
  });  
});

/* callback style of request.post is little bit special so wrapping the function by promise uses own way*/ 
exports.post = function (options) {
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
