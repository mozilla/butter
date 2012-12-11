/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function() {

  function ScrollGroup( scrollElement ) {
    this.scrollDiff = [ 0, 0 ];
    this.scrollOrigin = [ 0, 0 ];
    this.boundingClientRect = null;
    this.scrollElement = scrollElement;
    this.iterationScrollX = 0;
    this.iterationScrollY = 0;
  }

  ScrollGroup.prototype.updateBounds = function() {
    this.scrollOrigin[ 0 ] = this.scrollElement.scrollLeft;
    this.scrollOrigin[ 1 ] = this.scrollElement.scrollTop;
    this.boundingClientRect = this.scrollElement.getBoundingClientRect();
  };

  ScrollGroup.prototype.processIteration = function() {
    this.scrollElement.scrollLeft += this.iterationScrollX;
    this.scrollElement.scrollTop += this.iterationScrollY;
    this.scrollDiff[ 0 ] = this.scrollElement.scrollLeft - this.scrollOrigin[ 0 ];
    this.scrollDiff[ 1 ] = this.scrollElement.scrollTop - this.scrollOrigin[ 1 ];
    this.iterationScrollX = 0;
    this.iterationScrollY = 0;
  };

  function NullScrollGroup() {
    ScrollGroup.call( this, arguments );
  }

  NullScrollGroup.prototype = Object.create( ScrollGroup );

  NullScrollGroup.prototype.update = function() {};

  return {
    ScrollGroup: ScrollGroup,
    NullScrollGroup: NullScrollGroup
  };

});
