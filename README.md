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
* Stylus files will be compiled at run-time through a node module, so no pre-compile of `butter.ui.css` is necessary

Running Butter (without cornfield)
----------------------------------

* Be sure to have a webserver of some sort running and navigate to butter/templates/test.html ( keep in mind you will not be able to save and load projects )
* Run `node make` to ensure all of the CSS has been compiled, since Stylus files are used in place of plain CSS
* If you do not have a webserver setup you can create a temporary one by running `python -m SimpleHTTPServer 8888` inside the root of your Butter directory
* Navigate to localhost:8888 to use butter

Packaging and Distributing Butter
--------------------------------

Running `node make package` will compile all the necessary files into the `dist` folder, including resources like editors and dialogs which comprise a complete running environment for Butter.

The constituents of the `dist` folder are subsequently rolled into a zip file called `butter.zip` in the dist folder for an even easier distribution of the Butter environment.

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
* We have a bot that can run tests on code within pull requests. Try typing `/botio check` for linting, `/botio preview` to run the server, or `/botio help` for a list of all commands.

Known Issues
------------

* Seeking in Youtube, Vimeo and Soundcloud using the butter UI may cause the video to pause.
* Seeking in Vimeo using butter UI may cause the video to reset to second 0.
* Youtube URL query string options like "&feature=youtu.be&t=2m1s" may cause issues. Example: http://www.youtube.com/watch?v=4LP6nDRbDOA&feature=youtu.be&t=2m1s
* Soundcloud's playback position does not update visually while paused. Hitting play, it will fix its position.
* Soundcloud will not respond to seeking until after it has been played once.