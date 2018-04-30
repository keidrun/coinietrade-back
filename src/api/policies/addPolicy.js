import uuid from 'uuid';
import Policy from '../../models/Policy';
import { EFFECT } from './policies';

const addPolicy = (event, context, callback) => {
  const { effect } = JSON.parse(event.body);

  let policy = { id: uuid.v4() };
  if (effect) {
    const isCorrectEffect =
      [EFFECT.ALLOW, EFFECT.DENY, EFFECT.CANCELED].filter(
        value => effect === value
      ).length === 1;

    if (isCorrectEffect) {
      policy.effect = effect;
    } else {
      return callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          error: `The format of the property "effect" is wrong: ${effect}`
        })
      });
    }
  }

  const newPolicy = new Policy(policy);
  newPolicy
    .save()
    .then(addedPolicy =>
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(addedPolicy)
      })
    )
    .catch(err =>
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          error: err
        })
      })
    );
};

export default addPolicy;
