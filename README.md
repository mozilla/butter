Butter
======

An SDK for authoring Popcorn projects.

Supported Platforms
-------------------

We're writing Butter so that it runs in modern, HTML5 compatible browsers.  For version 1.0, we're targeting modern HTML5 desktop browsers.  In the current version we are supporting:

### Desktop:
* Chrome stable
* Firefox stable
* Internet Explorer 9+
* Safari stable

Prerequisites
-------------

* node v0.8 or higher
* npm (comes with node v0.8 installer)
* mongodb v2.0.8 or higher
* A working build environment:
  * Mac OS X - Xcode or Command Line Tools package
  * Windows - Python 2.5+ and Visual Studio 2010 (C++ Express edition works fine)
  * Linux - build-essential package on Debian/Ubuntu, or the equivalent for your distro

Environment Setup
-----------------

1. `git clone --recursive https://github.com/mozilla/butter.git`
2. `cd butter`
3. `npm install`

Running Butter in development mode
----------------------------------

1. Run `node make server`.
2. Navigate to http://localhost:8888/ in your favourite browser.

If you want to change the bind IP or port check the Configuration section below.

Packaging and Distributing Butter
--------------------------------

Running `node make deploy` will compile all the necessary files into the `dist/` folder.
Run `NODE_ENV=production node app.js` in the dist/cornfield directory in order to run the server in production mode.

### Configuration

There are several configuration files in cornfield/config/ that control how cornfield works.
They are applied in order from most general to most specific to present one configuration
to the server:

1. default.json
2. _hostname_.json
3. _environment_.json
4. _hostname_-_environment_.json
5. runtime.json

_hostname_ and _environment_ are variable:

* _hostname_ - The hostname of the machine. Defaults to the output of `hostname` on the cli.
* _environment_ - The value of the `NODE_ENV` environment variable. Defaults to `development`.

To change the cornfield configuration for your deployment of Butter, it's best to create a
new file called _hostname_-_environment_.json that overrides the cornfield defaults.

### Sample production config

`alice-production.json:`

```javascript
{
  "server" : {
    "bindIP" : "0.0.0.0",
    "bindPort" : "80"
  },
  "logger" : {
    "format" : "default"
  },
  "session" : {
    "secret": "1721f7a15316469fa4a9-5117d0d20e9f"
  },
  "staticMiddleware": {
    "maxAge": "3600000"
  },
  "dirs": {
    "hostname": "http://example.org"
  }
}
```

Testing
-------

Before contributing a new patch be sure to run the following:

* Run `node make check` to lint butter
* Run `node make server` and navigate to http://localhost:8888/test to run the browser tests

Getting Involved
----------------

* Chat with the Popcorn community on irc.mozilla.org in the [#popcorn](irc://irc.mozilla.org/popcorn) channel. The developers hang out here on a daily basis.
* We also have a [mailing list](https://mail.mozilla.org/listinfo/community-popcorn) that you can subscribe to.
* File bugs and feature requests on our [issue tracker](https://webmademovies.lighthouseapp.com/projects/65733-butter/).
* The latest code can be found on our [Github repository](https://github.com/mozilla/butter/).
* If you'd like to contribute code, file a ticket on our issue tracker, and link to it from your Github pull request.

Contributing Design
-------------------

### Where to find/drop files

Our design files are organized on dropbox, at this link:
https://www.dropbox.com/sh/7vm2rvw3axvkp0k/Tk4MKH4nZe
You can ask Kate ( k88hudson on IRC or Twitter ) to be added as a collaborator if you want to drop your files in here.

### File System
* References: screen shots and other reference work from the webmaker project or HTML5 ecosystem
* Wireframes: documents about the functionality/interaction/description of features
* Visual Comps: UI mock-ups and style guide

###  Working with lighthouse
When someone assigns you a ticket, it will show up in your lighthouse queue with a status of `ui-comps-requested` or `assigned`.

If you want someone to review or give feedback on your work, the best thing to do is:
* Put a link to your files in the ticket ( on our dropbox or somewhere externally )
* Change the status of the ticket to `peer-review-requested` or `feedback-requested`, and choose a member of the team to be responsible.

Contributing Code
-----------------

### Working with Lighthouse
All of our code changes to Butter are documented in tickets, and go through two levels of peer-review. If you are interested in working on a ticket chose one from the [list of open tickets](https://webmademovies.lighthouseapp.com/projects/65733-popcorn-maker/milestones/current), ping any of the developers on IRC, and they will assign it to you.

### Working with branches and making a pull-request

* Each ticket is a separate branch, usually named after the ticket number. IE `t1234`
* All commit messages must include the ticket number. IE `Bug 1234 - Fixed a thing` or `[t1234] Fixed a thing`
* Before submitting a pull request, make sure you have rebased against the latest revision of master.

### Getting review
All code changes in butter have to go through two levels of peer review. This improves the integrity of our code, and everyone goes through the process, from casual contributors to our most senior developers.

1. After you have made a pull-request, post the link (e.g. https://github.com/mozilla/butter/pull/662) in the corresponding ticket.
2. Set the status of the ticket to `peer-review requested`, and choose someone to review your code. If you're not sure who should review your code, ask in #popcorn on IRC.
3. After you get a review, you will see (1) comments in the diff in your pull-request and (2) comments in lighthouse. Keep an eye on the ticket to see when your review is done.
4. Complete the changes that were requested, or if you disagree or need more information, comment in the pull-request or lighthouse. Commit and push up.
5. After your review passes, your reviewer will pass the ticket on to `super-review-requested`. You will likely have more changes after that review.
6. After your final round of changes, your ticket will change to `review-looks-good`. Hurrah! Ask someone to help you merge your code into master.

### Landing (for those with commit rights to github.com/mozilla/butter)
Once code has been reviewed (PR+ and SR+), and you want to land it, you need to follow our rebase strategy. Don't use Github's "Merge pull request". Instead, please do the following:

1. `git checkout master`
2. `git pull mozilla master` This assumes your remote to Mozilla's butter is called mozilla
3. `git checkout mybranch`
4. `git rebase -i master` Squash your commits here, where it makes sense
5. Make sure everything still works in Butter at this point
6. `git push origin mybranch --force`
7. `git checkout master`
8. `git merge mybranch --ff-only` No need for a commit message, as we're not doing a merge commit
9. `git push mozilla master`
10. Paste URL to commits in ticket, and mark it as "Staged"

We use this landing strategy in order to make backing-out failed commits easier.
