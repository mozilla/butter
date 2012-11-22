/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "core/eventmanager", "util/scrollbars", "ui/widget/tooltip", "ui/widget/textbox" ],
  function( EventManager, Scrollbars, ToolTip, TextboxWrapper ) {

  /**
   * Class: BaseEditor
   *
   * Extends a given object to be a BaseEditor, giving it rudamentary editor capabilities
   *
   * @param {Object} extendObject: Object to be extended to become a BaseEditor
   * @param {Butter} butter: An instance of Butter
   * @param {DOMElement} rootElement: The root element to which the editor's content will be attached
   * @param {Object} events: Events such as 'open' and 'close' can be defined on this object to be called at the appropriate times
   */
  function BaseEditor( extendObject, butter, rootElement, events ) {

    EventManager.extend( extendObject );

    extendObject.butter = butter;
    extendObject.rootElement = rootElement;
    extendObject.parentElement = null;

    // Used when applyExtraHeadTags is called -- see below
    var _extraStyleTags = [],
        _extraLinkTags = [];

    /**
     * Member: open
     *
     * Opens the editor
     *
     * @param {DOMElement} parentElement: The element to which the editor's root will be attached
     */
    extendObject.open = function( parentElement ) {

      extendObject.parentElement = parentElement;

      // Attach the editor's root element to the given parentElement.
      // Do this before calling the open event so that element size and structure are defined.
      extendObject.parentElement.appendChild( extendObject.rootElement );

      // Update scrollbars, add one automatically if an allow-scrollbar class is added
      // See .addScrollbar for manual settings
      if ( extendObject.scrollbar ) {
        extendObject.scrollbar.update();
      } else if ( extendObject.rootElement.classList.contains( "allow-scrollbar" ) ) {
        extendObject.addScrollbar();
      }

      // If an open event existed on the events object passed into the constructor, call it
      if ( events.open ) {
        events.open.apply( extendObject, arguments );
      }

      // Add tooltips
      extendObject.addTooltips();

      extendObject.dispatch( "open" );
    };

    /**
     * Member: close
     *
     * Closes the editor
     */
    extendObject.close = function() {
      // Remove the editor's root element from the element to which it was attached
      extendObject.rootElement.parentNode.removeChild( extendObject.rootElement );

      // If a close event existed on the events object passed into the constructor, call it
      if ( events.close ) {
        events.close.apply( extendObject, arguments );
      }

      extendObject.dispatch( "closed" );
    };

    /**
     * Member: applyExtraHeadTags
     *
     * If a tag that belongs in the <head> is present in the given layout, place it in the document's head.
     *
     * @param {DOMFragment} layout: DOMFragment containing the style tag
     */
    extendObject.applyExtraHeadTags = function( layout ) {
      var linkNodes = layout.querySelectorAll( "link" ),
          styleNodes = layout.querySelectorAll( "style" ),
          x;

      for ( x = 0; x < linkNodes.length; x++ ) {
        _extraLinkTags[ x ] = linkNodes[ x ];
        document.head.appendChild( _extraLinkTags[ x ] );
      }

      for ( x = 0; x < styleNodes.length; x++ ) {
        _extraStyleTags[ x ] = styleNodes[ x ];
        document.head.appendChild( _extraStyleTags[ x ] );
      }
    };

    /**
     * Member: addScrollbar
     *
     * Creates a scrollbar with the following options:
     *    outer:      The outer containing element. ( optional. Default = inner.ParentNode )
     *    inner:      The inner element with the scrollable content.
     *    container:  The element to append the scrollbar to.
     */
    extendObject.addScrollbar = function( options ) {
      var innerDefault = extendObject.rootElement.querySelector( ".scrollbar-inner" );

      options = options || innerDefault && {
        inner: innerDefault,
        outer: extendObject.rootElement.querySelector( ".scrollbar-outer" ) || innerDefault.parentNode,
        appendTo: extendObject.rootElement.querySelector( ".scrollbar-container" ) || extendObject.rootElement
      };

      if ( !options ) {
        return;
      }

      extendObject.scrollbar = new Scrollbars.Vertical( options.outer, options.inner );
      options.appendTo.appendChild( extendObject.scrollbar.element );

      extendObject.scrollbar.update();

      return extendObject.scrollBar;
    };

    /**
    * Member: addTooltips
    *
    * Add tooltips to all elements marked data-tooltip
    */
    extendObject.addTooltips = function()  {
      ToolTip.apply( extendObject.rootElement );
    };

    /**
    * Member: createTooltip
    *
    * Create a tooltip that can be used in any editor.
    *
    * @param {DOMElement} element: The element that is being listened to.
    * @param {Object} options: Configuration options for the tooltip. These include:
    *                   name: The name of the Tooltip.
    *                   element: The element that the Tooltip bases it's positioning around.
    *                   message: The message that's displayed to users.
    *                   top: The CSS top position of the Tooltip in relation to element.
    *                   left: The CSS left position of the Tooltip in relation to element.
    *                   hidden: The Tooltips initial visibility state.
    *                   hover: Triggers if the tooltip displays on hover of element.
    */
    extendObject.createTooltip = function( element, options )  {
      var tooltip;

      if ( options && options.name ) {
        ToolTip.create( options );

        tooltip = ToolTip.get( options.name );

        element.addEventListener( "focus", function( e ) {
          tooltip.hidden = false;
        }, false );
        element.addEventListener( "blur", function( e ) {
          tooltip.hidden = true;
        }, false );
      }
    };

    /**
     * Member: removeExtraHeadTags
     *
     * Remove all extra style/link tags that have been added to the document head.
     */
    extendObject.removeExtraHeadTags = function() {
      var x;

      for ( x = 0; x < _extraLinkTags.length; x++ ) {
        document.head.removeChild( _extraLinkTags[ x ] );
      }
      _extraLinkTags = [];

      for ( x = 0; x < _extraStyleTags.length; x++ ) {
        document.head.removeChild( _extraStyleTags[ x ] );
      }
      _extraStyleTags = [];
    };

    /**
     * Member: wrapTextInputElement
     *
     * Force element to auto select the text of the element upon click.
     *
     * @param {DOMElement} element: Element that will be wrapped
     * @param {Object} options: options that can be provided to customize functionality
     *                   readOnly: Force input element to be read-only.
     */
    extendObject.wrapTextInputElement = function( element, options ) {
      return TextboxWrapper.applyTo( element, options );
    };

    window.addEventListener( "resize", function() {
      if ( extendObject.scrollbar ) {
        extendObject.scrollbar.update();
      }
    }, false );

  }

  return {
    extend: BaseEditor
  };

});
