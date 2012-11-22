/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/* This widget allows you to create a tooltip by:
 *    a) Manually calling Tooltip.create( "Some message" );
 *    b) Applying it to all elements with a given root element with a data-tooltip attribute,
 *       by calling Tooltip.apply( rootElement );
 */

define( [], function() {
  var __tooltipClass = "butter-tooltip",
      __tooltipOnClass = "tooltip-on",
      __toolTipNoHoverClass = "tooltip-no-hover",
      _registeredTooltips = {},
      ToolTipObj,
      ToolTip;

  function register( tooltip ) {
    _registeredTooltips[ tooltip.name ] = tooltip;
  }

  function isRegistered( name ) {
    return !!_registeredTooltips[ name ];
  }

  // ToolTip Constructor
  ToolTipObj = function( options ) {
    if ( options && options.name && isRegistered( options.name ) ) {
      return;
    }

    var parentElement,
        name,
        message,
        top,
        left,
        error,
        destroyed = false,
        tooltipElement = document.createElement( "div" );

    tooltipElement.classList.add( __tooltipClass );
    tooltipElement.classList.add( options.name );

    Object.defineProperty( this, "message", {
      get: function() {
        return message;
      },
      set: function( newMessage ) {
        if ( newMessage && typeof newMessage === "string" ) {
          message = newMessage;
          tooltipElement.innerHTML = newMessage;
        }
      },
      enumerable: true
    });

    Object.defineProperty( this, "hidden", {
      get: function() {
        return !tooltipElement.classList.contains( __tooltipOnClass );
      },
      set: function( hidden ) {
        if ( hidden || hidden === undefined ) {
          tooltipElement.classList.remove( __tooltipOnClass );
        } else {
          tooltipElement.classList.add( __tooltipOnClass );
        }
      },
      enumerable: true
    });

    Object.defineProperty( this, "hover", {
      get: function() {
        return !tooltipElement.classList.contains( __toolTipNoHoverClass );
      },
      set: function( hover ) {
        if ( hover || hover === undefined ) {
          tooltipElement.classList.remove( __toolTipNoHoverClass  );
        } else {
          tooltipElement.classList.add( __toolTipNoHoverClass );
        }
      },
      enumerable: true
    });

    Object.defineProperty( this, "top", {
      get: function() {
        return top;
      },
      set: function( newTop ) {
        if ( parentElement && newTop && typeof newTop === "string" ) {
          top = newTop;
          tooltipElement.style.top = newTop;
        }
      },
      enumerable: true
    });

    Object.defineProperty( this, "left", {
      get: function() {
        return left;
      },
      set: function( newLeft ) {
        if ( parentElement && newLeft && typeof newLeft === "string" ) {
          left = newLeft;
          tooltipElement.style.left = newLeft;
        }
      },
      enumerable: true
    });

    Object.defineProperty( this, "tooltipElement", {
      get: function() {
        return tooltipElement;
      },
      enumerable: true
    });

    Object.defineProperty( this, "parent", {
      get: function() {
        return parentElement;
      },
      set: function( newParent ) {
        if ( newParent ) {
          // Parent must be relative or absolute for tooltip to be positioned properly
          if ( [ "absolute", "relative", "fixed" ].indexOf( getComputedStyle( newParent ).getPropertyValue( "position" ) ) === -1 ) {
            newParent.style.position = "relative";
          }

          parentElement = newParent;
          parentElement.appendChild( tooltipElement );
        }
      },
      enumerable: true
    });

    Object.defineProperty( this, "name", {
      get: function() {
        return name;
      },
      enumerable: true
    });

    Object.defineProperty( this, "error", {
      get: function() {
        return error;
      },
      set: function( value ) {
        error = !!value;

        if ( error ) {
          tooltipElement.classList.add( "tooltip-error" );
        } else {
          tooltipElement.classList.remove( "tooltip-error" );
        }
      },
      enumerable: true
    });

    Object.defineProperty( this, "destroyed", {
      get: function() {
        return destroyed;
      },
      enumerable: true
    });

    this.destroy = function() {
      if ( !destroyed ) {
        if ( parentElement && tooltipElement.parentNode === parentElement ) {
          parentElement.removeChild( tooltipElement );
        }
        _registeredTooltips[ name ] = undefined;
        destroyed = true;
      }
    };

    this.parent = options.element;
    this.top = options.top || parentElement.getBoundingClientRect().height + "px";
    this.left = options.left || "50%";
    this.message = options.message || parentElement.getAttribute( "data-tooltip" ) || parentElement.getAttribute( "title" ) || "";
    this.hidden = options.hidden;
    this.hover = options.hover;
    this.error = options.error;

    name = options.name;

    if ( name ) {
      register( this );
    }

    return this;
  };

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
     *  hidden: true,
     *  hover: true,
     *  error: true
     * });
     */
    create: function( options ) {
      var newToolTip = new ToolTipObj( options );

      return newToolTip.tooltipElement;
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
