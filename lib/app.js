
import appConfig from '../app_config.json';
import processCrawler from './process_crawler';
import processApi from './process_api';
import libAsync from './async';

/**
 * This function dispatches to a next function depending on parameters.
 * The function decides either the parameter is from API Gateway or Scheduled Trigger.
 * 
 * @param {object} params A parameter object from Lambda Function.
 * @param {callback} callback A function from Lmbda Function.
 */

export const start = (params, callback) => {
  (async function () {
    let data = null;

    if (params['source'] === 'aws.events' && params['detail-type'] === 'Scheduled Event') {
      await processCrawler();
    }

    if (params['httpMethod'] === 'POST') {
      await processApi(params);
    }

    return;
  })()
  .then(data => callback(null, data))
  .catch(error => callback(error));
};
