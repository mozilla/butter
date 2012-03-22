/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([], function(){

  var SCROLL_INTERVAL = 16,
      DEFAULT_SCROLL_AMOUNT = 10,
      SCROLL_WINDOW = 20,
      MAXIMUM_Z_INDEX = 2147483647,
      MIN_WIDTH = 15;

  var __droppables = [],
      __helpers = [];

  function __getWindowRect(){
    return {
      top: 0,
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight
    };
  }

  function __drop(){
    var success = false;
    for( var i=__droppables.length - 1; i>=0; --i ){
      var temp = __droppables[ i ].drop();
      success = success || temp;
    }
    return success;
  }

  function __drag( element, elementRect, mousePos ){
    for( var i=__droppables.length - 1; i>=0; --i ){
      __droppables[ i ].drag( element, elementRect, mousePos );
    }
  }

  function Resizable( element, options ){
    var _leftHandle = document.createElement( "div" ),
        _rightHandle = document.createElement( "div" ),
        _onStart = options.start || function(){},
        _onStop = options.stop || function(){},
        _updateInterval = -1,
        _scroll = options.scroll,
        _scrollRect,
        _elementRect;

    _leftHandle.className = "handle left-handle";
    _rightHandle.className = "handle right-handle";

    element.appendChild( _leftHandle );
    element.appendChild( _rightHandle );

    function onLeftMouseDown( e ){
      e.stopPropagation();

      var originalRect = element.getBoundingClientRect(),
          originalPosition = element.offsetLeft,
          originalWidth = element.offsetWidth,
          mouseDownPosition = e.clientX,
          mousePosition,
          mouseOffset;

      function update(){
        var diff = mousePosition - mouseDownPosition,
            newX = originalPosition + diff,
            newW = originalWidth - diff;

        if( newW < MIN_WIDTH ){
          return;
        }

        if( _scroll && _scroll.scrollLeft > 0 ){
          if( originalRect.left + diff < _scrollRect.left - SCROLL_WINDOW ){
            _scroll.scrollLeft -= DEFAULT_SCROLL_AMOUNT;
            newX -= DEFAULT_SCROLL_AMOUNT;
            newW += DEFAULT_SCROLL_AMOUNT;
            mouseDownPosition += DEFAULT_SCROLL_AMOUNT;
          }
        }

        if( newX < 0 ){
          newW += newX;
          newX = 0;
        }

        element.style.left = newX + "px";
        element.style.width = newW + "px";
        _elementRect = element.getBoundingClientRect();
      }

      function onMouseUp( e ){
        window.removeEventListener( "mousemove", onMouseMove, false );
        window.removeEventListener( "mouseup", onMouseUp, false );
        clearInterval( _updateInterval );
        _updateInterval = -1;
      }

      function onMouseMove( e ){
        mousePosition = e.clientX;
        if( _updateInterval === -1 ){
          _updateInterval = setInterval( update, SCROLL_INTERVAL );
          _onStart();
        }
      }

      _elementRect = element.getBoundingClientRect();
      mouseOffset = e.clientX - _elementRect.left;
      _scrollRect = _scroll.getBoundingClientRect();

      window.addEventListener( "mousemove", onMouseMove, false );
      window.addEventListener( "mouseup", onMouseUp, false );
    }

    function onRightMouseDown( e ){
      e.stopPropagation();

      var originalPosition = element.offsetLeft,
          originalWidth = element.offsetWidth,
          mouseDownPosition = e.clientX,
          mousePosition,
          mouseOffset;

      function update(){
        var diff = mousePosition - mouseDownPosition,
            newW = originalWidth + diff;

        if( newW < MIN_WIDTH ){
          return;
        }

        if( _scroll && _scroll.scrollLeft < _scroll.scrollWidth - _scrollRect.width ){
          if( mousePosition > _scrollRect.right + SCROLL_WINDOW ){
            _scroll.scrollLeft += DEFAULT_SCROLL_AMOUNT;
            mouseDownPosition -= DEFAULT_SCROLL_AMOUNT;
          }
        }
        
        if( newW + originalPosition > element.offsetParent.offsetWidth ){
          newW = element.offsetParent.offsetWidth - originalPosition;
        }

        element.style.width = newW + "px";
        _elementRect = element.getBoundingClientRect();
      }

      function onMouseUp( e ){
        window.removeEventListener( "mousemove", onMouseMove, false );
        window.removeEventListener( "mouseup", onMouseUp, false );
        clearInterval( _updateInterval );
        _updateInterval = -1;
      }

      function onMouseMove( e ){
        mousePosition = e.clientX;
        if( _updateInterval === -1 ){
          _updateInterval = setInterval( update, SCROLL_INTERVAL );
          _onStart();
        }
      }

      _elementRect = element.getBoundingClientRect();
      if( _scroll ){
        _scrollRect = _scroll.getBoundingClientRect();
      }
      mouseOffset = e.clientX - _elementRect.left;

      window.addEventListener( "mousemove", onMouseMove, false );
      window.addEventListener( "mouseup", onMouseUp, false );
    }

    _leftHandle.addEventListener( "mousedown", onLeftMouseDown, false );
    _rightHandle.addEventListener( "mousedown", onRightMouseDown, false );
  }

  function Helper( element, options ){
    var _image = options.image,
        _id = __helpers.length;

    __helpers[ _id ] = element;

    element.setAttribute( "draggable", true );

    element.addEventListener( "dragstart", function( e ){
      e.dataTransfer.effectAllowed = "all";
      e.dataTransfer.setData( "text", _id );
      if( _image ){
        var img = document.createElement( "img" );
        img.src = _image.src;
        e.dataTransfer.setDragImage( img, img.width / 2, img.height / 2 );
      }
    });

    element.addEventListener( "dragend", function( e ){
    });

    element.addEventListener( "drop", function( e ){
    });
  }

  function Droppable( element, options ){
    options = options || {};
    var _hoverClass = options.hoverClass,
        _onDrop = options.drop || function(){},
        _onOver = options.over || function(){},
        _onOut = options.out || function(){},
        _zIndex,
        _draggedElement;

    element.addEventListener( "drop", function( e ){
      e.stopPropagation();
      _onDrop( __helpers[ e.dataTransfer.getData( "text" ) ] );
      return false;
    }, false );

    element.addEventListener( "dragover", function( e ){
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }, false );

    element.addEventListener( "dragenter", function( e ){
      element.classList.add( _hoverClass );
      _onOver( __helpers[ e.dataTransfer.getData( "text" ) ] );
    }, false );

    element.addEventListener( "dragleave", function( e ){
      element.classList.remove( _hoverClass );
      _onOut(__helpers[ e.dataTransfer.getData( "text" ) ] );
    }, false );

    __droppables.push({
      drop: function(){
        element.classList.remove( _hoverClass );

        if( _draggedElement ){
          _onDrop( _draggedElement );
          return true;
        }
        return false;
      },
      drag: function( dragElement, dragElementRect, mousePos ){
        var rect = element.getBoundingClientRect();
        if(     mousePos[ 0 ] < rect.right 
            &&  mousePos[ 0 ] > rect.left
            &&  mousePos[ 1 ] > rect.top
            &&  mousePos[ 1 ] < rect.bottom ){

          if( !_draggedElement ){
            element.classList.add( _hoverClass );
            _draggedElement = dragElement;
            _onOver( _draggedElement );
          }
        }
        else if( _draggedElement ){
          element.classList.remove( _hoverClass );
          _onOut( _draggedElement );
          _draggedElement = null;
        }
      }
    });
  }

  function Draggable( element, options ){
    options = options || {};

    var _containment = options.containment,
        _scroll = options.scroll,
        _axis = options.axis,
        _mouseOffset,
        _mousePos,
        _elementRect,
        _scrollRect,
        _offsetParentRect,
        _containmentRect,
        _scrollAmount = options.scrollAmount || DEFAULT_SCROLL_AMOUNT,
        _oldZIndex,
        _updateInterval = -1,
        _onStart = options.start || function(){},
        _onStop = options.stop || function(){ return false; },
        _originalPosition;

    function update(){
      updatePosition();
      if( _scroll ){
        checkScroll();
      }
      checkContainment();
      __drag( element, _elementRect, _mousePos );
    }

    function updateRects(){
      _containmentRect = _containment ? _containment.getBoundingClientRect() : __getWindowRect();
      _offsetParentRect = element.offsetParent ? element.offsetParent.getBoundingClientRect() : _containmentRect;
      _scrollRect = _scroll ? _scroll.getBoundingClientRect() : _containmentRect;
      _elementRect = element.getBoundingClientRect();
    }

    function updatePosition(){
      var x = _mousePos[ 0 ] - _mouseOffset[ 0 ],
          y = _mousePos[ 1 ] - _mouseOffset[ 1 ],
          r = x + _elementRect.width,
          b = y + _elementRect.height;

      if( !_axis || _axis.indexOf( "x" ) > -1 ){
        element.style.left = ( x - _offsetParentRect.left ) + "px";
      }

      if( !_axis || _axis.indexOf( "y" ) > -1 ){
        element.style.top = ( y - _offsetParentRect.top ) + "px";
      }

      _elementRect = element.getBoundingClientRect();
    }

    function checkScroll(){
      if( _elementRect.right > _scrollRect.right + SCROLL_WINDOW ){
        _scroll.scrollLeft += _scrollAmount;
        element.style.left = element.offsetLeft + _scrollAmount + "px";
        updateRects();
      }
      else if( _elementRect.left < _scrollRect.left - SCROLL_WINDOW ){
        _scroll.scrollLeft -= _scrollAmount;
        element.style.left = element.offsetLeft - _scrollAmount + "px";
        updateRects();
      }
    }

    function onMouseDown( e ){
      if( e.which !== 1 ){
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      window.addEventListener( "mousemove", onMouseMove, false );
      window.addEventListener( "mouseup", onMouseUp, false );
    }

    function onMouseUp( e ){
      window.removeEventListener( "mousemove", onMouseMove, false );
      window.removeEventListener( "mouseup", onMouseUp, false );
      if( _updateInterval === -1 ){
        return;
      }
      element.style.zIndex = _oldZIndex;
      clearInterval( _updateInterval );
      _updateInterval = -1;
      _onStop();
      if( !__drop() ){
        element.style.left = _originalPosition[ 0 ] + "px";
        element.style.top = _originalPosition[ 1 ] + "px";
      }
    }

    function checkContainment(){
      var x = _elementRect.left,
          y = _elementRect.top,
          r = x + _elementRect.width,
          b = y + _elementRect.height;

      if( !_axis || _axis.indexOf( "y" ) > -1 ){

        if( y < _containmentRect.top ){
          y = _containmentRect.top;
        }
        else if( b > _containmentRect.bottom ){
          y = _containmentRect.bottom - _elementRect.height;
        }
        //TODO: Scrolling for Y
        element.style.top = ( y - _offsetParentRect.top ) + "px";
      }

      if( !_axis || _axis.indexOf( "x" ) > -1 ){
        if( r > _scrollRect.right + SCROLL_WINDOW ){
          x = _scrollRect.right + SCROLL_WINDOW - _elementRect.width;
          r = x + _elementRect.width;
        }
        else if( x < _scrollRect.left - SCROLL_WINDOW ){
          x = _scrollRect.left - SCROLL_WINDOW;
          r = x + _elementRect.width;
        }
        if( x < _containmentRect.left ){
          x = _containmentRect.left;
        }
        else if( r > _containmentRect.right ){
          x = _containmentRect.right - _elementRect.width;
        }
        element.style.left = ( x - _offsetParentRect.left ) + "px";
      }

      _elementRect = element.getBoundingClientRect();
    }

    function onMouseMove( e ){
      _mousePos = [ e.clientX, e.clientY ];
      if( _updateInterval === -1 ){
        _originalPosition = [ element.offsetLeft, element.offsetTop ];
        _oldZIndex = getComputedStyle( element ).getPropertyValue( "z-index" );
        element.style.zIndex = MAXIMUM_Z_INDEX;
        updateRects();
        _mousePos = [ e.clientX, e.clientY ];
        _mouseOffset = [ e.clientX - _elementRect.left, e.clientY - _elementRect.top ];
        _updateInterval = setInterval( update, SCROLL_INTERVAL );
        _onStart();
      }
    }

    element.addEventListener( "mousedown", onMouseDown, false );
  }

  return {
    draggable: Draggable,
    droppable: Droppable,
    helper: Helper,
    resizable: Resizable
  };

});