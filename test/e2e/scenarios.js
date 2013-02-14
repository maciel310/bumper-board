'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function() {

  beforeEach(function() {
    browser().navigateTo('../../app/index.html');
  });


  it('should automatically redirect to /board when location hash/fragment is empty', function() {
    expect(browser().location().url()).toBe("/board");
  });


  describe('board', function() {

    beforeEach(function() {
      browser().navigateTo('#/board');
    });


    it('should render the board when user navigates to /board', function() {
      expect(element('[ng-view] #controls').text()).
        toMatch(/Gameshow/);
    });

  });
});
