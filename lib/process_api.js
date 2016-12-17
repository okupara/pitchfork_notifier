'use strict';

import _ from 'lodash';
import data  from './data'; 
import slack from './slack';

/**
 * This function is the main process when the program is invoked by API Gateway.
 * @param {Object} params
 * @return {Promise}
 */
export default async (params) => {
  if (!params || !params.body || !params.body === '') {
    throw new Error('your parameter is invalid.');
  }
  const body = requestBodyConvert(params.body);
  const trigger_word = body.trigger_word;

  if (!body.text || body.text.indexOf(trigger_word) !== 0) {
    return;
  }
  await data.init();
  const m = parseUserMessage(body);

  let num = 0;
  const userScore = await data.getUserScore();
  const userName = body.user_name;

  if (m.length > 0) {
    num = Number(m);
    if (isNaN(num)) {
      return processError(userName, m);
    }
    return processUpdate(userName, num);
  }
  
  /* answering of current value */
  return processNotifyCurrent(userName);
};

const processError = async (userName, input) => {
  const mess = `@${body.userName} your parameter "${input}" is invalid.`;
  await slack.notifyMessage(mess);
  throw new Error(mess);
}

const processNotifyCurrent = async (userName) => {
  await data.init();
  const userScore = data.getUserScore();
  await slack.notifyMessage(`@${userName} the current value of score is ${userScore.getValue()}`);
  return;
}

const processUpdate = async (userName, num) => {
  await data.init();
  const userScore = data.getUserScore();
  await userScore.update(num);
  await slack.notifyMessage(`@${userName} updating the value succeeded.`);
}

const parseUserMessage = (body) => {
  const r = new RegExp(body.trigger_word + '\\+*');
  const m = body.text.replace(r, '');
  return m;
}


const requestBodyConvert = (str) => {
  let ret = {};
  const array = str.split('&');
  array.forEach(function (el) {
    const kv = el.split('=');
    ret[kv[0]] = kv[1];
  });
  return ret;
}
