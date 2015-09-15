'use strict';

angular.module('players').controller('PlayersController', ['$scope', '$http', '$stateParams',
	function($scope, $http, $stateParams) {
		$scope.allWeeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
		function fetchStats(week) {
			$scope.loading = true;
			$http.get('/scrape/perfectchallenge?statWeek='+week).then(function(response) {
				$scope.players = response.data.players;
				$scope.selectedWeek = response.data.week;
				$scope.loading = false;
			});
		}
		$scope.changeWeek = function() {
			fetchStats($scope.selectedWeek);
		};
		var statWeek = $stateParams.statWeek || '';
		fetchStats(statWeek);
	}
]);
