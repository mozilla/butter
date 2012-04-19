Butter
======

An SDK for authoring Popcorn projects.

Build Prerequisites
-------------------

* node v0.6 or higher
* npm (comes with node v0.6 installer)

Using Butter with Cornfield
---------------------------

In order for Cornfield to operate correctly ( being able to save, load, and publish ) you will need to install mongodb. You can find a good guide to do so [here](http://www.mongodb.org/display/DOCS/Quickstart). Before starting up you Cornfield server be sure that you have MongoDB running or else it will fail to start.

Environment Setup
-----------------

1. `git clone --recursive https://github.com/mozilla/butter.git`
2. `cd butter`
3. `npm install`
4. `node make server`

When updating your repo, make sure to run `node make submodules` to update Butter's submodules.

Running Butter (with cornfield)
-------------------------------

* To use butter be sure to start the node server by running `node make server`.
* Navigate to http://localhost:8888/templates/test.html to begin using Butter

Running Butter (without cornfield)
----------------------------------

* Be sure to have a webserver of some sort running and navigate to butter/templates/test.html ( keep in mind you will not be able to save and load projects )
* Run `node make` to ensure all of the css has been compiled
* If you do not have a webserver setup you can create a temporary one by running `python -m SimpleHTTPServer 8888` inside the root of your butter directory
* Navigate to localhost:8888 to use butter

Testing
-------

Before contributing a new patch be sure to run the following:

* `node make check` to lint butter
* run the qUnit tests in the test/ directory to be sure you broke nothing

Getting Involved
----------------

We have an active irc community on irc.mozilla.org in the #popcorn channel, as well as a mailing list that you can subscribe to https://groups.google.com/group/web-made-movies-working. Come say hi!

Contributing
------------

* To file a bug or feature request, please use our issue-tracking lighthouse project: https://webmademovies.lighthouseapp.com/projects/65733-butter/
* When contributing code, please issue a pull request on github, so that we can track changes with comments. Be sure to put a link to the pull request in any corresponding lighthouse tickets.
* Be sure to change the ticket state on lighthouse to "peer-review-requested" and assign to to one of the [core developers](https://github.com/mozilla/butter/blob/master/package.json) for review
