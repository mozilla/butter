define( [ "./util" ], function( util ){

  var TemplateInstance = function( originalElement ){

    var _rootElement = originalElement.cloneNode( true ),
        _contentElement;

    var contents = _rootElement.querySelectorAll( "*[dialog-content]" );

    if( contents.length > 0 ){
      _contentElement = contents[ 0 ];
    }
    else {
      _contentElement = _rootElement;
    } //if

    util.addClass( _contentElement, "dialog-content" );

    this.insertContent = function( content ){
      _contentElement.appendChild( content );
    }; //insertContent

    this.show = function(){
      util.css( _rootElement, "visibility", "visible" );
    }; //show

    this.attach = function( parentNode ){
      parentNode.appendChild( _rootElement );
    }; //attach

    this.destroy = function(){
      _rootElement.parentNode.removeChild( _rootElement );
    }; //destroy

    Object.defineProperties( this, {
      element: {
        get: function(){
          return _rootElement;
        }
      },
      contentElement: {
        get: function(){
          return _contentElement;
        }
      }
    });
  }; //TemplateInstance

  return TemplateInstance;
});
