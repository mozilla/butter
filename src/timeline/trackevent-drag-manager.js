/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "./ghost-track" ], function( GhostTrack ) {

  function TrackEventDragManager( media, tracksContainerElement ) {
    
    var _media = media,
        _tracksContainerElement = tracksContainerElement;

    function correctOverlappingTrackEvents( trackEvent ) {
      var track = trackEvent.track,
          trackView = track.view,
          trackEventView = trackEvent.view,
          nextTrack = track;

      if ( trackView.findOverlappingTrackEvent( trackEventView ) ) {
        track.removeTrackEvent( trackEvent );
        while ( trackView.findOverlappingTrackEvent( trackEventView, true ) ) {
          nextTrack = _media.getNextTrack( nextTrack ) || _media.addTrack();
          trackView = nextTrack.view;
        }
        nextTrack.addTrackEvent( trackEvent );
      }
    }

    this.correctOverlappingTrackEvents = correctOverlappingTrackEvents;

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
      var track,
          nextTrack;

      if ( trackView ) {
        track = trackView.track;

        var overlappingTrackEvent = trackView.findOverlappingTrackEvent( trackEventView );

        if ( overlappingTrackEvent ) {
          nextTrack = _media.getNextTrack( track );
          if ( !nextTrack || nextTrack.view.findOverlappingTrackEvent( trackEventView ) ) {
            nextTrack = createGhostTrackForTrack( track, nextTrack );
            if ( trackEventView.ghost && trackEventView.ghost.track !== nextTrack ) {
              trackEventView.cleanupGhost();
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

    this.findNextAvailableTrack = function( track, trackEvent ) {
      while ( track ) {
        track = _media.getNextTrack( track );
        if ( !track.view.findOverlappingTrackEvent( trackEvent.view ) ) {
          return track;
        }
      }
      return track;
    };

    function replaceGhostWithTrack( ghostTrack ) {
      var newTrack;
      if ( ghostTrack.lastTrack && ghostTrack.nextTrack ) {
        newTrack = _media.insertTrackBefore( null, ghostTrack.nextTrack );
      }
      else {
        newTrack = _media.addTrack();
      }
      return newTrack;
    }

    this.trackEventUpdated = function( trackEvent ) {
      var currentTrack = trackEvent.track,
          ghost = trackEvent.view.ghost,
          newTrackEvent,
          newTrack;
      if ( ghost && ghost.track ) {
        newTrack = ghost.track;
        if ( !newTrack.isGhost ) {
          // make sure the track doesn't get cleared if it's empty by passing in true only if we were ghosting on the current track
          trackEvent.track.removeTrackEvent( trackEvent, ( newTrack.id === trackEvent.track.id ) && true );
          newTrackEvent = newTrack.addTrackEvent( trackEvent );
          trackEvent.view.cleanupGhost( currentTrack );
          correctOverlappingTrackEvents( newTrackEvent );
          cleanUpGhostTracks();
        }
        else {
          newTrack = replaceGhostWithTrack( newTrack );
          trackEvent.track.removeTrackEvent( trackEvent );
          newTrackEvent = newTrack.addTrackEvent( trackEvent );
          trackEvent.view.cleanupGhost();
          cleanUpGhostTracks();
        }
      }
      else {
        correctOverlappingTrackEvents( trackEvent );
      }

      return !!newTrackEvent;
    };

    this.trackEventDropped = function( trackEvent, newTrack, startTime ) {
      var newTrackEvent,
          oldTrack = trackEvent.track,
          popcornOptions = trackEvent.popcornOptions,
          ghost = trackEvent.view.ghost,
          ghostTrack,
          duration;

      if ( ghost && ghost.track ) {
        newTrack = ghost.track;
        if ( newTrack.isGhost ) {
          ghostTrack = newTrack;
          if ( ghostTrack.resultantTrack ) {
            newTrack = ghostTrack.resultantTrack;
          }
          else {
            newTrack = replaceGhostWithTrack( newTrack );
          }
          ghostTrack.resultantTrack = newTrack;
        }
        trackEvent.track.removeTrackEvent( trackEvent );
        newTrackEvent = newTrack.addTrackEvent( trackEvent );
        trackEvent.view.cleanupGhost();
        if ( ghostTrack ) {
          cleanUpGhostTracks();
        }
      }
      else {
        oldTrack.removeTrackEvent( trackEvent );
        duration = popcornOptions.end - popcornOptions.start;
        popcornOptions.start = startTime;
        popcornOptions.end = popcornOptions.start + duration;
        newTrackEvent = newTrack.addTrackEvent( trackEvent );
      }

      correctOverlappingTrackEvents( newTrackEvent );
      cleanUpGhostTracks();
    };
  }

  return TrackEventDragManager;

});
