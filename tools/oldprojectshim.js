window.Popcorn = function( fn ) {
  window.popcornDataFn = fn;
  delete window.Popcorn;
};
