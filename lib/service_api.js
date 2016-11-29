'use strict';

const cw = require('co').wrap;
const data = require('./data');
const slack = require('./slack');
const _ = require('lodash');

exports.process = cw(function *(params) {
  if (!params || !params.body || !params.body === '')
    throw new Error('your parameter is invalid.');
  
  const body = requestBodyConvert(params.body);

  const trigger_word = body.trigger_word;

  if (!body.text || body.text.indexOf(trigger_word) !== 0)
    return;

  const r = new RegExp(trigger_word + '\\+*');
  const m = body.text.replace(r, '');

  let num = 0;
  if (m.length > 0) {
    num = Number(m);
    if (isNaN(num)) {
      const mess = `@${body.user_name} your parameter "${m}" is invalid.`;
      yield slack.notifyMessage(mess);
      throw new Error(mess);
    }

    yield data.updateAdminScore(num);
    yield slack.notifyMessage(`@${body.user_name} updating the value succeeded.`);
    return;
  }

  const adminData = yield data.getAdminData();
  const score = _.get(adminData, 'Item.score');
  yield slack.notifyMessage(`@${body.user_name} the current value of score is ${score}`);
  return;

});


function makeAPIGateWayError (code, message) {
  return {
    'statusCode': code,
    'body': JSON.stringify({message}),
    'headers':{
      'Content-Type': 'application/json'
    }
  };
}

function requestBodyConvert (str) {
  let ret = {};
  const array = str.split('&');
  array.forEach(function (el) {
    const kv = el.split('=');
    ret[kv[0]] = kv[1];
  });
  return ret;
}
