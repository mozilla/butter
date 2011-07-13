(function (window, document, undefined, Butter) {

  var popcorn, trackEvents,
    urlRegex, videoURL,
    layout, DOMDB,
    iframe, popcornString,
    butterIds;

  Butter.registerModule( "previewer", {

    // setup function used to set default values
    setup: function() {
      
      urlRegex = /(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu|vimeo|soundcloud|baseplayer)/;
      layout = "../../../layout.html";
      DOMDB = { target: [], media: [] };
      butterIds = {};
    }, // setup

    extend: {

      // build function used setup iframe and start DOM scraping
      build: function( target, callback ) {
        
        var that = this,
            targetSrc = document.getElementById( target );

        // check if target is a div or iframe
        if ( targetSrc.tagName === "DIV" ) {

          target = document.getElementById( target );

          // force iframe to fill parent and set source
          iframe = document.createElement( "IFRAME" );
          iframe.src = layout;
          iframe.width = target.style.width;
          iframe.height = target.style.height;

          target.appendChild( iframe );

          // begin scraping once iframe has loaded, remove listener when complete
          iframe.addEventListener( "load", function (e) {
            that.scraper( iframe, callback );
            this.removeEventListener( "load", arguments.callee, false );
          }, false);

        } else if ( targetSrc.tagName === "IFRAME" ) {

          iframe = targetSrc;
          targetSrc.addEventListener( "load", function (e) {
            that.scraper( targetSrc, callback );
            this.removeEventListener( "load", arguments.callee, false );
          }, false);
        } // else
      }, // build

      // getDOMDB helper function, just returns the DOMDB
      getDOMDB: function() {
        return DOMDB;
      }, // getDOMDB

      // scraper function that scrapes all DOM elements of the given layout,
      // only scrapes elements with the butter-data attribute
      scraper: function( iframe, callback ) {

        // obtain a reference to the iframes body
        var body = iframe.contentWindow.document.getElementsByTagName( "BODY" );

        // function to ensure body is actually there
        var ensureLoaded = function() {

          if ( body.length < 1 ) {
            setTimeout( function() {
              ensureLoaded();
            }, 5 );      
          } else {

            // begin scraping once body is actually there, call callback once done
            ok( body[ 0 ].children );
            callback();
          } // else
        } // ensureLoaded

        ensureLoaded();

        // scraping is done here
        function ok( children ) {

          // loop for every child of the body
          for( var i = 0; i < children.length; i++ ) {
                        
            // this is highlighting stuff, needs some work
            children[ i ].addEventListener( "mouseover", function ( e ) {
              this.oldColor = this.style.backgroundColor;
              this.style.backgroundColor = "#EEB4B4";
            }, false );

            // more highlighting
            children[ i ].addEventListener( "mouseout", function ( e ) {
              this.style.backgroundColor = this.oldColor;
            }, false );
            
            // if DOM element has an data-butter tag that is equal to target or media,
            // add it to their repsective arrays in the DOMDB
            if( children[ i ].getAttribute( "data-butter" ) === "target" ) {
              DOMDB.target.push( children[ i ].id );
            } else if( children[ i ].getAttribute( "data-butter" ) === "media" ) {
              DOMDB.media.push( children[ i ].id );
            } // else

            // ensure we get every child, search recursively
            if ( children[ i ].children.length > 0 ) {

              ok ( children[ i ].children );
            } // if
          } // for
        } // ok

      }, // scraper

      // buildPopcorn function, builds an instance of popcorn in the iframe and also
      // a local version of popcorn
      buildPopcorn: function( videoTarget ) {
        
        console.log(this.getCurrentMedia());
        videoURL = this.getCurrentMedia().getMedia();
        console.log(videoURL);
        
        // create a string that will create an instance of popcorn with the proper video source
        popcornString = "document.addEventListener('DOMContentLoaded', function () {\n";        

        var regexResult = urlRegex.exec( videoURL ) || "",
            players = [];

        players[ "youtu" ] = function() {
          console.log("HERE");
          popcornString += "popcorn = Popcorn( Popcorn.youtube( '" + videoTarget + "', '" +
            videoURL + "', {\n" + 
            "width: 430, height: 300\n" + 
          "} ) );\n";
        };

        players[ "vimeo " ] = function() {
          popcornString += "popcorn = Popcorn( Popcorn.vimeo( '" + videoTarget + "', '" +
          videoURL + "', {\n" +
            "css: {\n" +
              "width: '430px',\n" +
              "height: '300px'\n" +
            "}\n" +
          "} ) );\n";
        };

        players[ "soundcloud" ] = function() {
          popcornString += "popcorn = Popcorn( Popcorn.soundcloud( '" + videoTarget + "'," +
          " '" + videoURL + "' ) );\n";
        };

        players[ "baseplayer" ] = function() {
          popcornString += "popcorn = Popcorn( Popcorn.baseplayer( '" + videoTarget + "' ) );\n";
        };

        players[ undefined ] = function() {
          var src = document.createElement( "source" );
          src.src = videoURL;

          iframe.contentWindow.document.getElementById( videoTarget ).appendChild( src );

          var vidId = "#" + videoTarget;          

          popcornString += "popcorn = Popcorn( '" + vidId + "');\n";
        }; 

        // call certain player function depending on the regexResult
        players[ regexResult[ 1 ] ]();    

        // if for some reason the iframe is refreshed, we want the most up to date popcorn code
        // to be represented in the head of the iframe, incase someone views source
        if ( trackEvents ) {

          // loop through each track event
          for ( var k = 0; k < trackEvents.length; k++ ) {
            
            // obtain all of the options in the manifest
            var options = trackEvents[ k ]._natives.manifest.options;
            popcornString += " popcorn." + trackEvents[ k ]._natives.type + "({\n"; 

            // for each option
            for ( item in options ) {

              if ( options.hasOwnProperty( item ) ) {

                // add the data to the string so it looks like normal popcorn code
                // that someone would write
                popcornString += item + ": '" + trackEvents[ k ][ item ] + "',\n";
              } // if
            } // for

            popcornString += "});";

          }// for
        } // if
        
        popcornString += "}, false);";     

        this.fillIframe();
      },
    
      // fillIframe function used to populate the iframe with changes made by the user,
      // which is mostly managing track events added by the user
      fillIframe: function() {
        
        var popcornScript, iframeHead, iframeBody,
            that = this, doc = iframe.contentWindow.document;

        // create a script within the iframe and populate it with our popcornString
        popcornScript = doc.createElement( "script" );
        popcornScript.innerHTML = popcornString;

        doc.head.appendChild( popcornScript );
        
        // create a new head element with our new data
        iframeHead = "<head>\n<script src='http://dl.dropbox.com/u/3531958/popcorn.complete.debug.js'>" + 
          "</script>\n<script>\n" + popcornString + "</script>\n</head>\n";

        // recreate the body as well
        iframeBody =  "<body>" + doc.body.innerHTML + "</body>\n";

        // open, write our changes to the iframe, and close it
        doc.open();
        doc.write( "<html>\n" + iframeHead + iframeBody + "\n</html>" );
        doc.close();

        // listen for a trackeventadded
        this.listen( "trackeventadded", function( e ) {

          // ensure our global iframe version of popcorn is their
          var popcornReady = function( e ) {
            
            popcorn = iframe.contentWindow.popcorn;

            if ( !popcorn ) {
              setTimeout( function() {
                popcornReady( e );
              }, 10 );
            } else {

              var framePopcorn = iframe.contentWindow.popcorn;

              // add track events to our local version
              popcorn[ e.type ]( e.popcornOptions );
              
              // force a timeupdate, so new events get recognized
              framePopcorn.video.currentTime += 0.0001;

              // add track events to the iframe verison of popcorn
              framePopcorn[ e.type ]( e.popcornOptions );

              butterIds[ e.getId() ] = framePopcorn.getLastTrackEventId();
              console.log(butterIds);
              // store a reference to track events
              trackEvents = popcorn.getTrackEvents();
            } // else
          } // function

          popcornReady( e );
        } ); // listener

        this.listen( "trackeventremoved", function( e ) {
          console.log(e.getId());
          iframe.contentWindow.popcorn.removeTrackEvent( butterIds[ e.getId ] );
        } );

      } // fillIframe
    }, // exnteds
    
  });
})(window, document, undefined, Butter);
