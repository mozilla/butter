/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/dragndrop" ], function( DragNDrop ){
	
	return function( butter ){
    var _addPopcornButton = document.createElement( "button" ),
        _parentElement = document.createElement( "div" ),
        _containerElement = document.createElement( "div" );

    _parentElement.id = "plugin-list";
    _containerElement.className = "container";

    _parentElement.appendChild( _containerElement );

    _addPopcornButton.id = "add-popcorn";
    _addPopcornButton.innerHTML = "+Popcorn";

    _addPopcornButton.addEventListener( "click", function(){
      if( butter.ui.contentState !== "add-popcorn" ){
        butter.ui.setContentState( "add-popcorn" );
        butter.ui.contentStateLocked = true;
      }
      else{
        butter.ui.contentStateLocked = false;
        butter.ui.setContentState( "timeline" );
      }
    }, false );

    butter.ui.areas[ "tools" ].addComponent( _addPopcornButton, {
      states: [ "add-popcorn" ],
      in: function(){
        _addPopcornButton.setAttribute( "disabled", true );
        _addPopcornButton.innerHTML = "Done";
        _addPopcornButton.classList.add( "add-popcorn-done" );
      },
      inComplete: function(){
        _addPopcornButton.removeAttribute( "disabled" );
      },
      out: function(){
        _addPopcornButton.setAttribute( "disabled", true );
        _addPopcornButton.innerHTML = "+Popcorn";
        _addPopcornButton.classList.remove( "add-popcorn-done" );
      },
      outComplete: function(){
        _addPopcornButton.removeAttribute( "disabled" );
      }
    });

    butter.ui.areas[ "work" ].addComponent( _parentElement, {
      states: [ "add-popcorn" ],
      in: function(){
        _parentElement.style.display = "block";
        setTimeout(function(){
          _parentElement.style.opacity = "1";
        }, 0);
      },
      out: function(){
        _parentElement.style.opacity = "0";
      },
      inComplete: function(){

      },
      outComplete: function(){
        _parentElement.style.display = "none";
      }
    });

    butter.listen( "pluginadded", function( e ){
      var element = document.createElement( "div" );
      element.innerHTML = e.data.type;

      DragNDrop.helper( element, {
        image: e.data.helper,
        start: function(){
          var targets = butter.targets,
              media = butter.currentMedia;
          media.view.blink();
          for( var i=0, l=targets.length; i<l; ++i ){
            targets[ i ].view.blink();
          }
        },
        stop: function(){
          
        }
      });

      element.setAttribute( "data-butter-plugin-type", e.data.type );
      element.setAttribute( "data-butter-draggable-type", "plugin" );
      
      _containerElement.appendChild( element );
    });

    _parentElement.style.display = "none";
    _parentElement.classList.add( "fadable" );

	};

});