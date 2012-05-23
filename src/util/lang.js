/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [], function(){

  /*************************************************************************/
  // Support createContextualFragment when missing (IE9)
  if ( 'Range' in window &&
       !Range.prototype.createContextualFragment ) {

    // Implementation used under MIT License, http://code.google.com/p/rangy/
    // Copyright (c) 2010 Tim Down

    // Implementation as per HTML parsing spec, trusting in the browser's
    // implementation of innerHTML. See discussion and base code for this
    // implementation at issue 67. Spec:
    // http://html5.org/specs/dom-parsing.html#extensions-to-the-range-interface
    // Thanks to Aleks Williams.

    var dom = {
      getDocument: function getDocument( node ) {
        if ( node.nodeType === 9 ) {
          return node;
        } else if ( typeof node.ownerDocument !== "undefined" ) {
          return node.ownerDocument;
        } else if ( typeof node.document !== "undefined" ) {
          return node.document;
        } else if ( node.parentNode ) {
          return this.getDocument( node.parentNode );
        } else {
          throw "No document found for node.";
        }
      },

      isCharacterDataNode: function( node ) {
        var t = node.nodeType;
        // Text, CDataSection or Comment
        return t === 3 || t === 4 || t === 8;
      },

      parentElement: function( node ) {
        var parent = node.parentNode;
        return parent.nodeType === 1 ? parent : null;
      },

      isHtmlNamespace: function( node ) {
        // Opera 11 puts HTML elements in the null namespace,
        // it seems, and IE 7 has undefined namespaceURI
        var ns;
        return typeof node.namespaceURI === "undefined" ||
               ( ( ns = node.namespaceURI ) === null ||
                 ns === "http://www.w3.org/1999/xhtml" );
      },

      fragmentFromNodeChildren: function( node ) {
        var fragment = this.getDocument( node ).createDocumentFragment(), child;
        while ( !!( child = node.firstChild ) ) {
          fragment.appendChild(child);
        }
        return fragment;
      }
    };

    Range.prototype.createContextualFragment = function( fragmentStr ) {
      // "Let node the context object's start's node."
      var node = this.startContainer,
        doc = dom.getDocument(node);

      // "If the context object's start's node is null, raise an INVALID_STATE_ERR
      // exception and abort these steps."
      if (!node) {
        throw new DOMException( "INVALID_STATE_ERR" );
      }

      // "Let element be as follows, depending on node's interface:"
      // Document, Document Fragment: null
      var el = null;

      // "Element: node"
      if ( node.nodeType === 1 ) {
        el = node;

      // "Text, Comment: node's parentElement"
      } else if ( dom.isCharacterDataNode( node ) ) {
        el = dom.parentElement( node );
      }

      // "If either element is null or element's ownerDocument is an HTML document
      // and element's local name is "html" and element's namespace is the HTML
      // namespace"
      if ( el === null ||
           ( el.nodeName === "HTML" &&
             dom.isHtmlNamespace( dom.getDocument( el ).documentElement ) &&
             dom.isHtmlNamespace( el )
           )
         ) {
        // "let element be a new Element with "body" as its local name and the HTML
        // namespace as its namespace.""
        el = doc.createElement( "body" );
      } else {
        el = el.cloneNode( false );
      }

      // "If the node's document is an HTML document: Invoke the HTML fragment parsing algorithm."
      // "If the node's document is an XML document: Invoke the XML fragment parsing algorithm."
      // "In either case, the algorithm must be invoked with fragment as the input
      // and element as the context element."
      el.innerHTML = fragmentStr;

      // "If this raises an exception, then abort these steps. Otherwise, let new
      // children be the nodes returned."

      // "Let fragment be a new DocumentFragment."
      // "Append all new children to fragment."
      // "Return fragment."
      return dom.fragmentFromNodeChildren( el );
    };
  }
  /*************************************************************************/

  /***************************************************************************
   * Cross-browser full element.classList implementation for IE9 and friends.
   * 2011-06-15
   *
   * By Eli Grey, http://eligrey.com
   * Public Domain.
   * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
   */
  /*global self, document, DOMException */
  /*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/
  if (typeof document !== "undefined" && !("classList" in document.createElement("a"))) {
    (function (view) {
      "use strict";

      var classListProp = "classList",
        protoProp = "prototype",
        elemCtrProto = (view.HTMLElement || view.Element)[protoProp],
        objCtr = Object,
        strTrim = String[protoProp].trim || function () {
          return this.replace(/^\s+|\s+$/g, "");
        },
        arrIndexOf = Array[protoProp].indexOf || function (item) {
          var i = 0,
            len = this.length;
          for (; i < len; i++) {
            if (i in this && this[i] === item) {
              return i;
            }
          }
          return -1;
        },
        // Vendors: please allow content code to instantiate DOMExceptions
        DOMEx = function (type, message) {
          this.name = type;
          this.code = DOMException[type];
          this.message = message;
        },
        checkTokenAndGetIndex = function (classList, token) {
          if (token === "") {
            throw new DOMEx("SYNTAX_ERR", "An invalid or illegal string was specified");
          }
          if (/\s/.test(token)) {
            throw new DOMEx("INVALID_CHARACTER_ERR", "String contains an invalid character");
          }
          return arrIndexOf.call(classList, token);
        },
        ClassList = function (elem) {
          var trimmedClasses = strTrim.call(elem.className),
            classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
            i = 0,
            len = classes.length;
          for (; i < len; i++) {
            this.push(classes[i]);
          }
          this._updateClassName = function () {
            elem.className = this.toString();
          };
        },
        classListProto = ClassList[protoProp] = [],
        classListGetter = function () {
          return new ClassList(this);
        };

      // Most DOMException implementations don't allow calling DOMException's toString()
      // on non-DOMExceptions. Error's toString() is sufficient here.
      DOMEx[protoProp] = Error[protoProp];
      classListProto.item = function (i) {
        return this[i] || null;
      };
      classListProto.contains = function (token) {
        token += "";
        return checkTokenAndGetIndex(this, token) !== -1;
      };
      classListProto.add = function (token) {
        token += "";
        if (checkTokenAndGetIndex(this, token) === -1) {
          this.push(token);
          this._updateClassName();
        }
      };
      classListProto.remove = function (token) {
        token += "";
        var index = checkTokenAndGetIndex(this, token);
        if (index !== -1) {
          this.splice(index, 1);
          this._updateClassName();
        }
      };
      classListProto.toggle = function (token) {
        token += "";
        if (checkTokenAndGetIndex(this, token) === -1) {
          this.add(token);
        } else {
          this.remove(token);
        }
      };
      classListProto.toString = function () {
        return this.join(" ");
      };

      if (objCtr.defineProperty) {
        var classListPropDesc = {
          get: classListGetter,
          enumerable: true,
          configurable: true
        };
        try {
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) { // IE 8 doesn't support enumerable:true
          if (ex.number === -0x7FF5EC54) {
            classListPropDesc.enumerable = false;
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
          }
        }
      } else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, classListGetter);
      }
    }(self));
  }
  /***************************************************************************/

  return {

    extend: function ( obj /* , extra arguments ... */) {
      var dest = obj, src = [].slice.call( arguments, 1 );
      src.forEach( function( copy ) {
        for( var prop in copy ){
          if( copy.hasOwnProperty( prop ) ){
            dest[ prop ] = copy[ prop ];
          }
        }
      });
    }, //extend

    // Convert an SMPTE timestamp to seconds
    smpteToSeconds: function( smpte ){
      var t = smpte.split( ":" );
      if( t.length === 1 ){
        return parseFloat( t[ 0 ], 10 );
      }
      if( t.length === 2 ){
        return parseFloat( t[ 0 ], 10 ) + parseFloat( t[ 1 ] / 12, 10 );
      }
      if( t.length === 3 ){
        return parseInt( t[ 0 ] * 60, 10 ) + parseFloat( t[ 1 ], 10 ) + parseFloat( t[ 2 ] / 12, 10 );
      }
      if( t.length === 4 ){
        return parseInt( t[ 0 ] * 3600, 10 ) + parseInt( t[ 1 ] * 60, 10 ) + parseFloat( t[ 2 ], 10 ) + parseFloat( t[ 3 ] / 12, 10 );
      }
    }, //smpteToSeconds

    secondsToSMPTE: function( time ){
      var timeStamp = new Date( 1970,0,1 ),
          seconds;
      timeStamp.setSeconds( time );
      seconds = timeStamp.toTimeString().substr( 0, 8 );
      if( seconds > 86399 ){
        seconds = Math.floor( (timeStamp - Date.parse("1/1/70") ) / 3600000) + seconds.substr(2);
      }
      return seconds;
    }, //secondsToSMPTE

    clone: function( obj ) {
      var newObj = {};
      for ( var prop in obj ) {
        if ( obj.hasOwnProperty( prop ) ) {
          newObj[ prop ] = obj[ prop ];
        } //if
      } //for
      return newObj;
    },

    // Fill in a given object with default properties.  Based on underscore (MIT License).
    // https://github.com/documentcloud/underscore/blob/master/underscore.js
    defaults: function( obj, source ){
      for( var prop in source ){
        if( obj[ prop ] === undefined ){
          obj[ prop ] = source[ prop ];
        }
      }
      return obj;
    },

    domFragment: function( inputString ) {
      var range = document.createRange(),
          fragment;
      range.selectNode( document.body.firstChild );
      fragment = range.createContextualFragment( inputString );

      if( fragment.childNodes.length === 1 ){
        var child = fragment.firstChild;
        fragment.removeChild( child );
        return child;
      }

      return fragment;
    }

  };

});
