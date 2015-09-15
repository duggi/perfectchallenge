'use strict';

function replacer(key, value) {
	if (typeof value === 'string') {
		return value;
	} else if (typeof value === 'function') {
		return value.toString();
	} else {
		return value;
	}
}

module.exports = function() {
	var s = '';
	for(var i = 0; i < arguments.length ; i++) {
		s += JSON.stringify(arguments[i], replacer, ' ');
	}
	console.log(s);
	if (arguments.length>0) {
		return arguments[0];
	}
};
