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
     
    return {
      manifest: {
        about:{
          name: "Popcorn Webpage Plugin",
          version: "0.1",
          author: "@annasob",
          website: "annasob.wordpress.com"
        },
        options:{
          //id     : {elem:'input', type:'text', label:'Id'},
          start  : {elem:'input', type:'text', label:'In'},
          end    : {elem:'input', type:'text', label:'Out'},
          src    : {elem:'input', type:'text', label:'Src'},
          target : 'iframe-container'
        }
      },
      _setup : function( options ) {
        
        // make an iframe 
        options._container  = document.createElement( 'iframe' ),
        options._container.setAttribute('width', "100%");
        options._container.setAttribute('height', "100%");
        //options._container.id  = options.id;

        options._container.style.display = 'none';
        // add the hidden iframe to the DON
        
        
        if (document.getElementById(options.target)) {
          document.getElementById(options.target).appendChild(options._container);
        }           
        
      },
      /**
       * @member webpage 
       * The start function will be executed when the currentTime 
       * of the video  reaches the start time provided by the 
       * options variable
       */
      start: function(event, options){
        // make the iframe visible
        
        options._container.src = options.src;
        options._container.style.display = 'inline';
      },
      /**
       * @member webpage 
       * The end function will be executed when the currentTime 
       * of the video  reaches the end time provided by the 
       * options variable
       */
      end: function(event, options){
        // make the iframe invisible
        options._container.style.display = 'none';
      }
      
    };
    
  })());

})( Popcorn );