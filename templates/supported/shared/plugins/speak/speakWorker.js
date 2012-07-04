importScripts('speakGenerator.js');

onmessage = function(event) {
  // Pass back the generated WAV along with the ID of the plugin that needs it.
  postMessage({
    popcornID: event.data.popcornID,
    optionsID: event.data.optionsID,
    data: generateSpeech( event.data.text, event.data.args )
  });
};
