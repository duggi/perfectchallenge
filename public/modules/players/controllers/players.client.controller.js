'use strict';

angular.module('players').controller('PlayersController', ['$scope', '$http',
	function($scope, $http) {
		$scope.loading = true;
		$http.get('/scrape/perfectchallenge').then(function(response) {
			$scope.players = response.data;
			$scope.loading = false;
		});
	}
]);
