document.addEventListener( "DOMContentLoaded", function( e ){
  
  (function( Butter ) {
    var t = new Template();
    t.name = "Test Template";
    t.config = "../config/default.conf";
    t.debug = true; //Comment out for production
    editor = new t.editor();

    t.butterInit = function( butter, media, popcorn, callback ) {
      t.log("Butter is loaded for the first time!");
      //Main edit mode button
      document.getElementById("edit-mode").addEventListener("click", function(){
        var body = document.getElementById("main");
        body.classList.contains("edit-mode") ? body.classList.remove("edit-mode") : body.classList.add("edit-mode");
      });

      //Add edit buttons to targets
      t.each( butter.targets, function( targetObj ){
        var target = targetObj.element,
            editButton = document.createElement( "button");

        editButton.className = "edit-button btn btn-icon-only";
        editButton.setAttribute("data-butter-exclude", true);
        editButton.innerHTML = 'Edit'
        target.appendChild( editButton );

        editButton.addEventListener( "click", function(e) {
          //Select the currently active popcorn event with the this button's target
          var trackEvent = t.getTrackEvents({ target: targetObj.elementID, isActive: true });
          var trackEventTarget =  t.children( target, function(el) { return (el.innerHTML === trackEvent.data.popcornOptions.text); });
          console.log("editing...", trackEvent);
          t._editing = trackEvent;
          editor.makeContentEditable( trackEventTarget );
          t.debug && console.log( t.name + ": Editing t._editing = (" + t._editing.id + ")", t._editing );  
        }, false);
        
      });

      //Before adding tracks, add editing functionality to trackevent view:
      butter.listen("trackeventadded", function(e) {
        t.debug && console.log( t.name + ": Track event added" );
        var trackEvent = e.data;

        if( trackEvent.type === "footnote" || trackEvent.type === "text" ) {
          trackEvent.view.listen("trackeventdoubleclicked", function(){
            var target = document.getElementById( trackEvent.popcornOptions.target );
            t._editing = trackEvent;
            // t.children takes an element and a function which returns an array of children for which the function returns true.
            // In this case, it selects all children (i.e. containers) of the target which match the selected track event's text
            editor.makeContentEditable( t.children( target, function(el) { return (el.innerHTML === t._editing.popcornOptions.text); }) );
            t.debug && console.log( t.name + ": Editing t._editing = (" + t._editing.id + ")", t._editing );      
          });
        }//if

      });

      //Add tracks
      var track = media.addTrack( "Track1" );
        media.addTrack( "Track" + Math.random() );
        media.addTrack( "Track" + Math.random() );

      var event = track.addTrackEvent({
        type: "text",
        popcornOptions: {
          start: 0,
          end: 3,
          text: "test",
          target: "Area1"
        }
      });

      butter.tracks[ 0 ].addTrackEvent({ 
        type: "footnote",
        popcornOptions: {
          start: 0,
          end: 2,
          text: "Robots rule",
          target: "title"
        }
      });

      butter.tracks[ 2 ].addTrackEvent({ 
        type: "footnote",
        popcornOptions: {
          start: 1,
          end: 2,
          target: "Area2"
        }
      });

      butter.tracks[ 1 ].addTrackEvent({ 
        type: "image",
        popcornOptions: {
          start: 4,
          end: 5,
          target: "Area2"
        }
      });

      // Template controls and tests
      var controls = document.getElementById( "template-controls");

      //These are some tests for different getTrackEvent selectors
      var btn1 = document.createElement( "button" );
      btn1.innerHTML = "Remove all text and footnote tracks";
      btn1.addEventListener( "click", function(){
        var text = t.getTrackEvents( { type: ["text", "footnote"] } );
        text.remove();
      }, false);

      var btn2 = document.createElement( "button" );
      btn2.innerHTML = "Change text to OMG!!!!!";
      btn2.addEventListener( "click", function(){
        var text = t.getTrackEvents( { type: ["text", "footnote"] } );
        text.update( { text: "OMG!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" } );
      }, false);

      var btn3 = document.createElement( "button" );
      btn3.innerHTML = "All track events";
      btn3.addEventListener( "click", function(){
        var allEvents = t.getTrackEvents( "all" );
        if( allEvents ) {
          t.log( "There are " + allEvents.length + " events." );
        } else {
          t.log( "There are no events" );
        }
      }, false);

      var btn4 = document.createElement( "button" );
      btn4.innerHTML = "Active popcorn events";
      btn4.addEventListener( "click", function(){
        var activeEvents = t.getTrackEvents( { isActive: true } );
        if( activeEvents ) {
          t.log( "There are " + activeEvents.length + " active events." );
        } else {
          t.log( "There are no active events" );
        }
      }, false);

      var btn5 = document.createElement( "button" );
      btn5.innerHTML = "All track events before the scrubber";
      btn5.addEventListener( "click", function(){
        var text = "The events before the scrubber are: ",
            currentTime = t.butter.currentTime,
            result = t.getTrackEvents( { before: currentTime } );
        t.each( result.data, function( trackEvent ) {
          text += trackEvent.id + " ";
        });
        t.log( text );
        
      }, false);

      controls.appendChild( btn3 );
      controls.appendChild( btn4 );
      controls.appendChild( btn5 );
      controls.appendChild( btn1 );
      controls.appendChild( btn2 );

      //Callback
      callback && callback();
    }

    t.initCallback = function(){
      t.log("Callback after init.");
      t.showTray( true );

    }

    t.butterMediaLoaded = function( butter, media, popcorn ) {
    // This function runs every time the media source changes, or a project is loaded.
      t.log("There was some new media. Sweet.");

  
    }

    t.popcornReady = function( popcorn ) {
    //This function runs once in butter AND once in exported projects.
    t.log("Popcorn stuff now.");
      
    }


    //RUN -------------------------------------

    if( Butter ) {

      Butter({
        config: t.config,
        ready: function( butter ){
          butter.media[ 0 ].onReady( function(){ console.log("foo") });
          function start() {
            t.butter = butter;

            t.butterMediaLoaded( butter, butter.media[ 0 ], butter.media[ 0 ].popcorn.popcorn );
            t.debug && console.log ( t.name + ": butterMediaLoaded" );

            t.popcornReady( butter.media[ 0 ].popcorn.popcorn );  
            t.eventWrapper( butter.media[ 0 ], "canplayall" ); //if canplay or canplayall is used, it must be removed.
          }

          t.butterInit( butter, butter.media[ 0 ], butter.media[ 0 ].popcorn.popcorn, t.initCallback );
          t.debug && console.log( t.name + ": butterInit" );

          start();
          butter.listen( "mediaready", start );
          t.debug && ( window.t = t );
          window.butter = butter;
        }
      });
    } else {
      t.popcornReady( Popcorn.instances[ 0 ] );
      t.debug && console.log( t.name + ": popcornReady" );
    }

  }(window.Butter));
}, false );
