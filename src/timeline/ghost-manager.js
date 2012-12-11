/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "./ghost-track" ], function( GhostTrack ) {

  function GhostManager( media, tracksContainerElement ) {
    
    var _media = media,
        _tracksContainerElement = tracksContainerElement;

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

    function cleanUpGhostTrack( track ) {
      var ghostTrack = track.ghost;
      if ( ghostTrack && ghostTrack.numGhostTrackEvents === 0 ) {
        _tracksContainerElement.removeChild( ghostTrack.view.element );
        track.ghost = null;
      }
    }
    
    this.trackEventDragged = function( trackEventView, trackView ) {
      var track, nextTrack, ghostTrack,
          overlappingTrackEvent;

      if ( trackView ) {
        track = trackView.track;

        overlappingTrackEvent = trackView.findOverlappingTrackEvent( trackEventView );

        if ( overlappingTrackEvent ) {
          nextTrack = _media.getNextTrack( track );
          if ( !nextTrack || nextTrack.view.findOverlappingTrackEvent( trackEventView ) ) {
            nextTrack = createGhostTrackForTrack( track, nextTrack );
            if ( trackEventView.ghost && trackEventView.ghost.track !== nextTrack ) {
              ghostTrack = trackEventView.ghost.track;
              trackEventView.cleanupGhost();
              if ( ghostTrack.lastTrack ) {
                cleanUpGhostTrack( ghostTrack.lastTrack );
              }
            }
          }
          if ( !trackEventView.ghost ) {
            nextTrack.view.addTrackEventGhost( trackEventView.createGhost() );
          }
          trackEventView.updateGhost();
        }
        else if ( trackEventView.ghost ) {
          track = trackEventView.ghost.track;
          trackEventView.cleanupGhost();
          cleanUpGhostTracks();
        }
      }
      else if ( trackEventView.ghost ) {
        track = trackEventView.ghost.track;
        trackEventView.cleanupGhost();
        cleanUpGhostTracks();
      }
    };

    this.removeGhostsAfterDrop = function( trackEvent, track ) {
      var currentTrack = trackEvent.track,
          ghost = trackEvent.view.ghost;

      if ( ghost && ghost.track ) {
        trackEvent.view.cleanupGhost( currentTrack );
        cleanUpGhostTracks();
      }
    };

  }

  return GhostManager;

});
