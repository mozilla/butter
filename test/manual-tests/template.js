/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

( function( Butter, EditorHelper ) {

  var _butter,
      _media;

  function runTests( e ) {
    _media.unlisten( "mediaready", runTests );

    asyncTest( "Basic usage handling", function() {
      var t = _media.tracks[ 0 ];

      _media.currentTime = 5;

      _butter.listen( "trackeventadded", function onTrackEventAdded( e ) {
        equal( _media.tracks.length, 2 , "Added track event was properly ghosted" );
        start();
      });

      _butter.generateSafeTrackEvent( "twitter", 5, t );
    });
  }

  document.addEventListener( "DOMContentLoaded", function() {
    Butter.init({
      config: "config.json",
      ready: function( butter ) {
        var script;

        _butter = butter;
        _media = _butter.currentMedia;

        EditorHelper.init( butter );
        script = document.createElement( "script" );
        script.src = "//www.mozilla.org/tabzilla/media/js/tabzilla.js";
        document.body.appendChild( script );

        _media.listen( "mediacontentchanged", function contentChanged() {
          _media.unlisten( "mediacontentchanged", contentChanged );
          _media.listen( "mediaready", runTests );
        });
      }
    });
  }, false );
}( window.Butter, window.EditorHelper ) );
