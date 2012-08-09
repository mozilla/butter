#!/usr/bin/python

# Copyright (c) 2007-2008 Mozilla Foundation
#
# Permission is hereby granted, free of charge, to any person obtaining a 
# copy of this software and associated documentation files (the "Software"), 
# to deal in the Software without restriction, including without limitation 
# the rights to use, copy, modify, merge, publish, distribute, sublicense, 
# and/or sell copies of the Software, and to permit persons to whom the 
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in 
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
# DEALINGS IN THE SOFTWARE.

# Several "try" blocks for python2/3 differences (@secretrobotron)
try:
  import httplib
except:
  import http.client as httplib

import os
import sys
import re

try:
  import urlparse
except:
  import urllib.parse as urlparse

import string
import gzip

try:
  from BytesIO import BytesIO
except:
  from io import BytesIO

try:
  maketrans = str.maketrans
except:
  maketrans = string.maketrans

extPat = re.compile(r'^.*\.([A-Za-z]+)$')
extDict = {
  "html" : "text/html",
  "htm" : "text/html",
  "xhtml" : "application/xhtml+xml",
  "xht" : "application/xhtml+xml",
  "xml" : "application/xml",
}

argv = sys.argv[1:]

forceXml = 0
forceHtml = 0
gnu = 0
errorsOnly = 0
encoding = None
fileName = None
contentType = None
inputHandle = None
service = 'https://validator.mozillalabs.com/'

for arg in argv:
  if '--help' == arg:
    print('-h : force text/html')
    print('-x : force application/xhtml+xml')
    print('-g : GNU output')
    print('-e : errors only (no info or warnings)')
    print('--encoding=foo : declare encoding foo')
    print('--service=url  : the address of the HTML5 validator')
    print('One file argument allowed. Leave out to read from stdin.')
    sys.exit(0)
  elif arg.startswith("--encoding="):
    encoding = arg[11:]
  elif arg.startswith("--service="):
    service = arg[10:]
  elif arg.startswith("--"):
      sys.stderr.write('Unknown argument %s.\n' % arg)
      sys.exit(2)
  elif arg.startswith("-"):
    for c in arg[1:]:
      if 'x' == c:
        forceXml = 1
      elif 'h' == c:
        forceHtml = 1
      elif 'g' == c:
        gnu = 1  		
      elif 'e' == c:
        errorsOnly = 1
      else:
        sys.stderr.write('Unknown argument %s.\n' % arg)
        sys.exit(3)        		
  else:
    if fileName:
      sys.stderr.write('Cannot have more than one input file.\n')
      sys.exit(1)
    fileName = arg
    
if forceXml and forceHtml:
  sys.stderr.write('Cannot force HTML and XHTML at the same time.\n')
  sys.exit(2)
  
if forceXml:
  contentType = 'application/xhtml+xml'
elif forceHtml:
  contentType = 'text/html'
elif fileName:
  m = extPat.match(fileName)
  if m:
    ext = m.group(1)
    ext = ext.translate(maketrans(string.ascii_uppercase, string.ascii_lowercase))    
    if ext in extDict:
      contentType = extDict[ext]
    else:
      sys.stderr.write('Unable to guess Content-Type from file name. Please force the type.\n')
      sys.exit(3)
  else:
    sys.stderr.write('Could not extract a filename extension. Please force the type.\n')
    sys.exit(6)    
else:
  sys.stderr.write('Need to force HTML or XHTML when reading from stdin.\n')
  sys.exit(4)

if encoding:
  contentType = '%s; charset=%s' % (contentType, encoding)

if fileName:
  inputHandle = open(fileName, "rb")
else:
  inputHandle = sys.stdin

data = inputHandle.read()

buf = BytesIO()
gzipper = gzip.GzipFile(fileobj=buf, mode='wb')
gzipper.write(data)
gzipper.close()
gzippeddata = buf.getvalue()
buf.close()

connection = None
response = None
status = 302
redirectCount = 0

url = service
if gnu:
  url = url + '?out=gnu'
else:
  url = url + '?out=text'
  
if errorsOnly:
  url = url + '&level=error'

while (status == 302 or status == 301 or status == 307) and redirectCount < 10:
  if redirectCount > 0:
    url = response.getheader('Location')
  parsed = urlparse.urlsplit(url)
  if redirectCount > 0:
    connection.close() # previous connection
    print('Redirecting to %s' % url)
    print('Please press enter to continue or type "stop" followed by enter to stop.')
    if raw_input() != "":
      sys.exit(0)
  connection = httplib.HTTPSConnection(parsed[1])
  connection.connect()
  connection.putrequest("POST", "%s?%s" % (parsed[2], parsed[3]), skip_accept_encoding=1)
  connection.putheader("Accept-Encoding", 'gzip')
  connection.putheader("Content-Type", contentType)
  connection.putheader("Content-Encoding", 'gzip')
  connection.putheader("Content-Length", len(gzippeddata))
  connection.endheaders()
  connection.send(gzippeddata)
  response = connection.getresponse()
  status = response.status
  redirectCount += 1

if status != 200:
  sys.stderr.write('%s %s\n' % (status, response.reason))
  sys.exit(5)

if response.getheader('Content-Encoding', 'identity').lower() == 'gzip':
  response = gzip.GzipFile(fileobj=BytesIO(response.read()))
  
if fileName and gnu:
  quotedName = '"%s"' % fileName.replace('"', '\\042')
  for line in response:
    sys.stdout.write(quotedName)
    sys.stdout.write(line)
else:
  output = response.read()
  # python2/3 difference in output's type
  if not isinstance(output, str):
    output = output.decode('utf-8')
  sys.stdout.write(output)

connection.close()
