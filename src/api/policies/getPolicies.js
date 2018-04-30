import Policy from '../../models/Policy';

const getPolicies = (event, context, callback) => {
  Policy.scan()
    .exec()
    .then(policies =>
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(policies)
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

export default getPolicies;
