define( [ "./logger", "./eventmanager", "util/lang", "util/time" ], function( Logger, EventManager, LangUtil, TimeUtil ) {

  var NUMBER_OF_DECIMAL_PLACES = 3,
      __guid = 0;

  var TrackEvent = function ( options ) {

    options = options || {};

    var _this = this,
        _id = "TrackEvent" + __guid++,
        _name = options.name || _id,
        _logger = new Logger( _id ),
        _em = new EventManager( this ),
        _track,
        _type = options.type,
        _properties = [],
        _popcornOptions = options.popcornOptions || {
          start: 0,
          end: 1
        },
        _selected = false;

    if( !_type ){
      _logger.log( "Warning: " + _id + " has no type." );
    } //if

    _popcornOptions.start = _popcornOptions.start || 0;
    _popcornOptions.start = TimeUtil.roundTime( _popcornOptions.start );
    _popcornOptions.end = _popcornOptions.end || _popcornOptions.start + 1;
    _popcornOptions.end = TimeUtil.roundTime( _popcornOptions.end );

    this.update = function( updateOptions ) {
      for ( var prop in updateOptions ) {
        if ( updateOptions.hasOwnProperty( prop ) ) {
          _popcornOptions[ prop ] = updateOptions[ prop ];
        } //if
      } //for
      if ( _popcornOptions.start ) {
        _popcornOptions.start = TimeUtil.roundTime( _popcornOptions.start );
      }
      if ( _popcornOptions.end ) {
        _popcornOptions.end = TimeUtil.roundTime( _popcornOptions.end );
      }
      _em.dispatch( "trackeventupdated", _this );
    }; //update

    Object.defineProperties( this, {
      popcornOptions: {
        enumerable: true,
        get: function(){
          return LangUtil.clone( _popcornOptions );
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
            if( _selected ){
              _em.dispatch( "trackeventselected" );
            }
            else {
              _em.dispatch( "trackeventdeselected" );
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
          _em.dispatch( "trackeventupdated", _this );
        }
      },
    }); //properties

  }; //TrackEvent

  return TrackEvent;

}); //define

