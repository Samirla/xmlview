/**
 * @include "../../src/signals.js"
 */
 
xv_settings = {
	_data: {},
	getValue: function(name, default_value) {
		var value = (name in this._data) ? this._data[name] : default_value;
		
		switch (typeof default_value) {
			case 'number':
				return parseFloat(value);
			case 'boolean':
				if (typeof value == 'string' && value.toLowerCase() == 'false')
					value = false;
				return !!value;
			default:
				return value;
		}
	},
	
	setValue: function(name, value) {
		this._data[name] = value;
		sendMessage({
			action: 'xv.store-settings', 
			name: name, 
			value: value}, dummy);
	},
	
	load: function(obj) {
		this._data = obj;
	}
};

//fallback to old Chrome API
var sendMessage = chrome.runtime.sendMessage;


/**
 * Returns rendered by Chrome XML tree container
 * @return {HTMLElement} 
 */
function getRenderedContent() {
	var xml_tree_viewer_output = document.getElementsByClassName('pretty-print');
	return xml_tree_viewer_output && xml_tree_viewer_output[0];
}

function isXML(doc) {
	var docElem = doc.documentElement;
	var isSVG = docElem && docElem.namespaceURI == 'http://www.w3.org/2000/svg';
	return !(doc instanceof HTMLDocument || isSVG);
}

function canTransform(doc) {
	doc = doc || this._doc;
	if (!doc)
		return false;
	
	if (doc.nodeType == 1)
		doc = doc.ownerDocument;
	
	return 'documentElement' in doc && isXML(doc) && !(doc.documentElement instanceof HTMLElement);
}

xv_dom.getByClass = function(class_name, context) {
	return _.filter((context || document).getElementsByTagName('*'), function(n) {
		return xv_dom.hasClass(n, class_name);
	});
};

var xv_dnd_feedback = {
	draw: function(text, fn) {
		sendMessage({action: 'xv.get-dnd-feedback', text: text}, function(response){
			fn(response.image);
		});
	}
};

function dummy() {}

function handleDndClicks() {
	var is_dnd_mode = false,
		copy_text = '';
		
	xv_signals.dndModeEntered.add(function() {
		is_dnd_mode = true;
	});
	
	xv_signals.dndModeQuit.add(function() {
		is_dnd_mode = false;
	});
	
	xv_signals.dndMessageChanged.add(function(message) {
		copy_text = message;
	});
	
	document.addEventListener('click', function(evt) {
		if (is_dnd_mode && copy_text) {
			sendMessage({action: 'xv.copy', text: copy_text}, dummy);
			evt.preventDefault();
			evt.stopPropagation();
		}
	}, false);
}

function doTransform(data) {
	// future checks:
	// https://bugs.webkit.org/show_bug.cgi?id=56263
	// typeof(window['handleWebKitXMLViewerOnLoadEvent'])
	// document.getElementById('webkit-xml-viewer-source-xml')
	sendMessage({action: 'xv.get-xsl', filePath: 'process.xsl'},
		function(response) {
			var xsl_proc = new XSLTProcessor();
			xsl_proc.importStylesheet(xv_utils.toXml(response.fileText));
			
			sendMessage({action: 'xv.get-settings'}, function(response) {
				xv_settings.load(response.data);
				xsl_proc.setParameter(null, 'css', chrome.extension.getURL('xv.css'));
				xsl_proc.setParameter(null, 'options_url', chrome.extension.getURL('options.html'));
				xsl_proc.setParameter(null, 'custom_css', xv_settings.getValue('custom_css', ''));
				
				var result = xsl_proc.transformToDocument(data);
				document.replaceChild(document.adoptNode(result.documentElement), document.documentElement);
				
				xv_dom.setHTMLContext(result);
				
				var doctype = document.implementation.createDocumentType('html',
                                        '-//W3C//DTD XHTML 1.0 Transitional//EN',
                                        'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd');
 
                                var xml_doc = document.implementation.createDocument(
                                        'http://www.w3.org/1999/xhtml', 'html', doctype);
 
				var replacement = null;
				if (data instanceof Document) {
					replacement = xml_doc.adoptNode(data.documentElement);
				} else {
					// assume 'data' is a node with HTML elements in it
					replacement = xml_doc.createDocumentFragment();
					_.each(data.childNodes, function(elem){
						replacement.appendChild(xml_doc.importNode(elem, true));
					});
				}
				xml_doc.replaceChild(replacement, xml_doc.documentElement);
				
				xv_controller.process(xml_doc);
				
				// handle clicks to copy xpath
				handleDndClicks();
			});
		}
	);
}

// XXX init

// Chrome 12.x+ check: https://bugs.webkit.org/show_bug.cgi?id=56263
//if (typeof(window.reloadWithWebKitXMLViewerDisabled) == 'function') {
//	window.reloadWithWebKitXMLViewerDisabled();
//} else if (window.currentDocumentIsXMLWithoutStyle && currentDocumentIsXMLWithoutStyle()) {
//	console.log('show custom');
////	showCustomXMLViewer();
//}

if (!('__canRenderWithXV' in this)) {
	this['__canRenderWithXV'] = canTransform(document);
}

function togglePageAction(isEnabled) {
	sendMessage({
		action: isEnabled ? 'xv.show-page-action' : 'xv.hide-page-action'
	});
}

function renderPage(url) {
	// it may look awkward, but doing XHR request rather that parsing current
	// document is the most reliable way to get correctly parsed XML
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200 || xhr.status == 0) {
				try {
					doTransform(xv_utils.toXml(xhr.responseText));
				} catch (e) {
					console.log('XV Extension: Unable to render document: invalid XML');
					console.error(e);
				}
			}
		}
	};
	
	xhr.open("GET", url || document.URL, true);
	xhr.send();
}

// this code will be executed twice since original document will be replaced 
// with Chrome's XML tree viewer. The real XML doc will have 'interactive' state,
// but replaced doc will have 'complete' state
document.addEventListener('readystatechange', function() {
	if (document.readyState == 'complete') {
		var webIntent = window.webkitIntent || window.intent;
		if (webIntent) {
			var url = webIntent.getExtra ? webIntent.getExtra('url') : webIntent.data[0].url;
			if (!url)
				return;
			
			renderPage(url);
			togglePageAction(false);
			return;
		}
		
		
		var el = document && document.getElementById('webkit-xml-viewer-source-xml');
		if (el) { // Chrome 12.x with native XML viewer
			el.parentNode.removeChild(el);
			doTransform(el);
			togglePageAction(false);
		} else if (__canRenderWithXV) {
			renderPage();
			togglePageAction(false);
		} else {
			// let’s see if current URL is in forced list
			togglePageAction(true);
			sendMessage({action: 'xv.get-settings'}, function(response) {
				var forcedURLs = response.data.forced_urls;
				if (forcedURLs && _.include(forcedURLs, document.URL)) {
					renderPage();
				}
			});
		}
	}
});

