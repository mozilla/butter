/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "/src/ui/widget/tooltip.js" ],

function( ToolTip ) {

  function toolTipPlugin() {

    var _ToolTip = ToolTip;

    function normalize( value ) {

      if ( typeof value === "number" || ( typeof value === "string" && !/px$/.test( value ) ) ) {
        return value + "px";
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

        _ToolTip.create({
          name: options.name,
          element: options._parent,
          message: options.message,
          top: normalize( options.top ),
          left: normalize( options.left ),
          hidden: options.hidden,
          hover: options.hover
        });

        options._toolTipReference = _ToolTip.get( options.name );
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
      _teardown: function() {
        var toolTipRef = options._toolTipReference;
        if ( toolTipRef ) {
          toolTipRef.destroy();
        }
      }
    }
  }

  return {

    // Build tutorial tool tips and set up timing
    build: function( butter, tutorialData ) {

      butter.listen( "ready", function() {

        var tooltips = tutorialData.tooltips,
            toolTipPopcornInstance;

        Popcorn.plugin( "tooltip", toolTipPlugin );

        toolTipPopcornInstance = new Popcorn( butter.currentMedia.target );

        for ( var i = tooltips.length - 1; i >= 0; i-- ) {
          toolTipPopcornInstance.tooltip( tooltips[ i ] );
        }

      });

    },

    toggle: function( state ) {

    }
  };

});