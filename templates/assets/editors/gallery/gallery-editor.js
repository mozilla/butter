/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( Butter ) {

  var Editor = Butter.Editor;

  Editor.register( "gallery", "load!{{baseDir}}templates/assets/editors/gallery/gallery-editor.html",
                   function( rootElement, butter, compiledLayout ) {

    var _rootElement = rootElement,
        _dropArea = _rootElement.querySelector( ".image-droparea" ),
        _this = this,
        _trackEvent,
        _addGallerySection = _rootElement.querySelector( ".gallery-add" ),
        _addGalleryButton = _rootElement.querySelector( "#gallery-toggle" ),
        _cachedValues;

    function updateTrackEvent( te, props ) {
      _this.setErrorState();
      _this.updateTrackEventSafe( te, props );
    }

    function toggleTabs() {
      _singleImageTab.classList.toggle( "display-off" );
      _flickrImageTab.classList.toggle( "display-off" );
    }

    function attachDropHandlers() {
      window.EditorHelper.droppable( _trackEvent, _dropArea );

      butter.listen( "droppable-unsupported", function error() {
        _this.setErrorState( "Sorry, but your browser doesn't support this feature." );
      });
    }

    function calcImageTime() {
      var imageTime = rootElement.querySelector( ".image-time-bold" ),
          popcornOptions = _trackEvent.popcornOptions,
          eventDuration = popcornOptions.end - popcornOptions.start,
          time;

      time = Math.round( ( eventDuration / popcornOptions.count ) * ( Math.pow( 10, 1 ) ) ) / Math.pow( 10, 1 );
      time = time > 0.01 ? time : 0.01;

      imageTime.innerHTML = time + " seconds";
    }

    function setup( trackEvent ) {
      var container = _rootElement.querySelector( ".editor-options" ),
          manifestOpts = trackEvent.popcornTrackEvent._natives.manifest.options;

      function callback( elementType, element, trackEvent, name ) {
        if ( elementType === "select" ) {
          _this.attachSelectChangeHandler( element, trackEvent, name );
        }
      }

      function attachHandlers() {
        attachDropHandlers();
      }

      container.insertBefore( _this.createStartEndInputs( trackEvent, updateTrackEvent ), container.firstChild );

      _this.createPropertiesFromManifest({
        trackEvent: trackEvent,
        callback: callback,
        basicContainer: container,
        ignoreManifestKeys: [ "start", "end" ]
      });

      attachHandlers();

      _this.updatePropertiesFromManifest( trackEvent );
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );

    }

    function onTrackEventUpdated( e ) {
      _trackEvent = e.target;
      calcImageTime();
      _this.updatePropertiesFromManifest( _trackEvent );
      _this.setErrorState( false );

      _this.scrollbar.update();
    }

    _addGalleryButton.addEventListener( "click", function() {
      _addGallerySection.classList.toggle( "hidden" );
    }, false );

    Editor.TrackEventEditor.extend( _this, butter, rootElement, {
      open: function( parentElement, trackEvent ) {
        _this.applyExtraHeadTags( compiledLayout );
        _trackEvent = trackEvent;

        _trackEvent.listen( "trackeventupdated", onTrackEventUpdated );

        setup( trackEvent );
      },
      close: function() {
        _this.removeExtraHeadTags();
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  });
}( window.Butter ));
