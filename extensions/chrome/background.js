var xsl = null;
var interceptedContentTypes = ['text/xml', 'application/xml', 'application/atom+xml', 'application/rss+xml'];
const forcedUrlsKey = 'forced_urls';

function loadXsl(url) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			xsl = xhr.responseText;
		}
	};
	xhr.send();
}

// Do some analytics
window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
ga('create', 'UA-21435223-1', 'auto');
ga('set', 'checkProtocolTask', null);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	switch (request.action) {
		case 'xv.get-dnd-feedback':
			sendResponse({ image: xv_dnd_feedback.draw(request.text) });
			break;
		case 'xv.copy':
			ga('send', 'event', 'Interaction', 'Copy tag');
			var ta = document.getElementById('ta');
			ta.value = request.text;
			ta.select();
			sendResponse({ success: document.execCommand("copy", false, null) });
			break;
		case 'xv.get-xsl':
			if (xsl === null)
				loadXsl(request.filePath);

			sendResponse({ fileText: xsl });
			break;
		case 'xv.get-settings':
			chrome.storage.local.get(data => sendResponse({ data }));
			return true;
		case 'xv.store-settings':
			const payload = {};
			payload[request.name] = request.value;
			chrome.storage.local.set(payload);
			break;
		case 'xv.show-page-action':
			chrome.pageAction.show(sender.tab.id);
			break;
		case 'xv.hide-page-action':
			chrome.pageAction.hide(sender.tab.id);
			break;
		case 'xv.analytics':
			ga('send', 'event', request.category, request.event, request.label);
			break;
	}
});

function getForcedUrls() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(forcedUrlsKey, resp => {
			const urls = resp && resp[forcedUrlsKey] || [];
			resolve(urls);
		});
	});
}

function setForcedUrls(urls) {
	return new Promise(resolve => {
		const payload = {};
		payload[forcedUrlsKey] = urls;
		chrome.storage.local.set(payload, () => resolve(urls));
	});
}

function addForcedUrl(url) {
	return getForcedUrls().then(urls => {
		if (!urls.includes(url)) {
			// make sure there’s no bloated list of documents
			while (urls.length > 500) {
				urls.shift();
			}

			urls.push(url);
			return setForcedUrls(urls);
		}
	});
}

function removeForcedUrl(url) {
	return getForcedUrls().then(urls => {
		return setForcedUrls(urls.filter(entry => entry !== url));
	});
}

chrome.pageAction.onClicked.addListener(function (tab) {
	// toggle forced XV display for current url
	getForcedUrls().then(urls => {
		const m = (tab.url || '').match(/^\w+:/);
		const protocol = m && m[0];
		let promise;

		if (urls.includes(tab.url)) {
			ga('send', 'event', 'Page Action', 'Disable', protocol);
			promise = removeForcedUrl(tab.url);
		} else {
			ga('send', 'event', 'Page Action', 'Enable', protocol);
			promise = addForcedUrl(tab.url);
		}

		promise.then(() => chrome.tabs.reload(tab.id));
	});
});

// chrome.webRequest.onHeadersReceived.addListener(
// 	function (details) {
// 		if (~details.statusLine.indexOf('200 OK')) {
// 			chrome.storage.local.get('intercept_requests', resp => {
// 				var shouldIntercept = resp['intercept_requests'];
// 				if (!shouldIntercept || shouldIntercept == 'false') {
// 					removeForcedUrl(details.url);
// 					return;
// 				}

// 				var isModified = false;
// 				_.each(details.responseHeaders, function (header) {
// 					if (header.name.toLowerCase() == 'content-type') {
// 						var headerValue = header.value.toLowerCase();
// 						var matchedType = _.find(interceptedContentTypes, function (t) {
// 							return ~headerValue.indexOf(t);
// 						});

// 						if (matchedType) {
// 							var parts = headerValue.split(';');
// 							parts[0] = 'text/plain';
// 							header.value = parts.join(';');
// 							isModified = true;
// 						}
// 					}
// 				});

// 				if (isModified) {
// 					addForcedUrl(details.url);
// 					return { responseHeaders: details.responseHeaders };
// 				}
// 			});
// 		}
// 	},
// 	{
// 		'urls': ['http://*/*', 'https://*/*'],
// 		'types': ['main_frame']
// 	},
// 	['blocking', 'responseHeaders']);

loadXsl('process.xsl');
