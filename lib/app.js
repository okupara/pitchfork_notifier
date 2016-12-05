'use strict';

const co = require('co');
const appConfig = require('../app_config');
const service_crawl = require('./service_crawl');
const service_api = require('./service_api');

/**
 * This function dispatches to a next function depending on parameters.
 * The function decides either the parameter is from API Gateway or Scheduled Trigger.
 * 
 * @param {object} params A parameter object from Lambda Function.
 * @param {callback} callback A function from Lmbda Function.
 */

exports.start = function (params, callback) {

  co (function *() {
    let data = null;

    /* when it is invoked by scheduled events */
    if (params['source'] === 'aws.events' && params['detail-type'] === 'Scheduled Event') {
      yield service_crawl.process();
    }

    /* when it is invoked by API Gateway */
    if (params['httpMethod'] === 'POST') {
      yield service_api.process(params);
    }
    return;
  })
  .then((data)=> callback(null, data))
  .catch((error)=> callback(error));
}

