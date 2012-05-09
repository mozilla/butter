#!/usr/bin/env python
import sys
import time
import random

from mimetypes import add_type

add_type('video/ogv', 'ogv', False)
add_type('audio/ogg', 'ogg', False)
add_type('video/webm', 'webm', False)

PORT = 9914
SLOW = False
MAX_SLOW_TIME = .10

g_stop_server = False

def createSlowHandler(ParentClass):
  class SlowHandler(ParentClass):
    def __init__(self, request, client_address, server):
      return ParentClass.__init__(self, request, client_address, server)

    def do_HEAD(self):
      global g_stop_server
      try:
        time.sleep(random.random() * MAX_SLOW_TIME)
      except KeyboardInterrupt:
        g_stop_server = True
      return ParentClass.do_HEAD(self)

    def do_GET(self):
      global g_stop_server
      try:
        time.sleep(random.random() * MAX_SLOW_TIME)
      except KeyboardInterrupt:
        g_stop_server = True
      return ParentClass.do_GET(self)

  return SlowHandler

def createStoppableServer(ParentClass):
  class StoppableServer(ParentClass):

    stopped = False

    def __init__(self, *args, **kw):
      ParentClass.__init__(self, *args, **kw)

    def serve_forever(self):
      while not self.stopped:
        self.handle_request()
        if g_stop_server:
          self.force_stop()

    def force_stop(self):
      self.server_close()
      self.stopped = True

  return StoppableServer

if "--port" in sys.argv:
  PORT = int(sys.argv[sys.argv.index("--port") + 1])

if "--slow" in sys.argv:
  SLOW = True

try:
  try:
    import SimpleHTTPServer
    import SocketServer

    if SLOW:
      print "Warning: --slow argument specified. Requests will be stunted."
      Handler = createSlowHandler(SimpleHTTPServer.SimpleHTTPRequestHandler)
    else:
      Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

    Server = createStoppableServer(SocketServer.TCPServer)

    httpd = Server(("localhost", PORT), Handler)
    print "Web Server listening on http://localhost:%s/ (stop with ctrl+c)..." % PORT
    httpd.serve_forever()

  except ImportError:
    from http.server import HTTPServer, SimpleHTTPRequestHandler

    if SLOW:
      print "Warning: --slow argument specified. Requests will be stunted."
      Handler = createSlowHandler(SimpleHTTPRequestHandler)
    else:
      Handler = SimpleHTTPRequestHandler

    Server = createStoppableServer(HTTPServer)

    httpd = Server(('localhost', PORT), Handler)
    print "Web Server listening on http://localhost:%s/ (stop with ctrl+c)..." % PORT
    httpd.serve_forever()

except BaseException, e:
  print(e)
  g_stop_server = True