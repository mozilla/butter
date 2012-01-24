(function () {

  define(
    [ "core/logger", "core/eventmanager", "comm/comm", "previewer/basic-link", "previewer/custom-link", "previewer/media" ], 
    function( Logger, EventManager, Comm, BasicLink, CustomLink, Media ) {

    function processStartEvent( e, callback ) {
      var message = Comm.parseStartEvent( e, window );
      if ( message && message.type === "setup" ) {
        callback( message );
      } //if
    };

    function bootStrapper( e ) {
      processStartEvent( e, function ( message ) {
        window.removeEventListener( 'message', window.ButterBootstrapper, false );
        var link = new BasicLink({
          defaultMedia: message.message.defaultMedia,
          exportBaseUrl: message.message.exportBaseUrl,
          importData: message.message.importData,
          popcornUrl: message.message.popcornUrl,
        });
      });
    } //bootStrapper

    function ButterTemplate( callback ) {
      window.removeEventListener( 'message', window.ButterBootstrapper, false );
      this.Basic = ButterTemplate.Basic = BasicLink;
      this.Custom = ButterTemplate.Custom = CustomLink;
      this.Media = ButterTemplate.Media = Media;
      callback( this );
    } //ButterTemplate

    window.ButterBootstrapper = bootStrapper;
    window.addEventListener( 'message', window.ButterBootstrapper, false );

    var waiting = window.ButterTemplate.__waiting;
    window.ButterTemplate = ButterTemplate;

    if ( waiting ) {
      for ( var i=0, l=waiting.length; i<l; ++i ) {
        ButterTemplate.apply( {}, waiting[ i ] );
      } //for
      delete ButterTemplate._waiting;
    } //if

  }); //define

})();
