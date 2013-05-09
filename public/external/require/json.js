define({
  load: function (id, require, onload, config) {
    if (config.isBuild) {
      return onload();
    }
     
    var xhr = new XMLHttpRequest();
    xhr.open('GET', id + '?bust=' + Date.now(), true);
    xhr.send(null);
    xhr.onreadystatechange = function (evt) {
      var status, err;
      //Do not explicitly handle errors, those should be
      //visible via console output in the browser.
      if (xhr.readyState === 4) {
        status = xhr.status;
        if (status > 399 && status < 600) {
          //An http 4xx or 5xx error. Signal an error.
          err = new Error(url + ' HTTP status: ' + status);
          err.xhr = xhr;
          onload.error(err);
        } else {
          onload(JSON.parse(xhr.responseText));
        }
      }
    };
  }
});
