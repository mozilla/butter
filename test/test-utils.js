window._testInitCallback = function(){};
window._testBeforeCallback = function(){};
window._testAfterCallback = function(){};

function createButterCore( callback ){

  Butter({
    config: "../test-config-core.json",
    debug: false,
    ready: function( butter ){
      callback( butter );
    }
  });
}

function createButterModule( callback ){
  Butter({
    config: "../test-config-module.json",
    debug: false,
    ready: function( butter ){
      callback( butter );
    }
  });
}