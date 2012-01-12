/*global text,expect,ok,module,notEqual,test,window*/
(function () {
  ButterTemplate( function() {
    var butterMapping = [];
    var template = new ButterTemplate.Custom({
      loadFromData: function( importData ) {
        var medias = importData.media;
        if ( medias ) {
          for ( var m=0; m<medias.length; ++m ) {
            var media = medias[ m ],
                popcorn = Popcorn( media.url );
            if ( media.tracks ) {
              for ( var t=0; t<media.tracks.length; ++t ) {
                var track = media.tracks[ t ];
                if ( track.trackEvents ) {
                  for ( var e=0; e<track.trackEvents.length; ++e ) {
                    var trackEvent = track.trackEvents[ e ];
                    popcorn[ trackEvent.type ]( trackEvent.popcornOptions );
                  } //for trackEvents
                } //if trackEvents
              } //for tracks
            } //if tracks
          } //for medias
        } //if medias
      },
      onfetchhtml: function( e ) {
        return template.link.getHTML( e.data );
      },
      onmediaremoved: function( e ) {
        template.link.removeMedia( template.link.getMedia( e.data.id ) );
      },
      onmediatimeupdate: function( e ) {
        template.link.currentMedia.popcorn.currentTime( e.data.currentTime );
      },
      onmediachanged: function( e ) {
        if ( template.link.currentMedia ) {
          template.link.removeMediaHandlers();
        }
        var currentMedia = template.link.currentMedia = template.link.getMedia( e.data.id );
        if ( currentMedia ) {
          template.link.addMediaHandlers({
            'trackeventadded': function( e ) {
              var media = template.link.currentMedia;
              media.popcorn[ e.data.type ]( e.data.popcornOptions );
              butterMapping[ e.data.id ] = media.popcorn.getLastTrackEventId();
            },
            'trackeventupdated': function( e ) {
              var media = template.link.currentMedia;
              if ( butterMapping[ e.data.id ] ) {
                media.popcorn.removeTrackEvent( butterMapping[ e.data.id ] );
              }
              media.popcorn[ e.data.type ]( e.data.popcornOptions );
              butterMapping[ e.data.id ] = media.popcorn.getLastTrackEventId();
            },
            'trackeventremoved': function( e ) {
              var media = template.link.currentMedia;
              if ( butterMapping[ e.data.id ] ) {
                media.popcorn.removeTrackEvent( butterMapping[ e.data.id ] );
              }
            },
            'play': currentMedia.play,
            'pause': currentMedia.pause,
            'mute': currentMedia.mute
          });
        }
      },
      onmediaadded: function( e ) {
        var link = template.link;
        if ( !link.getMedia( e.data.id ) ) {
          var media = new ButterTemplate.Media( e.data );
          link.addMedia( media );
          media.prepare({
            success: function( successOptions ) {
              link.setupPopcornHandlers();
              callback( media );
            },
            timeout: function() {
              link.sendTimeoutError( media );
            },
            error: function( e ) {
              link.sendLoadError( e );
            }
          });
        }
      },
      onsetup: function( options ) {
        template.link.sendImportData( options.importData );
        template.link.scrape();
      }
    }); //Custom
  }); //ButterTemplate
})();
