const dynamoose = require('dynamoose');

let defaultOptions = {
  // both create and update must be always true or false
  // if use global secondary index
  // See https://github.com/automategreen/dynamoose/issues/278
  // and https://github.com/automategreen/dynamoose/issues/302
  create: false, // Always must re-create table on my own when modifying schema
  update: false,
  prefix: `${process.env.SERVICE_NAME}_`,
  suffix: `_${process.env.STAGE}`,
};

if (process.env.NODE_ENV === 'production') {
  defaultOptions.create = false;

  dynamoose.AWS.config.update({
    accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY,
    region: process.env.DYNAMODB_REGION,
  });
} else {
  // NODE_ENV === 'development', 'staging' or others
  dynamoose.AWS.config.update({
    accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY,
    region: process.env.DYNAMODB_REGION,
  });
  // Work locally when the region is 'localhost'
  if (dynamoose.AWS.config.region === 'localhost') {
    dynamoose.local('http://localhost:8000');
  }
}

dynamoose.setDefaults(defaultOptions);

module.exports = dynamoose;
