module.exports = function(data) {
  data = data || {};

  return function(req, res, next) {
    req.session = {};

    Object.keys(data).forEach(function(key) {
      req.session[key] = data[key];
    });

    next();
  };
};
