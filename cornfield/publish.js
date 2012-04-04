var jsdom = require( "jsdom" );

jsdom.env( "http://localhost/~jon/butter/test/template.html", [
  "http://code.jquery.com/jquery-1.7.2.min.js"
],
function( errors, window ) {
  var pop,
      inject;

  // If Popcorn isn't loaded in the template, inject it
  if ( !window.Popcorn ) {
    pop = window.document.createElement('script');
    pop.src = "http://cdn.popcornjs.org/code/dist/popcorn-complete.min.js";
    window.document.head.appendChild(pop);
  }

  var json = {
      "targets": [
          {
              "id": "Target0",
              "name": "Target0",
              "element": "Area1"
          },
          {
              "id": "Target1",
              "name": "Target1",
              "element": "Area2"
          }
      ],
      "media": [
          {
              "id": "Media0",
              "name": "Media0",
              "url": "http://videos-cdn.mozilla.net/serv/webmademovies/laylapop.ogv",
              "target": "main",
              "duration": 9.916666,
              "tracks": [
                  {
                      "name": "Track0",
                      "id": "Track0",
                      "trackEvents": [
                          {
                              "id": "TrackEvent0",
                              "type": "text",
                              "popcornOptions": {
                                  "start": 0,
                                  "end": 3,
                                  "text": "test",
                                  "target": "Area1"
                              },
                              "name": "TrackEvent0"
                          }
                      ]
                  },
                  {
                      "name": "Track1",
                      "id": "Track1",
                      "trackEvents": [
                          
                      ]
                  },
                  {
                      "name": "Track2",
                      "id": "Track2",
                      "trackEvents": [
                          {
                              "id": "TrackEvent1",
                              "type": "footnote",
                              "popcornOptions": {
                                  "start": 1,
                                  "end": 2,
                                  "text": "test 2",
                                  "target": "Area2"
                              },
                              "name": "TrackEvent1"
                          }
                      ]
                  }
              ]
          }
      ]
  };

  // Build the Popcorn script

  var header = "Popcorn( function() { \n\
  var p = Popcorn.smart( '#" + json.media[0].target + "', '" + json.media[0].url + "'); \n\n";

  var events = "";
  json.media[0].tracks.forEach( function( value, index, arr ) {
    value.trackEvents.forEach( function( value, index, arr ) {
      events = events + "  p." + value.type + "( \n";
      events = events + "    " + JSON.stringify( value.popcornOptions ) + "\n";
      events = events + "  ); \n";
    });
  });
  events = events + "\n";

  var footer = "}); \n";

  inject = window.document.createElement('script');
  inject.innerHTML = header + events + footer;
  window.document.head.appendChild(inject)

  // Remove jquery
  window.$('.jsdom').remove();

  console.log( "<!DOCTYPE html>" + window.$( 'html' ).html() )
});
