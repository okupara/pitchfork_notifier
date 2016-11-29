'use strict';

const argsOfStr = require('./run_local_arguments');
const _ = require('lodash');
const targetToRun = require('../index.js');

const paramEventsCmd = {cmd: '/bin/ls'};
const mock = {
  context: {
  },
  callback: (error, obj)=> {
    if (error) {
      return console.log(error.stack);
    }
    console.log(obj);
  }
};
mock.events = _.defaults(paramEventsCmd, argsOfStr);
targetToRun.handler.apply(this, [mock.events, null, mock.callback]);
