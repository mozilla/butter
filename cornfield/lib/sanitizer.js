var sanitizer = {
  // From https://github.com/mozilla/zamboni/blob/a4b32033/media/js/mkt/utils.js#L15
  escapeHTML: function escapeHTML( s ) {
    if ( s && typeof s === "string" ) {
      s = s.replace( /&/g, '&amp;' ).replace( />/g, '&gt;' ).replace( /</g, '&lt;' )
           .replace( /'/g, '&#39;' ).replace( /"/g, '&#34;' );
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
    s = s.replace( /&#34;/g, '"').replace( /&#39;/g, "'");
    s = s.replace( /&quot;/g, '"').replace( /&apos;/g, "'");
    s = s.replace( /&ls;/g, '<').replace( /&gt;/g, '>');
    return s;
  },
  reconstituteHTMLinJSON: function reconstituteHTML( key, value ) {
    if ( typeof value === "string") {
      return sanitizer.reconstituteHTML( value );
    }

    return value;
  }
};

module.exports = sanitizer;