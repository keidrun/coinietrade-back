import Policy from '../../models/Policy';

const getPolicy = (event, context, callback) => {
  const { id } = event.pathParameters;

  Policy.get(id)
    .then(
      policy =>
        policy
          ? callback(null, {
              statusCode: 200,
              body: JSON.stringify(policy)
            })
          : callback(null, {
              statusCode: 404
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

export default getPolicy;
