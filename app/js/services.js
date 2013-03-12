(function() {
'use strict';
/*globals angular,webkitAudioContext,console*/
/*jshint newcap: false */


/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
var serviceModule = angular.module('bumperBoard.services', ['fileSystem']);

serviceModule.factory('audioDecoder', ['$http', '$q', function($http, $q) {
	var audioContext = new webkitAudioContext();
	
	var audioDecoder = {
		loadFromURL: function(src) {
			var def = $http.get(src, {responseType: 'arraybuffer'}).then(function(req) {
				console.log("Request Complete");
				
				return audioDecoder.fromArrayBuffer(req.data);
			}, function(err) {
				return $q.reject("Error downloading bumper");
			});
			
			return def;
		},
		fromArrayBuffer: function(data) {
			var def = $q.defer();
			
			audioContext.decodeAudioData(data, function(buffer) {
				console.log("Decoding Complete");
				
				def.resolve(buffer);
				
				angular.element('#board').scope().$apply();
			}, function onError(e) {
				def.reject("Error decoding audio stream");
			});
			
			return def.promise;
		}
	};
	
	return audioDecoder;
}]);

})();
