var xsl = null;
var lastTabId = null;

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

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
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

chrome.pageAction.onClicked.addListener(function(tab) {
	// toggle forced XV display for current url
	var forcedURLs = JSON.parse(localStorage.getItem('forced_urls') || '[]');
	if (_.include(forcedURLs, tab.url)) {
		forcedURLs = _.without(forcedURLs, tab.url);
	} else {
		// make sure there’s no bloated list of documents
		while (forcedURLs.length > 500)
			forcedURLs.shift();
		
		forcedURLs.push(tab.url);
	}
	
	localStorage.setItem('forced_urls', JSON.stringify(forcedURLs));
	chrome.tabs.reload(tab.id);
});

loadXsl('process.xsl');