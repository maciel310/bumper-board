/*
TODO:

Implement UI for displaying play status per bumper
--Different colors/indicators for background and looping tracks

Implement editing bumper
Implement loading board from localStorage database
--should a board-sharing feature be implemented? Would need a way of transferring tracks, too. 
Implement creating new board

Implement goToDelay option

Implement as Chrome App (with offline support)

*/

function BoardCtrl($scope, $http) {
	var audioContext = new webkitAudioContext();
	
	$scope.bumpersLoaded = false;
	
	$http.get('getboard.json').success(function(d) {
		$scope.board = d;
		
		if(!$scope.bumpersLoaded) {
			loadBumperSources();
		}
	});
	
	
	function loadBumperSources() {
		for(var i in $scope.board.bumpers) {
			if($scope.board.bumpers[i].src !== '') {
				$scope.getBumperFile(i);
			}
		}
	}
	
	$scope.getBumperFile = function(i) {
		var req = new XMLHttpRequest();
		req.open('GET', $scope.board.bumpers[i].src, true);
		req.responseType = 'arraybuffer';
		
		req.onload = function() {
			console.log("XHR Finished");
			
			audioContext.decodeAudioData(req.response, function(buffer) {
				console.log("Decoding Finished");
				$scope.board.bumpers[i].buffer = buffer;
				$scope.board.bumpers[i].playing = false;
				
				angular.element(document.querySelector('#board')).scope().$apply("checkBumperLoadComplete()");
			}, function onError(e) {
				alert("An error occurred!");
				console.log(arguments);
			});
			
		};
		
		req.send();
	};
	
	$scope.checkBumperLoadComplete = function() {
		var loaded = true;
		
		for(var i in $scope.board.bumpers) {
			if($scope.board.bumpers[i].src !== '' && typeof $scope.board.bumpers[i].buffer == 'undefined') {
				loaded = false;
			}
		}
		
		$scope.bumpersLoaded = loaded;
	};
	
	$scope.startTrack = function(b) {
		if(typeof b == "number") {
			b = $scope.board.bumpers[b];
		}
		
		if(b.src !== '') {
			if(!b.playing) {
				var i;
				//if this is a background track, only stop other background tracks
				if(b.background) {
					for(i in $scope.board.bumpers) {
						if($scope.board.bumpers[i] !== b && $scope.board.bumpers[i].background && 
								$scope.board.bumpers[i].playing) {
							$scope.stop($scope.board.bumpers[i]);
						}
					}
				} else {
					//stop all other non-background tracks
					for(i in $scope.board.bumpers) {
						if($scope.board.bumpers[i] !== b && !$scope.board.bumpers[i].background && 
								$scope.board.bumpers[i].playing) {
							$scope.stop($scope.board.bumpers[i]);
						}
					}
				}
				
				$scope.play(b);
			} else {
				$scope.stop(b);
			}
		}
	};
	
	$scope.play = function(b) {
		var source = audioContext.createBufferSource();
		var gain = audioContext.createGainNode();
		
		source.buffer = b.buffer;
		source.connect(gain);
		gain.connect(audioContext.destination);
		
		source.loop = b.loop;
		source.loopStart = b.loopStart;
		source.loopEnd = b.loopEnd;
		
		gain.gain.linearRampToValueAtTime(0, audioContext.currentTime);
		gain.gain.linearRampToValueAtTime(b.volume, audioContext.currentTime + b.fadeIn);
		
		b.audioSource = source;
		
		//TrackStart parameter of .start is broken on current Chrome Stable. Catch error and retry without it
		try {
			source.start(0, b.trackStart);
		} catch(e) {
			source.start(0);
		}
		
		b.playing = true;
	};
	
	$scope.stop = function(b) {
		if(typeof b == "number") {
			b = $scope.board.bumpers[b];
		}
		
		b.audioSource.stop(0);
		b.audioSource = null;
		
		b.playing = false;
	};
	
	//check for tracks that were non-looping and have stopped
	//TODO: Make this check smarter (schedule the check on play start instead of constantly checking blindly)
	setInterval(function() {
		if($scope.board) {
			for(var i in $scope.board.bumpers) {
				var b = $scope.board.bumpers[i];
				if(b.audioSource && b.audioSource.playbackState === 3) {
					angular.element(document.querySelector('#board')).scope().$apply("stop(" + i + ")");
					
					if(typeof b.goTo !== "undefined" && b.goTo !== -1) {
						angular.element(document.querySelector('#board')).scope().$apply("startTrack(" + b.goTo + ")");
					}
				}
			}
		}
	}, 100);
}