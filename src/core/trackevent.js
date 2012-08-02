/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

/**
 * Module: TrackEvent
 *
 * Supports a single event in the Media > Track > TrackEvent model.
 */
define( [
          "./logger",
          "./eventmanager",
          "util/lang",
          "util/time",
          "./views/trackevent-view"
        ],
        function(
          Logger,
          EventManagerWrapper,
          LangUtil,
          TimeUtil,
          TrackEventView
        ){

  var __guid = 0;

  var TrackEventUpdateException = function ( reason, message ) {
    this.type = "trackevent-update";
    this.reason = reason;
    this.message = message;
    this.toString = function () {
      return "TrackEvent update failed: " + message;
    };
  };

  /**
   * Class: TrackEvent
   *
   * Represents and governs a single popcorn event.
   *
   * @param {Object} options: Options for initialization. Can contain the properties type, name, and popcornOptions. If the popcornOptions property is specified, its contents will be used to initialize the plugin instance associated with this TrackEvent.
   */
  var TrackEvent = function ( options, track, popcornWrapper ) {

    options = options || {};

    var _this = this,
        _id = "TrackEvent" + __guid++,
        _name = options.name || _id,
        _logger = new Logger( _id ),
        _track = track,
        _type = options.type + "",
        _popcornOptions = options.popcornOptions || {
          start: 0,
          end: 1
        },
        _view = new TrackEventView( this, _type, _popcornOptions ),
        _popcornWrapper = popcornWrapper,
        _selected = false;

    EventManagerWrapper( _this );

    _this.popcornOptions = _popcornOptions;
    _this.popcornTrackEvent = null;

    function defaultValue( item ) {
      if ( item.default ) {
        return item.default;
      }
      return item.type === "number" ? 0 : "";
    }

    if( !_type ){
      _logger.log( "Warning: " + _id + " has no type." );
    }
    else {
      this.manifest = Popcorn.manifest[ _type ];
    }

    _popcornOptions.start = _popcornOptions.start || 0;
    _popcornOptions.start = TimeUtil.roundTime( _popcornOptions.start );
    _popcornOptions.end = _popcornOptions.end || _popcornOptions.start + 1;
    _popcornOptions.end = TimeUtil.roundTime( _popcornOptions.end );

    /**
     * Member: setPopcornWrapper
     *
     * Sets the PopcornWrapper object. Subsequently, PopcornWrapper can be used to directly manipulate Popcorn track events.
     *
     * @param {Object} newPopcornWrapper: PopcornWrapper object or null
     */
    this.setPopcornWrapper = function ( newPopcornWrapper ) {
      _popcornWrapper = newPopcornWrapper;
    };

    /**
     * Member: update
     *
     * Updates the event properties and runs sanity checks on input.
     *
     * @param {Object} updateOptions: Object containing plugin-specific properties to be updated for this TrackEvent.
     * @event trackeventupdated: Occurs when an update operation succeeded.
     * @throws TrackEventUpdateException: When an update operation failed because of conflicting times or other serious property problems.
     */
    this.update = function( updateOptions, applyDefaults ) {
      updateOptions = updateOptions || {};

      var newStart = _popcornOptions.start,
          newEnd = _popcornOptions.end,
          manifestOptions;

      if ( !isNaN( updateOptions.start ) ) {
        newStart = TimeUtil.roundTime( updateOptions.start );
      }
      else if ( !!updateOptions.start ) {
        throw new TrackEventUpdateException( "invalid-start-time", "[start] is an invalid value." );
      }

      if ( !isNaN( updateOptions.end ) ) {
        newEnd = TimeUtil.roundTime( updateOptions.end );
      }
      else if ( updateOptions.end ) {
        throw new TrackEventUpdateException( "invalid-end-time", "[end] is an invalid value." );
      }

      if ( newStart >= newEnd ) {
        throw new TrackEventUpdateException( "start-greater-than-end", "[start] must be equal to or less than [end]." );
      }
      if ( _track && _track._media && _track._media.ready ) {
        var media = _track._media;
        if( ( newStart > media.duration ) ||
            ( newEnd > media.duration ) ||
            ( newStart < 0 ) ) {
          throw new TrackEventUpdateException( "invalid-times", "[start] or [end] are not within the duration of media" );
        }
      }

      if ( this.manifest ) {
        manifestOptions = this.manifest.options;
        if ( manifestOptions ) {
          for ( var prop in manifestOptions ) {
            if ( manifestOptions.hasOwnProperty( prop ) ) {
              if ( updateOptions[ prop ] === undefined ) {
                if ( applyDefaults ) {
                  _popcornOptions[ prop ] = defaultValue( manifestOptions[ prop ] );
                }
              } else {
                _popcornOptions[ prop ] = updateOptions[ prop ];
              }
            }
          }
          if ( !( "target" in manifestOptions ) && updateOptions.target ) {
            _popcornOptions.target = updateOptions.target;
          }
          if ( "zindex" in manifestOptions ) {
            _popcornOptions.zindex = _track._media.maxPluginZIndex - _track.order;
          }
        }
      }
      
      if( newStart ){
        _popcornOptions.start = newStart;
      }
      if( newEnd ){
        _popcornOptions.end = newEnd;
      }

      // if PopcornWrapper exists, it means we're connected properly to a Popcorn instance,
      // and can update the corresponding Popcorn trackevent for this object
      if ( _popcornWrapper ) {
        _popcornWrapper.updateEvent( _this );
      }

      _view.update( _popcornOptions );
      _this.popcornOptions = _popcornOptions;

      // make sure we have a reference to the trackevent before calling toString
      if ( _this.popcornTrackEvent ) {
        _view.elementText = _this.popcornTrackEvent.toString();
      }

      // we should only get here if no exceptions happened
      _this.dispatch( "trackeventupdated", _this );
    };

    /**
     * Member: moveFrameLeft
     *
     * Moves the event to the left, or shrinks it by a specified amount.
     *
     * @param {Number} inc: Amount by which the event is to move or grow.
     * @param {Boolean} metaKey: State of the metaKey (windows, command, etc.). When true, the event duration is shortened.
     * @event trackeventupdated: Occurs whenan update operation succeeded.
     */
    this.moveFrameLeft = function( inc, metaKey ){
      if( !metaKey ) {
        if( _popcornOptions.start > inc ) {
          _popcornOptions.start -= inc;
          _popcornOptions.end -= inc;
        } else {
          _popcornOptions.end = _popcornOptions.end - _popcornOptions.start;
          _popcornOptions.start = 0;
        } // if
      } else if ( _popcornOptions.end - _popcornOptions.start > inc ) {
        _popcornOptions.end -= inc;
      } else {
        _popcornOptions.end = _popcornOptions.start;
      } // if
      _this.dispatch( "trackeventupdated", _this );
      _this.update( _popcornOptions );
    }; //moveFrameLeft

    /**
     * Member: moveFrameRight
     *
     * Moves the event to the right, or elongates it by a specified amount.
     *
     * @param {Number} inc: Amount by which the event is to move or grow.
     * @param {Boolean} metaKey: State of the metaKey (windows, command, etc.). When true, the event duration is lengthened.
     * @event trackeventupdated: Occurs whenan update operation succeeded.
     */
    this.moveFrameRight = function( inc, metaKey ){
      if( _popcornOptions.end < _track._media.duration - inc ) {
        _popcornOptions.end += inc;
        if( !metaKey ) {
          _popcornOptions.start += inc;
        }
      } else {
        if( !metaKey ) {
          _popcornOptions.start += _track._media.duration - _popcornOptions.end;
        }
        _popcornOptions.end = _track._media.duration;
      }
      _this.dispatch( "trackeventupdated", _this );
      _this.update( _popcornOptions );
    }; //moveFrameRight

    /**
     * Member: unbind
     *
     * Kills references to popcornWrapper and track which are necessary to function. TrackEvent becomes
     * a husk for popcorn data at this point.
     */
    this.unbind = function() {
      _popcornWrapper.destroyEvent( _this );
      _popcornWrapper = null;
      _track = null;
    };

    Object.defineProperties( this, {

      /**
       * Property: track
       *
       * Specifies the track on which this TrackEvent currently sites.
       */
      track: {
        enumerable: true,
        get: function(){
          return _track;
        }
      },

      /**
       * Property: view
       *
       * A reference to the view object generated for this TrackEvent.
       * @malleable: No.
       */
      view: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _view;
        }
      },

      /**
       * Property: dragging
       *
       * A dragging state of the track event.
       * @malleable: No.
       */
      dragging: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _view.dragging;
        }
      },

      /**
       * Property: type
       *
       * The type representing the popcorn plugin created and manipulated by this TrackEvent.
       * @malleable: No.
       */
      type: {
        enumerable: true,
        get: function(){
          return _type;
        }
      },

      /**
       * Property: name
       *
       * Name of this TrackEvent.
       * @malleable: No.
       */
      name: {
        enumerable: true,
        get: function(){
          return _name;
        }
      },

      /**
       * Property: id
       *
       * Name of this TrackEvent.
       * @malleable: No.
       */
      id: {
        enumerable: true,
        get: function(){
          return _id;
        }
      },

      /**
       * Property: selected
       *
       * Specifies the state of selection. When true, this TrackEvent is selected.
       *
       * @malleable: Yes.
       * @event trackeventselected: Dispatched when selected state changes to true.
       * @event trackeventdeselected: Dispatched when selected state changes to false.
       */
      selected: {
        enumerable: true,
        get: function(){
          return _selected;
        },
        set: function( val ){
          if( val !== _selected ){
            _selected = val;
            _view.selected = _selected;
            if( _selected ){
              _this.dispatch( "trackeventselected" );
            }
            else {
              _this.dispatch( "trackeventdeselected" );
            } //if
          } //if
        }
      },

      /**
       * Property: json
       *
       * Represents this TrackEvent in a portable JSON format.
       *
       * @malleable: Yes. Will import JSON in the same format that it was exported.
       * @event trackeventupdated: When this property is set, the TrackEvent's data will change, so a trackeventupdated event will be dispatched.
       */
      json: {
        enumerable: true,
        get: function(){
          return {
            id: _id,
            type: _type,
            popcornOptions: LangUtil.clone( _popcornOptions ),
            track: _track ? _track.name : undefined,
            name: _name
          };
        },
        set: function( importData ){
          _type = _popcornOptions.type = importData.type;
          this.manifest = Popcorn.manifest[ _type ];
          if( importData.name ){
            _name = importData.name;
          }
          _popcornOptions = importData.popcornOptions;
          _this.popcornOptions = _popcornOptions;
          _view.type = _type;
          _view.update( _popcornOptions );
          _this.dispatch( "trackeventupdated", _this );
        }
      }
    }); //properties

  }; //TrackEvent

  return TrackEvent;

}); //define
