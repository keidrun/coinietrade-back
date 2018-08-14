const { Rule } = require('../../../models');
const { apiResponse } = require('../../../utils');
const { response, responseError, responseErrorFromDynamodb } = apiResponse;
const { apiMessages, apiErrors } = require('../../../messages');

const updateRule = async (event, callback) => {
  const { userId, ruleId } = event.pathParameters;
  let {
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
    totalProfit,
    counts,
    status,
  } = JSON.parse(event.body);

  let rule = {};
  if (priority) rule.priority = priority;
  if (strategy) rule.strategy = strategy;
  if (coinUnit) rule.coinUnit = coinUnit;
  if (currencyUnit) rule.currencyUnit = currencyUnit;
  if (orderType) rule.orderType = orderType;
  if (assetRange) rule.assetRange = assetRange;
  if (assetMinLimit) rule.assetMinLimit = assetMinLimit;
  if (buyWeightRate) rule.buyWeightRate = buyWeightRate;
  if (sellWeightRate) rule.sellWeightRate = sellWeightRate;
  if (maxFailedLimit) rule.maxFailedLimit = maxFailedLimit;
  if (oneSiteName) rule.oneSiteName = oneSiteName;
  if (otherSiteName) rule.otherSiteName = otherSiteName;
  if (totalProfit) rule.totalProfit = totalProfit;
  if (counts) {
    let validationErrors = [];
    if (!counts.hasOwnProperty('executionCount')) {
      validationErrors.push(apiErrors.errors.RULE_MISSING_EXECUTION_COUNT);
    }
    if (!counts.hasOwnProperty('successCount')) {
      validationErrors.push(apiErrors.errors.RULE_MISSING_SUCCESS_COUNT);
    }
    if (!counts.hasOwnProperty('failureCount')) {
      validationErrors.push(apiErrors.errors.RULE_MISSING_FAILURE_COUNT);
    }
    if (!counts.hasOwnProperty('cancellationCount')) {
      validationErrors.push(apiErrors.errors.RULE_MISSING_CANCELLATION_COUNT);
    }

    if (validationErrors.length > 0) {
      return callback(
        null,
        responseError(
          400,
          apiMessages.errors.RULE_API_MESSAGE_UPDATE_FAILED,
          event.httpMethod,
          event.path,
          validationErrors,
          event,
        ),
      );
    } else {
      rule.counts = counts;
    }
  }
  if (status) rule.status = status;

  try {
    const existingRule = await Rule.get({ userId, ruleId });
    if (existingRule) {
      const updatedRule = await Rule.updateWithVersion(
        { userId, ruleId },
        rule,
      );
      callback(null, response(200, updatedRule));
    } else {
      callback(
        null,
        responseError(
          404,
          apiMessages.errors.RULE_API_MESSAGE_UPDATE_FAILED,
          event.httpMethod,
          event.path,
          apiErrors.errors.RULE_UPDATE_DATA_NOT_FOUND_BY_IDSs,
          event,
        ),
      );
    }
  } catch (error) {
    callback(
      null,
      responseErrorFromDynamodb(
        apiMessages.errors.RULE_API_MESSAGE_UPDATE_FAILED,
        event.httpMethod,
        event.path,
        error,
        event,
      ),
    );
  }
};

module.exports = updateRule;
