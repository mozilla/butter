/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

"use strict";

define( [ "util/xhr", "util/uri" ],
  function( XHR, URI ) {

  var REGEX_MAP = {
    youtube: /(?:https?:\/\/www\.|https?:\/\/|www\.|\.|^)youtu/,
    vimeo: /https?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/,
    soundcloud: /(?:https?:\/\/www\.|https?:\/\/|www\.|\.|^)(soundcloud)/
  };

  return {
    checkUrl: function( url ) {
      for ( var type in REGEX_MAP ) {
        if ( REGEX_MAP.hasOwnProperty( type ) ) {
          if ( REGEX_MAP[ type ].test( url ) ) {
            return type;
          }
        }
      }
      return "html5";
    },
    getMetaData: function( baseUrl, callback, type ) {
      var id,
          parsedUri,
          splitUriDirectory,
          xhrURL,
          testEl;

      type = type || this.checkUrl( baseUrl );
      callback = callback || function(){};

      if ( type === "youtube" ) {
        parsedUri = URI.parse( baseUrl );
        // youtube id can either be a query under v, example:
        // http://www.youtube.com/watch?v=p_7Qi3mprKQ
        // Or at the end of the url like this:
        // http://youtu.be/p_7Qi3mprKQ
        id = parsedUri.queryKey.v || parsedUri.directory.replace( "/", "" );
        if ( !id ) {
          return;
        }

        xhrURL = "https://gdata.youtube.com/feeds/api/videos/" + id + "?v=2&alt=jsonc&callback=?";
        Popcorn.getJSONP( xhrURL, function( resp ) {
          var respData = resp.data;
          if ( !respData ) {
            return;
          }
          callback({
            source: "http://www.youtube.com/watch?v=" + id,
            title: respData.title,
            type: type,
            thumbnail: respData.thumbnail.hqDefault,
            author: respData.uploader,
            duration: respData.duration,
            // This informs the plugin that embed is not allowed.
            // The plugin's action of what to do with this is up to the plugin.
            denied: respData.accessControl.embed === "denied"
          });
        });
      } else if ( type === "soundcloud" ) {
        parsedUri = URI.parse( baseUrl );
        splitUriDirectory = parsedUri.directory.split( "/" );
        id = splitUriDirectory[ splitUriDirectory.length - 1 ];
        xhrURL = "http://api.soundcloud.com/tracks/" + id + ".json?callback=?&client_id=PRaNFlda6Bhf5utPjUsptg";
        Popcorn.getJSONP( xhrURL, function( respData ) {
          var denied;
          if ( !respData ) {
            return;
          }

          if ( respData.sharing === "private" || respData.embeddable_by === "none" ) {
            // This informs the plugin that embed is not allowed.
            // The plugin's action of what to do with this is up to the plugin.
            denied = true;
          }
          callback({
            source: baseUrl,
            denied: denied,
            type: type,
            thumbnail: respData.artwork_url,
            duration: respData.duration / 1000,
            title: respData.title,
            hidden: true
          });
        });
      } else if ( type === "vimeo" ) {
        parsedUri = URI.parse( baseUrl );
        splitUriDirectory = parsedUri.directory.split( "/" );
        id = splitUriDirectory[ splitUriDirectory.length - 1 ];
        xhrURL = "http://vimeo.com/api/v2/video/" + id + ".json?callback=?";
        Popcorn.getJSONP( xhrURL, function( respData ) {
          respData = respData && respData[ 0 ];
          if ( !respData ) {
            return;
          }
          callback({
            source: baseUrl,
            type: type,
            thumbnail: respData.thumbnail_small,
            duration: respData.duration,
            title: respData.title
          });
        });
      } else if ( type === "html5" ) {
        testEl = document.createElement( "video" );
        testEl.addEventListener( "loadedmetadata", function() {
          callback ({
            source: baseUrl,
            type: type,
            title: baseUrl.substring( baseUrl.lastIndexOf( "/" ) + 1 ),
            thumbnail: testEl,
            duration: testEl.duration
          });
        }, false );
        testEl.src = URI.makeUnique( baseUrl ).toString();
      }
    }
  };
});
