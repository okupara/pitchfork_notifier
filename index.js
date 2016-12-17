
import * as app from './lib/app';
/**
 * This function is an entry point of this program.
 * It is called by API Gateway and Scheduled Trigger in Lambda Function.
 * 
 * @param {Object} event The information of an invoking environment.
 * @param {Object} context
 * @param {Function} callback
 */

export const handler = (event, context, callback) => {

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
