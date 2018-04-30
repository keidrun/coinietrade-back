import Policy from '../../models/Policy';

const removePolicy = (event, context, callback) => {
  const { id } = event.pathParameters;

  Policy.delete({ id })
    .then(() =>
      callback(null, {
        statusCode: 204
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

export default removePolicy;
