const { Rule } = require('../../../models/Rule');
const { response, responseError, responseErrorFromDynamodb } = require('../../../utils/response');
const apiMessages = require('../../../messages/apiMessages');
const apiErrors = require('../../../messages/apiErrors');

module.exports.addRule = async (event, callback) => {
  let {
    userId,
    priority,
    arbitrageStrategy,
    orderType,
    coinUnit,
    currencyUnit,
    orderAmount,
    orderPrice,
    orderPriority,
    priceDifference,
    sites
  } = JSON.parse(event.body);

  sites = sites || [];

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

  if (!orderAmount) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_ORDER_AMOUNT,
        event
      )
    );
  }

  if (!orderPrice) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_ORDER_PRICE,
        event
      )
    );
  }

  if (!priceDifference) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_PRICE_DIFFERENCE,
        event
      )
    );
  }

  if (sites.length === 2) {
    sites.forEach((site) => {
      if (!site.name) {
        return callback(
          null,
          responseError(
            400,
            apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
            event.httpMethod,
            event.path,
            apiErrors.errors.RULE_MISSING_SITE_NAME,
            event
          )
        );
      }
      if (!site.expectedTransactionFeeRate) {
        return callback(
          null,
          responseError(
            400,
            apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
            event.httpMethod,
            event.path,
            apiErrors.errors.RULE_MISSING_SITE_EXPECTED_TRANSACTION_FEE_RATE,
            event
          )
        );
      }
      if (!site.expectedRemittanceFee) {
        return callback(
          null,
          responseError(
            400,
            apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
            event.httpMethod,
            event.path,
            apiErrors.errors.RULE_MISSING_SITE_EXPECTED_REMITTANCE_FEE,
            event
          )
        );
      }
    });
  } else if (sites.length === 0) {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_MISSING_SITES,
        event
      )
    );
  } else {
    return callback(
      null,
      responseError(
        400,
        apiMessages.errors.RULE_API_MESSAGE_CREATE_FAILED,
        event.httpMethod,
        event.path,
        apiErrors.errors.RULE_INVALID_SITES,
        event
      )
    );
  }

  const rule = {
    userId,
    priority,
    arbitrageStrategy,
    orderType,
    coinUnit,
    currencyUnit,
    orderAmount,
    orderPrice,
    orderPriority,
    priceDifference,
    sites,
    counts: { executionCount: 0, successCount: 0, failureCount: 0 }
  };
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
