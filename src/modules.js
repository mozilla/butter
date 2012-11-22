/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define(

  [
    "editor/module",
    "timeline/module",
    "cornfield/module",
    "plugin/module"
  ],
  function(){

  var moduleList = Array.prototype.slice.apply( arguments );

  return function( Butter, butter, config, onReady ){

    var modules = [],
        loadedModules = 0,
        readyModules = 0;

    for( var i=0; i<moduleList.length; ++i ){
      var name = moduleList[ i ].__moduleName;
      butter[ name ] = new moduleList[ i ]( butter, config.value( name ), Butter );
      modules.push( butter[ name ] );
    }

    return {
      load: function( onLoaded ){
        function onModuleLoaded(){
          loadedModules++;
          if( loadedModules === modules.length ){
            onLoaded();
          }
        }

        for( var i=0; i<modules.length; ++i ){
          if( modules[ i ]._load ){
            modules[ i ]._load( onModuleLoaded );
          }
          else{
            loadedModules++;
          }
        }

        if( loadedModules === modules.length ){
          onLoaded();
        }
      },
      ready: function( onReady ){
        function onModuleReady(){
          readyModules++;
          if( readyModules === modules.length ){
            onReady();
          }
        }

        for( var i=0; i<modules.length; ++i ){
          if( modules[ i ]._start ){
            modules[ i ]._start( onModuleReady );
          }
          else{
            onModuleReady();
          }
        }
      }
    };

  };

});
