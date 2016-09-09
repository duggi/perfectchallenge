'use strict';

// Images controller
angular.module('images').controller('ImagesController', ['$scope', '$stateParams', '$location', 'Images',
	function($scope, $stateParams, $location, Images ) {
		$scope.images = Images.query();
		$('.upload_field').unsigned_cloudinary_upload('spp6yanh', { cloud_name: 'dnbcedmm8' })
		.bind('cloudinarydone', function(e, data) {
				console.log(data.result);
				$('.progress_bar').css('width', '0%');
				$('.thumbnails').append($.cloudinary.image(data.result.public_id,
					{ cloud_name: 'dnbcedmm8', format: 'jpg', width: 150, height: 100,
						crop: 'thumb', gravity: 'face', effect: 'saturation:50' } ));})
		.bind('cloudinaryprogress', function(e, data) {
				$('.upload_field').css('display', 'none');
				$('.progress_bar').css('width',
					Math.round((data.loaded * 100.0) / data.total) + '%');
			});

	}
]);
