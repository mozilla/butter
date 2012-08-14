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
  }
};

module.exports = sanitizer;
