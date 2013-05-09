module.exports = function( metrics, utils, stores ) {
  return {
    healthcheck: require( "./healthcheck" ),
    image: require( "./image" )( metrics, utils, stores )
  };
};
