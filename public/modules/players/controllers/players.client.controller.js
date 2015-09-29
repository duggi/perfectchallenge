'use strict';

angular.module('players').controller('PlayersController', ['$scope', '$http', '$state', '$stateParams',
	function($scope, $http, $state, $stateParams) {
		$scope.allStats = ['overall', 'overallWithBonus', 'bonus',
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
		function fetchStats(stat) {
			$scope.loading = true;
			$http.get('/scrape/perfectchallenge?stat='+stat).then(function(response) {
				$scope.players = response.data.players;
				$scope.selectedStat = response.data.week;
				$scope.stat = response.data.stat;
				if (!$scope.selectedStat) {
					$scope.selectedStat = $scope.stat;
				}
				$scope.loading = false;
			});
		}
		$scope.changeWeek = function() {
			$state.go('players', {stat:$scope.selectedStat});
		};
		var week = $stateParams.stat || '';
		fetchStats(week);
	}
]);
