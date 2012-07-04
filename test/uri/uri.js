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
      "http://",
      "https://",
      "http://host",
      "http://host/",
      "http://host.com",
      "http://subdomain.host.com",
      "http://host.com:81",
      "http://user@host.com",
      "http://user@host.com:81",
      "http://user:@host.com",
      "http://user:@host.com:81",
      "http://user:pass@host.com",
      "http://user:pass@host.com:81",
      "http://user:pass@host.com:81?query",
      "http://user:pass@host.com:81#anchor",
      "http://user:pass@host.com:81/",
      "http://user:pass@host.com:81/?query",
      "http://user:pass@host.com:81/#anchor",
      "http://user:pass@host.com:81/file.ext",
      "http://user:pass@host.com:81/directory",
      "http://user:pass@host.com:81/directory?query",
      "http://user:pass@host.com:81/directory#anchor",
      "http://user:pass@host.com:81/directory/",
      "http://user:pass@host.com:81/directory/?query",
      "http://user:pass@host.com:81/directory/#anchor",
      "http://user:pass@host.com:81/directory/sub.directory/",
      "http://user:pass@host.com:81/directory/sub.directory/file.ext",
      "http://user:pass@host.com:81/directory/file.ext?query",
      "http://user:pass@host.com:81/directory/file.ext?query=1&test=2",
      "http://user:pass@host.com:81/directory/file.ext?query=1#anchor",
      /* XXX: I'm removing // here, where parseUri doesn't: "//host.com" */
      "host.com",
      /* XXX: I'm removing // here, where parseUri doesn't:
       *  "//user:pass@host.com:81/direc.tory/file.ext?query=1&test=2#anchor" */
      "user:pass@host.com:81/direc.tory/file.ext?query=1&test=2#anchor",
      "/directory/sub.directory/file.ext?query=1&test=2#anchor",
      "/directory/",
      "/file.ext",
      "/?query",
      "/#anchor",
      "/",
      "?query",
      "?query=1&test=2#anchor",
      "#anchor",
      "path/to/file",
      "localhost",
      "192.168.1.1",
      "host.com",
      "host.com:81",
      "host.com:81/",
      "host.com?query",
      "host.com#anchor",
      "host.com/",
      "host.com/file.ext",
      "host.com/directory/?query",
      "host.com/directory/#anchor",
      "host.com/directory/file.ext",
      "host.com:81/direc.tory/file.ext?query=1&test=2#anchor",
      "user@host.com",
      "user@host.com:81",
      "user@host.com/",
      "user@host.com/file.ext",
      "user@host.com?query",
      "user@host.com#anchor",
      "user:pass@host.com:81/direc.tory/file.ext?query=1&test=2#anchor"
    ];

    var uniqueURLs = [
      { before: "http://host.com", after: "http://host.com?butteruid=0" },
      { before: "http://subdomain.host.com", after: "http://subdomain.host.com?butteruid=1" },
      { before: "http://host.com:81", after: "http://host.com:81?butteruid=2" },
      { before: "http://user@host.com", after: "http://user@host.com?butteruid=3" },
      { before: "http://user@host.com:81", after: "http://user@host.com:81?butteruid=4" },
      { before: "http://user:@host.com", after: "http://user:@host.com?butteruid=5" },
      { before: "http://user:@host.com:81", after: "http://user:@host.com:81?butteruid=6" },
      { before: "http://user:pass@host.com", after: "http://user:pass@host.com?butteruid=7" },
      { before: "http://user:pass@host.com:81", after: "http://user:pass@host.com:81?butteruid=8" },
      { before: "http://user:pass@host.com:81?query", after: "http://user:pass@host.com:81?query&butteruid=9" },
      { before: "http://user:pass@host.com:81#anchor", after: "http://user:pass@host.com:81?butteruid=10#anchor" },
      { before: "http://user:pass@host.com:81/", after: "http://user:pass@host.com:81/?butteruid=11" },
      { before: "http://user:pass@host.com:81/?query", after: "http://user:pass@host.com:81/?query&butteruid=12" },
      { before: "http://user:pass@host.com:81/#anchor", after: "http://user:pass@host.com:81/?butteruid=13#anchor" },
      { before: "http://user:pass@host.com:81/file.ext", after: "http://user:pass@host.com:81/file.ext?butteruid=14" },
      { before: "http://user:pass@host.com:81/directory", after: "http://user:pass@host.com:81/directory?butteruid=15" },
      { before: "http://user:pass@host.com:81/directory?query", after: "http://user:pass@host.com:81/directory?query&butteruid=16" },
      { before: "http://user:pass@host.com:81/directory#anchor", after: "http://user:pass@host.com:81/directory?butteruid=17#anchor" },
      { before: "http://user:pass@host.com:81/directory/", after: "http://user:pass@host.com:81/directory/?butteruid=18" },
      { before: "http://user:pass@host.com:81/directory/?query", after: "http://user:pass@host.com:81/directory/?query&butteruid=19" },
      { before: "http://user:pass@host.com:81/directory/#anchor", after: "http://user:pass@host.com:81/directory/?butteruid=20#anchor" },
      { before: "http://user:pass@host.com:81/directory/sub.directory/", after: "http://user:pass@host.com:81/directory/sub.directory/?butteruid=21" },
      { before: "http://user:pass@host.com:81/directory/sub.directory/file.ext", after: "http://user:pass@host.com:81/directory/sub.directory/file.ext?butteruid=22" },
      { before: "http://user:pass@host.com:81/directory/file.ext?query", after: "http://user:pass@host.com:81/directory/file.ext?query&butteruid=23" },
      { before: "http://user:pass@host.com:81/directory/file.ext?query=1&test=2", after: "http://user:pass@host.com:81/directory/file.ext?query=1&test=2&butteruid=24" },
      { before: "http://user:pass@host.com:81/directory/file.ext?query=1#anchor", after: "http://user:pass@host.com:81/directory/file.ext?query=1&butteruid=25#anchor" },
      /* XXX: I'm removing // here, where parseUri doesn't: "//host.com" */
      { before: "host.com", after: "host.com?butteruid=26" },
      /* XXX: I'm removing // here, where parseUri doesn't:
       *  "//user:pass@host.com:81/direc.tory/file.ext?query=1&test=2#anchor" */
      { before: "user:pass@host.com:81/direc.tory/file.ext?query=1&test=2#anchor", after: "user:pass@host.com:81/direc.tory/file.ext?query=1&test=2&butteruid=27#anchor" },
      { before: "/directory/sub.directory/file.ext?query=1&test=2#anchor", after: "/directory/sub.directory/file.ext?query=1&test=2&butteruid=28#anchor" },
      { before: "/directory/", after: "/directory/?butteruid=29" },
      { before: "/file.ext", after: "/file.ext?butteruid=30" },
      { before: "/?query", after: "/?query&butteruid=31" },
      { before: "/#anchor", after: "/?butteruid=32#anchor" },
      { before: "/", after: "/?butteruid=33" },
      { before: "?query", after: "?query&butteruid=34" },
      { before: "?query=1&test=2#anchor", after: "?query=1&test=2&butteruid=35#anchor" },
      { before: "#anchor", after: "?butteruid=36#anchor" },
      { before: "path/to/file", after: "path/to/file?butteruid=37" },
      { before: "localhost", after: "localhost?butteruid=38" },
      { before: "192.168.1.1", after: "192.168.1.1?butteruid=39" },
      { before: "host.com", after: "host.com?butteruid=40" },
      { before: "host.com:81", after: "host.com:81?butteruid=41" },
      { before: "host.com:81/", after: "host.com:81/?butteruid=42" },
      { before: "host.com?query", after: "host.com?query&butteruid=43" },
      { before: "host.com#anchor", after: "host.com?butteruid=44#anchor" },
      { before: "host.com/", after: "host.com/?butteruid=45" },
      { before: "host.com/file.ext", after: "host.com/file.ext?butteruid=46" },
      { before: "host.com/directory/?query", after: "host.com/directory/?query&butteruid=47" },
      { before: "host.com/directory/#anchor", after: "host.com/directory/?butteruid=48#anchor" },
      { before: "host.com/directory/file.ext", after: "host.com/directory/file.ext?butteruid=49" },
      { before: "host.com:81/direc.tory/file.ext?query=1&test=2#anchor", after: "host.com:81/direc.tory/file.ext?query=1&test=2&butteruid=50#anchor" },
      { before: "user@host.com", after: "user@host.com?butteruid=51" },
      { before: "user@host.com:81", after: "user@host.com:81?butteruid=52" },
      { before: "user@host.com/", after: "user@host.com/?butteruid=53" },
      { before: "user@host.com/file.ext", after: "user@host.com/file.ext?butteruid=54" },
      { before: "user@host.com?query", after: "user@host.com?query&butteruid=55" },
      { before: "user@host.com#anchor", after: "user@host.com?butteruid=56#anchor" },
      { before: "user:pass@host.com:81/direc.tory/file.ext?query=1&test=2#anchor", after: "user:pass@host.com:81/direc.tory/file.ext?query=1&test=2&butteruid=57#anchor" }
    ];

    test( "URI.parse().toString()", function(){
      // Make sure parsing and putting URIs back together works.
      testURLs.forEach( function( uri ){
       equal( URI.parse( uri ).toString(), uri, "URI property reconstructed" );
      });
    });

    test( "Complex URIs made unique", function(){
      URI.seed = 0;

      uniqueURLs.forEach( function( uriPair ){
       equal( URI.makeUnique( uriPair.before ).toString(), uriPair.after, "URI made unqiue properly" );
      });
    });

    test( "Multiple calls to URI.makeUnique", function(){
      URI.seed = 0;

      var uriA = "host.com:81/direc.tory/file.ext?query=1&test=2#anchor",
          uriB = "host.com:81/direc.tory/file.ext?query=1&test=2&butteruid=0#anchor",
          uriC = "host.com:81/direc.tory/file.ext?query=1&test=2&butteruid=1#anchor";

      equal( URI.makeUnique( uriA ).toString(), uriB , "Calling URI.makeUnique once works." );
      equal( URI.makeUnique( uriB ).toString(), uriC , "Calling URI.makeUnique twice works." );
    });

  });

}());
