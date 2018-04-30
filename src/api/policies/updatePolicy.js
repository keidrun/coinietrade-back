import Policy from '../../models/Policy';

const updatePolicy = (event, context, callback) => {
  const { id } = event.pathParameters;
  const { effect } = JSON.parse(event.body);
  let policy = {};
  if (effect) policy.effect = effect;

  Policy.update({ id }, { $PUT: policy })
    .then(updatedTodo =>
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(updatedTodo)
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

export default updatePolicy;
