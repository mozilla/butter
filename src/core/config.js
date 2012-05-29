/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

(function( undefined ) {

  /**
   * Variables allowed in config files.  Variables take the form:
   *
   * "foo": "value",
   * "bar": "{{foo}}"
   *
   * The name of the variable is enclosed in {{..}} when used.
   * A defaultValue can be specified as well as a validate()
   * function, to validate/clean values when being set.
   */
  var __variables = {

    // The base-dir prefix used in paths, often something like ../
    "baseDir": {
      name: "{{baseDir}}",
      defaultValue: "./",
      validate: function( value ){
        // Make sure value ends in a trailing /
        return value.replace( /\/?$/, '/' );
      }
    }

  };

  /**
   * Replace any variable {{foo}} with the value of "foo" from the config
   */
  function __replaceVariables( value, config ){
    if( value === undefined ){
      return value;
    }

    var newValue = value,
        variable,
        configValue,
        substitution;

    for( var variableName in __variables ){
      if( __variables.hasOwnProperty( variableName ) ){
        variable = __variables[ variableName ];
        configValue = config[ variableName ];
        substitution = configValue ? configValue : variable.defaultValue;
        newValue = newValue.replace ?
          newValue.replace( variable.name, substitution, "g" ) :
          newValue;
      }
    }

    return newValue;
  }

  /**
   * Validates any variable value being set, for example,
   * making sure paths end in '/'.
   */
  function __validateVariable( property, value, config ){
    var variable = __variables[ property ];

    if( !( variable && variable.validate ) ){
      return value;
    }

    return variable.validate( value );
  }

  /**
   * Module: Config
   *
   * Manages configuration info for the app.
   */
  define( [], function() {

    /**
     * Class: Configuration
     *
     * Manages access to config properties, doing variable substitution.
     *
     * @param {Object} configObject: A parsed config object, see config.parse().
     * @throws config is not a parsed object (e.g., if string is passed).
     */
    function Configuration( configObject ) {

      // Constructor should be called by Config.parse()
      if (typeof configObject !== "object"){
        throw "Config Error: expected parsed config object";
      }

      // Cache the config object
      var _config = configObject,
          _merged = [];

      // Find the first config that has a given property, starting
      // with the most recently merged Configuration (if any) and
      // ending with our internal _config object.
      function findConfig( property ){
        var i = _merged.length;
        while( i-- ){
          if( _merged[ i ].value( property ) !== undefined ){
            return _merged[ i ];
          }
        }
        return _config;
      }

      /**
       * Member: value
       *
       * Gets or overrides the value of a config property, doing
       * variable replacement as needed. If only one argument is passed,
       * the name of a property, the value is returned. If two arguments
       * are passed, the second is used in order to override the property's
       * value. If a known variable is overriden, its validate() method
       * is called (if any). The value is returned in both cases.
       *
       * @param {String} property: The config property to get.
       * @param {Object} newValue: [Optional] A new value to use.
       */
      this.value = function( property, newValue ){
        var config = findConfig( property );

        if( config instanceof Configuration ){
          return config.value( property, newValue );
        } else {
          if( newValue !== undefined ){
            config[ property ] = __validateVariable( property, newValue, config );
          }
          return __replaceVariables( config[ property ], config );
        }
      };

      this.merge = function( configuration ){
        _merged.push( configuration );
      };
    }

    /**
     * Class: Config
     *
     * Manages creation of Configuration objects
     */
    var Config = {

      /**
       * Member: parse
       *
       * Parses a JSON config string, creating a Configuration object.
       *
       * @param {String} configJSON: The config's JSON string.
       * @throws JSON is malformed or otherwise can't be parsed.
       */
      parse: function( configJSON ){
        var config;
        try {
          config = JSON.parse( configJSON );
          return new Configuration( config );
        } catch( e ){
          throw "Config.parse Error: unable to parse config string. Error was: " + e.message;
        }
      }

    };

    return Config;
  });

}());
