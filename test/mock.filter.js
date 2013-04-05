function mockFilter(req, res, next) {
  next();
}

module.exports = {
  isLoggedIn: mockFilter,
  isStorageAvailable: mockFilter,
  crossOriginAccessible: mockFilter
};
