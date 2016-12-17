

import ejs from 'ejs';
import http from './http';
import config from '../app_config.json';
import Async from './async';


/**
 * This function notifies album information to slack.
 * @param {Array} items Array of items of album information.
 * @param {Boolean} isCompact An flag either
 * @return {Promise} 
 */
const notifyNewHigherAlbums = async (items, isCompact) => {
  for (let item of items) {
    if (isCompact === false || typeof(isCompact) === 'undefined') {
      await notify({text: templateToPost(item)});
    }
    else {
      await notify({text: templateToPostCompact(item)});
    }
    Async.wait(200);
  }
};

const notifyMessage = (message) => {
  const jsobj = {text: message};
  return notify(jsobj);
};

/**
 * This function actually kicks http post request.
 * @param {Object} jsobj parameter object to send a message to Slack.
 * @return {Promise}
 */
const notify = (jsobj) => {
  const param = {
    uri: config.slack.webhook_url,
    form: {payload: JSON.stringify(jsobj)}
  };
  return http.postRequest(param);
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

export default { notifyNewHigherAlbums, notifyMessage };
