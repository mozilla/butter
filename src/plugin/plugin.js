/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "util/dragndrop" ], function( DragNDrop ){

  var PLUGIN_ELEMENT_PREFIX = "butter-plugin-";

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

  return function( id, pluginOptions ){
    pluginOptions = pluginOptions || {};

    var _id = "plugin" + id,
        _this = this,
        _name = pluginOptions.type,
        _path = pluginOptions.path,
        _manifest = {},
        _type = pluginOptions.type,
        _element,
        _helper = document.getElementById( _this.type + "-icon" ) ||
                  document.getElementById( "default-icon" );

    if( _path ) {
      var head = document.getElementsByTagName( "HEAD" )[ 0 ],
          script = document.createElement( "script" );

      script.src = _path;
      head.appendChild( script );
    } //if

    Object.defineProperties( this, {
      id: {
        enumerable: true,
        get: function() {
          return _id;
        }
      },
      name: {
        enumerable: true,
        get: function() {
          return _name;
        }
      },
      path: {
        enumerable: true,
        get: function() {
          return _path;
        }
      },
      manifest: {
        enumerable: true,
        get: function() {
          return _manifest;
        },
        set: function( manifest ) {
          _manifest = manifest;
        }
      },
      type: {
        enumerable: true,
        get: function() {
          return _type;
        }
      },
      helper: {
        enumerable: true,
        get: function(){
          return _helper;
        }
      }
    });

    this.createElement = function ( butter, pattern ) {
      var pluginElement;
      if ( !pattern ) {
        pluginElement = document.createElement( "span" );
        pluginElement.innerHTML = _this.type + " ";
      }
      else {
        var patternInstance = pattern.replace( /\$type/g, _this.type );
        var range = document.createRange();
        range.selectNode( document.body.children[ 0 ] );
        pluginElement = range.createContextualFragment( patternInstance ).childNodes[ 0 ];
      }
      pluginElement.id = PLUGIN_ELEMENT_PREFIX + _this.type;
      pluginElement.setAttribute( "data-butter-plugin-type", _this.type );
      pluginElement.setAttribute( "data-butter-draggable-type", "plugin" );
      DragNDrop.helper( pluginElement, {
        image: _helper,
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
      this.element = pluginElement;
      return pluginElement;
    }; //createElement

  };
});
