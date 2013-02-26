'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
var serviceModule = angular.module('bumperBoard.services', []);

serviceModule.factory('audioDecoder', function() {
	var audioContext = new webkitAudioContext();
	
	return {
		loadFromURL: function(src, cb) {
			var req = new XMLHttpRequest();
			req.open('GET', src, true);
			req.responseType = 'arraybuffer';
			
			req.onload = function() {
				console.log("XHR Finished");
				
				audioContext.decodeAudioData(req.response, function(buffer) {
					console.log("Decoding Finished");
					
					cb(buffer);
				}, function onError(e) {
					cb(null);
				});
				
			};
			
			req.send();
		}
	};
});
