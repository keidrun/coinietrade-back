const { Transaction, TRANSACTION_STATES } = require('../../models/Transaction');

const result = {
  noTransaction: () => {
    return Promise.resolve({
      additionalProfit: 0,
      additionalCounts: {
        executionCount: 1,
        successCount: 1,
        failureCount: 0,
        cancellationCount: 0
      }
    });
  },
  success: (profit) => {
    return Promise.resolve({
      additionalProfit: profit,
      additionalCounts: {
        executionCount: 1,
        successCount: 1,
        failureCount: 0,
        cancellationCount: 0
      }
    });
  },
  failure: () => {
    return Promise.resolve({
      additionalProfit: 0,
      additionalCounts: {
        executionCount: 1,
        successCount: 0,
        failureCount: 1,
        cancellationCount: 0
      }
    });
  },
  cancellation: () => {
    return Promise.resolve({
      additionalProfit: 0,
      additionalCounts: {
        executionCount: 1,
        successCount: 0,
        failureCount: 0,
        cancellationCount: 1
      }
    });
  }
};

const transaction = {
  initial: async (transactionObj) => {
    const newTransaction = new Transaction(transactionObj);
    const transaction = await newTransaction.save({ overwrite: false });
    return transaction;
  },
  in_progress: async (userId, transactionId) => {
    const workingTransaction = await Transaction.updateWithVersionOrCreate(
      { userId, transactionId },
      {
        state: TRANSACTION_STATES.IN_PROGRESS
      }
    );
    return workingTransaction;
  },
  succeeded: async (userId, transactionId) => {
    const succeededTransaction = await Transaction.updateWithVersionOrCreate(
      { userId, transactionId },
      {
        state: TRANSACTION_STATES.SUCCEEDED
      }
    );
    return succeededTransaction;
  },
  canceled: async (userId, transactionId, errorCode, errorDetail) => {
    const canceledTransaction = await Transaction.updateWithVersionOrCreate(
      { userId, transactionId },
      {
        state: TRANSACTION_STATES.CANCELED,
        errorCode,
        errorDetail
      }
    );
    return canceledTransaction;
  },
  failed: async (userId, transactionId, errorCode, errorDetail) => {
    const failedTransaction = await Transaction.updateWithVersionOrCreate(
      { userId, transactionId },
      {
        state: TRANSACTION_STATES.FAILED,
        errorCode,
        errorDetail
      }
    );
    return failedTransaction;
  },
  getWorking: async (ruleId) => {
    const workingTransactions = await Transaction.query('ruleId')
      .eq(ruleId)
      .where('state')
      .eq(TRANSACTION_STATES.IN_PROGRESS)
      .exec();
    return workingTransactions;
  }
};

module.exports = {
  result,
  transaction
};
