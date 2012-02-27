define( [ "./logger", "./eventmanager", "util/lang" ], function( Logger, EventManager, util ) {

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
        _selected = false,
        _round = function( number, numberOfDecimalPlaces ) {
          return Math.round( number * ( Math.pow( 10, numberOfDecimalPlaces ) ) ) / Math.pow( 10, numberOfDecimalPlaces );
        };

    if( !_type ){
      _logger.log( "Warning: " + _id + " has no type." );
    } //if

    _popcornOptions.start = _popcornOptions.start || 0;
    _popcornOptions.start = _round( _popcornOptions.start, NUMBER_OF_DECIMAL_PLACES );
    _popcornOptions.end = _popcornOptions.end || _popcornOptions.start + 1;
    _popcornOptions.end = _round( _popcornOptions.end, NUMBER_OF_DECIMAL_PLACES );

    this.update = function( updateOptions ) {
      var errorMessage;
      if ( updateOptions.start >= _round( butter.duration, NUMBER_OF_DECIMAL_PLACES ) ) {
        errorMessage = "The in time cannot be greater than or equal to the duration of the video, which is " + _round( butter.duration, NUMBER_OF_DECIMAL_PLACES ) + " seconds.";
        _em.dispatch( "trackeventupdatefailed", errorMessage );
        return;
      } //if
      if ( updateOptions.end > _round( butter.duration, NUMBER_OF_DECIMAL_PLACES ) ) {
        errorMessage = "The out time cannot be greater than the duration of the video, which is " + _round( butter.duration, NUMBER_OF_DECIMAL_PLACES ) + " seconds.";
        _em.dispatch( "trackeventupdatefailed", errorMessage );
        return;
      } //if

      for ( var prop in updateOptions ) {
        if ( updateOptions.hasOwnProperty( prop ) ) {
          _popcornOptions[ prop ] = updateOptions[ prop ];
        } //if
      } //for
      if ( _popcornOptions.start ) {
        _popcornOptions.start = _round( _popcornOptions.start, NUMBER_OF_DECIMAL_PLACES );
      }
      if ( _popcornOptions.end ) {
        _popcornOptions.end = _round( _popcornOptions.end, NUMBER_OF_DECIMAL_PLACES );
      }
      _em.dispatch( "trackeventupdated", _this );
    }; //update

    Object.defineProperties( this, {
      popcornOptions: {
        enumerable: true,
        get: function(){
          return util.clone( _popcornOptions );
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
            popcornOptions: util.clone( _popcornOptions ),
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
        }
      },
    }); //properties

  }; //TrackEvent

  return TrackEvent;

}); //define

