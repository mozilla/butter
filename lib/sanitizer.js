var sanitizer = {
  // From https://github.com/mozilla/zamboni/blob/a4b32033/media/js/mkt/utils.js#L15
  escapeHTML: function escapeHTML( s ) {
    if ( s && typeof s === "string" ) {
      s = s.replace( /&/g, '&amp;' )
           .replace( />/g, '&gt;' )
           .replace( /</g, '&lt;' )
           .replace( /'/g, '&#39;' )
           .replace( /"/g, '&#34;' );
    }

    return s;
  },
  escapeHTMLinJSON: function escapeHTMLinJSON( key, value ) {
    if ( typeof value === "string" ) {
      return sanitizer.escapeHTML( value );
    }

    return value;
  },
  reconstituteHTML: function reconstituteHTML( s ) {
    return s.replace( /&#34;/g, '"' )
            .replace( /&#39;/g, "'" )
            .replace( /&quot;/g, '"' )
            .replace( /&apos;/g, "'" )
            .replace( /&lt;/g, '<' )
            .replace( /&gt;/g, '>' )
            .replace( /&amp;/g, '&' );
  },
  reconstituteHTMLinJSON: function reconstituteHTML( key, value ) {
    if ( typeof value === "string") {
      return sanitizer.reconstituteHTML( value );
    }

    return value;
  },
  compressHTMLEntities: function compressHTMLEntities( string ) {
    return string.replace( /&amp;(\w+;)/g, "&$1" );
  }
};

module.exports = sanitizer;
