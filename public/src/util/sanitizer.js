/**
 * The sanitizer is a client-side text sanitizer, which takes
 * user-generated text content and checks it for whether or not
 * it generates illegal DOM nodes, if injected into a page.
 * Any such nodes are stripped out.
 */
define( [], function() {

  // use an offscreen document, to prevent autoloading of HTML elements
  var offscreenDocument = document.implementation.createHTMLDocument(""),
      unpackDiv = offscreenDocument.createElement("div");

  var Sanitizer = {
      reconstituteHTML: function reconstituteHTML( htmlString ) {
        var cleaned = false;
        // We may have to clean several times due to multiply
        // escaped HTML entities (&amp;#60;, for instance, which
        // resolves to &#60;, which is actually <).
        while ( !cleaned ) {
          cleaned = true;
          // assign as HTML, resolving any HTML entities present.
          unpackDiv.innerHTML = htmlString;
          // strip any non-text DOM nodes that this introduces.
          var children = unpackDiv.childNodes, i;
          for ( i = children.length - 1; i >= 0; i-- ) {
            if ( children[ i ].nodeType !== 3 ) {
              unpackDiv.removeChild( children[ i ] );
              cleaned = false;
            }
          }
          if ( htmlString !== unpackDiv.textContent ) {
            htmlString = unpackDiv.textContent;
            cleaned = false;
          }
        }
        // return the cleaned, resolved text string
        return htmlString;
      }
  };

  return Sanitizer;

});
