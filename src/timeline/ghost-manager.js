/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "./ghost-track" ], function( GhostTrack ) {

  function GhostManager( media, tracksContainerElement ) {
    
    var _media = media,
        _tracksContainerElement = tracksContainerElement,
        _overlappingTrackEvents = [];

    function createGhostTrackForTrack( track, nextTrack ) {
      var ghostTrack;
      if ( !track.ghost ) {
        ghostTrack = track.ghost = new GhostTrack( track, nextTrack );
        if ( !nextTrack ) {
          _tracksContainerElement.appendChild( ghostTrack.view.element );
        }
        else {
          _tracksContainerElement.insertBefore( ghostTrack.view.element, nextTrack.view.element );
        }
      }
      return track.ghost;
    }

    function cleanUpGhostTracks() {
      var tracks = _media.tracks;
      for ( var i = 0, l = tracks.length; i < l; ++i ) {
        cleanUpGhostTrack( tracks[ i ] );
      }
    }

    function cleanUpGhostTrackEvents() {
      for ( var i = 0; i < _overlappingTrackEvents.length; i++ ) {
        _overlappingTrackEvents[ i ].view.cleanupGhost();
      }
      _overlappingTrackEvents = [];
    }

    function cleanUpGhostTrack( track ) {
      var ghostTrack = track.ghost;
      if ( ghostTrack && ghostTrack.numGhostTrackEvents === 0 ) {
        _tracksContainerElement.removeChild( ghostTrack.view.element );
        track.ghost = null;
      }
    }
    
    this.trackEventDragged = function( trackEventView, trackView ) {
      var track, nextTrack, ghostTrack,
          overlappingTrackEvent, overlappingTrackEvents,
          overlappingTrackEventView;

      if ( trackView ) {
        track = trackView.track;

        overlappingTrackEvents = trackView.findOverlappingTrackEvent( trackEventView );

        if ( overlappingTrackEvents ) {

          if ( !overlappingTrackEvents.length ) {
            overlappingTrackEvents = [ overlappingTrackEvents ];
          }

          for ( var i = 0; i < overlappingTrackEvents.length; i++ ) {
            overlappingTrackEvent = overlappingTrackEvents[ i ];
            overlappingTrackEventView = overlappingTrackEvent.view;

            nextTrack = _media.getNextTrack( track );

            if ( !overlappingTrackEventView.ghost ) {
              if ( _overlappingTrackEvents.indexOf( overlappingTrackEvent ) === -1 ) {
                _overlappingTrackEvents.push( overlappingTrackEvent );
              }

              nextTrack = createGhostTrackForTrack( track, nextTrack );
              nextTrack.view.addTrackEventGhost( overlappingTrackEventView.createGhost() );
            }
          }
        } else {
          cleanUpGhostTrackEvents();
          cleanUpGhostTracks();
        }
      } else {
        cleanUpGhostTrackEvents();
        cleanUpGhostTracks();
      }

    };

    this.removeGhostsAfterDrop = function( trackEvents ) {
      var currentTrack, ghost, trackEvent;

      if ( trackEvents ) {

        if ( !trackEvents.length ) {
          trackEvents = [ trackEvents ];
        }

        for ( var i = 0; i < trackEvents.length; i++ ) {
          trackEvent = trackEvents[ i ];
          currentTrack = trackEvent.track;
          ghost = trackEvent.view.ghost;

          if ( ghost && ghost.track ) {
            trackEvent.view.cleanupGhost( currentTrack );
            cleanUpGhostTracks();
          }
        }
      }

      _overlappingTrackEvents = [];
    };

  }

  return GhostManager;

});
