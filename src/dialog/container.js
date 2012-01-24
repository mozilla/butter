define( [ "./util" ], function( util ){

  var Container = function( element ) {
    var _element = element,
        _this = this;

    util.addClass( _element, "dialog-container" );

    Object.defineProperties( this, {
      element: {
        get: function(){ return _element; }
      }
    });
  }; //Container

  return Container;
});
