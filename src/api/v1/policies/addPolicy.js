const { Policy, EFFECTS } = require('../../../models/Policy');
const { response } = require('../../utils/response');

module.exports.addPolicy = (event, callback) => {
  const { userId, effect } = JSON.parse(event.body);

  if (!userId) {
    return callback(
      null,
      response(400, {
        error: `The property "userId" is required.`
      })
    );
  }

  let policy = { userId };
  if (effect) {
    const isCorrectEffect =
      [EFFECTS.ALLOW, EFFECTS.DENY, EFFECTS.CANCELED].filter(
        value => effect === value
      ).length === 1;

    if (isCorrectEffect) {
      policy.effect = effect;
    } else {
      return callback(
        null,
        response(400, {
          error: `The format of the property "effect" is wrong: ${effect}`
        })
      );
    }
  }

  const newPolicy = new Policy(policy);
  newPolicy
    .save({ overwrite: false })
    .then(addedPolicy => callback(null, response(200, addedPolicy)))
    .catch(err =>
      callback(
        null,
        response(500, {
          error: err
        })
      )
    );
};
