
const co = require('co');
const cw = require('co').wrap;
const ejs = require('ejs');

const http = require('./http');
const config = require('../app_config');

exports.notifyAlbum = function (item) {
  const jsobj = {text: templateToPost(item)};
  return notify(jsobj);
}

exports.notifyMessage = function (message) {
  const jsobj = {text: message};
  return notify(jsobj);
}

function notify (jsobj) {
  const param = {
    uri: config.slack.webhook_url,
    form: {payload: JSON.stringify(jsobj)}
  };
  return http.post(param);
}

const templateToPostStr = `
-----------------------------------
*<%- score %>*
*<%- artist %>* : <%- title %>
<%- link %>
\`\`\`<%- desc %>\`\`\`
<%- imageUrl %>


`;
const templateToPost = ejs.compile(templateToPostStr); 


