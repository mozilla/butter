(function() {

  define( [ "core/logger", "core/eventmanager", "comm/comm", "previewer/link" ], function( Logger, EventManager, Comm, Link ) {

    function processStartEvent( e, callback ) {
      var message = Comm.parseStartEvent( e, window );
      if ( message && message.type === "setup" ) {
        callback( message );
      } //if
    };

    var CustomLink = function( options ) {
      var that = this, 
      link,
      importData;

      options = options || {};

      window.removeEventListener( 'message', window.ButterBootstrapper, false );

      function captureStartEvent( e ) {
        processStartEvent( e, function ( message ) {
          window.removeEventListener( 'message', captureStartEvent, false );
          link = new Link({
            type: "custom",
            defaultMedia: message.message.defaultMedia,
            exportBaseUrl: message.message.exportBaseUrl,
            importData: message.message.importData,
            popcornUrl: message.message.popcornUrl,
            onmediachanged: options.onmediachanged || function() {},
            onmediaadded: options.onmediaadded || function() {},
            onmediaremoved: options.onmediaremoved || function() {},
            onmediatimeupdate: options.onmediatimeupdate || function() {},
            onmediacontentchanged: options.onmediacontentchanged || function() {},
            onfetchhtml: options.onfetchhtml || function() {}
          });
          if ( options.onsetup ) {
            options.onsetup({
              importData: message.message.importData
            });
          }
        });
      } //captureStartEvent

      window.addEventListener( 'message', captureStartEvent, false );

      Object.defineProperty( this, "link", {
        get: function() {
          return link;
        }
      });

      if ( options.loadFromData ) {
        var scripts = document.getElementsByTagName( "script" );
        for ( var i=0; i<scripts.length; ++i ) {
          if ( scripts[ i ].getAttribute( "data-butter" ) === "project-data" ) {
            try {
              var text = scripts[ i ].text.replace(/^\s+|\s+$/g,"");
              if ( text.length > 0 ) {
                importData = JSON.parse( text );
                if ( importData.media ) {
                  options.loadFromData( importData );
                } //if
              }
            }
            catch( e ) {
              console.log( "Error: Couldn't load baked butter project data." );
              console.log( e );
            } //if
          } //if
        } //for
      } //if

    }; //CustomLink

    return CustomLink;
  }); //define
})();
