/**
 * @typedef {Object} AskRequest
 * @property {string} prompt - The natural language prompt to send to the model
 */

/**
 * @typedef {Object} AskResponse
 * @property {string} text - The text chunk from the model
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {string} error - Error message
 * @property {string} [message] - Detailed error message (only in development)
 */

// Export as JSDoc types for better IDE support even in JavaScript
module.exports = {};
