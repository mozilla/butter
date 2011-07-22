
BUTTER := butter
SRC_DIR := .
DIST_DIR := $(SRC_DIR)/dist
BUTTER_DIST := $(DIST_DIR)/$(BUTTER).js
BUTTER_MIN := $(DIST_DIR)/$(BUTTER).min.js
BUTTER_CSS_DIST := $(DIST_DIR)/$(BUTTER).css
SOURCE_DIR := $(SRC_DIR)/src
MODULES_DIR := $(SOURCE_DIR)/modules
EXTERNAL_DIR := $(SRC_DIR)/external
TOOLS_DIR := $(SRC_DIR)/tools

JS_LIBS := \
  $(EXTERNAL_DIR)/jquery/jquery.js \
  $(EXTERNAL_DIR)/jquery-ui/jquery-ui.min.js \
  $(EXTERNAL_DIR)/popcorn/popcorn-complete.js \
  $(EXTERNAL_DIR)/trackLiner/trackLiner.js

JS_SRCS := \
  $(SOURCE_DIR)/butter.js \
  $(MODULES_DIR)/butter.comm.js \
  $(MODULES_DIR)/eventeditor/butter.eventeditor.js \
  $(MODULES_DIR)/previewer/butter.previewer.js \
  $(MODULES_DIR)/timeline/butter.timeline.js \
  $(MODULES_DIR)/butter.testmodule.js

CSS_SRCS := \
  $(EXTERNAL_DIR)/jquery-ui/jquery-ui-1.8.5.custom.css \
  $(EXTERNAL_DIR)/trackLiner/trackLiner.css

compile = java -jar $(TOOLS_DIR)/closure/compiler.jar \
                    $(shell for js in $(JS_SRCS) ; do echo --js $$js ; done) \
	                  --compilation_level SIMPLE_OPTIMIZATIONS \
	                  --js_output_file $(1)

all: $(DIST_DIR) $(BUTTER_DIST) $(BUTTER_MIN)
	@@echo "Finished, see $(DIST_DIR)"

$(BUTTER_MIN): $(DIST_DIR) $(BUTTER_DIST)
	@@echo "Building $(BUTTER_MIN)"
	@@$(call compile,$(BUTTER_MIN))

$(BUTTER_DIST): $(DIST_DIR) $(JS_SRCS) $(CSS_SRCS)
	@@echo "Building $(BUTTER_DIST)"
	@@cat $(JS_LIBS) > $(BUTTER_DIST)
	@@cat $(JS_SRCS) >> $(BUTTER_DIST)
	@@echo "Building $(BUTTER_CSS_DIST)"
	@@cat $(CSS_SRCS) > $(BUTTER_CSS_DIST)

$(DIST_DIR):
	@@echo "Creating $(DIST_DIR)"
	@@mkdir $(DIST_DIR)

clean:
	@@rm -fr $(DIST_DIR)
