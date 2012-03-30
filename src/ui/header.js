define([], function(){
  
  return function( butter ){

    var _rootElement = document.createElement( "header" );

    _rootElement.id = "butter-header";

    _rootElement.innerHTML = '\
      <div class="drop"></div><a href="#"><h1>Popcorn Maker</h1></a>\
      <div class="editor-actions">\
          <button id="new">New</button>\
          <button id="save">Save</button>\
          <button id="load">Load</button>\
          <button id="share">Share</button>\
          <button id="auth">ben@mozillafoundation.org</button> |\
          <button id="auth-out">Logout</button>\
      </div>\
    ';

    _rootElement.setAttribute( "data-butter-exclude", true );

    document.body.insertBefore( _rootElement, document.body.firstChild );

    function setup(){
      _rootElement.style.width = window.innerWidth + "px";
    }

    window.addEventListener( "resize", setup, false );
    setup();

  };

});