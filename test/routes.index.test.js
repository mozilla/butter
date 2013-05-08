var test = require("tap").test,
    request = require("supertest");

var mockEmail = "test@example.org",
    mockSession = require("./mock.session"),
    mockProject = require("./mock.project")(),
    mockFilter = require("./mock.filter"),
    mockSanitizer = require("./mock.sanitizer"),
    mockStore = require("./mock.store"),
    utils = require("../lib/utils")({
      EMBED_HOSTNAME: "http://localhost:8888",
      EMBED_SUFFIX: "_"
    }, mockStore);

var express = require("express");
var app = express();

app.use(mockSession({
  email: mockEmail,
  _csrf: "FDaS435D2z"
}))
.use(express.bodyParser());

require("../routes")(app, mockProject, mockFilter, mockSanitizer, mockStore, utils);

app = app.listen(0);

test("whoami API valid", function(t) {
  request(app)
    .get("/api/whoami")
    .end(function(err, res) {
      t.equal(res.statusCode, 200, "status code is 200");
      t.equal(res.type, "application/json", "response type is json");
      t.deepEqual(res.body, {
        status: "okay",
        email: mockEmail,
        name: mockEmail,
        username: mockEmail,
        csrf: "FDaS435D2z"
      }, "response should have 5 attributes");

      t.end();
    });
});

test("project data get with error", function(t) {
  mockProject.error = true;
  mockProject.doc = false;

  request(app)
    .get("/api/project/1234")
    .end(function(err, res) {
      t.equal(res.statusCode, 500, "status code is 500");
      t.equal(res.type, "application/json", "response type is json");
      t.ok(res.body.error, "json contains an error");

      t.end();
    });
});

test("project data get not found", function(t) {
  mockProject.error = false;
  mockProject.doc = false;

  request(app)
    .get("/api/project/1234")
    .end(function(err, res) {
      t.equal(res.statusCode, 404, "status code is 404");
      t.equal(res.type, "application/json", "response type is json");
      t.ok(res.body.error, "json contains an error");

      t.end();
    });
});

test("project data get valid", function(t) {
  mockProject.error = false;
  mockProject.doc = true;

  request(app)
    .get("/api/project/1234")
    .end(function(err, res) {
      t.equal(res.statusCode, 200, "status code is 200");
      t.equal(res.type, "application/json", "response type is json");

      // This is very obtuse...
      var mockData = mockProject.generateMockData(1234);
      mockData.data = JSON.parse(mockData.data);
      mockData.data.name = mockData.name;
      mockData.data.projectID = mockData.id;
      mockData.data.author = mockData.author;
      mockData.data.template = mockData.template;
      mockData.data.publishUrl = mockData.publishUrl;
      mockData.data.iframeUrl = mockData.iframeUrl;
      mockData = mockData.data;
      t.deepEqual(res.body, mockData, "saved data is equal");

      t.end();
    });
});

test("delete project not found", function(t) {
  mockProject.error = true;

  request(app)
    .post("/api/delete/1234")
    .end(function(err, res) {
      t.equal(res.statusCode, 404, "status code is 404");
      t.equal(res.type, "application/json", "response type is json");
      t.ok(res.body.error, "json contains an error");

      t.end();
    });
});

test("delete project found", function(t) {
  mockProject.error = false;

  request(app)
    .post("/api/delete/1234")
    .end(function(err, res) {
      t.equal(res.statusCode, 200, "status code is 200");
      t.equal(res.type, "application/json", "response type is json");
      // wtf was I think when returning error is a good thing?
      t.equal(res.body.error, "okay", "json returns okay");

      t.end();
    });
});

/*******************
 * DANGER ZONE     *
 * HERE BE DRAGONS *
 *******************/

test("create project with error", function(t) {
  mockProject.error = true;

  var mockData = mockProject.generateMockData(1234);
  delete mockData.id;

  request(app)
    .post("/api/project/1234")
    .send(mockData)
    .end(function(err, res) {
      t.equal(res.statusCode, 500, "status code is 500");
      t.equal(res.type, "application/json", "response type is json");
      t.equal(res.body.error, "mock error", "error message is correct");

      t.end();
    });
});

test("create project with no data", function(t) {
  mockProject.error = false;

  var mockData = mockProject.generateMockData(1234);
  delete mockData.id;
  delete mockData.data;

  request(app)
    .post("/api/project/1234")
    .send(mockData)
    .end(function(err, res) {
      t.equal(res.statusCode, 500, "status code is 500");
      t.equal(res.type, "application/json", "response type is json");
      t.equal(res.body.error, "not enough parameters to update", "error message is correct");

      t.end();
    });
});

test("create project valid", function(t) {
  mockProject.error = false;

  var mockData = mockProject.generateMockData();
  mockData.data = JSON.parse(mockData.data);
  delete mockData.id;

  request(app)
    .post("/api/project/1234")
    .send(mockData)
    .end(function(err, res) {
      t.equal(res.statusCode, 200, "status code is 200");
      t.equal(res.type, "application/json", "response type is json");
      t.equal(res.body.error, "okay", "status is okay");
      t.ok(res.body.projectId, "id is present");

      t.end();
    });
});

test("update project with error", function(t) {
  mockProject.error = true;
  mockProject.doc = true;

  var mockData = mockProject.generateMockData(1234);
  mockData.data = JSON.parse(mockData.data);
  mockData.id = mockData.id;

  request(app)
    .post("/api/project/1234")
    .send(mockData)
    .end(function(err, res) {
      t.equal(res.statusCode, 500, "status code is 500");
      t.equal(res.type, "application/json", "response type is json");
      t.ok(res.body.error, "mock error");

      t.end();
    });
});

test("update project with no matching id", function(t) {
  mockProject.error = false;
  mockProject.doc = false;

  var mockData = mockProject.generateMockData(1234);
  mockData.data = JSON.parse(mockData.data);
  mockData.id = mockData.id;

  request(app)
    .post("/api/project/1234")
    .send(mockData)
    .end(function(err, res) {
      t.equal(res.statusCode, 500, "status code is 500");
      t.equal(res.type, "application/json", "response type is json");
      t.ok(res.body.error, "project id not found");

      t.end();
    });
});

test("update project valid", function(t) {
  mockProject.error = false;
  mockProject.doc = true;

  var mockData = mockProject.generateMockData(1234);
  mockData.data = JSON.parse(mockData.data);
  mockData.id = mockData.id;

  request(app)
    .post("/api/project/1234")
    .send(mockData)
    .end(function(err, res) {
      t.equal(res.statusCode, 200, "status code is 200");
      t.equal(res.type, "application/json", "response type is json");
      t.equal(res.body.error, "okay", "status is okay");
      mockData.data = JSON.stringify(mockData.data);
      t.deepEqual(res.body.project, mockData, "saved data is equal");

      t.end();
    });
});


test("remix project with error", function(t) {
  mockProject.error = true;
  mockProject.doc = false;

  request(app)
    .get("/api/remix/1234")
    .end(function(err, res) {
      t.equal(res.statusCode, 500, "status code is 500");
      t.equal(res.type, "application/json", "response type is json");
      t.ok(res.body.error, "json contains an error");

      t.end();
    });
});

test("remix project with no doc", function(t) {
  mockProject.error = false;
  mockProject.doc = false;

  request(app)
    .get("/api/remix/1234")
    .end(function(err, res) {
      t.equal(res.statusCode, 404, "status code is 404");
      t.equal(res.type, "application/json", "response type is json");
      t.ok(res.body.error, "json contains an error");

      t.end();
    });
});

test("remix project valid", function(t) {
  mockProject.error = false;
  mockProject.doc = true;

  request(app)
    .get("/api/remix/1234")
    .end(function(err, res) {
      t.equal(res.statusCode, 200, "status code is 200");
      t.equal(res.type, "application/json", "response type is json");

      // This is very obtuse...
      var mockData = mockProject.generateMockData(1234);
      mockData.data = JSON.parse(mockData.data);
      mockData.data.name = "Remix of " + mockData.name;
      mockData.data.template = "basic";
      mockData.data.remixedFrom = mockData.id;
      mockData = mockData.data;
      t.deepEqual(res.body, mockData, "saved data is equal");

      t.end();
    });
});

test("clean up server connections", function(t) {
  app.close();
  t.end();
});
