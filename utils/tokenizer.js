/**
 * Simple token estimator based on character count
 * Uses a ratio of 1 token per 4.5 characters as a rough estimate
 * 
 * @param {string} text - The text to estimate tokens for
 * @returns {number} - Estimated token count
 */
function estimateTokens(text) {
  if (!text) return 0;
  
  // Simple estimation based on character count
  // This is a rough approximation, not exact
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount / 4.5);
  
  return estimatedTokens;
}

module.exports = {
  estimateTokens
};
