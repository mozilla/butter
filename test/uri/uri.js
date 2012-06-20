/*global text,expect,ok,module,notEqual,Butter,test,window*/
(function (window, document, undefined) {

  require( [ "../src/util/uri" ], function( URI ){

    test( "URI existence" , function (){
      ok( URI, "URI exists" );
      ok( URI.parse, "URI.parse exists" );
      ok( URI.makeUnique, "URI.makeUnique exists" );
    });


    test( "URI.parse", function(){
      // See http://stevenlevithan.com/demo/parseuri/js/#resultsList
      var url = "http://usr:pwd@www.test.com:81/dir/dir.2/index.htm?q1=0&&test1&test2=value#top";
      url = URI.parse( url );

      equal( url.anchor, "top", "URI.anchor" );
      equal( url.query, "q1=0&&test1&test2=value", "URI.query" );
      equal( url.file, "index.htm", "URI.file" );
      equal( url.directory, "/dir/dir.2/", "URI.directory" );
      equal( url.path, "/dir/dir.2/index.htm", "URI.path" );
      equal( url.relative, "/dir/dir.2/index.htm?q1=0&&test1&test2=value#top", "URI.relative" );
      equal( url.port, "81", "URI.port" );
      equal( url.host, "www.test.com", "URI.host" );
      equal( url.password, "pwd", "URI.password" );
      equal( url.user, "usr", "URI.user" );
      equal( url.userInfo, "usr:pwd", "URI.userInfo" );
      equal( url.authority, "usr:pwd@www.test.com:81", "URI.authority" );
      equal( url.protocol, "http", "URI.protocol" );
      equal( url.source, "http://usr:pwd@www.test.com:81/dir/dir.2/index.htm?q1=0&&test1&test2=value#top" );
      equal( url.queryKey[ "q1" ], "0", "URL.queryKey[q1]" );
      equal( url.queryKey[ "test1" ], "", "URL.queryKey[test1]" );
      equal( url.queryKey[ "test2" ], "value", "URL.queryKey[test2]" );
    });


    test( "URI.makeUnique", function(){
      // Set a seed for testing
      URI.seed = 1;

      var url = URI.makeUnique( "http://videos-cdn.mozilla.net/serv/webmademovies/trailer.mp4" );
      equal( url.toString(), "http://videos-cdn.mozilla.net/serv/webmademovies/trailer.mp4?butteruid=1", "No query string" );

    });

    var testURLs = [
      /* I'm adding // here, where parseUri doesn't: "http://" */
      ["http://"],
      ["https://"],
      ["http://host"],
      ["http://host/"],
      ["http://host.com"],
      ["http://subdomain.host.com"],
      ["http://host.com:81"],
      ["http://user@host.com"],
      ["http://user@host.com:81"],
      ["http://user:@host.com"],
      ["http://user:@host.com:81"],
      ["http://user:pass@host.com"],
      ["http://user:pass@host.com:81"],
      ["http://user:pass@host.com:81?query"],
      ["http://user:pass@host.com:81#anchor"],
      ["http://user:pass@host.com:81/"],
      ["http://user:pass@host.com:81/?query"],
      ["http://user:pass@host.com:81/#anchor"],
      ["http://user:pass@host.com:81/file.ext"],
      ["http://user:pass@host.com:81/directory"],
      ["http://user:pass@host.com:81/directory?query"],
      ["http://user:pass@host.com:81/directory#anchor"],
      ["http://user:pass@host.com:81/directory/"],
      ["http://user:pass@host.com:81/directory/?query"],
      ["http://user:pass@host.com:81/directory/#anchor"],
      ["http://user:pass@host.com:81/directory/sub.directory/"],
      ["http://user:pass@host.com:81/directory/sub.directory/file.ext"],
      ["http://user:pass@host.com:81/directory/file.ext?query"],
      ["http://user:pass@host.com:81/directory/file.ext?query=1&test=2"],
      ["http://user:pass@host.com:81/directory/file.ext?query=1#anchor"],
      /* XXX: I'm removing // here, where parseUri doesn't: "//host.com" */
      ["host.com"],
      /* XXX: I'm removing // here, where parseUri doesn't:
       *  "//user:pass@host.com:81/direc.tory/file.ext?query=1&test=2#anchor" */
      ["user:pass@host.com:81/direc.tory/file.ext?query=1&test=2#anchor"],
      ["/directory/sub.directory/file.ext?query=1&test=2#anchor"],
      ["/directory/"],
      ["/file.ext"],
      ["/?query"],
      ["/#anchor"],
      ["/"],
      ["?query"],
      ["?query=1&test=2#anchor"],
      ["#anchor"],
      ["path/to/file"],
      ["localhost"],
      ["192.168.1.1"],
      ["host.com"],
      ["host.com:81"],
      ["host.com:81/"],
      ["host.com?query"],
      ["host.com#anchor"],
      ["host.com/"],
      ["host.com/file.ext"],
      ["host.com/directory/?query"],
      ["host.com/directory/#anchor"],
      ["host.com/directory/file.ext"],
      ["host.com:81/direc.tory/file.ext?query=1&test=2#anchor"],
      ["user@host.com"],
      ["user@host.com:81"],
      ["user@host.com/"],
      ["user@host.com/file.ext"],
      ["user@host.com?query"],
      ["user@host.com#anchor"],
      ["user:pass@host.com:81/direc.tory/file.ext?query=1&test=2#anchor"]
    ];

    test( "URI.parse().toString()", function(){
      // Make sure parsing and putting URIs back together works.
      testURLs.forEach( function( uri ){
       equal( URI.parse( uri ).toString(), uri, "URI property reconstructed" );
      });
    });

    test( "Complex URIs made unique", function(){
      URI.seed = 0;

      equal( URI.makeUnique( "host.com:81/direc.tory/file.ext?query=1&test=2#anchor" ).toString(),
             "host.com:81/direc.tory/file.ext?query=1&test=2&butteruid=0#anchor",
             "Multiple query string pairs is OK" );

      equal( URI.makeUnique( "/?query" ).toString(), "/?query&butteruid=1", "Only query string is OK" );

      equal( URI.makeUnique( "http://user:pass@host.com:81#anchor" ).toString(),
                             "http://user:pass@host.com:81?butteruid=2#anchor",
                             "No query string with anchor is OK" );

      equal( URI.makeUnique( "localhost" ).toString(), "localhost?butteruid=3", "localhost is OK" );

      equal( URI.makeUnique( "127.0.0.1" ).toString(), "127.0.0.1?butteruid=4", "127.0.0.1 is OK" );
    });

    test( "Multiple calls to URI.makeUnique", function(){
      URI.seed = 0;

      var uri = URI.parse( "host.com:81/direc.tory/file.ext?query=1&test=2#anchor" );
      equal( URI.makeUnique( uri ).toString(),
             URI.makeUnique( uri ).toString(),
             "Safe to call makeUnique more than once" );
    });

  });

}());
