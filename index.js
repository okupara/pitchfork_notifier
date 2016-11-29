'use strict';

const app = require('./lib/app');

exports.handler = function (event, context, callback) {
  if (!event || typeof(event) !== 'object' || Object.keys(event) === 0) {
    return callback('Please specify a command to run as event');
  }
  app.start(event, (error)=> {
    if (error) {
      return callback(error, 'error');
    }
    callback(null, 'end');
  });
};




