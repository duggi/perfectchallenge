/* Utilities for mailgun
 *
 */

// TODO process.env this shit
const API_KEY = 'a6826941a2ba49c0f0b6aa183efa6e59-7bbbcb78-56bd074a';
const request = require('request-promise');

/* Returns the stored message for a given URL.
 */
exports.getStoredMessage = function (url) {
  return request(url, {auth: {user:'api', password: API_KEY}, json: true})
}
