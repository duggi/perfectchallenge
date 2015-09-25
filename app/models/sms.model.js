'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
var Schema = mongoose.Schema;

var SmsSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	phoneNumber: {
		type: String,
		required: true
	},
	message: {
		type: String,
		required: true
	}
});

SmsSchema.plugin(timestamps);
mongoose.model('Sms', SmsSchema);
