
import http from './http';
import { xml2js } from 'xml-js';
import _ from 'lodash';
import cheerio from 'cheerio';
import striptags from 'striptags';
import Async from './async';

/**
 * This function filters rssdata by checking date.
 * @param {Array} data Array of rssfeeds.
 * @return {Object} max: the most newest date in rssfeeds, items: filtered items.
 */
const filterByDate = (data, checkNewerDate) => {
  let max = 0;

  let filteredItems = data.filter(el => {
    const articlePublishDate = el.getPublishedDate();
    if (!checkNewerDate(articlePublishDate)) {
      return false;
    }
    if (articlePublishDate > max) {
      max = articlePublishDate;
    }
    return true;
  });

  if (!Array.isArray(filteredItems) || filteredItems.length === 0) {
    return null;
  }

  filteredItems.reverse();
  return { max, items: filteredItems };  
}

/**
 * 
 */
const filterByScore = (data, callback) => (
  data.filter(el => callback(el.getScore()))
);

/**
 * This function fetches details of reviews
 * because the score is written only detail pages.
 * @param {Array} rssData Array of rssfeeds.
 * @return {Array} Array of Detail class.
 */
const fetchDetailPages = async (rssData) => {
  const ret = [];
  for (let item of rssData) {
    const detail = new DetailPage(item.getInfoObj());
    await detail.fetch();
    ret.push(detail);
    await Async.wait(1000);
  }
  return ret;
};


/**
 * This function fetches rss feeds from its url.
 * @param {String} url
 * @return {Array} Array of RssFeed class.
 */
const getRssJson = async (url) => {
  const xmlDoc = await http.getRequest(url);
  if (!xmlDoc || !xmlDoc.body) {
    throw new Error('It is returned undefined or something bad values.');
  }
  const json = xml2js(xmlDoc.body, { compact: true });
  const items = _.get(json, 'rss.channel.item');
  if (!items || !Array.isArray(items))
    return null;
  
  return items.map(el => new RSSFeed(el));
};


/**
 * 
 */
class RSSFeed {
  constructor(rssData) {
    this.rss = rssData;
  }
  getPublishedDate() {
    const pubDateText = this.rss.pubDate._text;
    const d = new Date(pubDateText);
    return d.getTime();
  }
  getInfoObj() {
    const item = this.rss;
    const array = item.title._text.split(/:\s+/);
    const tmp = item.description._text.replace(/<br*. \/*>/g, '\n' );
    let description = striptags(tmp).slice(0, 600);
    description = `${description}...`;
    return {
      artist: array[0],
      title: array[1],
      link: item.link._text,
      desc: description,
      image: item.enclosure._attributes.url
    };
  }
}

/**
 * 
 */
class DetailPage {
  constructor({ artist, title, link, desc, image }) {
    this.artist = artist;
    this.title = title;
    this.link = link;
    this.desc = desc;
    this.image = image;
  }
  _retrieveAlbumImg($) {
    const $albumImg = $('div.album-art img');
    if (!$albumImg) {
      return null;
    }
    return $albumImg.attr();
  }
  _retrieveScore($) {
    const strScore = $('span.score').text();
    const score = Number(strScore);
    if (isNaN(score)) {
      return null;
    }
    return score;
  }
  fetch() {
    const self = this;
    return new Promise(function (resolv, reject) {
      (async () => {
        let resp = await http.getRequest(self.link);
        const $ = cheerio.load(resp.body);
        self.score = self._retrieveScore($);
        self.albumImg = self._retrieveAlbumImg($);
      })()
      .then(data => resolv(data))
      .catch(err => reject(err));
    });
  }
  getScore() {
    return this.score;
  }
  getInfoObj() {
    return {
      
    }
  }
}

/**
 * This function proccesses all filter flow involved rss.
 *  @param {String} url url of rss.
 *  @param {Function} checkHigherScoreFunc a Function that is used when rss feeds are filtered by socre.
 *  @param {Function} checkNewerDateFunc a Function that is used when rss feeds are filtered by date.
 *  @return {Object} max: the most newer date which an article is published. albums: new albums which have high score than you set.
 */
export default async ({
   url, checkHigherScoreFunc, checkNewerDateFunc
}) => {
  let rssData = await getRssJson(url);
  if (!rssData) {
    return null;
  }

  const filteredByDates = filterByDate(rssData, checkNewerDateFunc);
  if (!filteredByDates) {
    return null;
  }

  const details = await fetchDetailPages(filteredByDates.items);
  const ret = filterByScore(details, checkHigherScoreFunc);
  return {
    albums: filterByScore(details, checkHigherScoreFunc),
    max: filteredByDates.max
  };
}
