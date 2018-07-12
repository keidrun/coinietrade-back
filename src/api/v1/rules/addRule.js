const { Rule } = require('../../../models/Rule');
const {
  response,
  responseError,
  responseErrorFromDynamodb,
} = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.addRule = async (event, callback) => {
  let {
    userId,
    priority,
    strategy,
    coinUnit,
    currencyUnit,
    orderType,
    assetRange,
    assetMinLimit,
    buyWeightRate,
    sellWeightRate,
    maxFailedLimit,
    oneSiteName,
    otherSiteName,
  } = JSON.parse(event.body);

  if (!userId) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_USER_ID,
        event,
      ),
    );
  }

  if (!strategy) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_ARBITRAGE_STRATEGY,
        event,
      ),
    );
  }

  if (!coinUnit) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_COIN_UNIT,
        event,
      ),
    );
  }

  if (!currencyUnit) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_CURRENCY_UNIT,
        event,
      ),
    );
  }

  if (!oneSiteName) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_ONE_SITE_NAME,
        event,
      ),
    );
  }

  if (!otherSiteName) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_OTHER_SITE_NAME,
        event,
      ),
    );
  }

  const rule = {
    userId,
    strategy,
    coinUnit,
    currencyUnit,
    oneSiteName,
    otherSiteName,
    counts: {
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      cancellationCount: 0,
    },
  };
  if (priority) rule.priority = priority;
  if (orderType) rule.orderType = orderType;
  if (assetRange) rule.assetRange = assetRange;
  if (assetMinLimit) rule.assetMinLimit = assetMinLimit;
  if (buyWeightRate) rule.buyWeightRate = buyWeightRate;
  if (sellWeightRate) rule.sellWeightRate = sellWeightRate;
  if (maxFailedLimit) rule.maxFailedLimit = maxFailedLimit;
  const newRule = new Rule(rule);

  try {
    const addedRule = await newRule.save({ overwrite: false });
    callback(null, response(201, addedRule));
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};
