/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

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

  var TrackEvent = function ( options ) {

    options = options || {};

    var _this = this,
        _id = "TrackEvent" + __guid++,
        _name = options.name || _id,
        _logger = new Logger( _id ),
        _track,
        _type = options.type + "",
        _properties = [],
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
      view: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _view;
        }
      },
      type: {
        enumerable: true,
        get: function(){
          return _type;
        }
      },
      name: {
        enumerable: true,
        get: function(){
          return _name;
        }
      },
      id: {
        enumerable: true,
        get: function(){
          return _id;
        }
      },
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
