/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**$
 * TrackEventView
 *
 * View controller for TrackEvents.
 *
 * @type module
 */
define( [ "core/logger", "core/eventmanager", "util/dragndrop",
          "util/lang", "text!layouts/trackevent.html" ],
  function( Logger, EventManager, DragNDrop,
            LangUtils, TRACKEVENT_LAYOUT ) {

  var TRACKEVENT_MIN_WIDTH = 50;


  /**$
   * TrackEventView::TrackEventView
   *
   * Interface for controlling the view of a TrackEvent (on a timeline).
   *
   * @type class
   * @param {TrackEvent} trackEvent TrackEvent object to represent.
   * @param {String} type Type of TrackEvent.
   * @param {Dictionary} Options to pass to update immediately to initialize this view.
   * @api public
   */
  return function( trackEvent, type, inputOptions ){

    var _element = LangUtils.domFragment( TRACKEVENT_LAYOUT, ".butter-track-event" ),
        _type = type,
        _icon = document.getElementById( _type + "-icon" ),
        _start = inputOptions.start || 0,
        _end = inputOptions.end || _start + 1,
        _parent,
        _handles,
        _typeElement = _element.querySelector( ".title" ),
        _draggable,
        _resizable,
        _trackEvent = trackEvent,
        _dragging = false,
        _resizing = false,
        _padding = 0,
        _elementText,
        _ghost,
        _onDrag,
        _onResize,
        _this = this;

    EventManager.extend( _this );

    /**$
     * TrackEventView::TrackEventView::resetContainer
     *
     * Adjusts the element's visual properties to be in accordance with current event settings.
     *
     * @type member function
     * @api private
     */
    function resetContainer() {
      if ( !_trackEvent.track || !_trackEvent.track._media ) {
        return;
      }
      if ( _trackEvent.track.view.element !== _element.parentNode ) {
        _trackEvent.track.view.element.appendChild( _element );
      }
      _element.style.left = _start  / _trackEvent.track._media.duration * 100 + "%";
      _element.style.width = ( _end - _start ) / _trackEvent.track._media.duration * 100 + "%";
    }

    /**$
     * TrackEventView::TrackEventView::setToolTip
     *
     * Sets the `title` attribute of this view's dom element, thereby allowing a tooltip to become visible
     * with appropriate browser support.
     *
     * @type member function
     * @param {String} title Title to show on view element.
     * @api public
     */
    this.setToolTip = function( title ){
      _element.title = title;
    };

    /**$
     * TrackEventView::TrackEventView::update
     *
     * Updates the internal references to corresponding TrackEvent properties (like start & end). Calls
     * `resetContainer` before finishing.
     *
     * @type member function
     * @param {Dictionary} options TrackEvent (Popcorn) options to reference when collecting data for this view.
     * @api public
     */
    this.update = function( options ){
      options = options || {};
      _element.style.top = "0px";
      if ( !isNaN( options.start ) ) {
        _start = options.start;
      }
      if ( !isNaN( options.end ) ) {
        _end = options.end;
      }
      resetContainer();
    };

    /**$
     * TrackEventView::TrackEventView::createGhost
     *
     * Creates a clone of the current TrackEvent that does not have an associated Popcorn event.
     * Used to notify the user when a TrackEvent overlaps and where the new location will be
     * when the TrackEvent is dropped.
     *
     * @type member function
     * @return {Object} An object which represents a TrackEvent's ghost 
     * @api public
     */
    this.createGhost = function() {
      if ( _ghost ) {
        return _ghost;
      }

      var clone = _element.cloneNode( false );
      clone.style.top = "";

      // Copy the `left` attribute here, once. Successive updates are done using
      // the translate transform property.
      clone.style.left = _element.style.left;

      clone.classList.add( "butter-track-event-ghost" );
      LangUtils.setTransformProperty( clone, "" );

      _ghost = {
        element: clone
      };

      return _ghost;
    };

    /**$
     * TrackEventView::TrackEventView::cleanupGhost
     *
     * Removes this TrackEvent's ghost and makes sure `isGhost` is set to `false`.
     *
     * @type member function
     * @api public
     */
    this.cleanupGhost = function() {
      _ghost.track.view.removeTrackEventGhost( _ghost );
      _ghost = null;
    };

    /**$
     * TrackEventView::TrackEventView::updateGhost
     *
     * Updates the positional properties on the ghost element for this TrackEvent view.
     *
     * @type member function
     * @api public
     */
    this.updateGhost = function() {
      // Don't touch top or left style attributes. Just adjust transform through translate(x, 0) to match
      // the draggable element.
      LangUtils.setTransformProperty( _ghost.element, "translate(" + _draggable.getLastOffset()[ 0 ] + "px, 0px)" );
    };

    /**$
     * TrackEventView::TrackEventView::setDragHandler
     *
     * Sets the handler function for dragging. This handler system is provided to circumvent a potentially costly
     * event-calling process. Instead, the provided function is accessed directly when dragging occurs (perhaps many times/second).
     *
     * @type member function
     * @param {Function} dragHandler Handler to call when drag event occurs.
     * @api public
     */
    this.setDragHandler = function( dragHandler ) {
      _onDrag = dragHandler;
    };

    /**$
     * TrackEventView::TrackEventView::setResizeHandler
     *
     * Sets the handler function for resizing. This handler system is provided to circumvent a potentially costly
     * event-calling process. Instead, the provided function is accessed directly when resizing occurs (perhaps many times/second).
     *
     * @type member function
     * @param {Function} dragHandler Handler to call when resize event occurs.
     * @api public
     */
    this.setResizeHandler = function( resizeHandler ) {
      _onResize = resizeHandler;
    };

    Object.defineProperties( this, {
      /**$
       * TrackEventView::TrackEventView::trackEvent
       *
       * TrackEvent this TrackEventView object represents.
       *
       * @type Property
       * @return {TrackEvent}
       */
      trackEvent: {
        enumerable: true,
        get: function(){
          return _trackEvent;
        }
      },

      /**$
       * TrackEventView::TrackEventView::ghost
       *
       * Ghost object referenced during TrackEvent overlapping.
       *
       * @type Property
       * @return {Object}
       */
      ghost: {
        enumerable: true,
        get: function() {
          return _ghost;
        }
      },

      /**$
       * TrackEventView::TrackEventView::element
       *
       * DOM element used by this TrackEventView.
       *
       * @type Property
       * @return {DOMElement}
       */
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      },

      /**$
       * TrackEventView::TrackEventView::start
       *
       * `start` value for the associated TrackEvent. Referenced internally to avoid conflicts.
       *
       * @type Property
       * @return {Number}
       */
      start: {
        enumerable: true,
        get: function(){
          return _start;
        },
        set: function( val ){
          _start = val;
          resetContainer();
        }
      },

      /**$
       * TrackEventView::TrackEventView::end
       *
       * `end` value for the associated TrackEvent. Referenced internally to avoid conflicts.
       *
       * @type Property
       * @return {Number}
       */
      end: {
        enumerable: true,
        get: function(){
          return _end; 
        },
        set: function( val ){
          _end = val;
          resetContainer();
        }
      },

      /**$
       * TrackEventView::TrackEventView::type
       *
       * `type` value for the associated TrackEvent. Referenced internally to avoid conflicts.
       *
       * @type Property
       * @return {String}
       */
      type: {
        enumerable: true,
        get: function(){
          return _type;
        },
        set: function( val ){
          _type = val;
          _element.setAttribute( "data-butter-trackevent-type", _type );
        }
      },

      /**$
       * TrackEventView::TrackEventView::elementText
       *
       * String to display on the TrackEventView DOM element. This will be reflected on the timeline if
       * this TrackEventView is being displayed.
       *
       * @type Property
       * @return {String}
       */
      elementText: {
        enumerable: true,
        get: function() {
          return _elementText;
        },
        set: function( val ) {
          _elementText = val;
          _typeElement.innerHTML = _elementText;
        }
      },

      /**$
       * TrackEventView::TrackEventView::selected
       *
       * Reflects the current selection state of this TrackEventView. When selected, this property is `true` and vice-versa. `false` otherwise.
       *
       * @type Property
       * @return {Boolean}
       */
      selected: {
        enumerable: true,
        get: function(){
          return _draggable.selected;
        },
        set: function( val ){
          if( val ){
            select();
          }
          else {
            deselect();
          }
        }
      },

      /**$
       * TrackEventView::TrackEventView::dragging
       *
       * Reflects the current dragging state of this TrackEventView. When being dragged, this property is `true`. `false` otherwise.
       *
       * @type Property
       * @return {Boolean}
       */
      dragging: {
        enumerable: true,
        get: function(){
          return _dragging;
        }
      },

      /**$
       * TrackEventView::TrackEventView::resizing
       *
       * Reflects the current resizing state of this TrackEventView. When being resized, this property is `true`. `false` otherwise.
       *
       * @type Property
       * @return {Object}
       */
      resizing: {
        enumerable: true,
        get: function() {
          return _resizing;
        }
      },

      /**$
       * TrackEventView::TrackEventView::parent
       *
       * Parent TrackView on which this TrackEventView resides. Setting this property causes UI initialization to occur since
       * the TrackEvent may be newly added to the DOM.
       *
       * @type Property
       * @return {TrackView}
       */
      parent: {
        enumerabled: true,
        get: function(){
          return _parent;
        },
        set: function( val ){
          _parent = val;

          if( _draggable ){
            _draggable.destroy();
            _draggable = null;
          }

          if( _resizable ){
            _resizable.destroy();
            _resizable = null;
            _handles = null;
          }

          if( _parent ){

            if( _parent.element && _parent.element.parentNode && _parent.element.parentNode.parentNode ){

              // Capture the element's computed style on initialization
              var elementStyle = getComputedStyle( _element ),
                  paddingLeft = elementStyle.paddingLeft ? +elementStyle.paddingLeft.substring( 0, elementStyle.paddingLeft.length - 2 ) : 0,
                  paddingRight = elementStyle.paddingRight ? +elementStyle.paddingRight.substring( 0, elementStyle.paddingRight.length - 2 ) : 0;

              // Store padding values to negate from width calculations
              _padding = paddingLeft + paddingRight;

              _draggable = DragNDrop.draggable( _element, {
                containment: _parent.element.parentNode,
                scroll: _parent.element.parentNode.parentNode,
                data: _this,
                start: function(){
                  _dragging = true;
                  _element.classList.add( "trackevent-dragging" );
                  _this.dispatch( "trackeventdragstarted" );
                },
                stop: function() {
                  _dragging = false;
                  _element.classList.remove( "trackevent-dragging" );
                  _this.dispatch( "trackeventdragstopped" );
                },
                drag: function( draggable, droppable ) {
                  if ( _onDrag ) {
                    _onDrag( draggable, droppable );
                  }
                },
                revert: true
              });

              _draggable.selected = _trackEvent.selected;

              _resizable = DragNDrop.resizable( _element, {
                containment: _parent.element.parentNode,
                scroll: _parent.element.parentNode.parentNode,
                padding: _padding,
                start: function( resizeEvent ) {
                  _resizing = true;
                  _this.dispatch( "trackeventresizestarted", resizeEvent );
                },
                stop: function( resizeEvent ) {
                  _resizing = false;
                  _this.dispatch( "trackeventresizestopped", resizeEvent );
                },
                resize: function( x, w, resizeEvent ) {
                  if ( w < TRACKEVENT_MIN_WIDTH ) {
                    _element.classList.add( "trackevent-small" );
                  } else {
                    _element.classList.remove( "trackevent-small" );
                  }
                  if ( _onResize ) {
                    _onResize( _trackEvent, x, w, resizeEvent, resizeEvent.direction );
                  }
                }
              });

              _element.setAttribute( "data-butter-draggable-type", "trackevent" );
              _element.setAttribute( "data-butter-trackevent-id", _trackEvent.id );

            }

            resetContainer();
          }
        }
      }
    });

    _element.className = "butter-track-event";
    if ( _icon ) {
      _element.querySelector( ".butter-track-event-icon" ).style.backgroundImage = "url( "+ _icon.src + ")";
    }
    _this.type = _type;

    _this.update( inputOptions );

    _element.addEventListener( "mousedown", function ( e ) {
      _this.dispatch( "trackeventmousedown", { originalEvent: e, trackEvent: _trackEvent } );
    }, true);
    _element.addEventListener( "mouseup", function ( e ) {
      _this.dispatch( "trackeventmouseup", { originalEvent: e, trackEvent: _trackEvent } );
    }, false);
    _element.addEventListener( "mouseover", function ( e ) {
      _this.dispatch( "trackeventmouseover", { originalEvent: e, trackEvent: _trackEvent } );
    }, false );
    _element.addEventListener( "mouseout", function ( e ) {
      _this.dispatch( "trackeventmouseout", { originalEvent: e, trackEvent: _trackEvent } );
    }, false );

    /**$
     * TrackEventView::TrackEventView::select
     *
     * Changes this TrackEventView's element to a selected state, and notifies the `draggable` manager.
     *
     * @type member function
     * @api private
     */
    function select() {
      if ( _draggable ) {
        _draggable.selected = true;
      }
      _element.setAttribute( "selected", true );
    }

    /**$
     * TrackEventView::TrackEventView::deselect
     *
     * Changes this TrackEventView's element to an unselected state, and notifies the `draggable` manager.
     *
     * @type member function
     * @api private
     */
     function deselect() {
      if ( _draggable ) {
        _draggable.selected = false;
      }
      _element.removeAttribute( "selected" );
    }

  };

});
