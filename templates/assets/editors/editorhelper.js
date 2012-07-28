(function( global, $ ) {
    global.EditorHelper = function( butter ) {
      var CONTROLS_HEIGHT = 35,
          EMBED_SIZES = {
            "small": {
              width: 560,
              height: 315
            },
            "medium": {
              width: 640,
              height: 350
            },
            "large": {
              width: 853,
              height: 470
            },
            "fullscreen": {
              width: 1280,
              height: 715
            }
          };

      function _updateFunction( e ) {

        var _trackEvent,
            _container,
            _textEls,
            _popcornOptions,
            _canvas = document.createElement( "canvas" ),
            _context,
            _trackFunctions;

        if ( e.type === "trackeventadded" ) {
          _trackEvent = e.data;
        } else if ( e.type === "trackeventupdated" ) {
          _trackEvent = e.target;
        } else {
          _trackEvent = e;
        }

        _popcornOptions = _trackEvent.popcornTrackEvent;
        _container = _popcornOptions._container;
        _trackFunctions = _popcornOptions._natives;

        if ( !_container ) {
          return false;
        }

        // Dragging of Plugin Container if defined in plugin
        if ( _trackFunctions._dragSetup ) {
          if ( $ ) {
            _trackFunctions._dragSetup( _trackEvent, function() {
              $( _container ).draggable({
                stop: function( event, ui ) {
                  if ( _trackFunctions.onDragEnd ) {
                    _trackFunctions.onDragEnd( event, ui, _trackEvent );
                  }
                }
              });
            });
          }
        }

        // Resizing of Plugin Container if defined in plugin
        if ( _trackFunctions._resizeSetup ) {
          if ( $ ) {
            _trackFunctions._resizeSetup( _trackEvent, function() {
              $( _container ).resizable({
                stop: function( event, ui ) {
                  if ( _trackFunctions.onResizeEnd ) {
                    _trackFunctions.onResizeEnd( event, ui, _trackEvent );
                  }
                }
              });
            });
          }
        }

      } //updateFunction

      //Add a size chooser to the template
      function _sizeSwitcher( e ) {
        var selectedSize = this.options[ this.selectedIndex ].value,
            wrapper = document.getElementById( "embed-wrapper" );

        if ( EMBED_SIZES[ selectedSize ] ) {
          wrapper.style.width = EMBED_SIZES[ selectedSize ].width + "px";
          wrapper.style.height = EMBED_SIZES[ selectedSize ].height+ CONTROLS_HEIGHT + "px";
        } else {
          wrapper.style.width = "";
          wrapper.style.height = "";
        }
      }

      butter.listen( "trackeventadded", _updateFunction );
      butter.listen( "trackeventupdated", _updateFunction );

    };
  })( window, window.jQuery );
