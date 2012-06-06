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
      __mouseDown = false,
      __selectedDraggables = [],
      __mousePos = [ 0, 0 ],
      __mouseLast = [ 0, 0 ],
      __scroll = false,
      __helpers = [];

  // for what seems like a bug in chrome. :/
  // dataTransfer.getData seems to report nothing
  var __currentDraggingElement;

  var __nullRect = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  };

  function updateTimeout(){
    __scroll = false;
    if( __mouseDown ){
      for( var i = __selectedDraggables.length - 1; i >= 0; --i ){
        __selectedDraggables[ i ].update();
      } //for
      window.setTimeout( updateTimeout, SCROLL_INTERVAL );
    } //if
  }

  function onDragged( e ){
    __mouseLast[ 0 ] = __mousePos[ 0 ];
    __mouseLast[ 1 ] = __mousePos[ 1 ];
    __mousePos = [ e.clientX, e.clientY ];

    var remembers = [],
        droppable,
        remember,
        i, j;

    if( __mouseDown ){
      for( i = __selectedDraggables.length - 1; i >= 0; --i ){
        remembers.push( __selectedDraggables[ i ] );
      } //for
    }else{
      var selectedDraggable;
      __mouseDown = true;
      window.setTimeout( updateTimeout, SCROLL_INTERVAL );

      for( i = __selectedDraggables.length - 1; i >= 0; --i ){
        selectedDraggable = __selectedDraggables[ i ];
        selectedDraggable.start( e );
        remembers.push( __selectedDraggables[ i ] );
      } //for
    } //if

    for( i = remembers.length - 1; i >= 0; --i ){
      remember = remembers[ i ];
      for( j = __droppables.length - 1; j >= 0; --j ){
        droppable = __droppables[ j ];
        if( !droppable.element.id ||
            remember.element.id === droppable.element.id ||
            !droppable.drag( remember.element.getBoundingClientRect() ) ){
          droppable.forget( remember );
        }else{
          droppable.remember( remember );
        } //if
      } //for
    } //for
  }

  function onMouseUp( e ){
    __mouseDown = false;
    window.removeEventListener( "mousemove", onDragged, false );

    var selectedDraggable;

    for( var i = __selectedDraggables.length - 1; i >= 0; --i ){
      selectedDraggable = __selectedDraggables[ i ];
      if( selectedDraggable.dragging ){
        selectedDraggable.stop();
      } //if
    } //for
  }

  function onMouseDown( e ){
    if( e.which !== 1 ){
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    window.addEventListener( "mousemove", onDragged, false );
    window.addEventListener( "mouseup", onMouseUp, false );
  }

  function getPaddingRect( element ){
    var style = getComputedStyle( element ),
          top = style.getPropertyValue( "padding-top" ),
          left = style.getPropertyValue( "padding-left" ),
          bottom = style.getPropertyValue( "padding-bottom" ),
          right = style.getPropertyValue( "padding-right" );

      return {
        top: Number(top.substring( 0, top.indexOf( "px" ) ) ),
        left: Number(left.substring( 0, left.indexOf( "px" ) ) ),
        bottom: Number(bottom.substring( 0, bottom.indexOf( "px" ) ) ),
        right: Number(right.substring( 0, right.indexOf( "px" ) ) )
      };
  }

  function __getWindowRect(){
    return {
      top: 0,
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight
    };
  }

  function checkParent ( parent, child ) {
    var parentNode = child.parentNode;
    while( parentNode ) {
      if ( parentNode === parent ) {
        return true;
      }
      parentNode = parentNode.parentNode;
    }
    return false;
  }

  function getHighestZIndex ( element ) {
    var z = getComputedStyle( element ).zIndex;
    if ( isNaN( z ) ) {
      z = 0;
      var parentNode = element.parentNode;
      while ( parentNode && [ window, document ].indexOf( parentNode ) === -1 ) {
        var style = getComputedStyle( parentNode );
        if ( style ) {
          var nextZ = style.zIndex;
          if ( isNaN( nextZ ) && nextZ > z ) {
            z = nextZ;
          }
        }
        parentNode = parentNode.parentNode;
      }
    }
    
  }

  function __sortDroppables(){
    __droppables = __droppables.sort( function ( a, b ) {

      var elementA = a.element,
          elementB = b.element,
          zA = getHighestZIndex( elementA ),
          zB = getHighestZIndex( elementB );

      if ( checkParent( elementA, elementB ) ) {
        return -1;
      }
      else if ( checkParent( elementB, elementA ) ) {
        return 1;
      }

      return zA - zB;
    });
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
        _onStop();
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
        _onStop();
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

    return {
      destroy: function(){
        _leftHandle.removeEventListener( "mousedown", onLeftMouseDown, false );
        _rightHandle.removeEventListener( "mousedown", onRightMouseDown, false );
        element.removeChild( _leftHandle );
        element.removeChild( _rightHandle );
      }
    };
  }

  function Helper( element, options ){
    var _image = options.image,
        _onStart = options.start || function(){},
        _onStop = options.stop || function(){},
        _id = __helpers.length;

    __helpers[ _id ] = element;

    element.setAttribute( "draggable", true );

    element.addEventListener( "dragstart", function( e ){
      __currentDraggingElement = element;
      e.dataTransfer.effectAllowed = "all";
      e.dataTransfer.setData( "text", _id );
      if( _image ){
        var img = document.createElement( "img" );
        img.src = _image.src;
        e.dataTransfer.setDragImage( img, img.width / 2, img.height / 2 );
      }
      _onStart();
    });

    element.addEventListener( "dragend", function( e ){
      __currentDraggingElement = null;
      _onStop();
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
        _droppable = {},
        _draggedElements = {},
        _draggedCount = 0;

    function onDrop( e ) {
      e.preventDefault();
      e.stopPropagation();

      if( _hoverClass ){
        element.classList.remove( _hoverClass );
      }
      var transferData = e.dataTransfer.getData( "text" ),
          helper = __helpers[ transferData ] || __currentDraggingElement;
      if( helper ){
        _onDrop( helper, [ e.clientX, e.clientY ] );
      }
    }

    function onDragOver( e ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    }

    function onDragEnter( e ) {
      if( _hoverClass ) {
        element.classList.add( _hoverClass );
      }
      var transferData = e.dataTransfer.getData( "text" ),
          helper = __helpers[ transferData ] || __currentDraggingElement;
      if( helper ){
        _onOver( helper, [ e.clientX, e.clientY ] );
      }
    }

    function onDragLeave( e ) {
      if ( _hoverClass ) {
        element.classList.remove( _hoverClass );
      }
      var transferData = e.dataTransfer.getData( "text" ),
          helper = __helpers[ transferData ] || __currentDraggingElement;
      if( helper ){
        _onOut( helper, [ e.clientX, e.clientY ] );
      }
    }

    element.addEventListener( "drop", onDrop, false );
    element.addEventListener( "dragover", onDragOver, false );
    element.addEventListener( "dragenter", onDragEnter, false );
    element.addEventListener( "dragleave", onDragLeave, false );

    _droppable = {
      element: element,
      remember: function( draggable ){
        if( !_draggedElements[ draggable.element.id ] && !draggable.droppable ){
          _draggedCount++;
          element.classList.add( _hoverClass );
          _draggedElements[ draggable.element.id ] = draggable;
          draggable.droppable = _droppable;
          _onOver( draggable.element );
        } //if
      },
      forget: function( draggable ){
        // we only care to forget if it is currently dragging
        if( _draggedElements[ draggable.element.id ] && draggable.droppable ){
          if( --_draggedCount === 0 ){
            element.classList.remove( _hoverClass );
          } //if
          draggable.droppable = null;
          _onOut( draggable.element );
          delete _draggedElements[ draggable.element.id ];
        } // if
      },
      drop: function( draggable ){
        if( _draggedElements[ draggable.element.id ] ){
          if( --_draggedCount === 0 ){
            element.classList.remove( _hoverClass );
          } //if
          draggable.droppable = null;
          _onDrop( draggable.element, __mousePos );
          delete _draggedElements[ draggable.element.id ];
        } //if
      },
      drag: function( dragElementRect ){
        var rect = element.getBoundingClientRect();

        var maxL = Math.max( dragElementRect.left, rect.left ),
            maxT = Math.max( dragElementRect.top, rect.top ),
            minR = Math.min( dragElementRect.right, rect.right ),
            minB = Math.min( dragElementRect.bottom, rect.bottom );

        if( minR < maxL || minB < maxT ){
          return false;
        }

        var overlapDims = [ minR - maxL, minB - maxT ];

        if( overlapDims[ 0 ] * overlapDims[ 1 ] / 2 > dragElementRect.width * dragElementRect.height / 4 ){

          return true;
        }

        return false;
      },
      destroy: function(){
        var idx = __droppables.indexOf( _droppable );
        if ( idx > -1 ) {
          __droppables.splice( idx, 1 );
        }
        element.removeEventListener( "drop", onDrop, false );
        element.removeEventListener( "dragover", onDragOver, false );
        element.removeEventListener( "dragenter", onDragEnter, false );
        element.removeEventListener( "dragleave", onDragLeave, false );
      }
    };

    __droppables.push( _droppable );
    __sortDroppables();

    return _droppable;
  }

  function Draggable( element, options ){
    options = options || {};

    var _containment = options.containment,
        _scroll = options.scroll,
        _axis = options.axis,
        _revert = options.revert,
        _mouseOffset,
        _element = element,
        _elementRect,
        _scrollRect,
        _offsetParentRect,
        _containmentRect,
        _scrollAmount = options.scrollAmount || DEFAULT_SCROLL_AMOUNT,
        _oldZIndex,
        _onStart = options.start || function(){},
        _onStop = options.stop || function(){ return false; },
        _originalPosition,
        _droppable = null,
        _draggable = {
          destroy: function(){
            element.removeEventListener( "mousedown", onMouseDown, false );
          }
        },
        _dragging = false,
        _containmentPadding = __nullRect;

    if( _containment ){
      _containmentPadding = getPaddingRect( _containment );
    }

    _draggable.updateRects = function(){
      _containmentRect = _containment ? _containment.getBoundingClientRect() : __getWindowRect();
      _offsetParentRect = element.offsetParent ? element.offsetParent.getBoundingClientRect() : _containmentRect;
      _scrollRect = _scroll ? _scroll.getBoundingClientRect() : _containmentRect;
      _elementRect = element.getBoundingClientRect();
    };

    function updatePosition(){

      var x = __mousePos[ 0 ] - _mouseOffset[ 0 ],
          y = __mousePos[ 1 ] - _mouseOffset[ 1 ];

      if( !_axis || _axis.indexOf( "x" ) > -1 ){
        element.style.left = ( x - _offsetParentRect.left ) + "px";
      }

      if( !_axis || _axis.indexOf( "y" ) > -1 ){
        element.style.top = ( y - _offsetParentRect.top ) + "px";
      }

      _elementRect = element.getBoundingClientRect();
    }

    function checkScroll(){
      if( !__scroll ){
        if( _elementRect.right > _scrollRect.right + SCROLL_WINDOW ){
          __scroll = true;
          _scroll.scrollLeft += _scrollAmount;
        }
        else if( _elementRect.left < _scrollRect.left - SCROLL_WINDOW ){
          __scroll = true;
          _scroll.scrollLeft -= _scrollAmount;
        } //if
      } //if
      _draggable.updateRects();
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
        element.style.top = ( y - _offsetParentRect.top - _containmentPadding.top ) + "px";
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
        element.style.left = ( x - _offsetParentRect.left - _containmentPadding.left ) + "px";
      }

      _elementRect = element.getBoundingClientRect();
    }

    element.addEventListener( "mousedown", onMouseDown, false );

    _draggable.update = function(){

      updatePosition();
      if( _scroll ){
        checkScroll();
      }
      checkContainment();
    };

    _draggable.start = function( e ){
      _dragging = true;
      _originalPosition = [ element.offsetLeft, element.offsetTop ];
      _draggable.updateRects();
      _mouseOffset = [ e.clientX - _elementRect.left, e.clientY - _elementRect.top ];
      _onStart();
    };

    _draggable.stop = function(){
      _dragging = false;
      _onStop();
      if( !_droppable && _revert ){
        element.style.left = _originalPosition[ 0 ] + "px";
        element.style.top = _originalPosition[ 1 ] + "px";
      } else if ( _droppable ){
        _droppable.drop( _draggable );
      } //if
    };

    Object.defineProperties( _draggable, {
      selected: {
        enumerable: true,
        get: function(){
          for( var i = __selectedDraggables.length - 1; i >= 0; --i ){
            if( __selectedDraggables[ i ].element.id === _element.id ){
              return true;
            } //if
          } //for
          return false;
        },
        set: function( val ){
          if ( val ) {
            _oldZIndex = getComputedStyle( element ).getPropertyValue( "z-index" );
            element.style.zIndex = MAXIMUM_Z_INDEX;
            __selectedDraggables.push( _draggable );
          } else {
            element.style.zIndex = _oldZIndex;
            for( var i = __selectedDraggables.length - 1; i >= 0; --i ){
              if( __selectedDraggables[ i ].element.id === _element.id ){
                __selectedDraggables.splice( i, 1 );
                return;
              } //if
            } //for
          } //if
        }
      },
      dragging: {
        enumerable: true,
        get: function(){
          return _dragging;
        }
      },
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      },
      droppable: {
        enumerable: true,
        get: function(){
          return _droppable;
        },
        set: function( val ){
          _droppable = val;
        }
      }
    });

    return _draggable;
  }

  function Sortable( parentElement, options ){

    var _onChange = options.change || function(){},
        _elements = [],
        _instance = {},
        _mouseDownPosition = 0,
        _draggingElement,
        _draggingOriginalPosition,
        _moved,
        _hoverElement,
        _placeHolder,
        _oldZIndex;


    function createPlaceholder( victim ){
      var placeholder = victim.cloneNode( false );
      placeholder.classList.add( "placeholder" );
      parentElement.replaceChild( placeholder, victim );
      return placeholder;
    }

    function positionElement( diff ){
      _draggingElement.style.top = _draggingOriginalPosition - diff + "px";
    }

    function onElementMouseMove( e ){
      if( !_moved ){
        _moved = true;
        _placeHolder = createPlaceholder( _draggingElement );
        parentElement.appendChild( _draggingElement );
        _draggingElement.style.position = "absolute";
        _draggingElement.style.zIndex = MAXIMUM_Z_INDEX;
        positionElement( 0 );
      }
      else{
        var diff = _mouseDownPosition - e.clientY;
        positionElement( diff );
        var dragElementRect = _draggingElement.getBoundingClientRect();
        for( var i=_elements.length - 1; i>=0; --i ){
          var element = _elements[ i ];

          if( element === _draggingElement ){
            continue;
          }

          var rect = element.getBoundingClientRect();

          var maxL = Math.max( dragElementRect.left, rect.left ),
              maxT = Math.max( dragElementRect.top, rect.top ),
              minR = Math.min( dragElementRect.right, rect.right ),
              minB = Math.min( dragElementRect.bottom, rect.bottom );

          if( minR < maxL || minB < maxT ){
            continue;
          }

          var overlapDims = [ minR - maxL, minB - maxT ];

          if( overlapDims[ 0 ] * overlapDims[ 1 ] / 2 > dragElementRect.width * dragElementRect.height / 4 ){
            _hoverElement = element;
            var newPlaceHolder = createPlaceholder( _hoverElement );
            parentElement.replaceChild( _hoverElement, _placeHolder );
            _placeHolder = newPlaceHolder;
            var orderedElements = [],
                childNodes = parentElement.childNodes;
            for( var j=0, l=childNodes.length; j<l; ++j ){
              var child = childNodes[ j ];
              if( child !== _draggingElement ){
                if( child !== _placeHolder ){
                  orderedElements.push( child );
                }
                else{
                  orderedElements.push( _draggingElement );
                }
              }
            }
            _onChange( orderedElements );
          }
        }
      }
    }

    function onElementMouseDown( e ){
      if( e.which !== 1 ){
        return;
      }
      _moved = false;
      _draggingElement = e.target;
      _draggingOriginalPosition = _draggingElement.offsetTop;

      var style = getComputedStyle( _draggingElement );

      _oldZIndex = style.getPropertyValue( "z-index" );
      _mouseDownPosition = e.clientY;

      window.addEventListener( "mouseup", onElementMouseUp, false );
      window.addEventListener( "mousemove", onElementMouseMove, false );
    }

    function onElementMouseUp( e ){
      _draggingElement.style.zIndex = _oldZIndex;
      window.removeEventListener( "mouseup", onElementMouseUp, false );
      window.removeEventListener( "mousemove", onElementMouseMove, false );
      _moved = false;
      if( _placeHolder ){
        _draggingElement.style.zIndex = "";
        _draggingElement.style.position = "";
        _draggingElement.style.top = "";
        parentElement.replaceChild( _draggingElement, _placeHolder );
        _placeHolder = null;
      }
    }

    _instance.addItem = function( item ){
      _elements.push( item );
      item.addEventListener( "mousedown", onElementMouseDown, false );
    };

    _instance.removeItem = function( item ){
      _elements.splice( _elements.indexOf( item ), 1 );
      item.removeEventListener( "mousedown", onElementMouseDown, false );
    };

    return _instance;
  }

  return {
    draggable: Draggable,
    droppable: Droppable,
    helper: Helper,
    resizable: Resizable,
    sortable: Sortable
  };

});

