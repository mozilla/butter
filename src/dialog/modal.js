define( [], function(){

  var __container;

  return function( state ){

    if( !__container ){
      __container = document.createElement( "div" );
      __container.id = "butter-modal-container";
      document.body.appendChild( __container );
    } //if

    var _element = document.createElement( "div" ),
        _this = this;

    if( state && typeof( state ) === "string" ){
      _element.setAttribute( "state", state );
    } //if

    _element.className = "layer";

    __container.appendChild( _element );

    this.destroy = function(){
      __container.removeChild( _element );
    }; //destroy

  }; //Modal

});
