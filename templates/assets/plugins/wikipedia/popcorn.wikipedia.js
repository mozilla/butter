"use strict";

(function ( Popcorn ) {

  // shortcut
  function create( type ) {
    return document.createElement( type );
  }

  function getFragment( inputString ) {
    //grabbed from butter util methods
    var range = document.createRange(),

        // For particularly speedy loads, 'body' might not exist yet, so try to use 'head'
        container = document.body || document.head,
        fragment;

    range.selectNode( container );
    fragment = range.createContextualFragment( inputString );

    if( fragment.childNodes.length === 1 ){
      var child = fragment.firstChild;
      fragment.removeChild( child );
      return child;
    }

    return fragment;
  };

  Popcorn.plugin( "wikipedia" , {

    _setup : function( options ) {
      // declare needed variables
      // get a guid to use for the global wikicallback function
      var _text,
          _title,
          _titleDiv,
          _titleTextArea,
          _mainContentDiv,
          _contentArea,
          _toWikipedia,
          _container,
          _href,
          _guid = Popcorn.guid(),
          _manifestOpts = options._natives.manifest.options;

      options._target = Popcorn.dom.find( options.target ) || Popcorn.dom.find( _manifestOpts.target[ "default" ] );

      if ( !options._target ) {
        return;
      }

      options._container = _container = create( "div" );

      _container.classList.add( "wikipedia-inner-container" );
      _container.style.width = ( options.width || _manifestOpts.width[ "default" ] ) + "%";
      _container.style.height = ( options.height || _manifestOpts.height[ "default" ] ) + "%";
      _container.style.top = ( options.top || _manifestOpts.top[ "default" ] ) + "%";
      _container.style.left = ( options.left || _manifestOpts.left[ "default" ] ) + "%";

      _titleDiv = create( "div" );
      _titleDiv.classList.add( "wikipedia-title");

      _titleTextArea = create( "div" );
      _titleTextArea.classList.add( "wikipedia-title-text" );
      _titleTextArea.classList.add( "wikipedia-ellipsis" );

      _titleDiv.appendChild( _titleTextArea );

      _mainContentDiv = create( "div" );
      _mainContentDiv.classList.add( "wikipedia-main-content" );

      _contentArea = create( "div" );
      _contentArea.classList.add( "wikipedia-content" );

      _mainContentDiv.appendChild( _contentArea );

      _toWikipedia = create( "div" );
      _toWikipedia.classList.add( "wikipedia-to-wiki" );

      _container.appendChild( _titleDiv );
      _container.appendChild( _mainContentDiv );
      _container.appendChild( _toWikipedia );

      options._target.appendChild( _container );

      if ( !options.lang ) {
        options.lang = "en";
      }

      window[ "wikiCallback" + _guid ]  = function ( data ) {

        var responseFragment = getFragment( "<div>" + data.parse.text + "</div>" ),
            element = responseFragment.querySelector( "div > p:nth-of-type(1)" ),
            mainText = "",
            toWikiLink,
            link,
            fragNodeName;

        _titleTextArea.appendChild( getFragment( "<a href=\"" + options._link + "\" target=\"_blank\">" + data.parse.title + "</a>" ) );
        _toWikipedia.appendChild( getFragment( "<div>Read more on <a href=\"" + options._link + "\" target=\"_blank\">Wikipedia</a></div>" ) );

        // Store the Main text of the article, will leave "element" on first header element
        while ( element && element.nodeName === "P" ) {
          mainText += element.textContent + "<br />";
          element = element.nextElementSibling;
        }

        _contentArea.innerHTML = mainText;

      };

      if ( options.src ) {

        _href = "//" + options.lang + ".wikipedia.org/w/";
        _title = options.src.slice( options.src.lastIndexOf( "/" ) + 1 );
        options._link = "//" + options.lang + ".wikipedia.org/wiki/" + _title;

        // gets the mobile format, so that we don't load unwanted images when the respose is turned into a documentFragment
        Popcorn.getScript( _href + "api.php?action=parse&prop=text&redirects&page=" +
          _title + "&noimages=1&mobileformat=html&format=json&callback=wikiCallback" + _guid );
      }

      options.toString = function() {
        return options.src || options._natives.manifest.options.src[ "default" ];
      };
    },

    start: function( event, options ){
      if ( options._container ) {
        options._container.classList.add( "wikipedia-visible" );
      }
    },

    end: function( event, options ){

      if ( options._container ) {
        options._container.classList.remove( "wikipedia-visible" );
      }
    },

    _teardown: function( options ){

      if ( options._target && options._container ) {
        options._target.removeChild( options._container );
      }
    },

    manifest: {
      about:{
        name: "Popcorn Wikipedia Plugin",
        version: "0.1",
        author: "@ChrisDeCairos",
        website: "https://chrisdecairos.ca/"
      },
      options:{
        start: {
          elem: "input",
          type: "number",
          label: "Start"
        },
        end: {
          elem: "input",
          type: "number",
          label: "End"
        },
        lang: {
          elem: "input",
          type: "text",
          label: "Language",
          "default": "en",
          optional: true
        },
        src: {
          elem: "input", 
          type: "text", 
          label: "Article Link",
          "default": "London_2012_Olympics"
        },
        width: {
          elem: "input",
          type: "number",
          label: "Width",
          "default": 100
        },
        height: {
          elem: "input",
          type: "number",
          label: "Height",
          "default": 100
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          "default": 0
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          "default": 0
        },
        target: "#wikipedia-container"
      }
    },
  });

})( Popcorn );
