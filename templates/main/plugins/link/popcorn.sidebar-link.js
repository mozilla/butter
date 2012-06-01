// PLUGIN: Text

(function ( Popcorn ) {

  /**
   * Text Popcorn plug-in
   *
   * Places text in an element on the page.  Plugin options include:
   * Options parameter will need a start, end.
   *   Start: Is the time that you want this plug-in to execute
   *   End: Is the time that you want this plug-in to stop executing
   *   Text: Is the text that you want to appear in the target
   *   Escape: {true|false} Whether to escape the text (e.g., html strings)
   *   Multiline: {true|false} Whether newlines should be turned into <br>s
   *   Target: Is the ID of the element where the text should be placed. An empty target
   *           will be placed on top of the media element
   *
   * @param {Object} options
   *
   * Example:
   *  var p = Popcorn('#video')
   *
   *    // Simple text
   *    .text({
   *      start: 5, // seconds
   *      end: 15, // seconds
   *      text: 'This video made exclusively for drumbeat.org',
   *      target: 'textdiv'
   *     })
   *
   *    // HTML text, rendered as HTML
   *    .text({
   *      start: 15, // seconds
   *      end: 20, // seconds
   *      text: '<p>This video made <em>exclusively</em> for drumbeat.org</p>',
   *      target: 'textdiv'
   *    })
   *
   *    // HTML text, escaped and rendered as plain text
   *    .text({
   *      start: 20, // seconds
   *      end: 25, // seconds
   *      text: 'This is an HTML p element: <p>paragraph</p>',
   *      escape: true,
   *      target: 'textdiv'
   *    })
   *
   *    // Multi-Line HTML text, escaped and rendered as plain text
   *    .text({
   *      start: 25, // seconds
   *      end: 30, // seconds
   *      text: 'This is an HTML p element: <p>paragraph</p>\nThis is an HTML b element: <b>bold</b>',
   *      escape: true,
   *      multiline: true,
   *      target: 'textdiv'
   *    });
   *
   *    // Subtitle text
   *    .text({
   *      start: 30, // seconds
   *      end: 40, // seconds
   *      text: 'This will be overlayed on the video',
   *     })
   **/

  /**
   * HTML escape code from mustache.js, used under MIT Licence
   * https://github.com/janl/mustache.js/blob/master/mustache.js
   **/
  var escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHTML( string, multiline ) {
    return String( string ).replace( /&(?!\w+;)|[<>"']/g, function ( s ) {
      return escapeMap[ s ] || s;
    });
  }

  function newlineToBreak( string ) {
    // Deal with both \r\n and \n
    return string.replace( /\r?\n/gm, "<br>" );
  }


  Popcorn.plugin( "sidebar-link", {

    manifest: {
      about: {
        name: "Popcorn Sidebar Link Plugin",
        version: "0.1",
        author: "@k88hudson"
      },
      options: {
        start: {
          elem: "input",
          type: "text",
          label: "In",
          hidden: true
        },
        end: {
          elem: "input",
          type: "text",
          label: "Out",
          hidden: true
        },
        text: {
          elem: "input",
          type: "text",
          label: "Text",
          "default": "Popcorn.js"
        },
        timecode: {
          elem: "input",
          type: "number",
          label: "Timecode for link (in s)"
        },
        target: {
          elem: "select",
          options: ["now-playing-links"],
          "default": "now-playing-links"
        }
      }
    },

    _setup: function( options ) {

      var target,
          text,
          container = options._container = document.createElement( "a" );

      container.style.display = "none  ";

      target = document.getElementById( options.target );

      // cache reference to actual target container
      options._target = target;
      text = options.text;

      container.href = "#" + options.timecode || "";
      container.innerHTML = text || "";
      container.className = "btn btn-full-width btn-red";

      target.appendChild( container );

    },

    /**
     * @member text
     * The start function will be executed when the currentTime
     * of the video  reaches the start time provided by the
     * options variable
     */
    start: function( event, options ) {
      options._container.style.display = "block";
    },

    /**
     * @member text
     * The end function will be executed when the currentTime
     * of the video  reaches the end time provided by the
     * options variable
     */
    end: function( event, options ) {
      options._container.style.display = "none";
    },

    _teardown: function( options ) {
      var target = options._target;
      if ( target ) {
        target.removeChild( options._container );
      }
    }
  });
})( Popcorn );
