define( [ "./util", "./template-instance" ], function( util, TemplateInstance ){

  var Template = function( element, options ) {
    options = options || {};

    var _element = element,
        _contentElement,
        _name = options.name || element.id,
        _this = this;

    util.addClass( _element, "dialog-template" );
    util.css( _element, "position", "absolute" );
    util.css( _element, "visibility", "hidden" );

    _element.parentNode.removeChild( _element );

    this.createInstance = function( content ){
      return new TemplateInstance( _element );
    }; //clone

    Object.defineProperties( this, {
      name: {
        get: function(){ return _name; }
      },
      element: {
        get: function(){ return _element; }
      }
    });

  }; //Template

  return Template;
});
