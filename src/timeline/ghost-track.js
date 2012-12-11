/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/*
 * Module: GhostTrack
 *
 * Creates a ghosted track that will potentially get created if an overlapping trackEvent is dropped.
 */
define( [], function() {
  function GhostTrack( lastTrack, nextTrack ) {
    var _this = this,
        _element = document.createElement( "div" ),
        _view;

    _element.classList.add( "butter-track" );
    _element.classList.add( "butter-track-ghost" );

    // Will be filled in when a new track is made to take the place of this ghost.
    _this.resultantTrack = null;

    // Create methods to manage ghost trackEvents
    _view = {
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
      /*
       * Property: element
       *
       * Reference to the DOM element for the ghost track
       */
      element: {
        enumerable: true,
        get: function() {
          return _element;
        }
      },
      /*
       * Property: track
       *
       * The ghost track
       */
      track: {
        enumerable: true,
        get: function() {
          return _this;
        }
      }
    });

    Object.defineProperties( _this, {
      /*
       * Property: lastTrack
       *
       * Reference to the bottom most track inside the track-container
       */
      lastTrack: {
        enumerable: true,
        get: function() {
          return lastTrack;
        }
      },
      /*
       * Property: nextTrack
       *
       * The track that is below this track inside the track-container
       */
      nextTrack : {
        enumerable: true,
        get: function() {
          return nextTrack;
        }
      },
      /*
       * Property: view
       *
       * A reference to the view object that was generated for this track
       */
      view: {
        enumerable: true,
        get: function() {
          return _view;
        }
      },
      /*
       * Property: isGhost
       *
       * Specifies whether this track is a ghost or not.
       */
      isGhost: {
        enumerable: true,
        get: function() {
          return true;
        }
      },
      /*
       * Property: numGhostTrackEvents
       *
       * Specifies the number of trackEvents on this track which are ghosts
       */
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
