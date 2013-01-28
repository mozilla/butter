/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

"use strict";

define( [ "util/xhr" ],
  function( XHR ) {

  var REGEX_MAP = {
    youtube: /(?:https?:\/\/www\.|https?:\/\/|www\.|\.|^)youtu/,
    vimeo: /https?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/,
    soundcloud: /(?:https?:\/\/www\.|https?:\/\/|www\.|\.|^)(soundcloud)/
  };

  var EXAMPLES = {
    youtube: "http://www.youtube.com/watch?v=CLg2JbELs9o",
    html5: "http://popcorn.webmadecontent.org/videos/getstarted.mp4"
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
      var data = {},
          id,
          xhrURL,
          testEl;

      type = data.type = type || this.checkUrl( baseUrl );
      callback = callback || function(){};

      if ( type === "youtube" ) {
        id = baseUrl.split( "v=" )[ 1 ].split( "&" )[ 0 ];
        xhrURL = "https://gdata.youtube.com/feeds/api/videos?q=" + id + "&v=2&alt=jsonc";
        XHR.get( xhrURL, function( resp ) {
          var raw = JSON.parse( resp.target.responseText ).data.items[ 0 ];
          data.source = "http://www.youtube.com/v=" + id;
          data.title = raw.title;
          data.thumbnail = raw.thumbnail.hqDefault;
          data.author = raw.uploader;
          data.duration = raw.duration;
          callback( data );
        });

      } else if ( type === "html5" ) {
        testEl = document.createElement( "video" );
        testEl.src = baseUrl;
        testEl.addEventListener( "canplaythrough", function( e ) {
          data.source = baseUrl;
          data.title = baseUrl.substring( baseUrl.lastIndexOf( "/" ) + 1 );
          data.thumbnail = testEl;
          data.duration = testEl.duration;
          callback ( data );
        }, false );
      }
    }
  };
});
