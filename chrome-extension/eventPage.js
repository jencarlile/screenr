// Background event page for Chrome Extension

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	console.log("Got message", sender.tab ?
		"from a content script: " + sender.tab.url :
		"from the extension");
	if (request.msg === "recording-complete") {
		console.log("About to download", request.filename);
		chrome.downloads.download( {
			url: request.url,
			filename: request.filename
		});

		sendResponse({msg: "Received file"});
	}
});