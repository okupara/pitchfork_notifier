'use strict';

const co = require('co');
const chai = require('chai');
const assert = chai.assert;
const promisify = require('bluebird').promisify;
const fs = require('fs');
const convert = require('xml-js');
const _ = require('lodash');
const service = require('../lib/service_crawl');
const http = require('../lib/http');

const readFile = promisify(fs.readFile);


describe('service_crawl',function () {

  it('#isHigherScore', function (done) {
    this.timeout(0);
    co(function *() {
      const res = yield http.get('http://pitchfork.com/reviews/albums/22561-death-certificate/');
      const result = service.checkHigherScore(6.0, res.body);
      assert(result.score === 9.5, 'the score from html is higer than another value from a config and the function returns the higher value');
      assert(result.imageUrl.indexOf('http://') === 0, 'image url string looks like a url');
    })
    .then(done)
    .catch((error)=> {
      console.log(error.stack)
      done();
    });
  });

  /* this test requires internet connection */
  it('#collect', function (done) {
    this.timeout(0);
    co(function *() {
      const items = yield service.collect();
      assert(Array.isArray(items), 'items is Array');
      assert(items.length > 0, 'items has some elements, at least one.');
    })
    .then(done)
    .catch((err)=> {
      console.log(err.stack);
      done();
    });
  });

  it('#filterRSS', function (done) {
    this.timeout(0);
    co(function *() {
      const xml = yield readFile('./test/album.xml');
      const items = _.get(convert.xml2js(xml.toString(), {compact: true}), 'rss.channel.item');
      const d = new Date();
      d.setFullYear(2016);
      d.setMonth(10);
      d.setDate(24);

      const f = service.filterRss(d, items);
      assert(f.items.length === 5, 'dummy data has 5 new recoreds');
      assert(f.items[0].artist === 'Dawn Richard', 'checking fields of objects');

    })
    .then(done)
    .catch((err)=> {
      console.log(err.stack);
      done();
    });
  });
});



