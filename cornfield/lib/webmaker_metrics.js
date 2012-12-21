"use strict";

var metrics,
    API_KEY = "ntQg43WhJFAAhxgm4dmZj1gFl56cLCg6SMmxNW5a9YUVW1Ca3j",
    ducksnode = require('ducksnode').create({ api_key: API_KEY }),
    ducksboard_widgets = {
      newProject: [
        "popcorn_maker_new_projects_24hrs",
        "popcorn_maker_new_projects_7days",
        "popcorn_maker_new_projects_30days"
      ],
      totalProjects: [
        "popcorn_maker_total_projects_7days"
      ],
      multipleProjects: [
        "popcorn_maker_multiple_projects_7days"
      ]
    },
    appDeployment;

metrics = {
  pushToBoard: function( widgetset, data, callback ) {
    if ( appDeployment === "production" ) {
      var widgetIds = ducksboard_widgets[ widgetset ];

      callback = callback || function(){};

      for ( var i = 0; i < widgetIds.length; i++ ) {
        ducksnode.push( widgetIds[ i ], data, callback );
      }
    }
  }
};

module.exports = function( environment ) {
  appDeployment = environment;
  return metrics;
};
