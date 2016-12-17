
import AWS from 'aws-sdk';
import _ from 'lodash';
import config from '../app_config.json'
import libAsync  from './async'

const awsConfig = config.aws;
const { accessKeyId, secretAccessKey, region } = config.aws;

let userScore = null;
let lastDate = null;
let flgUserComapct = false;

AWS.config.update({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region
});

const dynDoc = new AWS.DynamoDB.DocumentClient();
const promisedDoc = libAsync.promisifyObj(dynDoc, ['get', 'update', 'put']);


export const getAdminData = async function() {
  return await promisedDoc.get({
    TableName: awsConfig.tableName,
    Key: {
      id: awsConfig.record_id
    }
  });
};

const updateAdminDate = async (num) => {
  const param = {
    UpdateExpression: 'set last_checking = :r',
    ExpressionAttributeValues: {
      ':r': num
    }
  };
  return await updateAdminData(param);
};

const updateAdminCompact = async (flg) => {
  const param = {
    UpdateExpression: 'set compact = :r',
    ExpressionAttributeValues: {
      ':r': flg
    }
  };
  return await promisedDoc.update(param);
};

const updateAdminScore = async (score) => {
  const param = {
    UpdateExpression: 'set score = :r',
    ExpressionAttributeValues: {
      ':r': score
    }
  };
  return await updateAdminData(param);
};

const updateAdminData = async (param) => {
  const addParam = {
    TableName: awsConfig.tableName,
    Key: {id: awsConfig.record_id},
    ReturnValues: 'UPDATED_NEW'
  };
  // return await promisedDoc.update(_.merge(addParam, param));
  return await promisedDoc.update({ ...addParam, ...param });
};

const putAdminData = async () => {
  const param = {
    TableName: awsConfig.tableName,
    Item:{ 
      id: awsConfig.record_id,
      compact: true,
      score: 6.5, /* default */
      last_checking: 0
    },
    ReturnValues: 'ALL_OLD'
  };
  return await promisedDoc.put(param);
};

const init = async () => {
  let adminData = await getAdminData();
  if (Object.keys(adminData).length === 0) {
    await putAdminData();
    adminData = await getAdminData();
  }

  lastDate = new LastDate(_.get(adminData, 'Item.last_checking'));

  const score = _.get(adminData, 'Item.score');
  userScore = new UserScore(score);

  flgUserComapct = _.get(adminData, 'Item.compact');
};

class UserScore {
  constructor(num) {
    let n = num;
    if (typeof(num) !== 'number') {
      n = Number(n);
      if (isNaN(n)) {
        return this.score = -1;
      }
    }
    this.score = num;
  }
  checkHigher(num) {
    if (this.score > num) {
      return false;
    }
    return true;
  }
  update(num) {
    this.score = num;
    return updateAdminScore(num);
  }
  getValue() {
    return this.score;
  }
}


const makeValidNumber = (num) => {
  let n = num;
  if (typeof(n) === 'number') {
    return n;
  }
  if (_.get(n, 'constructor.name') === 'Date') {
    n = n.getTime();
    return n;
  }
  return null;
};

class LastDate {
  constructor(dateMsec) {
    this.date = dateMsec;
  }
  update(newDate) {
    if (this.date > newDate) {
      return null;
    }
    const promise = updateAdminDate(newDate);
    this.date = newDate;
    return promise;
  }
  checkHigher(num) {
    let n = num;
    n = makeValidNumber(n);
    if (!n || this.date >= n) {
      return false;
    }
    return true;
  }
}

class CompactFlag {
  constructor(flg) {
    this.compactFlg = flg;
  }
  update(flg) {
    this.compactFlg = flg;
    return updateAdminCompact(flg);
  }
  getValue() {
    return this.compactFlg;
  }
}

export default {
  init,
  getUserScore: () => userScore,
  getLastDate: () => lastDate,
  getFlgCompact: () => flgUserComapct
}
