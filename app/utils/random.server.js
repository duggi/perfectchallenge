'use strict';
(function () {

	/**
	 * Returns a random character from [a-zA-Z0-9]
	 */
	exports.character = function () {
		var num = Math.floor((Math.random() * 62));
		if (num < 10) {
			//digits
			return String.fromCharCode(48 + num);
		} else if (num < 36) {
			// upper case letter
			return String.fromCharCode(65 + (num - 10));
		} else {
			// lower case letter
			return String.fromCharCode(97 + (num - 36));
		}
	};

	/**
	 * Returns a string of given length made up of the characters [a-zA-Z0-9]
	 */
  exports.string = function(length) {
    var code = '';
    for (var i = 0; i < length; i++) {
      code = code + exports.character();
    }
    return code;
  };

	/**
	 * Returns a random integer between min (inclusive) and max (inclusive)
	 */
	exports.int  = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

	/**
	 * Returns random element of the arr. Must have length >= 1
	 */
	exports.fromArray = function(arr) {
		return arr[exports.int(0, arr.length-1)];
	};

	/**
	 * Returns random element of the arr and removes it from arr. Must have length >= 1
	 */
	exports.removeFromArray = function(arr) {
		var index = exports.int(0, arr.length-1);
		var item = arr[index];
		arr.splice(index, 1);
		return item;
	};

})();
