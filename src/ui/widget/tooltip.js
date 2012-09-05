/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/* This widget allows you to create a tooltip by:
 *    a) Manually calling Tooltip.create( "Some message" );
 *    b) Applying it to all elements with a given root element with a data-tooltip attribute,
 *       by calling Tooltip.apply( rootElement );
 */

define( [], function() {
  var __tooltipClass = "butter-tooltip",
      __tooltipOnClass = "tooltip-on",
      _registeredTooltips = {},
      ToolTip;

  function register( tooltip ) {
    _registeredTooltips[ tooltip.title ] = tooltip;
  }

  function isRegistered( title ) {
    return !!_registeredTooltips[ title ];
  }

  ToolTip = {
    /**
     * Member: create
     *
     * Creates a tooltip inside a given element, with optional message.
     * Usage:
     * Tooltip.create({
     *  name: "tooltip-name"
     *  element: myParentElement,
     *  message: "This is my message",
     *  top: 14px,
     *  left: 30px,
     *  hidden: true
     * });
     */
    create: function( options ) {
      var element = options.element,
          tooltipEl = document.createElement( "div" ),
          tooltipText = options.message || element.getAttribute( "data-tooltip" ) || element.getAttribute( "title" ) || "",
          tooltipTitle = options.title || element.getAttribute( "title" ) || ( "" + new Date() ),
          top = options.top,
          left = options.left,
          parentRect;

      if ( isRegistered( tooltipTitle ) ) {
        return;
      }

      tooltipEl.classList.add( __tooltipClass );
      tooltipEl.innerHTML = tooltipText;

      if ( options.hidden === false ) {
        tooltipEl.classList.add( __tooltipOnClass );
      }

      if ( element ) {
         // Parent must be relative or absolute for tooltip to be positioned properly
        if ( [ "absolute", "relative" ].indexOf( getComputedStyle( element ).getPropertyValue( "position" ) ) === -1 ) {
          element.style.position = "relative";
        }

        parentRect = element.getBoundingClientRect();
        tooltipEl.style.top = top || parentRect.height + "px";
        tooltipEl.style.left = left || "50%";

        element.appendChild( tooltipEl );
      }

      register( {
        title: tooltipTitle,
        elem: tooltipEl,
        text: tooltipText
      });

      return tooltipEl;
    },
    /**
     * Member: apply
     *
     * Creates a tooltip inside all elements of a given root element with data-tooltip attribute
     */
    apply: function( rootElement ) {
      var elements,
          i,
          l;

      rootElement = rootElement || document;
      elements = rootElement.querySelectorAll( "[data-tooltip]" );

      for ( i = 0, l = elements.length; i < l; i++ ) {
        ToolTip.create({
          element: elements[ i ]
        });
      }
    },
    /**
     * Member: get
     *
     * Get a tooltip reference by name
     */
     get: function( title ){
      return _registeredTooltips[ title ];
     }
  };
  return ToolTip;
});
