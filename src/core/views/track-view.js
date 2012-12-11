/* This Source Code Form is subject to the terms of the MIT license.
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**$
 * TrackView
 *
 * View controller for Tracks.
 *
 * @type module
 */
define( [ "core/logger", "core/eventmanager", "util/dragndrop" ],
  function( Logger, EventManager, DragNDrop ) {

  /**$
   * TrackView::TrackView
   *
   * Interface for controlling the view of a Track (on a timeline).
   *
   * @type class
   * @param {String} id Identifier for this Track.
   * @param {Track} track Track object to represent.
   * @api public
   */
  return function( id, track ) {

    var _id = id,
        _track = track,
        _this = this,
        _trackEvents = [],
        _element = document.createElement( "div" ),
        _duration = 1,
        _parent,
        _droppable;

    EventManager.extend( _this );

    _element.className = "butter-track";

    /**$
     * TrackView::TrackView::setupDroppable
     *
     * Prepares this TrackView to be droppable. Elements from the plugin tray can be dragged onto this TrackView
     * and turned into corresponding TrackEvents. TrackEventView objects can also be dropped which changes their ownership.
     *
     * @type member function
     * @dispatch trackeventdropped When a TrackEventView object is dropped on this TrackView.
     * @dispatch plugindropped When a plugin element is dropped (from the plugin tray).
     * @api private
     */
    function setupDroppable(){
      _droppable = DragNDrop.droppable( _element, {
        hoverClass: "draggable-hover",
        data: _this,
        drop: function( dropped, mousePosition ) {
          var droppedElement = dropped.data ? dropped.data.element : dropped,
              draggableType = droppedElement.getAttribute( "data-butter-draggable-type" ),
              duration, start, end, left,
              trackRect = _element.getBoundingClientRect(),
              trackEvent, trackEventView, trackEventRect;

          if ( draggableType === "plugin" ) {
            left = mousePosition[ 0 ] - trackRect.left;
            start = left / trackRect.width * _duration;
            _this.dispatch( "plugindropped", {
              start: start,
              track: _track,
              type: droppedElement.getAttribute( "data-popcorn-plugin-type" )
            });
          }
          else if ( draggableType === "trackevent" ) {
            trackEventRect = dropped.getLastRect();
            trackEventView = dropped.data;
            trackEvent = trackEventView.trackEvent;

            // Avoid using width values to derive end value to circumvent padding/border issues.
            duration = trackEvent.popcornOptions.end - trackEvent.popcornOptions.start;
            left = trackEventRect.left - trackRect.left;
            start = left / trackRect.width * _duration;
            end = start + duration;

            _this.dispatch( "trackeventdropped", {
              start: start,
              end: end,
              track: _track,
              trackEvent: trackEventView.trackEvent
            });
          }
        }
      });
    }

    _element.setAttribute( "data-butter-track-id", _id );

    Object.defineProperties( this, {
      /**$
       * TrackView::TrackView::id
       *
       * Identifier for this TrackView.
       *
       * @type Property
       * @return {String}
       */
      id: {
        enumerable: true,
        get: function() {
          return _id;
        }
      },

      /**$
       * TrackView::TrackView::element
       *
       * DOM element controlled by this TrackView.
       *
       * @type Property
       * @return {DOMElement}
       */
      element: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _element;
        }
      },

      /**$
       * TrackView::TrackView::duration
       *
       * Duration of the current media. Replicated here for speed and to avoid conflicts. When set, update is
       * bubbled to TrackEvent children.
       *
       * @type Property
       * @return {Number}
       */
      duration: {
        enumerable: true,
        get: function(){
          return _duration;
        },
        set: function( val ){
          _duration = val;
          for( var i=0, l=_trackEvents.length; i<l; ++i ){
            _trackEvents[ i ].update();
          }
        }
      },

      /**$
       * TrackView::TrackView::parent
       *
       * Parent container (Media in timeline module). When this property is set, UI initialization may occur.
       *
       * @type Property
       * @return {Object}
       */
      parent: {
        enumerable: true,
        get: function(){
          return _parent;
        },
        set: function( val ){
          _parent = val;
          if ( _droppable ) {
            _droppable.destroy();
            _droppable = null;
          }
          if ( _parent ) {
            setupDroppable();
          }
          for( var i=0, l=_trackEvents.length; i<l; ++i ){
            _trackEvents[ i ].parent = _this;
          }
        }
      },

      /**$
       * TrackView::TrackView::track
       *
       * Track object represented by this TrackView.
       *
       * @type Property
       * @return {Track}
       */
      track: {
        enumerable: true,
        get: function() {
          return _track;
        }
      }
    });

    function onTrackEventDragStopped( e ) {
      _track.removeTrackEvent( e.target.trackEvent );
    }

    this.addTrackEvent = function( trackEvent ) {
      var trackEventElement = trackEvent.view.element;
      _element.appendChild( trackEventElement );
      _trackEvents.push( trackEvent.view );
      trackEvent.view.parent = _this;
      _this.chain( trackEvent, [
        "trackeventmousedown",
        "trackeventmouseover",
        "trackeventmouseout",
        "trackeventmoved"
      ]);

      trackEvent.view.listen( "trackeventdragstopped", onTrackEventDragStopped );
    };

    this.removeTrackEvent = function( trackEvent ){
      var trackEventElement = trackEvent.view.element;

      // When `trackeventdragstarted` occurs, TrackEvents views are removed from their Track's view
      // to avoid unnecessary collisions while dragging. So, it may be the case that the TrackEvent's view
      // is no longer parented by this Track's view.
      trackEventElement.parentNode.removeChild( trackEventElement );

      _trackEvents.splice( _trackEvents.indexOf( trackEvent.view ), 1 );
      trackEvent.view.parent = null;
      _this.unchain( trackEvent, [
        "trackeventmousedown",
        "trackeventmouseover",
        "trackeventmouseout",
        "trackeventmoved"
      ]);

      trackEvent.view.unlisten( "trackeventdragstopped", onTrackEventDragStopped );
    };

    // Creates a ghost trackEvent on this track. This means a cloned representation of a currently overlapping trackEvent
    // is added to this track.

    /**$
     * TrackView::TrackView::addTrackEventGhost
     *
     * Adds the ghost object to the DOM as a child of the DOM element controlled by this TrackView. Note that no TrackEvent functionality
     * is meant to be attached to the ghost object. It is purely a visual assistant.
     *
     * @type member function
     * @param {Object} ghost Ghost obejct to add.
     * @api public
     */
    this.addTrackEventGhost = function( ghost ) {
      ghost.track = _track;
      _element.appendChild( ghost.element );
    };

    /**$
     * TrackView::TrackView::removeTrackEventGhost
     *
     * Removes a ghost object from this TrackView.
     *
     * @type member function
     * @param {Object} ghost Ghost obejct to remove.
     * @api public
     */
    this.removeTrackEventGhost = function( ghost ) {
      ghost.track = null;
      _element.removeChild( ghost.element );
    };

    /**$
     * TrackView::TrackView::findOverlappingTrackEvent
     *
     * Find overlapping TrackEvents by comparing left and right pixel boundaries.
     *
     * @type member function
     * @param {TrackEventView} trackEventView TrackEventView object to use for comparison with other TrackEventViews on this TrackView object.
     * @param {Number} leftValue When supplied TrackEventView's element cannot provide a bounding rect, this value is used to establish a left boundary.
     * @param {Number} widthValue When supplied TrackEventView's element cannot provide a bounding rect, this value is used to establish a right boundary.
     * @return {TrackEvent}
     * @api public
     */
    this.findOverlappingTrackEvent = function( trackEventView, leftValue, widthValue ) {
      var otherTrackEventView,
          rect1 = trackEventView.element.getBoundingClientRect(),
          rect2,
          left, right, width;

      left = leftValue || rect1.left;
      width = widthValue || rect1.width;
      right = left + width;

      // If the rect's width is 0 here, it's likely that we're not even attached to the DOM
      if ( width === 0 ) {
        return null;
      }

      // loop over all the trackevents for this track and see if we overlap
      for ( var i = 0, l = _trackEvents.length; i < l; i++ ) {
        otherTrackEventView = _trackEvents[ i ];
        // make sure that we don't check against the same trackEvent or other dragging trackEvents
        if ( !otherTrackEventView.dragging && trackEventView !== otherTrackEventView ) {
          rect2 = otherTrackEventView.element.getBoundingClientRect();
          // if a trackevent overlaps and it's not a ghost...
          if ( !otherTrackEventView.isGhost && !( left > rect2.right || right < rect2.left ) ) {
            return otherTrackEventView.trackEvent;
          }
        }
      }
      return null;
    };
  };
});
