module.exports = {
  publish: {
    expand: function( id ) {
      return "v/" + id + ".html";
    },
    remove: function(path, callback) {
      callback = callback || function(){};
      callback();
    }
  },
  images: {
    expand: function(path) {
      return path;
    },
    write: function(filename, data, callback){
      callback();
    }
  }
};
