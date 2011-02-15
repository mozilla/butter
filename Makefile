PREFIX = .

VER = "0.1.1"

SRC_JS_DIR = ${PREFIX}/js


BUILD_DIR = build


DIST_DIR = ${PREFIX}/dist
DIST_JS_DIR = ${PREFIX}/dist/js





RHINO ?= java -jar ${BUILD_DIR}/js.jar
CLOSURE_COMPILER = ${BUILD_DIR}/google-compiler-20100917.jar


MINJAR ?= java -jar ${CLOSURE_COMPILER}


APP_SRC = ${SRC_JS_DIR}/butter.application.js


APPLICATION = ${DIST_JS_DIR}/butter.application.js
APPLICATION_MIN = ${DIST_JS_DIR}/butter.application.min.js


all:  application min 
	@@echo "Butter build complete."


application: ${APPLICATION}
min: ${APPLICATION_MIN}


${DIST_JS_DIR}:
	@@mkdir -p ${DIST_JS_DIR}


${APPLICATION}: ${MODULES} | ${DIST_JS_DIR}
	@@echo "Building" ${APPLICATION}
	
	@@cat ${APP_SRC} > ${APPLICATION};




${APPLICATION_MIN}: ${APPLICATION}
	@@echo "Building" ${APPLICATION_MIN}

	@@head -8 ${APPLICATION} > ${APPLICATION_MIN}
	@@${MINJAR} --js ${APPLICATION} --warning_level QUIET --js_output_file ${APPLICATION_MIN}.tmp
	@@cat ${APPLICATION_MIN}.tmp >> ${APPLICATION_MIN}
	@@rm -f ${APPLICATION_MIN}.tmp  


clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}