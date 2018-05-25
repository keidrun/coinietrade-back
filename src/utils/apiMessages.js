exports.infos = {};

exports.errors = {
  // Policies api error messages
  POLICY_API_MESSAGE_CREATE_FAILED: 'Create Policy Request Failed',
  POLICY_API_MESSAGE_READ_FAILED: 'Read Policy Request Failed',
  POLICY_API_MESSAGE_READ_LIST_FAILED: 'Read Policies Request Failed',
  POLICY_API_MESSAGE_UPDATE_FAILED: 'Update Policy Request Failed',
  POLICY_API_MESSAGE_DELETE_FAILED: 'Delete Policy Request Failed',
  // Secrets api error messages
  SECRET_API_MESSAGE_CREATE_FAILED: 'Create Secret Request Failed',
  SECRET_API_MESSAGE_DELETE_FAILED: 'Delete Secret Request Failed',
  // Tickets api error messages
  TICKET_API_MESSAGE_CREATE_FAILED: 'Create Ticket Request Failed',
  TICKET_API_MESSAGE_READ_FAILED: 'Read Ticket Request Failed',
  TICKET_API_MESSAGE_DELETE_FAILED: 'Delete Ticket Request Failed',
  TICKET_API_MESSAGE_UPDATE_FAILED: 'Update Ticket Request Failed',
  // Wallets api error messages
  WALLET_API_MESSAGE_CREATE_FAILED: 'Create Wallet Request Failed',
  WALLET_API_MESSAGE_DELETE_FAILED: 'Delete Wallet Request Failed',
  // Wallet model errors
  WALLET_MISSING_USER_ID: { code: 7301, message: "Required field Wallet 'userId' is missing" },
  WALLET_DUPLICATE_USER_ID: { code: 7302, message: "Required field Wallet 'userId' is duplicated" },
  WALLET_MISSING_COMPANY: { code: 7303, message: "Required field Wallet 'company' is missing" },
  WALLET_MISSING_ADDRESS_TYPE: { code: 7304, message: "Required field Wallet 'addressType' is missing" },
  WALLET_MISSING_ADDRESS: { code: 7305, message: "Required field Wallet 'address' is missing" }
};
