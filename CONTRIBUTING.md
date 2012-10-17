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
2. Set the status of the ticket to `peer-review requested`, and choose someone to review your code. If you're not sure who should review your code, ask in [#popcorn on IRC](irc://irc.mozilla.org/popcorn).
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

Testing
-------

Before contributing a new patch be sure to run the following:

* Run `node make check` to lint butter
* Run `node make server` and navigate to `http://localhost:8888/test` to run the browser tests

If you are contributing changes to cornfield, make sure you run the cornfield tests with `npm test`.

Cornfield will attempt to run tests for using a mysql backend, but they will not run if mysql is not set up properly. To ensure that they run, use the `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` environment variables to tell the tests which host, database, username, and password to use respectively. If `DB_HOST` is left blank, `localhost` is assumed.
