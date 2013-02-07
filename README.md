Butter
======

An online application for authoring Popcorn projects.

Supported Platforms
-------------------

We're writing Butter so that it runs in modern, HTML5 compatible browsers.
For version 1.0, we're targeting modern HTML5 desktop browsers.
In the current version we are supporting:

### Desktop:
* Chrome stable
* Firefox stable
* Internet Explorer 9+
* Safari stable

Installing locally
-------------------

### Installing prerequisites

* node v0.8 or higher and npm - download from http://nodejs.org/
* A working build environment:

#### Mac OS X
Xcode and Command Line Tools package (warning, this is a large download - so grab some tea while you're doing it)

#### Windows
Python 2.5+ and Visual Studio 2010; specifically:
* uninstall *any and all* "Microsoft Visual C++ 2010 x86/64 Redistributable" copies
* install Microsoft Visual C++ 2010 (Express edition is fine)
* install Microsoft Visual Studio 2010 SP1
* install Microsoft Windows SDK v7.1
* install Microsoft Visual C++ 2010 SP1 Compiler Update for Windows SDK v7.1

#### Linux
build-essential package on Debian/Ubuntu, or the equivalent for your distro

### Getting the code

```
git clone --recursive https://github.com/mozilla/butter.git
cd butter
npm install
```

### Running the development server

```
node make server
```

Navigate to [http://localhost:8888/](http://localhost:8888/) in your favourite browser.

If you want to change the bind IP or port check the [Configuration section](https://github.com/rossbruniges/butter/wiki/Cornfield).

### Installation FAQs

We've tried to include answers to the commen questions, if you have any more problems please let us know.

#### When I try and run npm install I see an error containing 'Error: not found: make'

Make sure that you've installed the Xcode command line tools, they are not bundled with Xcode 4.3 and you need to download/install them separately - (http://developer.apple.com/library/ios/#documentation/DeveloperTools/Conceptual/WhatsNewXcode/Articles/xcode_4_3.html)

#### When checking out the repo it gets to 97% complete and looks like it has crashed...

Yeah it gets slow, but it hasn't crashed. It'll get there in the end!

#### Running npm install throws error around needing to sudo install some files

You shouldn't need to sudo any files - the likelyhood is that you've sudo'ed some files in the past though.

Run this:

```
sudo rm -rf ~/.npm
```

This may cause some other node apps you have to fail when you try to run them again, but you should be able to `npm install` the dependancies back in.

Getting Involved
----------------

* Chat with the Popcorn community on irc.mozilla.org in the [#popcorn](irc://irc.mozilla.org/popcorn) channel. The developers hang out here on a daily basis.
* We also have a [mailing list](https://mail.mozilla.org/listinfo/community-popcorn) that you can subscribe to.
* File bugs and feature requests on our [issue tracker](https://webmademovies.lighthouseapp.com/projects/65733-butter/).
* The latest code can be found on our [Github repository](https://github.com/mozilla/butter/).
* If you'd like to contribute code first have a read of our [contributor guide](https://github.com/mozilla/butter/blob/master/CONTRIBUTING.md)
