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
  
  const adminScore = _.get(adminData, 'Item.score');
  yield checkAndNotify(adminScore, filtered.items);
  yield data.updateAdminDate(filtered.max)

  return;
});

const checkAndNotify = cw(function *(score, items) {
  for (let item of items) {
    const res = yield http.get(item.link);
    const result = checkHigherScore(score, res.body);
    if (result !== -1) {
      item.score = result.score;
      if (result.imageUrl)
        item.imageUrl = result.imageUrl;

      yield slack.notifyAlbum(item);
    }

    yield async.wait(1000);
  }
  return;
});


const collect = cw(function *() {
  const xmlDoc = yield http.get(config.urlRssAlbum);
  const json = convert.xml2js(xmlDoc.body, {compact: true});
  const items = _.get(json, 'rss.channel.item');
  if (!items)
    return null;
  return items;
});


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







