/*global Butter,asyncTest,equal,start*/
require( [], function() {

  function createButter( callback ){
    Butter({
      config: "../test-config-core.json",
      debug: false,
      ready: callback
    });
  }

  module( "Editor" );

  asyncTest( "Basic usage", 6, function() {
    createButter( function( butter ) {
      var media = butter.addMedia(),
          track = media.addTrack(),
          trackEvent = track.addTrackEvent({
            type: "text",
            popcornOptions: {
              start: 3,
              end: 6
            }
          });

      var editor = butter.editor.editTrackEvent( trackEvent );
      ok( editor, "Got Editor back from edit call." );
      ok( editor.rootElement.querySelectorAll( ".trackevent-property" ).length, "Default Editor created properties properly." );
      equal( editor.rootElement.querySelector( ".trackevent-property > input[data-manifest-key='start']" ).value, 3, "[start] input box has correct value." );
      equal( editor.rootElement.querySelector( ".trackevent-property > input[data-manifest-key='end']" ).value, 6, "[end] input box has correct value." );
      trackEvent.update({
        start: 1,
        end: 10
      });
      equal( editor.rootElement.querySelector( ".trackevent-property > input[data-manifest-key='start']" ).value, 1, "[start] input box has correct value after update." );
      equal( editor.rootElement.querySelector( ".trackevent-property > input[data-manifest-key='end']" ).value, 10, "[end] input box has correct value after update." );
      start();
    });
  });

  asyncTest( "Custom editor", 10, function() {

    var layoutSrc = "<div class=\"butter-editor\">" +
                    "  <div class=\"error-message-container\">" +
                    "    <div class=\"content-container\"></div>" +
                    "    <div class=\"error-message\"></div>" +
                    "  </div>" +
                    "</div>";

    var createdManifestItems = [],
        createdManifestItems2 = [];

    Butter.Editor.register( "text", layoutSrc, function( rootElement, butter ) {
      Butter.Editor.TrackEventEditor( this, butter, rootElement, {
        open: function( parentElement, trackEvent ) {
          var contentContainer = rootElement.querySelector( ".content-container" );

          this.createPropertiesFromManifest( trackEvent,
            function( elementType, element, trackEvent, name ){
              createdManifestItems.push( name );
            }, null, rootElement.querySelector( ".content-container" ), [ "start", "end", "target" ] );

          ok( createdManifestItems.indexOf( "start" ) === -1, "start not created from manifest" );
          ok( createdManifestItems.indexOf( "end" ) === -1, "end not created from manifest" );
          ok( createdManifestItems.indexOf( "target" ) === -1, "target not created from manifest" );
          ok( createdManifestItems.indexOf( "escape" ) > -1, "escape created from manifest" );
          ok( createdManifestItems.indexOf( "multiline" ) > -1, "multiline created from manifest" );
          ok( createdManifestItems.indexOf( "text" ) > -1, "text created from manifest" );

          this.createPropertiesFromManifest( trackEvent,
            function( elementType, element, trackEvent, name ){
              createdManifestItems2.push( name );
            }, [ "start" ] );

          ok( createdManifestItems2.indexOf( "start" ) > -1, "text created from manifest" );

          ok( contentContainer.querySelectorAll( "*" ).length > 0, ".content-container was filled with manifest items" );
          var startElement = rootElement.querySelector( "[data-manifest-key='start']" ).parentNode;
          ok( startElement, "start element was created with correct data-manifest-key" );
          ok( startElement.parentNode === rootElement, "start element was created outside of content-container" );

        },
        close: function() {
        }
      });
    });

    createButter( function( butter ) {
      var media = butter.addMedia(),
          track = media.addTrack(),
          trackEvent = track.addTrackEvent({
            type: "text",
            popcornOptions: {
              start: 3,
              end: 6
            }
          });

      var editor = butter.editor.editTrackEvent( trackEvent );
      start();
    });
  });

});