'use strict';

const _ = require('lodash');
const cw = require('co').wrap;
const config = require('../app_config');
const data = require('./data');
const convert = require('xml-js');
const slack = require('./slack');
const cheerio = require('cheerio');
const http = require('./http');
const striptags = require('striptags');
const async = require('./async');


/**
 * This function is the main process when it is invoked by Scheduled Trigger.
 * @type {Promise} A promised generator wrapped by co.wrap. 
 */
const process = cw(function *() {

  const rssData = yield collect();
  if (!rssData)
    return null;

  const adminData = yield data.getAdminData();

  const numLastCheckedDate = _.get(adminData, 'Item.last_checking');
  if (!numLastCheckedDate && numLastCheckedDate !== 0)
    throw new Error('cannot recognize the value as the Number');
  
  const lastCheckedDate = new Date();
  lastCheckedDate.setTime(numLastCheckedDate);

  const filtered = filterRss(lastCheckedDate, rssData);
  if (!filtered)
    return null;
  
  const score = _.get(adminData, 'Item.score');
  const compact = _.get(adminData, 'Item.compact');
  // yield checkAndNotify(adminScore, filtered.items, isCompact);
  yield checkAndNotify({items: filtered.items, score, compact});
  yield data.updateAdminDate(filtered.max)

  return;
});

/**
 * This function notifies an album information to slack channel when it founds a new album which has higher score than a user set.
 * @type {Promise} A promised generator wrapped by co.wrap.
 * @param {Object} An object which includes score, flag of compact and array of an item.
 */
const checkAndNotify = cw(function *(param) {
  const score = param.score;
  const compact = param.compact;
  const items = param.items;

  for (let item of items) {
    const res = yield http.get(item.link);
    const result = checkHigherScore(score, res.body);
    if (result !== -1) {
      item.score = result.score;
      if (result.imageUrl)
        item.imageUrl = result.imageUrl;

      yield slack.notifyAlbum(item, compact);
    }

    yield async.wait(1000);
  }
  return;
});

/**
 * This function gets a document from rss.
 * @type {Promise} A promised generator wrapped by co.wrap.
 * @return {Array} An array of object of entries.
 */
const collect = cw(function *() {
  const xmlDoc = yield http.get(config.urlRssAlbum);
  const json = convert.xml2js(xmlDoc.body, {compact: true});
  const items = _.get(json, 'rss.channel.item');
  if (!items)
    return null;
  return items;
});

/**
 * This function check that the set score by user is higher or not than another score from a detail page.
 * It returns object which consists of score and url if the score is higher.
 * If lower, it returns -1.
 * 
 * @param {Number} score A value of number that user set.
 * @param {String} html A string data which are html.
 * @return {Object} Object(higher) or -1(lower).
 */
function checkHigherScore (score, html) {
  const $ = cheerio.load(html);
  let retObj = {};

  /* we can get information of score and album img only from detail pages. */  
  const htmlScore = Number($('span.score').text());
  const $albumImg = $('div.album-art img');
  if ($albumImg) {
    retObj.imageUrl = $albumImg.attr('src');   
  }

  if (htmlScore > score) {
    retObj.score = htmlScore;
    return retObj;
  }
  
  return -1;
}

/**
 * This function removes object which we already checked from array.
 * It determiends by cehcking last date from user-data(in Dynamo DB).
 * @param {Date} adminDate A published date that we already checked. 
 * @param {Array} items An array of object of item.
 */
function filterRss (adminDate, items) {
  let ret = {};
  let max = 0;

  const adminDateTime = adminDate.getTime();

  let filteredItems = [];
  for (let it of items) {
    const pubDate = new Date(it.pubDate._text);
    if (pubDate > adminDateTime) {
      if (pubDate > max)
        max = pubDate.getTime();
      filteredItems.push(convertObj(it))
    }
  }
  /* new item moves to tail */
  filteredItems.reverse();

  if (!Array.isArray(filteredItems) || filteredItems.length === 0)
    return null;

  ret.items = filteredItems;
  ret.max = max;
  return ret;
}

function convertObj (item) {
  const array = item.title._text.split(/:\s+/);
  const tmp = item.description._text.replace(/<br*.\/*>/g, '\n');
  const description = striptags(tmp).slice(0, 600) + '...';
  return {
    artist: array[0],
    title: array[1],
    link: item.link._text,
    desc: description,
    image: item.enclosure._attributes.url
  };
}


module.exports = {
  process,
  collect,
  filterRss,
  checkHigherScore
};







