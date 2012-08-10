(function( global, $ ) {
  var plugins = {};

  global.EditorHelper = function( butter ) {
    var CONTROLS_HEIGHT = 35,
        EMBED_SIZES = {
          small: {
            width: 560,
            height: 315
          },
          medium: {
            width: 640,
            height: 350
          },
          large: {
            width: 853,
            height: 470
          },
          fullscreen: {
            width: 1280,
            height: 715
          }
        };

    global.EditorHelper.draggable = function( trackEvent, dragContainer, mediaContainer ) {
      var media = mediaContainer.getBoundingClientRect();

      $( dragContainer ).draggable({
        stop: function( event, ui ) {
          trackEvent.update({
            top: ( ui.position.top / media.height ) * 100,
            left: ( ui.position.left / media.width ) * 100
          });
        }
      });
    };

    global.EditorHelper.resizable = function( trackEvent, resizeContainer, mediaContainer, handlePositions ) {
      var media = mediaContainer.getBoundingClientRect();

      $( resizeContainer ).resizable({
        handles: handlePositions,
        stop: function( event, ui ) {
          trackEvent.update({
            height: ( ui.size.height / media.height ) * 100,
            width: ( ui.size.width / media.width ) * 100
          });
        }
      });
    };

    function _updateFunction( e ) {

      var _trackEvent;

      if ( e.type === "trackeventadded" ) {
        _trackEvent = e.data;
      } else if ( e.type === "trackeventupdated" ) {
        _trackEvent = e.target;
      } else {
        _trackEvent = e;
      }

      if ( plugins[ _trackEvent.type ] ) {
        plugins[ _trackEvent.type ]( _trackEvent );
      }
    } //updateFunction

    //Add a size chooser to the template
    function _sizeSwitcher( e ) {
      var selectedSize = this.options[ this.selectedIndex ].value,
          wrapper = document.getElementById( "embed-wrapper" );

      if ( EMBED_SIZES[ selectedSize ] ) {
        wrapper.style.width = EMBED_SIZES[ selectedSize ].width + "px";
        wrapper.style.height = EMBED_SIZES[ selectedSize ].height + CONTROLS_HEIGHT + "px";
      } else {
        wrapper.style.width = "";
        wrapper.style.height = "";
      }
    }

    butter.listen( "trackeventadded", _updateFunction );
    butter.listen( "trackeventupdated", _updateFunction );
  };

  global.EditorHelper.addPlugin = function( plugin, callback ) {
    plugins[ plugin ] = callback;
  };

}( window, window.jQuery ));