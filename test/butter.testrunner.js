document.addEventListener( "DOMContentLoaded", function() {
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
      currentTest = Butter_tests[ index ],
      results_arr = [],
      userAgent = id( "qunit-userAgent" );


  if ( userAgent ) {
    userAgent.innerHTML = navigator.userAgent;
  };

  window.addEventListener( "message", function( e ) {
    var message = JSON.parse( e.data ),
        li,
        b,
        ol,
        a,
        oneTest,
        time,
        title,
        type,
        fail = 0,
        pass = 0,
        total = 0;

    // If name is present, we know this is a testDone post, so push results into array.
    if ( message.name ) {
      results_arr.push( message );
      return;
    }

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

    title = currentTest.name;
    type = currentTest.type;

    mainB = create( "b" );
    mainB.innerHTML = '<span class="module-name">' + type +
      ':&nbsp;</span><span class="test-name">' +
      title + ":</span> Tests completed in " +
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

    // are there more tests?
    if ( ++index < Butter_tests.length ) {
      currentTest = Butter_tests[ index ];
      mainLi = create( "li" );
      mainB = create( "b" );
      mainB.innerHTML = "Running " + currentTest.name;
      mainLi.appendChild( mainB );
      mainLi.className = "running";
      results.appendChild( mainLi );
      testFrame.src = currentTest.path;
      testFrame.contentWindow.focus();
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
  });

  // Kickstart the tests
  mainB.innerHTML = "Running " + currentTest.name;
  mainLi.appendChild( mainB );
  mainLi.className = "running";
  results.appendChild( mainLi );

  testFrame.src = currentTest.path;
}, false );