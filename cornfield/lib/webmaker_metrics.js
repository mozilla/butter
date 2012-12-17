"use strict";

var metrics,
    API_KEY = "KSqFZGbhBom1w3Wg4b9CvcyqLlSqELuCdvs57GGRgrg8uu6U61",
    ducksnode = require('ducksnode').create({ api_key: API_KEY }),
    ducksboard_widgets = {
      newProject: [
        "popcorn_maker_new_projects_24hrs",
        "popcorn_maker_new_projects_7days",
        "popcorn_maker_new_projects_30days"
      ],
      updatedProject: [
        "popcorn_maker_updated_projects_24hrs",
        "popcorn_maker_updated_projects_7days",
        "popcorn_maker_updated_projects_30days"
      ]
    },
    appDeployment;

metrics = {
  pushToBoard: function( widgetset, data ) {
    if ( appDeployment === "production" ) {
      var widgetIds = ducksboard_widgets[ widgetset ];

      for ( var i = 0; i < widgetIds.length; i++ ) {
        ducksnode.push( widgetIds[ i ], data );
      }
    }
  }
};

module.exports = function( environment ) {
  appDeployment = environment;
  return metrics;
};
