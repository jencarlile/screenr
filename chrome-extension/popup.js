// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
// function getCurrentTabUrl(callback) {
//   // Query filter to be passed to chrome.tabs.query - see
//   // https://developer.chrome.com/extensions/tabs#method-query
//   var queryInfo = {
//     active: true,
//     currentWindow: true
//   };

//   chrome.tabs.query(queryInfo, function(tabs) {
//     // chrome.tabs.query invokes the callback with a list of tabs that match the
//     // query. When the popup is opened, there is certainly a window and at least
//     // one tab, so we can safely assume that |tabs| is a non-empty array.
//     // A window can only have one active tab at a time, so the array consists of
//     // exactly one tab.
//     var tab = tabs[0];

//     // A tab is a plain object that provides information about the tab.
//     // See https://developer.chrome.com/extensions/tabs#type-Tab
//     var url = tab.url;

//     // tab.url is only available if the "activeTab" permission is declared.
//     // If you want to see the URL of other tabs (e.g. after removing active:true
//     // from |queryInfo|), then the "tabs" permission is required to see their
//     // "url" properties.
//     console.assert(typeof url == 'string', 'tab.url should be a string');

//     callback(url);
//   });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
// }




/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */
// function getImageUrl(searchTerm, callback, errorCallback) {
//   // Google image search - 100 searches per day.
//   // https://developers.google.com/image-search/
//   var searchUrl = 'https://ajax.googleapis.com/ajax/services/search/images' +
//     '?v=1.0&q=' + encodeURIComponent(searchTerm);
//   var x = new XMLHttpRequest();
//   x.open('GET', searchUrl);
//   // The Google image search API responds with JSON, so let Chrome parse it.
//   x.responseType = 'json';
//   x.onload = function() {
//     // Parse and process the response from Google Image Search.
//     var response = x.response;
//     if (!response || !response.responseData || !response.responseData.results ||
//         response.responseData.results.length === 0) {
//       errorCallback('No response from Google Image search!');
//       return;
//     }
//     var firstResult = response.responseData.results[0];
//     // Take the thumbnail instead of the full image to get an approximately
//     // consistent image size.
//     var imageUrl = firstResult.tbUrl;
//     var width = parseInt(firstResult.tbWidth);
//     var height = parseInt(firstResult.tbHeight);
//     console.assert(
//         typeof imageUrl == 'string' && !isNaN(width) && !isNaN(height),
//         'Unexpected respose from the Google Image Search API!');
//     callback(imageUrl, width, height);
//   };
//   x.onerror = function() {
//     errorCallback('Network error.');
//   };
//   x.send();
// }



// function renderStatus(statusText) {
//   document.getElementById('status').textContent = statusText;
// }

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


// --------------- Experimenting with screen streaming ------------------------
function startScreenStreamFrom(streamId) {
  navigator.webkitGetUserMedia({
    audio: false,  // was false...
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: streamId,
        maxWidth: window.screen.width,
        maxHeight: window.screen.height
      }
    }
  },
  // successCallback
  function(screenStream) {
    
    // Play in <video> element
    videoElement = document.getElementById('video');
    videoElement.src = URL.createObjectURL(screenStream);
    videoElement.play();

    recorder = new MediaRecorder(screenStream);
    recorder.ondataavailable = onDataAvailable;
    recorder.start();

  },
  // errorCallback
  function(err) {
    console.log('getUserMedia failed!: ' + err);
  });
}


function onRecordButtonClick() {
    chrome.desktopCapture.chooseDesktopMedia(["screen", "window", "tab"], function(streamId) {
    console.log("chooseDesktopMedia", streamId);
    startScreenStreamFrom(streamId);
  });
}



document.addEventListener('DOMContentLoaded', function() {

  document.getElementById("stop").addEventListener('click', onStopButtonClick);
  // document.getElementById("record").addEventListener('click', onRecordButtonClick);


  
  // Playing with chrome.tts
  // chrome.tts.getVoices(
  //   function(voices) {
  //     for (var i = 0; i < voices.length; i++) {
  //       console.log('Voice ' + i + ':');
  //       console.log('  name: ' + voices[i].voiceName);
  //       console.log('  lang: ' + voices[i].lang);
  //       console.log('  gender: ' + voices[i].gender);
  //       console.log('  extension id: ' + voices[i].extensionId);
  //       console.log('  event types: ' + voices[i].eventTypes);
  //     }
  //   });

  // chrome.tts.speak("Hello, Jen.");
  // chrome.tts.speak("Hello, Vivian.", { 'enqueue': true, 'gender': 'female'});




  // Playing with chrome.desktopCapture
  var media = chrome.desktopCapture.chooseDesktopMedia(["screen", "window", "tab"], function(streamId) {
    console.log("chooseDesktopMedia", streamId);
    startScreenStreamFrom(streamId);
  });




  // Sample code
  // getCurrentTabUrl(function(url) {
    
  //   console.log("Current URL", url);
    

  //   // Put the image URL in Google search.
  //   renderStatus('Performing Google Image search for ' + url);

  //   getImageUrl(url, function(imageUrl, width, height) {

  //     renderStatus('Search term: ' + url + '\n' +
  //         'Google image search result: ' + imageUrl);
  //     var imageResult = document.getElementById('image-result');
  //     // Explicitly set the width/height to minimize the number of reflows. For
  //     // a single image, this does not matter, but if you're going to embed
  //     // multiple external images in your page, then the absence of width/height
  //     // attributes causes the popup to resize multiple times.
  //     imageResult.width = width;
  //     imageResult.height = height;
  //     imageResult.src = imageUrl;
  //     imageResult.hidden = false;

  //   }, function(errorMessage) {
  //     renderStatus('Cannot display image. ' + errorMessage);
  //   });

  // });

});
