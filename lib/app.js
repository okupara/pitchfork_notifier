'use strict';

const co = require('co');
const appConfig = require('../app_config');
const service_crawl = require('./service_crawl');
const service_api = require('./service_api');

exports.start = function (params, callback) {

  co (function *() {
    let data = null;
    /* when it is invoked by scheduled events */
    if (params['source'] === 'aws.events' && params['detail-type'] === 'Scheduled Event') {
      yield service_crawl.process();
    }
    if (params['httpMethod'] === 'POST') {
      yield service_api.process(params);
    }
    return;
  })
  .then((data)=> callback(null, data))
  .catch((error)=> callback(error));
}

