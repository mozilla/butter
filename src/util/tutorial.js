/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "ui/widget/tooltip" ],

function( ToolTip ) {

  function toolTipPlugin() {

    function normalize( value ) {

      if ( typeof value === "number" || ( typeof value === "string" && !/(px|%)$/.test( value ) ) ) {
        return value + "%";
      }

      return value;
    }

    return {
      _setup: function( options ) {

        options.name = options.name || Popcorn.guid( "tooltip-" );
        options._parent = Popcorn.dom.find( options.element );
        options.hover = !!options.hover;
        options.hidden = !!options.hidden;
        options.message = options.message || "";

        ToolTip.create({
          name: options.name,
          element: options._parent,
          message: options.message,
          top: normalize( options.top ),
          left: normalize( options.left ),
          hidden: options.hidden,
          hover: options.hover
        });

        options._toolTipReference = ToolTip.get( options.name );
      },
      start: function( event, options ) {
        var toolTipRef = options._toolTipReference;
        if ( toolTipRef ) {
          toolTipRef.hidden = false;
        }
      },
      end: function( event, options ) {
        var toolTipRef = options._toolTipReference;
        if ( toolTipRef ) {
          toolTipRef.hidden = true;
        }
      },
      _teardown: function( options ) {
        var toolTipRef = options._toolTipReference;
        if ( toolTipRef ) {
          toolTipRef.destroy();
        }
      }
    };
  }

  function editorControllerPlugin( butter ) {
    return function() {
      var editorTypes = [ "media-editor", "plugin-list", "share-properties" ];

      function openEditor( type ) {
        if ( editorTypes.indexOf( type ) !== -1 ) {
          butter.editor.openEditor( type );
        }
      }

      return {
        start: function( event, options ) {
          openEditor( options.type );
        },
        end: Popcorn.nop
      };
    };
  }

  function makeTips( popcornInstance, tips ) {
    for ( var i = tips.length - 1; i >= 0; i-- ) {
      popcornInstance.tooltip( tips[ i ] );
    }
  }

  function makeEditorEvents( popcornInstance, events ) {
    var controllerOptions;
    for ( var i = events.length - 1; i >= 0; i-- ) {
      controllerOptions = events[ i ];
      popcornInstance.editorController( controllerOptions );
    }
  }

  return {

    // Build tutorial tool tips and set up timing
    build: function( butter, tutorialData ) {
      var toolTipPopcornInstance;

      Popcorn.plugin( "tooltip", toolTipPlugin );
      Popcorn.plugin( "editorController", editorControllerPlugin( butter ) );

      toolTipPopcornInstance = new Popcorn( butter.currentMedia.target );

      butter.listen( "ready", function() {

        makeTips( toolTipPopcornInstance, tutorialData.general );

        if ( tutorialData.editorOpenEvents ) {
          makeEditorEvents( toolTipPopcornInstance, tutorialData.editorOpenEvents );
        }
      });

      butter.listen( "editoropened", function( e ) {
        var name = e.data;

        if ( tutorialData[ name ] ) {
          makeTips( toolTipPopcornInstance, tutorialData[ name ] );
          tutorialData[ name ] = null;
        }
      });

    }
  };

});
