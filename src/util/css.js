define( [], function(){

  return {
    addClass: function( obj, className ){
      var classes = obj.className.split( " " );
      for( var i=0, l=classes.length; i<l; ++i ){
        if( classes[ i ] === className ){
          return;
        } //if
      } //for
      obj.className += " " + className;
    },
    removeClass: function( obj, className ){
      var classes = obj.className.split( " " );
      for( var i=classes.length; i>-1; --i ){ 
        if( classes[ i ] === className ){
          classes.splice( i, 1 );
        } //if
      } //for
      obj.className = classes.join( " " );
    },
    css: function( obj, key, value ){
      if( value ){
        obj.style[ key ] = value;
      }
      return obj.style[ key ];
    }
  }; //util

});
