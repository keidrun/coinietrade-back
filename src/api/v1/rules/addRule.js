const { Rule } = require('../../../models/Rule');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.addRule = async (event, callback) => {
  let {
    userId,
    priority,
    arbitrageStrategy,
    coinUnit,
    currencyUnit,
    orderType,
    assetRange,
    commitmentTimeLimit,
    buyWeightRate,
    sellWeightRate,
    oneSiteName,
    otherSiteName
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
        event
      )
    );
  }

  if (!arbitrageStrategy) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_ARBITRAGE_STRATEGY,
        event
      )
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
        event
      )
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
        event
      )
    );
  }

  if (!assetRange) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_ASSET_RANGE,
        event
      )
    );
  }

  if (!commitmentTimeLimit) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_COMMITMENT_TIME_LIMIT,
        event
      )
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
        event
      )
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
        event
      )
    );
  }

  const rule = {
    userId,
    priority,
    arbitrageStrategy,
    coinUnit,
    currencyUnit,
    assetRange,
    commitmentTimeLimit,
    oneSiteName,
    otherSiteName,
    counts: {
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      cancellationCount: 0
    }
  };
  if (orderType) rule.orderType = orderType;
  if (buyWeightRate) rule.buyWeightRate = buyWeightRate;
  if (sellWeightRate) rule.sellWeightRate = sellWeightRate;
  const newRule = new Rule(rule);

  try {
    const duplicateRules = await Rule.scan('userId').contains(userId).exec();
    if (duplicateRules.count <= 0) {
      const addedRule = await newRule.save({ overwrite: false });
      callback(null, response(201, addedRule));
    } else {
      callback(
        null,
        responseError(
          400,
          apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.RULE_DUPLICATE_USER_ID,
          event
        )
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event
      )
    );
  }
};
