/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "./undomanager" ], function( UndoManager ){

  var __undoManager = UndoManager.getInstance();

  function makeCommand( command ) {
    return {
      execute: function(){
        command.execute();
        __undoManager.register({
          execute: command.execute,
          undo: command.undo
        });
      }
    };
  }; //makeCommand

  return function( butter ){
    butter.undoManager = __undoManager;

    document.addEventListener( "keydown", function( e ){
      if ( e.ctrlKey && e.shiftKey && e.keyCode === 90 ){
        __undoManager.redo();
      }
      else if ( e.ctrlKey && e.keyCode === 90 ){
        __undoManager.undo();
      }
    }); //addEventListener

    butter.addTrackEvent = function( options ){
      return addTrackEventCommand( options ).execute();
    }; //addTrackEvent

    function addTrackEventCommand( options ) {
      var track = options.track, trackEvent;

      return makeCommand({
        execute: function(){
          trackEvent = track.addTrackEvent({
            type: options.type,
            popcornOptions: options.popcornOptions
          });
          return trackEvent;
        },
        undo: function(){
          track.removeTrackEvent( trackEvent );
        }
      });
    }; //addTrackEventCommand
  };
});
