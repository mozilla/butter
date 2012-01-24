#############################################################################################
# NOTES:
#
# This Makefile assumes that you have the following installed, setup:
#
#  * node: http://nodejs.org
#  * Unixy shell (use msys on Windows)
#
#############################################################################################

SRC_DIR := ./
DIST_DIR := ./dist
EVENTEDITOR_SRC := $(SRC_DIR)/butter.editors.js
EVENTEDITOR_DIST := $(DIST_DIR)/butter.editors.js
EVENTEDITOR_MIN := $(DIST_DIR)/butter.editors.min.js
TOOLS_DIR := ../../tools

compile = node $(TOOLS_DIR)/node_modules/uglify-js/bin/uglifyjs -o $(1) $(EVENTEDITOR_DIST)

all: $(DIST_DIR) $(EVENTEDITOR_DIST) $(EVENTEDITOR_MIN)
	@@echo "Finished, see $(DIST_DIR)"

$(DIST_DIR):
	@@echo "Creating $(DIST_DIR)"
	@@mkdir $(DIST_DIR)

$(EVENTEDITOR_DIST): $(DIST_DIR) $(EVENTEDITOR_SRC)
	@@echo "Building $(EVENTEDITOR_DIST)"
	@@node $(TOOLS_DIR)/r.js -o $(SRC_DIR)/build.js

$(EVENTEDITOR_MIN): $(DIST_DIR) $(EVENTEDITOR_SRC)
	@@echo "Building $(EVENTEDITOR_MIN)"
	@@$(call compile,$(EVENTEDITOR_MIN))

clean:
	@@rm -fr $(DIST_DIR)
