PREFIX = .

VER = "0.1"

SRC_JS_DIR = ${PREFIX}/js
SRC_POPCORN_DIR = ${PREFIX}/popcorn-js
SRC_POPCORN_PLUGINS_DIR = ${PREFIX}/popcorn-js/plugins


BUILD_DIR = build


DIST_DIR = ${PREFIX}/dist
DIST_JS_DIR = ${PREFIX}/dist/js
DIST_POPCORN_DIR = ${PREFIX}/dist/popcorn-js
DIST_POPCORN_PLUGINS_DIR = ${PREFIX}/dist/popcorn-js/plugins



RHINO ?= java -jar ${BUILD_DIR}/js.jar
CLOSURE_COMPILER = ${BUILD_DIR}/google-compiler-20100917.jar


MINJAR ?= java -jar ${CLOSURE_COMPILER}


SRC_FILES = ${SRC_POPCORN_DIR}/popcorn.js\
	${SRC_POPCORN_PLUGINS_DIR}/googleMap/popcorn.googleMap.js\
	${SRC_POPCORN_PLUGINS_DIR}/footnote/popcorn.footnote.js\
	${SRC_POPCORN_PLUGINS_DIR}/webpage/popcorn.webpage.js\
	${SRC_POPCORN_PLUGINS_DIR}/flickr/popcorn.flickr.js\
	${SRC_POPCORN_PLUGINS_DIR}/image/popcorn.image.js\
	${SRC_POPCORN_PLUGINS_DIR}/wikipedia/popcorn.wikipedia.js\
	${SRC_POPCORN_PLUGINS_DIR}/twitter/popcorn.twitter.js
  
  
MODULES = ${SRC_FILES}


POPCORN = ${DIST_DIR}/popcorn-compiled.js
POPCORN_MIN = ${DIST_DIR}/popcorn-compiled.min.js


all:  popcorn min 
	@@echo "Butter build complete."


popcorn: ${POPCORN}
min: ${POPCORN_MIN}


${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}


${POPCORN}: ${MODULES} | ${DIST_DIR}
	@@echo "Building" ${POPCORN}

	@@cat ${MODULES} | > ${POPCORN};




${POPCORN_MIN}: ${POPCORN}
	@@echo "Building" ${POPCORN_MIN}

	@@head -15 ${POPCORN} > ${POPCORN_MIN}
	@@${MINJAR} --js ${POPCORN} --warning_level QUIET --js_output_file ${POPCORN_MIN}.tmp
	@@cat ${POPCORN_MIN}.tmp >> ${POPCORN_MIN}
	@@rm -f ${POPCORN_MIN}.tmp	
