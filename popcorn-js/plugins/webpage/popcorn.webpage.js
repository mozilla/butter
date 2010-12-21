// PLUGIN: WEBPAGE

(function (Popcorn) {
  
  /**
   * Webpages popcorn plug-in 
   * Creates an iframe showing a website specified by the user
   * Options parameter will need a start, end, id, target and src.
   * Start is the time that you want this plug-in to execute
   * End is the time that you want this plug-in to stop executing 
   * Id is the id that you want assigned to the iframe
   * Target is the id of the document element that the iframe needs to be attached to, 
   * this target element must exist on the DOM
   * Src is the url of the website that you want the iframe to display
   *
   * @param {Object} options
   * 
   * Example:
     var p = Popcorn('#video')
        .webpage({
          id: "webpages-a", 
          start: 5, // seconds
          end: 15, // seconds
          src: 'http://www.webmademovies.org',
          target: 'webpagediv'
        } )
   *
   */
  Popcorn.plugin( "webpage" , (function(){
      
    var exists, iframe, temp;
    iframe  = document.createElement( 'iframe' ),
    iframe.setAttribute('width', "100%");
    iframe.setAttribute('height', "100%");
    
    
    return {
      manifest: {
        about:{
          name: "Popcorn Webpage Plugin",
          version: "0.1",
          author: "Anna Sobiepanek",
          website: ""
        },
        options: {
          start   : { elem:'input', type:'text', label:'In' },
          end     : { elem:'input', type:'text', label:'Out' },
          src    : { elem:'input', type:'text', label:'Url' }, 
          target  : 'image-container'
        }
      },        
      /**
       * @member webpage 
       * The start function will be executed when the currentTime 
       * of the video  reaches the start time provided by the 
       * options variable
       */
      start: function(event, options){
        temp    = document.getElementById( options.target || "webpage" );
        iframe.id  = options.id;
        iframe.src = options.src;
        temp.appendChild(iframe);
      },
      /**
       * @member webpage 
       * The end function will be executed when the currentTime 
       * of the video  reaches the end time provided by the 
       * options variable
       */
      end: function(event, options){
        temp.removeChild(iframe);
      }
      
    };
    
  })());

})( Popcorn );