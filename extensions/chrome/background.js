var xsl = null;
var interceptedContentTypes = ['text/xml', 'application/xml', 'application/atom+xml', 'application/rss+xml'];

function loadXsl(url){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function(){
		if (xhr.readyState == 4) {
			xsl = xhr.responseText;
		}
	};
	xhr.send();
}

(chrome.extension.onMessage || chrome.extension.onRequest).addListener(function(request, sender, sendResponse) {
	switch (request.action) {
		case 'xv.get-dnd-feedback':
			sendResponse({image: xv_dnd_feedback.draw(request.text)});
			break;
		case 'xv.copy':
			var ta = document.getElementById('ta');
			ta.value = request.text;
			ta.select();
			sendResponse({success: document.execCommand("copy", false, null)});
			break;
		case 'xv.get-xsl':
			if (xsl === null)
				loadXsl(request.filePath);
				
			sendResponse({fileText: xsl});
			break;
		case 'xv.get-settings':
			sendResponse({data: xv_settings.dump()});
			break;
		case 'xv.store-settings':
			xv_settings.setValue(request.name, request.value);
			break;
		case 'xv.show-page-action':
			chrome.pageAction.show(sender.tab.id);
			break;
		case 'xv.hide-page-action':
			chrome.pageAction.hide(sender.tab.id);
			break;
	}
});

function addForcedUrl(url, forcedURLs) {
	forcedURLs = forcedURLs || JSON.parse(localStorage.getItem('forced_urls') || '[]');
	if (!_.include(forcedURLs, url)) {
		// make sure there’s no bloated list of documents
		while (forcedURLs.length > 500)
			forcedURLs.shift();
		
		forcedURLs.push(url);
	}
	
	localStorage.setItem('forced_urls', JSON.stringify(forcedURLs));
}

function removeForcedUrl(url, forcedURLs) {
	forcedURLs = forcedURLs || JSON.parse(localStorage.getItem('forced_urls') || '[]');
	forcedURLs = _.without(forcedURLs, url);
	localStorage.setItem('forced_urls', JSON.stringify(forcedURLs));
}

chrome.pageAction.onClicked.addListener(function(tab) {
	// toggle forced XV display for current url
	var forcedURLs = JSON.parse(localStorage.getItem('forced_urls') || '[]');
	if (_.include(forcedURLs, tab.url)) {
		removeForcedUrl(tab.url, forcedURLs);
	} else {
		addForcedUrl(tab.url, forcedURLs);
	}
	
	chrome.tabs.reload(tab.id);
});

chrome.webRequest.onHeadersReceived.addListener(
	function(details) {
		if (~details.statusLine.indexOf('200 OK')) {
			var shouldIntercept = localStorage.getItem('intercept_requests');
			if (!shouldIntercept || shouldIntercept == 'false') {
				removeForcedUrl(details.url);
				return;
			}
			
			var isModified = false;
			_.each(details.responseHeaders, function(header) {
				if (header.name.toLowerCase() == 'content-type') {
					var headerValue = header.value.toLowerCase();
					var matchedType = _.find(interceptedContentTypes, function(t) {
						return ~headerValue.indexOf(t);
					});
					
					if (matchedType) {
						var parts = headerValue.split(';');
						parts[0] = 'text/plain';
						header.value = parts.join(';');
						isModified = true;
					}
				}
			});
			
			if (isModified) {
				addForcedUrl(details.url);
				return {responseHeaders: details.responseHeaders};
			}
		}
	}, 
	{
		'urls': ['http://*/*', 'https://*/*'],
		'types': ['main_frame']
	}, 
	['blocking', 'responseHeaders']);

loadXsl('process.xsl');