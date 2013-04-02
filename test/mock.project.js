function generateMockData(id, mediaData) {
  id = id || parseInt( Math.random()*10000, 10 );

  var projectData = {
    hello: "world",
    adventure: "bill & ted's",
    media: mediaData
  };

  return {
    id: id,
    data: JSON.stringify( projectData ),
    email: "test@example.org",
    name: "My Mock Project",
    author: "Test User",
    template: "basic",
    publishUrl: "http://localhost:8888/v/" + id + ".html",
    iframeUrl: "http://localhost:8888/v/" + id + "_.html"
  };
}

module.exports = function() {
  return {
    error: false,
    doc: true,
    generateMockData: generateMockData,
    find: function( options, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      if (!this.doc) {
        callback();
        return;
      }

      callback(null, generateMockData(options.id));
    },
    findAll: function( options, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      if (!this.doc) {
        callback("mock error");
        return;
      }

      callback(null, [ generateMockData() ]);
    },
    findRecentlyCreated: function( options, callback ) {
      callback();
    },
    findRecentlyUpdated: function( options, callback ) {
      callback();
    },
    delete: function( options, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      callback();
    },
    create: function( options, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      var data = options.data;
      if (!data.data) {
        callback("not enough parameters to update");
        return;
      }

      data.id = parseInt( Math.random()*10000, 10 );
      data.data = JSON.stringify( data.data );

      callback(null, data);
    },
    update: function( options, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      if (!this.doc) {
        callback("project id not found");
        return;
      }

      var data = options.data;
      data.data = JSON.stringify( data.data );

      callback(null, data);
    },
    linkImageFilesToProject: function( options, callback ) {
      callback();
    },
    createImageReferencesForProject: function( options, callback ) {
      callback();
    }
  };
};
