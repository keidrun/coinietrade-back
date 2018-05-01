module.exports.response = (statusCode, jsonObject) => {
  return !jsonObject
    ? { statusCode }
    : {
        statusCode,
        body: JSON.stringify(jsonObject)
      };
};
