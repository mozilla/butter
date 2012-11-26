/*! This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

/**
 * Document: Config
 *
 * Manages configuration info for the app.
 *
 * @structure Module
 */
define( [], function() {

  /**
   * Shared config for all Configuration instances, keyed on configID below
   */
  var __config = {};

  /**
   * Configuration IDs go from 1..n, and are used to key __config
   */
  var __id = 0;

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
   * Validates any variable value being set, for example,
   * making sure paths end in '/'.
   */
  function __validateVariable( property, value ){
    var variable = __variables[ property ];

    if( !( variable && variable.validate ) ){
      return value;
    }

    return variable.validate( value );
  }

  /**
   * Replace any variable {{foo}} with the value of "foo" from the config.
   */
  function __replaceVariable( value, config ){
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
   * Replace any variable {{foo}} with the value of "foo" down a property
   * branch.
   */
  function __replaceVariableBranch( property, config ){
    if( property === undefined ){
      return property;
    }

    for( var propName in property ){
      if( property.hasOwnProperty( propName ) ){
        if( typeof property[ propName ] === "object" ){
          property[ propName ] = __replaceVariableBranch( property[ propName ], config );
        } else {
          property[ propName ] = __replaceVariable( property[ propName ], config );
        }
      }
    }

    return property;
  }


  /**
   * Document: Config::Configuration
   *
   * Manages access to config properties, doing variable substitution.
   *
   * @param {String} configID: A unique ID for this config, used as key into __config.
   * @param {Object} configObject: A parsed config object, see config.parse().
   * @throw config is not a parsed object (e.g., if string is passed).
   * @structure Class
   */
  function Configuration( configID, configObject ) {

    // Constructor should be called by Config.parse()
    if (typeof configObject !== "object"){
      throw "Config Error: expected parsed config object";
    }

    // Register configuration info centrally
    __config[ configID ] = configObject;

    /**
     * Document: Config::Configuration::value
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
     * @structure Member Function
     */
    this.value = function( property, newValue ){
      var configValue;

      if( newValue !== undefined ){
        configObject[ property ] = __validateVariable( property, newValue );
      }

      // If we're giving back a property branch, replace values deep before
      // handing it back to the user.
      configValue = configObject[ property ];
      if( typeof configValue === "object" ){
        return __replaceVariableBranch( configValue, configObject );
      } else {
        return __replaceVariable( configValue, configObject );
      }
    };

    /**
     * Document: Config::Configuration::override
     *
     * Overrides this Configuration object's top-level config with values
     * in another, leaving any values in this object alone which aren't
     * in the other. You typically override a default configuration with
     * a user's extra settings.
     *
     * @param {Object} configuration Values to overwrite old configuration.
     * @structure Member Function
     */
    this.override = function( configuration ){
      var configA = configObject,
          configB = __config[ configuration.id ];

      for( var propName in configB ){
        if( configB.hasOwnProperty( propName ) ){
          configA[ propName ] = configB[ propName ];
        }
      }
    };

    /**
     * An internal-use getter for keying config information.
     */
    Object.defineProperty( this, "id", { get: function(){ return configID; } } );
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
      try {
        var config = JSON.parse( configJSON );
        return new Configuration( "config-" + __id++, config );
      } catch( e ){
        throw "Config.parse Error: unable to parse config string. Error was: " + e.message;
      }
    }

  };

  return Config;
});