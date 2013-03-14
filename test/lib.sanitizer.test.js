var test = require("tap").test;

var sanitizer = require( "../lib/sanitizer" );

test( "String sanitization", function( t ) {
  t.equal( sanitizer.escapeHTML( "hello world" ),
    "hello world",
    "no sanitization needed" );

  t.equal( sanitizer.escapeHTML( "<script>alert()</script>" ),
    "&lt;script&gt;alert()&lt;/script&gt;",
    "sanitize less than and greater than" );

  t.equal( sanitizer.escapeHTML( "bill & ted" ),
    "bill &amp; ted",
    "sanitize ampersand" );

  t.equal( sanitizer.escapeHTML( "'\"" ),
    "&#39;&#34;",
    "sanitize single and double quotes" );

  t.end();
});

test( "JSON sanitization", function( t ) {
  t.deepEqual(JSON.parse('{"hello":"world"}', sanitizer.escapeHTMLinJSON ),
    { hello: "world" },
    "no sanitization needed" );

  t.deepEqual(JSON.parse('{"test":"<script>alert()</script>"}', sanitizer.escapeHTMLinJSON ),
    { test: "&lt;script&gt;alert()&lt;/script&gt;" },
    "sanitize less than and greater than" );

  t.deepEqual(JSON.parse('{"test":"bill & ted"}', sanitizer.escapeHTMLinJSON ),
    { test: "bill &amp; ted" },
    "sanitize ampersand" );

  t.deepEqual(JSON.parse('{"test":"\'\\""}', sanitizer.escapeHTMLinJSON ),
    { test: "&#39;&#34;" },
    "sanitize single and double quotes" );

  t.deepEqual(JSON.parse('{"testing\'\\"alert()": "uh oh" }', sanitizer.escapeHTMLinJSON ),
    { "testing'\"alert()": "uh oh" },
    "key names are not sanitized" );

  t.end();
});
