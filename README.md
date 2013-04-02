Butter
======

An SDK for authoring Popcorn projects.

Supported Platforms
-------------------

### Desktop:
* Chrome stable
* Firefox stable
* Internet Explorer 9+
* Safari stable

Prerequisites
-------------

* node v0.8 or higher
* npm (comes with node v0.8 installer)
* A working build environment:
  * Mac OS X - Xcode or Command Line Tools package
  * Windows - Python 2.5+ and Visual Studio 2010; specifically:
    * uninstall *any and all* "Microsoft Visual C++ 2010 x86/64 Redistributable" copies
    * install Microsoft Visual C++ 2010 (Express edition is fine)
    * install Microsoft Visual Studio 2010 SP1
    * install Microsoft Windows SDK v7.1
    * install Microsoft Visual C++ 2010 SP1 Compiler Update for Windows SDK v7.1
  * Linux - build-essential package on Debian/Ubuntu, or the equivalent for your distro

Environment Setup
-----------------

1. `git clone --recursive https://github.com/mozilla/butter.git`
2. `cd butter`
3. `npm install`

Running Butter in development mode
----------------------------------

1. Run `node server`.
2. Navigate to [http://localhost:8888/](http://localhost:8888/) in your favourite browser.

If you want to change the bind IP or port check the Configuration section below. Run `NODE_ENV=production node server.js` in order to run the server in production mode.

Server Configuration
--------------------

Cornfield is Popcorn Maker's back-end server system, designed to serve content to users, store their ongoing work, and publish what they've done.

### Storage

There are two types of storage Cornfield needs to run:

* A database: To store user project data, a database is required. Popcorn Maker currently supports MySQL, PostgreSQL, and Sqlite.
* A data-blob store: To store published projects, Cornfield can use the filesystem, or Amazon's S3.

### Configuration

The default server configuration can be found in [lib/default-config.js](lib/default-config.js). To override any of these settings you can:

1. Use environment variables e.g. (`PORT=1337 node server.js`)
2. Add a file named `local.json`. `server.js` will recurse up the directory tree looking for it
3. Use the `BUTTER_CONFIG_FILE` environment variable e.g. (`BUTTER_CONFIG_FILE=/etc/popcorn/local.json node server.js`)

#### Configuration Options

  - `PORT` the port to bind the server to
  - `hostname` the hostname for the server (e.g., `http://localhost:8888`, `https://popcorn.webmaker.org`). **This must match your browser's address bar otherwise Persona login will not work**
  - `NODE_ENV` the environment you're running the server in (e.g. `development`, `staging`, `production`)
  - `logger` settings for server logging
    - `format` the logging format to use.  Possible values include: default, short, tiny, dev.
  - `session` settings for user sessions
    - `secret` the sessions secret (i.e., some long string)
  - `staticMiddleware` settings for cornfield Connect middleware
    - `maxAge` the max age of static assests
  - `dirs` settings for various directories, paths, hostnames
    - `wwwRoot` the server's WWW root directory (e.g., `../`)
    - `templates` the location of templates (e.g., `../templates`)
    - `embedHostname` *[optional]* the hostname URL where published embed documents are stored, if different from `hostname` (e.g., `http://s3.amazonaws.com/your-bucket`)
  - `templates` list of templates to serve.  The format is as follows:
    `<template-name>`: `{{templateBase}}<path/to/template/config.json>`.  The `{{templateBase}}` string will be replaced by the value in `dirs.templates` (e.g., "basic": "{{templateBase}}basic/config.json")

  - `exportedAssets` list of scripts to include in exported assets.  These are things like popcorn.js or other scripts that your exported projects depend upon in order to run.

  - `additionalStaticRoots` list of additional roots to use.

  - `database` database configuration options
    - `database` the database name. Used by mysql and postgresql
    - `username` the username to use when connecting to the database. Used by mysql and postgresql
    - `password` the password for the username. Used by mysql and postgresql
    - `options` additional sequelize options. Please see the [sequelize manual](http://www.sequelizejs.com/#usage-options) for the complete listing.
      - `dialect` the sql dialect of the database. Default is `mysql`, must be one of `mysql`, `sqlite`, or `postgresql`
      - `storage` the storage engine for sqlite. Default is `:memory:`, an in-memory db, must be a string representing a file path or `:memory:`
      - `logging` function to print sql queries to console. Default is `console.log`, must be a function or `false`
      - `host` hostname of the mysql or postgresql server. Default is `localhost`
      - `port` port of the mysql or postgresql server. Default is `3306`
      - `pool` connection pooling options for mysql and postgresql. Default is none
        - `maxConnections` - maximum number of connections open in the pool
        - `maxIdleTime` - maximum time in seconds to leave an idle connection open in the pool

  - `metrics` *[optional]* metric server configuration options for a [StatsD](https://github.com/etsy/statsd/) server
    - `host` The host to connect to. Default is `localhost`
    - `port` The port to connect to. Default is `8125`
    - `prefix` *[optional]* prefix to assign to each stat name sent. If not given a default of `<NODE_ENV>.butter.` will be used, for example: pr`oduction.butter`
    - `suffix` *[optional]* suffix to assign to each stat name sent.
    - `globalize` *[optional]* boolean to add `statsd` as an object in the global namespace

  - `publishStore` a `fileStore` used to publish project HTML files (see `fileStore` below for details)

  - `feedbackStore` a `fileStore` used to publish feedback from the user as JSON (see `fileStore` below for details)

  - `crashStore` a `fileStore` used to publish crash reports from the user as JSON (see `fileStore` below for details)

  - `imageStore` a `fileStore` used to retain converted data-uri images for published projects (see the `ImageStore` section below for details)

The `fileStore` type is used to setup a backend for storing data:

   - `type` the type of file store to use.  Possible values include `local` (i.e., local file system) and `s3` (i.e., Amazon S3)
   - `options` options for the file store, which depends on the type chosen.
      - `hostname` the hostname to use for constructing urls if different than `embedHostname`
      - local options
         - `root` the root directory under which all exported files are placed (e.g., `./view`)
         - `namePrefix` *[optional]* the path prefix to add to any filenames passed to the local file store.  For example, if using "v" all filenames will become "v/<key>"
         - `nameSuffix` *[optional]* the filename suffix to use for all filenames (e.g., ".html")
      - s3 options
       - `key` the AWS S3 key to use for authentication
       - `secret` the AWS S3 secret to use for authentication
       - `bucket` the AWS S3 bucket name to use for storing key/value pairs
       - `namePrefix` *[optional]* the prefix to add to any key names passed to the s3 file store.  For example, if using "v" all keys will become "v/<key>"
       - `nameSuffix` *[optional]* the suffix to add to any key names passed to the s3 file store.  For example, if using ".json" all keys will end in ".json"
       - `contentType` *[optional]* the mime type to use for data written to S3. If none given `text/plain` is used.
       - `headers` *[optional]* any additional headers to use for data written to S3. For example, setting cache control headers with `{ 'Cache-Control': 'max-age=1800' }`.

#### ImageStore

As part of the configuration, an `imageStore` should be specified to store converted data-uri images for published projects. When a project is saved, the project data is scanned for data-uris which are converted into binary blobs and stored on the server in the `imageStore`. Currently, there are no special checks or functionality for image store content-types. However, the only images which will be converted are jpegs and pngs. Everything else is ignored. See below for an example `imageStore` configuration.

Server Monitoring
-----------------

Popcorn Maker supports server monitoring with [New Relic](https://newrelic.com/). It is implemented by the [newrelic npm module](https://github.com/newrelic/node-newrelic/).
Configuration is done entirely with environment variables. See the [https://github.com/newrelic/node-newrelic/#configuring-the-agent](README) for a comprehensive list.
To enable New Relic monitoring with Popcorn Maker, the following environment variable *must* be set:

* NEW\_RELIC\_HOME

Getting Involved
----------------

* Chat with the Popcorn community on irc.mozilla.org in the [#popcorn](irc://irc.mozilla.org/popcorn) channel. The developers hang out here on a daily basis.
* We also have a [mailing list](https://mail.mozilla.org/listinfo/community-popcorn) that you can subscribe to.
* File bugs and feature requests on our [issue tracker](https://bugzilla.mozilla.org/enter_bug.cgi?format=guided#h=dupes|Webmaker|).
* The latest code can be found on our [Github repository](https://github.com/mozilla/butter/).
* If you'd like to contribute code, file a ticket on our issue tracker, and link to it from your Github pull request.
