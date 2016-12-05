
const co = require('co');
const cw = require('co').wrap;
const ejs = require('ejs');

const http = require('./http');
const config = require('../app_config');


/**
 * This function notifies album information to slack.
 * @param {Object} item An object of information to notify.
 * @param {Boolean} isCompact An flag either
 * @return {Promise} 
 */
exports.notifyAlbum = function (item, isCompact) {

  if (isCompact === false || typeof(isCompact) === 'undefined') {
    return notify({text: templateToPost(item)});
  }

  return notify({text: templateToPostCompact(item)});
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
const templateToPostStrCompact = `
-----------------------------------
*<%- score %>*
*<%- artist %>* : <%- title %>
<%- link %>
`;
const templateToPostCompact = ejs.compile(templateToPostStrCompact);

const templateToPostStr = `
-----------------------------------
*<%- score %>*
*<%- artist %>* : <%- title %>
<%- link %>
\`\`\`<%- desc %>\`\`\`
<%- imageUrl %>


`;
const templateToPost = ejs.compile(templateToPostStr); 


