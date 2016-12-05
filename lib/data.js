'use strict';

const AWS = require('aws-sdk');
const awsConfig = require('../app_config').aws; 
const promisify = require('bluebird').promisify;
const cw = require('co').wrap;
const async = require('./async');
const _ = require('lodash');

const co = require('co');

AWS.config.update({
  accessKeyId: awsConfig.accessKeyId,
  secretAccessKey: awsConfig.secretAccessKey,
  region: awsConfig.region
});


const dynDoc = new AWS.DynamoDB.DocumentClient();
const promisedDoc = async.promisifyObj(dynDoc, ["get", "update"]);


exports.getAdminData = cw(function *() {
  return yield promisedDoc.get({
    TableName: awsConfig.tableName,
    Key: {
      id: awsConfig.record_id
    }
  });
});

exports.updateAdminDate = cw(function *(num) {
  let param = {
    UpdateExpression: 'set last_checking = :r',
    ExpressionAttributeValues: {
      ':r': num
    }
  };
  return yield updateAdminData(param);
});

exports.updateAdminScore = cw (function *(score) {
  let param = {
    UpdateExpression: 'set score = :r',
    ExpressionAttributeValues: {
      ':r': score
    }
  };
  return yield updateAdminData(param);
})

const updateAdminData = cw(function *(param) {
  const addParam = {
    TableName: awsConfig.tableName,
    Key: {id: awsConfig.record_id},
    ReturnValues: 'UPDATED_NEW'
  };
  return yield promisedDoc.update(_.merge(addParam, param));
});




