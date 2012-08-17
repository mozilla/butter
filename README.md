Butter
======

An SDK for authoring Popcorn projects.

Supported Platforms
-------------------

We're writing Butter so that it runs in modern, HTML5 compatible browsers.  For version 1.0, we're targeting modern HTML5 desktop browsers.  In the current version we are supporting:

#### Desktop (Windows, OS X, Linux):
* Firefox stable
* Chrome stable

Known Issues
------------

* Chrome has a [known bug](http://code.google.com/p/chromium/issues/detail?id=31014) where loading a video with the same source URL multiple times will cause the loading process to hang with no UI or JavaScript indication. This can occur with videos on the same page or tab.

Build Prerequisites
-------------------

* node v0.6 or higher
* npm (comes with node v0.6 installer)

Using Butter with Cornfield
---------------------------

In order for Cornfield to operate correctly ( being able to save, load, and publish ) you will need to install mongodb. You can find a good guide to do so [here](http://www.mongodb.org/display/DOCS/Quickstart). For Cornfield to work correctly, ensure [v2.0.6 or greater](http://www.mongodb.org/downloads) is installed. Before starting up you Cornfield server be sure that you have MongoDB running or else it will fail to start.

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

* Be sure to have a webserver of some sort running and navigate to butter/templates/basic/ ( keep in mind you will not be able to save and load projects )
* Run `node make` to ensure all of the CSS has been compiled, since Stylus files are used in place of plain CSS
* If you do not have a webserver setup you can create a temporary one by running `python -m SimpleHTTPServer 8888` inside the root of your Butter directory
* Navigate to localhost:8888 to use butter

Packaging and Distributing Butter
--------------------------------

Running `node make deploy` will compile all the necessary files into the `dist/` folder, including resources like editors and dialogs which comprise a complete running environment for Butter.

Within `dist/` you will find `src/butter.js` and `external/popcorn-js/popcorn.js`, which are single-file versions of the Butter and Popcorn.js sources, customized to the basic template.  You can find these templates in `dist/templates/basics`.

Testing
-------

Before contributing a new patch be sure to run the following:

* `node make check` to lint butter
* run the qUnit tests in the test/ directory to be sure you broke nothing

Documentation
-------------

Documentation can be created from the source files by running `node make docs`. Running this command will create `/doc` and fill it with markdown files corresponding to documentation found within the source.

Getting Involved
----------------

We have an active irc community on irc.mozilla.org in the #popcorn channel, as well as a mailing list that you can subscribe to https://groups.google.com/group/web-made-movies-working. Come say hi!

Contributing
------------

* To file a bug or feature request, please use our issue-tracking lighthouse project: https://webmademovies.lighthouseapp.com/projects/65733-butter/
* When contributing code, please issue a pull request on github, so that we can track changes with comments. Be sure to put a link to the pull request in any corresponding lighthouse tickets.
* Be sure to change the ticket state on lighthouse to "peer-review-requested" and assign to to one of the [core developers](https://github.com/mozilla/butter/blob/master/package.json) for review
* We have a bot that can run tests on code within pull requests. Try typing `/botio check` for linting, `/botio preview` to run the server, or `/botio help` for a list of all commands.

# Get started working on Butter

1. Join the #popcorn IRC channel
A lot of the people working on Butter are in the #popcorn channel on irc.mozilla.org during business hours M to F (most of us are in Toronto, so Eastern Time). 

2. Request to be added to lighthouse
Ask someone to add you to our ticketing system, which currently exists here:
https://webmademovies.lighthouseapp.com/projects/65733-popcorn-maker/
Our upcoming milestone and the responsibilites associate with it can be found here:
https://webmademovies.lighthouseapp.com/projects/65733-popcorn-maker/milestones/current

## Designers

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

## Developers

### Github repo
You can find the github repo for Butter at https://github.com/mozilla/butter. In order to clone with dependencies simply run
```
git clone https://github.com/mozilla/butter --recursive
```
from your terminal.

If you're going to be making pull requests you'll want to fork your own version as well.

### Working with lighthouse
All of our code changes to Butter are documented in tickets, and go through two levels of peer-review. You can find a list of open tickets here:
https://webmademovies.lighthouseapp.com/projects/65733-popcorn-maker/milestones/current

If you are interested in working on a ticket, assign it to yourself (see above for how to get added to lighthouse), by marking the responsible field to your name and the status to `assigned`.

### Working with branches + making a pull-request
By convention, when we are working on a ticket we do so by creating a new branch of master named after the ticket. For example, if I was working on ticket #1234, I would run:
```
git checkout -b t1234
```
from my terminal while on `master`.
We also tend to mark our commit messages with ticket numbers to make our history more readable, for example:
```
"[t1234] Fixed all the bugs"
```
After you have commited your changes, you can go to github and make a pull-request against `mozilla:master`. Try to make sure you have rebased to the lastest version of master.

### Getting review
All code changes in butter have to go through two levels of peer review. This improves the integrity of our code, and everyone goes through the process, from casual contributors to our most senior developers.

1. After you have made a pull-request, post the link (e.g. https://github.com/mozilla/butter/pull/662) in the corresponding ticket.
2. Set the status of the ticket to `peer-review requested`, and choose someone to review your code. If you're not sure who to ask, check out this list https://github.com/organizations/mozilla/teams/151407 or better, ask in #popcorn on IRC.
3. After you get a review, you will see (1) comments in the diff in your pull-request and (2) comments in lighthouse. Keep an eye on the ticket to see when your review is done.
4. Complete the changes that were requested, or if you disagree or need more information, comment in the pull-request or lighthouse. Commit and push up.
5. After your review passes, your reviewer will pass the ticket on to `super-review-requested`. You will likely have more changes after that review.
6. After your final round of changes, your ticket will change to `review-looks-good`. Ask someone to help you rebase/merge into master. Hurrah!

### Landing (for those with commit rights to github.com/mozilla/butter)
Once code has been reviewed (PR+ and SR+), and you want to land it, you need to follow our rebase strategy. Please don't use Github's "Merge pull request". Instead, please do the following:

* git checkout master
* git pull mozilla master # assuming your remote to Mozilla's butter is called `mozilla`
* git checkout mybranch
* git rebase -i master # consider squashing your commits here, if it makes sense
* # make sure everything still works in Butter at this point
* git push origin mybranch --force
* git checkout master
* git merge mybranch --ff-only # no need for a commit message, as we're not doing a merge commit
* git push mozilla master
* # Paste URL to commits in ticket, and mark it as "Staged"

We use this landing strategy in order to make backing-out failed commits easier.
