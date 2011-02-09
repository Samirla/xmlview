function isXML(doc) {
	return !(doc instanceof HTMLDocument || doc instanceof SVGDocument);
}

function canTransform() {
	return document && isXML(document) && document.documentElement;
}

xv_dom.getByClass = function(class_name, context) {
	return _.filter((context || document).getElementsByTagName('*'), function(n) {
		return xv_dom.hasClass(n, class_name);
	});
};

if (canTransform()) {
	var html = xv_dom.fromHTML('<html><body>' +
				'<div class="xv-source-pane"><div class="xv-source-pane-inner"></div></div>' +
				'</body></html>');
	
	var source_doc = document.documentElement;
	
	var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="' + chrome.extension.getURL('xv.css') + '"');
	document.insertBefore(pi, document.firstChild);
		
	document.replaceChild(html, document.documentElement);
}