module.exports = {
  publish: {
    remove: function(path, callback) {
      callback = callback || function(){};
      callback();
    }
  }
};
