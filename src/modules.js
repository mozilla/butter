define(

  [
    "editor/module",
    "timeline/module",
    "cornfield/module",
    "plugin/module",
    "ui/module"
  ], 
  function(){

  var moduleList = Array.prototype.slice.apply( arguments );

  return function( butter, config ){

    var modules = [];

    for( var i=0; i<moduleList.length; ++i ){
      var name = moduleList[ i ].__moduleName;
      butter[ name ] = new moduleList[ i ]( butter, config[ name ] );
      modules.push( butter[ name ] );
    } //for

    for( var i=0; i<modules.length; ++i ){
      if( modules[ i ]._start ){
        modules[ i ]._start();
      } //if
    } //for

  };

});
