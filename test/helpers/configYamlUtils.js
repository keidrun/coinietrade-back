const fs = require('fs');
const yaml = require('js-yaml');

const getConfigYaml = {
  conifg: yaml.safeLoad(
    fs.readFileSync(`${__dirname}/../../config/config.yml`, 'utf8'),
  ),
  serverless: yaml.safeLoad(
    fs.readFileSync(`${__dirname}/../../serverless.yml`, 'utf8'),
  ),
};

const loadConfigYamlToEnv = environment => {
  if (environment == 'production') {
    process.env.SERVICE_NAME = getConfigYaml.serverless.service.name;
    process.env.STAGE = 'prod';
    process.env.DYNAMODB_ACCESS_KEY_ID =
      getConfigYaml.conifg.prod.aws_access_key_id;
    process.env.DYNAMODB_SECRET_ACCESS_KEY =
      getConfigYaml.conifg.prod.aws_secret_access_key;
    process.env.DYNAMODB_REGION = getConfigYaml.conifg.prod.region;
    process.env.ENCRYPT_KEY = getConfigYaml.conifg.prod.encrypt_key;
  } else if (environment === 'staging') {
    process.env.SERVICE_NAME = getConfigYaml.serverless.service.name;
    process.env.STAGE = 'staging';
    process.env.DYNAMODB_ACCESS_KEY_ID =
      getConfigYaml.conifg.staging.aws_access_key_id;
    process.env.DYNAMODB_SECRET_ACCESS_KEY =
      getConfigYaml.conifg.staging.aws_secret_access_key;
    process.env.DYNAMODB_REGION = getConfigYaml.conifg.staging.region;
    process.env.ENCRYPT_KEY = getConfigYaml.conifg.staging.encrypt_key;
  } else {
    process.env.SERVICE_NAME = getConfigYaml.serverless.service.name;
    process.env.STAGE = 'dev';
    process.env.DYNAMODB_ACCESS_KEY_ID =
      getConfigYaml.conifg.dev.aws_access_key_id;
    process.env.DYNAMODB_SECRET_ACCESS_KEY =
      getConfigYaml.conifg.dev.aws_secret_access_key;
    process.env.DYNAMODB_REGION = getConfigYaml.conifg.dev.region;
    process.env.ENCRYPT_KEY = getConfigYaml.conifg.dev.encrypt_key;
  }
};

module.exports = {
  getConfigYaml,
  loadConfigYamlToEnv,
};
