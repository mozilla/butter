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
          nextTrack = track,
          trackEventViewRect;

      if ( trackView.findOverlappingTrackEvent( trackEventView ) ) {
        trackEventViewRect = trackEventView.element.getBoundingClientRect();
        track.removeTrackEvent( trackEvent );
        while ( trackView.findOverlappingTrackEventFromRect( trackEventViewRect ) ) {
          nextTrack = _media.getNextTrack( nextTrack ) || _media.addTrack();
          trackView = nextTrack.view;
        }
        nextTrack.addTrackEvent( trackEvent );
      }
    }

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
            if ( trackEventView.ghost ) {
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

    this.trackEventUpdated = function( trackEvent ) {
      var currentTrack = trackEvent.track,
          ghost = trackEvent.view.ghost,
          newTrackEvent;
          try{
            console.log(ghost, ghost.track, ghost.track.isGhost );
          }
          catch(e){
            console.log('whoops');
          }
      if ( ghost && ghost.track ) {
        if ( !ghost.track.isGhost ) {
          trackEvent.track.removeTrackEvent( trackEvent );
          newTrackEvent = ghost.track.addTrackEvent( trackEvent );
          trackEvent.view.cleanupGhost( currentTrack );
          correctOverlappingTrackEvents( newTrackEvent );
          cleanUpGhostTracks();
        }
        else {
          trackEvent.view.cleanupGhost( currentTrack );
          cleanUpGhostTracks();
        }
      }
      else {
        correctOverlappingTrackEvents( trackEvent );
      }
    };

    this.trackEventDropped = function( trackEvent, newTrack, startTime ) {
      var newTrackEvent,
          oldTrack = trackEvent.track,
          corn = trackEvent.popcornOptions,
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
          else if ( newTrack.lastTrack && newTrack.nextTrack ) {
            newTrack = _media.insertTrackBefore( null, newTrack.nextTrack );
          }
          else {
            newTrack = _media.addTrack();
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
        duration = corn.end - corn.start;
        corn.start = startTime;
        corn.end = corn.start + duration;
        newTrackEvent = newTrack.addTrackEvent( trackEvent );
      }

      correctOverlappingTrackEvents( newTrackEvent );
      cleanUpGhostTracks();
    };

  }

  return TrackEventDragManager;

});