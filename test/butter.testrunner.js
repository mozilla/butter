(function() {

  var TestRunner = window.TestRunner = function() {
    var id = function( name ) {
          return document.getElementById( name );
        },
        create = function( type ) {
          return document.createElement( type );
        },
        index = 0,
        testFrame = id( "test-frame" ),
        results = id( "qunit-tests" ),
        totalPass = 0,
        totalFail = 0,
        totalRun = 0,
        totalTime = 0,
        mainLi = create( "li" ),
        mainB = create( "b" ),
        results_arr = [],
        currentTest,
        testList = [],
        results_arr = [],
        userAgent = id( "qunit-userAgent" );


    if ( userAgent ) {
      userAgent.innerHTML = navigator.userAgent;
    }

    function sendGetFocus( event ) {
      if ( event.target && event.target.contentWindow ) {
        event.target.contentWindow.postMessage( "getFocus", "*" );
      }
    }

    function receiveResults( data ) {
      var message = JSON.parse( data ),
          li,
          b,
          ol,
          a,
          oneTest,
          time,
          type,
          fail = 0,
          pass = 0,
          total = 0;

      // If name is present, we know this is a testDone post, so push results into array.
      if ( message.name ) {
        results_arr.push( message )
      } else {

        // this message is a Done post, so tally up everything and build the list item
        ol = create( "ol" );
        ol.style.display = "none";

        // build inner list of results
        while( oneTest = results_arr.pop() ) {
          li = create( "li" );
          li.className = oneTest.failed ? "fail" : "pass";
          li.innerHTML = oneTest.name + " <b class='counts'>(<b class='failed'>" +
            oneTest.failed + "</b>, <b class='passed'>" +
            oneTest.passed + "</b>, " +
            oneTest.total + ")</b>";
          ol.appendChild( li );
          // set to displayed if tests failed
          if ( oneTest.failed ) {
            ol.style.display = "block";
          }
        }

        var a = create( "a" );
        a.innerHTML = "Run test in new window";
        a.href = currentTest.path;
        a.target = "_blank";

        fail = message.failed;
        pass = message.passed;
        total = message.total;
        time = message.runtime;

        type = currentTest.name + " Tests";

        mainB = create( "b" );
        mainB.innerHTML = "<span class='test-name'>" + type +
          "&nbsp;</span>completed in " +
          time + " milliseconds " + " <b class='counts'>(<b class='failed'>" +
          fail + "</b>, <b class='passed'>" +
          pass + "</b>, " + total + ")</b>";

        // set up click listener for expanding inner test list
        mainB.addEventListener( "click", function( e ) {
          var next = e.target.nextSibling.nextSibling,
              display = next.style.display;
          next.style.display = display === "none" ? "block" : "none";
        }, false );

        // build mainLi, append all children and then append to result list
        mainLi.className = fail ? "fail" : "pass";
        mainLi.removeChild( mainLi.firstChild );
        mainLi.appendChild( mainB );
        mainLi.appendChild( a );
        mainLi.appendChild( ol );

        // update running totals
        totalRun += total;
        totalFail += fail;
        totalPass += pass;
        totalTime += time;

        advance();
      }
    }

    function advance() {
      if ( ++index < testList.length ) {
        currentTest = testList[ index ];
        mainLi = create( "li" );
        mainB = create ( "b" );
        mainB.innerHTML = "Running " + currentTest.name;
        mainLi.appendChild( mainB );
        mainLi.className = "running";
        results.appendChild( mainLi );
        testFrame.onload = function() {
          testFrame.contentWindow.focus();
        }
        testFrame.src = currentTest.path;
      } else {
        // Finish test suite; display totals
        testFrame.parentNode.removeChild( testFrame );

        id( "qunit-banner" ).className = totalFail ? "qunit-fail" : "qunit-pass";

        var banner = create( "p" ),
            html = [
              'Tests completed in ',
              totalTime,
              ' milliseconds.<br/>',
              '<span class="passed">',
              totalPass,
              '</span> tests of <span class="total">',
              totalRun,
              '</span> passed, <span class="failed">',
              totalFail,
              '</span> failed.'
            ].join('');

        banner.id = "qunit-testresult";
        banner.className = "result";
        banner.innerHTML = html;
        results.parentNode.insertBefore( banner, results );
      }
    }

    this.getTests = function( loadedCallback ) {
      var xhr = new XMLHttpRequest();

      xhr.open( "GET", "../tests.conf", false );
      xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4 ) {
          var allTests = JSON.parse( xhr.responseText ),
              testGroup,
              testLinks = id( "test-links" ),
              anchor,
              anchorText,
              testName;

          for ( x in allTests ) {
            testGroup = allTests[ x ];
            for ( f in testGroup ) {
              testName = f.charAt( 0 ).toUpperCase() + f.slice( 1 );
              testList.push({
                "name": testName,
                "path": "../" + testGroup[ f ],
                "type": testGroup
              });

              anchor = document.createElement( "a" );
              anchor.target = "_blank";
              anchor.href = "../" + testGroup[ f ];
              anchorText = document.createTextNode( testName );
              anchor.appendChild( anchorText );
              testLinks.appendChild( anchor );
            }
          }
          if ( loadedCallback && typeof loadedCallback === "function" ) {
            loadedCallback();
          }
        }
      }
      xhr.send();
    }

    this.runTests = function() {
      if ( testList.length ) {
        currentTest = testList[ index ];
        mainB.innerHTML = "Running " + currentTest.name;
        mainLi.appendChild( mainB );
        mainLi.className = "running";
        results.appendChild( mainLi );

        testFrame.src = currentTest.path;
      }
    };

    // Tells the tests within the iframe to take focus
    testFrame.addEventListener( "load", sendGetFocus, false );

    // Populate the userAgent h2 with information, if available
    if ( userAgent ) {
      userAgent.innerHTML = navigator.userAgent;
    }

    // Triggers tallying of results, and advances the tests.
    window.addEventListener( "message", function( e ) {
      receiveResults( e.data );
    });
  };

  document.addEventListener( "DOMContentLoaded", function() {
    var runner = new TestRunner();
    runner.getTests(function() {
      runner.runTests();
    });
  });
}());