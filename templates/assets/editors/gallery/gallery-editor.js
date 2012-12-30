/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

(function( Butter ) {

  var Editor = Butter.Editor;

  Editor.register( "gallery", "load!{{baseDir}}templates/assets/editors/gallery/gallery-editor.html",
                   function( rootElement, butter, compiledLayout ) {

    // Defaults
    var DEFAULT_WIDTH = 40,
        DEFAULT_HEIGHT = 50,
        DEFAULT_TOP = 20,
        DEFAULT_LEFT = 20,
        HIGHLIGHT_CLASS = "ui-state-sortable-highlight",
        DEFAULT_TRANSITION = "popcorn-fade";

    var _rootElement = rootElement,
        _dropArea = _rootElement.querySelector( ".image-droparea" ),
        _this = this,
        _trackEvent,
        _cachedValues,
        _listContainer = _rootElement.querySelector( "#gallery-fieldset" ),
        _manageList,
        _media;

    function updateTrackEvent( te, props ) {
      _this.setErrorState();
      _this.updateTrackEventSafe( te, props );
    }

    function attachDropHandlers() {
      window.EditorHelper.droppable( _trackEvent, _dropArea, function( src ) {
        var currentImages = _trackEvent.popcornOptions.images,
            newImage;

        newImage = {
          src: src,
          top: DEFAULT_TOP,
          left: DEFAULT_LEFT,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          transition: DEFAULT_TRANSITION
        };

        currentImages.push( newImage );
        _trackEvent.update( currentImages );
      });

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

    function onSortableChange( event, ui ) {
      console.log(event, ui.helper, ui.item);
    }

    function generateManageList() {
      var li,
          images = _trackEvent.popcornOptions.images,
          img;

      if ( _manageList ) {
        _manageList.parentNode.removeChild( _manageList );
      }

      _manageList = document.createElement( "ul" );
      _manageList.id = "gallery-sortable";

      for ( var i = 0; i < images.length; i++ ) {
        img = images[ i ];
        li = document.createElement( "li" );

        li.id = img.id;
        li.style.backgroundImage = "url( " + img.src + " )";
        _manageList.appendChild( li );
      }

      window.jQuery( _manageList ).sortable({
        scroll: true,
        scrollSensitivity: 300,
        scrollSpeed: 100,
        update: onSortableChange
      });

      var list = _manageList.querySelectorAll( "li" );

      for ( var item in list ) {
        list[ item ].onmousedown = function( e ) {

          for ( var i = 0; i < list.length; i++ ) {
            list[ i ].classList.remove( HIGHLIGHT_CLASS );
          }

          e.target.classList.add( HIGHLIGHT_CLASS );
        }; 
      }

      _listContainer.appendChild( _manageList );
    }

    function setup( trackEvent ) {
      var container = _rootElement.querySelector( ".editor-options" ),
          manifestOpts = trackEvent.popcornTrackEvent._natives.manifest.options,
          $ = window.jQuery,
          sortable = document.getElementById( "sortable" );

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
      generateManageList();

      _this.updatePropertiesFromManifest( trackEvent );
      _this.setTrackEventUpdateErrorCallback( _this.setErrorState );

    }

    function onTrackEventUpdated( e ) {
      _trackEvent = e.target;
      _this.updatePropertiesFromManifest( _trackEvent );
      _this.setErrorState( false );

      /*
        I originally went with seperate add/remove methods that I would call in callbacks. Apparently however
        this isn't kosher for some reason. I would add new list items to the UL but they would never appear.
        */
      generateManageList();
      _this.scrollbar.update();
    }

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
