import dynamoose from '../services/dynamoose';
const { Schema } = dynamoose;
import { EFFECT } from '../api/policies/policies';

const options = {
  timestamps: true
};

const policySchema = new Schema(
  {
    id: {
      type: String,
      hashKey: true
    },
    effect: {
      type: String,
      required: true,
      default: EFFECT.ALLOW
    }
  },
  options
);

const Policy = dynamoose.model('policies', policySchema);
export default Policy;
