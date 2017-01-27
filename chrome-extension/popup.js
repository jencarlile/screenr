// Flux Screen Recorder Extension
// Hackathon January 2017

// ------------- Experiment on recording -------------------
var buffer = [];
var recorder;



function onDataAvailable(e) {
  if (e.data) {
    buffer.push(e.data);
  }
}

function bufferToDataUrl(callback) {
  var blob = new Blob(buffer, { type:'video/webm' });

  var reader = new FileReader();
  reader.onload = function() {
    callback(reader.result); 
  };

  reader.readAsDataURL(blob);
}

// Return file that we can send to the server
function dataUrlToFile(dataUrl) {
  var binary = atob(dataUrl.split(',')[1]),
  data = [];

  for (var i = 0; i < binary.length; i++) {
    data.push(binary.charCodeAt(i));
  }

  return new File([new Uint8Array(data)], 'recorded-video.webm', { type: 'video/webm' });
}



function onStopButtonClick() {
  console.log("STOP");

  try {recorder.stop();
    recorder.stream.getTracks().forEach(function(track) {
      track.stop();
    }); 
  } catch (e) { 
    console.error("Error!", e) 
  }

  bufferToDataUrl(function(dataUrl) {
    var file = dataUrlToFile(dataUrl);
    console.log("File", file);

    // Do something with the file...
    chrome.downloads.download({
      url: dataUrl,
      filename: 'recorded-video.webm'
    });

  });
}



// ----------- Helper functions ----------------
function startStream(stream) {
  console.log("startStream()::", stream);
  videoElement = document.getElementById('video');
  videoElement.src = URL.createObjectURL(stream);
  videoElement.play();

  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = onDataAvailable;
  recorder.start();
}


// --------------- Experimenting with screen streaming ------------------------
function startScreenStreamFrom(streamId) {
  navigator.webkitGetUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: streamId,
        maxWidth: window.screen.width,
        maxHeight: window.screen.height
      }
    }
  },
  function(screenStream) { // successCallback
    // Play in <video> element
    console.log("start streaming: ", screenStream);
    startStream(screenStream);
  },
  function(err) { // errorCallback
    console.log('getUserMedia failed!: ' + err);
  });
}

function onRecordButtonClick() {
    chrome.desktopCapture.chooseDesktopMedia(["screen", "window", "tab"], function(streamId) {
      console.log("chooseDesktopMedia", streamId);
      startScreenStreamFrom(streamId);
    });
}

// ----- Experimenting with tab streaming -----
function onRecordTab() {
  chrome.tabCapture.capture( 
    { video: true },
    function(tabStream) { 
      startStream(tabStream); 
    }
  );
}


document.addEventListener('DOMContentLoaded', function() {

  document.getElementById("stop").addEventListener('click', onStopButtonClick);
  // document.getElementById("record").addEventListener('click', onRecordButtonClick);
  document.getElementById("record").addEventListener('click', onRecordTab);


});
