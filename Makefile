#############################################################################################
# NOTES:
#
# This Makefile assumes that you have the following installed, setup:
#
#  * node: http://nodejs.org
#  * Unixy shell (use msys on Windows)
#
#############################################################################################

SRC_DIR := ./src
DIST_DIR := ./dist
BUTTER_SRC := $(SRC_DIR)/butter.js
EVENTEDITOR_SRC := $(SRC_DIR)/eventeditor
EVENTEDITOR_DIST_DIR := $(EVENTEDITOR_SRC)/dist
EVENTEDITOR_DIST := $(EVENTEDITOR_DIST_DIR)/butter.editors.js
EVENTEDITOR_MIN := $(EVENTEDITOR_DIST_DIR)/butter.editors.min.js
PREVIEWER_SRC := $(SRC_DIR)/previewer
PREVIEWER_DIST_DIR := $(PREVIEWER_SRC)/dist
PREVIEWER_DIST := $(PREVIEWER_DIST_DIR)/butter.previewer.js
PREVIEWER_MIN := $(PREVIEWER_DIST_DIR)/butter.previewer.min.js
BUTTER_DIST := $(DIST_DIR)/butter.js
BUTTER_MIN := $(DIST_DIR)/butter.min.js
TOOLS_DIR := ./tools

compile = node $(TOOLS_DIR)/node_modules/uglify-js/bin/uglifyjs -o $(1) $(BUTTER_DIST)

all: $(DIST_DIR) $(BUTTER_DIST) $(BUTTER_MIN) $(EVENTEDITOR_DIST) $(PREVIEWER_DIST)
	@@echo "Finished, see $(DIST_DIR)"

$(DIST_DIR):
	@@echo "Creating $(DIST_DIR)"
	@@mkdir $(DIST_DIR)

$(BUTTER_DIST): $(DIST_DIR) $(BUTTER_SRC)
	@@echo "Building $(BUTTERR_DIST)"
	@@node $(TOOLS_DIR)/r.js -o $(TOOLS_DIR)/build.js

$(BUTTER_MIN): $(DIST_DIR) $(BUTTER_SRC)
	@@echo "Building $(BUTTER_MIN)"
	@@$(call compile,$(BUTTER_MIN))

$(EVENTEDITOR_DIST): $(DIST_DIR) $(EVENTEDITOR_SRC)
	@@echo "Recursively Making Eventeditor"
	@@cd $(EVENTEDITOR_SRC); $(MAKE)
	@@cp $(EVENTEDITOR_DIST) $(DIST_DIR)
	@@cp $(EVENTEDITOR_MIN) $(DIST_DIR)

$(PREVIEWER_DIST): $(DIST_DIR) $(PREVIEWER_SRC)
	@@echo "Recursively Making Previewer"
	@@cd $(PREVIEWER_SRC); $(MAKE)
	@@cp $(PREVIEWER_DIST) $(DIST_DIR)
	@@cp $(PREVIEWER_MIN) $(DIST_DIR)

clean:
	@@rm -fr $(DIST_DIR)
	@@rm -fr $(EVENTEDITOR_DIST_DIR)
	@@rm -fr $(PREVIEWER_DIST_DIR)
