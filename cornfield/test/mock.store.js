module.exports = {
  publish: {
    expand: function( id ) {
      return "v/" + id + ".html";
    },
    remove: function(path, callback) {
      callback = callback || function(){};
      callback();
    }
  }
};
