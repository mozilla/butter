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

  /**
   * Class: TrackEvent
   *
   * Represents and governs a single popcorn event.
   *
   * @param {Object} options: Options for initialization. Can contain the properties type, name, and popcornOptions. If the popcornOptions property is specified, its contents will be used to initialize the plugin instance associated with this TrackEvent.
   */
  var TrackEvent = function ( options ) {

    options = options || {};

    var _this = this,
        _id = "TrackEvent" + __guid++,
        _name = options.name || _id,
        _logger = new Logger( _id ),
        _track,
        _type = options.type + "",
        _popcornOptions = options.popcornOptions || {
          start: 0,
          end: 1
        },
        _view = new TrackEventView( this, _type, _popcornOptions ),
        _selected = false;

    EventManagerWrapper( _this );

    _this.popcornOptions = _popcornOptions;

    if( !_type ){
      _logger.log( "Warning: " + _id + " has no type." );
    } //if

    _popcornOptions.start = _popcornOptions.start || 0;
    _popcornOptions.start = TimeUtil.roundTime( _popcornOptions.start );
    _popcornOptions.end = _popcornOptions.end || _popcornOptions.start + 1;
    _popcornOptions.end = TimeUtil.roundTime( _popcornOptions.end );

    /**
     * Member: update
     *
     * Updates the event properties and runs sanity checks on input.
     *
     * @param {Object} updateOptions: Object containing plugin-specific properties to be updated for this TrackEvent.
     * @event trackeventupdatefailed: Occurs when an update operation failed because of conflicting times or other serious property problems. As the data property on this event is a string which represents the reason for failure.
     * @event trackeventupdated: Occurs whenan update operation succeeded.
     */
    this.update = function( updateOptions ) {
      var failed = false,
          newStart = _popcornOptions.start,
          newEnd = _popcornOptions.end;

      if ( !isNaN( updateOptions.start ) ) {
        newStart = TimeUtil.roundTime( updateOptions.start );
      }
      if ( !isNaN( updateOptions.end ) ) {
        newEnd = TimeUtil.roundTime( updateOptions.end );
      }

      if ( newStart >= newEnd ){
        failed = "invalidtime";
      }
      else {
        if( _track && _track._media ){
          var media = _track._media;
          if( ( newStart > media.duration ) ||
              ( newEnd > media.duration ) ||
              ( newStart < 0 ) ) {
            failed = "invalidtime";
          }
        }
      }

      if( failed ){
        _this.dispatch( "trackeventupdatefailed", failed );
      }
      else{
        for ( var prop in updateOptions ) {
          if ( updateOptions.hasOwnProperty( prop ) ) {
            _popcornOptions[ prop ] = updateOptions[ prop ];
          } //if
        } //for
        if( newStart ){
          _popcornOptions.start = newStart;
        }
        if( newEnd ){
          _popcornOptions.end = newEnd;
        }
        _view.update( _popcornOptions );
        _this.popcornOptions = _popcornOptions;
        _this.dispatch( "trackeventupdated", _this );
      }

    }; //update

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
      _view.update( _popcornOptions );
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
      _view.update( _popcornOptions );
    }; //moveFrameRight

    _view.listen( "trackeventviewupdated", function( e ){
      _popcornOptions.start = _view.start;
      _popcornOptions.end = _view.end;
      _this.dispatch( "trackeventupdated" );
    });

    Object.defineProperties( this, {

      /**
       * Property: _track
       *
       * Specifies the track on which this TrackEvent currently sites. When set, an update occurs.
       * @malleable: Yes, but not recommended. Butter will manipulate this value automatically. Other uses may yield unexpected results.
       */
      _track: {
        enumerable: true,
        get: function(){
          return _track;
        },
        set: function( val ){
          _track = val;
          _this.update( _popcornOptions );
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
