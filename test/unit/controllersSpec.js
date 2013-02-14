'use strict';

/* jasmine specs for controllers go here */

describe('BoardCtrl', function(){
	var boardCtrl;
	
	var scope, ctrl, $httpBackend;
	
	beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
		$httpBackend = _$httpBackend_;
		$httpBackend.expectGET('getboard.json').
		respond({
			"title": "Gameshow",
			"rows": 1,
			"cols": 2,
			"bumpers": [{
				"label": "Somebody That I Used To Know",
				"src": "/bumper-board/know.mp3",
				"trackStart": 5,
				"fadeIn": 1,
				"background": true,
				"loop": true,
				"loopStart": 50,
				"loopEnd": 240,
				"volume": 1.0
			},
			{
				"label": "Already Gone",
				"src": "/bumper-board/gone.mp3",
				"trackStart": 11,
				"fadeIn": 5,
				"background": true,
				"loop": true,
				"loopStart": 50,
				"loopEnd": 240,
				"volume": 1
			}
			]
		});
		
		scope = $rootScope.$new();
		ctrl = $controller(PhoneListCtrl, {$scope: scope});
	}));
	
	beforeEach(function(){
		boardCtrl = new BoardCtrl();
	});
	
	
	it('should ....', function() {
		//spec body
	});
});
