'use strict';

import data from './data';
import config from '../app_config.json';
import pickNewHigherAlbums from './pitchfork';
import slack from './slack';

/**
 * This function is the main process when it is invoked by Scheduled Trigger.
 * @type {Promise} A promised generator wrapped by co.wrap. 
 */
export default async () => {
  await data.init();
  const userScore = data.getUserScore();
  const lastEntryDate = data.getLastDate();

  const newHigherAlbums = await pickNewHigherAlbums({
    url: config.urlRssAlbum,
    checkNewerDateFunc: lastEntryDate.checkHigher.bind(lastEntryDate),
    checkHigherScoreFunc: userScore.checkHigher.bind(userScore)
  });

  if (!newHigherAlbums) {
    return null;
  }

  const { albums, max } = newHigherAlbums;
  slack.notifyNewHigherAlbums(albums, data.getFlgCompact());
  lastEntryDate.update(max);//check either the date is newer
};
