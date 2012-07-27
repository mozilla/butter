/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function() {
  function GhostTrack( lastTrack, nextTrack ){
    var _this = this;

    var _element = document.createElement( "div" );

    _element.classList.add( "butter-track" );
    _element.classList.add( "butter-track-ghost" );

    // Will be filled in when a new track is made to take the place of this ghost.
    _this.resultantTrack = null;

    var _view = {
      addTrackEventGhost: function( trackEventGhost ) {
        trackEventGhost.track = _this;
        _element.appendChild( trackEventGhost.element );
      },
      removeTrackEventGhost: function( trackEventGhost ) {
        trackEventGhost.track = null;
        _element.removeChild( trackEventGhost.element );
      }
    };

    Object.defineProperties( _view, {
      element: {
        enumerable: true,
        get: function() {
          return _element;
        }
      },
      track: {
        enumerable: true,
        get: function() {
          return _this;
        }
      }
    });

    Object.defineProperties( _this, {
      lastTrack: {
        enumerable: true,
        get: function() {
          return lastTrack;
        }
      },
      nextTrack : {
        enumerable: true,
        get: function() {
          return nextTrack;
        }
      },
      view: {
        enumerable: true,
        get: function() {
          return _view;
        }
      },
      isGhost: {
        enumerable: true,
        get: function() {
          return true;
        }
      },
      numGhostTrackEvents: {
        enumerable: true,
        get: function() {
          return _element.childNodes.length;
        }
      }
    });
  }

  return GhostTrack;

});
