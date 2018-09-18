'use strict';

var email = require('../../app/controllers/email');

module.exports = function (app) {
	app.route('/email/').post(email.handleIncomingEmail);
	app.route('/email/retry').get(email.retryStoredEmail);
};
