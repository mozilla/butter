function generateMockData(id) {
  id = id || parseInt( Math.random()*10000, 10 );

  return {
    id: id,
    data: JSON.stringify({
      hello: "world",
      adventure: "bill & ted's"
    }),
    email: "test@example.org",
    name: "My Mock Project",
    author: "Test User",
    template: "basic"
  };
}

module.exports = function() {
  return {
    error: false,
    doc: true,
    generateMockData: generateMockData,
    findProject: function(email, id, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      if (!this.doc) {
        callback();
        return;
      }

      callback(null, generateMockData(id));
    },
    deleteProject: function(email, id, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      callback();
    },
    findById: function(id, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      if (!this.doc) {
        callback();
        return;
      }

      callback(null, generateMockData(id));
    },
    createProject: function(email, data, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      if (!data.data) {
        callback("not enough parameters to update");
        return;
      }

      data.id = parseInt( Math.random()*10000, 10 );
      data.data = JSON.stringify( data.data );

      callback(null, data);
    },
    updateProject: function(email, id, data, callback) {
      if (this.error) {
        callback("mock error");
        return;
      }

      if (!this.doc) {
        callback("project id not found");
        return;
      }

      data.data = JSON.stringify( data.data );

      callback(null, data);
    }
  };
};
