/**
 * @include "../../src/signals.js"
 */
 
 
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

var xv_dnd_feedback = {
	draw: function(text, fn) {
		chrome.extension.sendRequest({action: 'xv.get-dnd-feedback', text: text}, function(response){
			fn(response.image);
		});
	}
}

if (canTransform()) {
	var html = xv_dom.fromHTML('<html><body>' +
				'<div class="xv-source-pane"><div class="xv-source-pane-inner"></div></div>' +
				'</body></html>');
	
	var source_doc = document.documentElement;
	
	var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="' + chrome.extension.getURL('xv.css') + '"');
	document.insertBefore(pi, document.firstChild);
	document.replaceChild(html, document.documentElement);
	
	var xml_doc = document.implementation.createDocument();
	xml_doc.replaceChild(xml_doc.adoptNode(source_doc), xml_doc.documentElement);
	
	xv_controller.process(xml_doc);
	
	// handle clicks to copy xpath
	handleDndClicks();
}

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
			chrome.extension.sendRequest({action: 'xv.copy', text: copy_text}, dummy);
			evt.preventDefault();
			evt.stopPropagation();
		}
	}, false);
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse){
	if (request.action == 'xv.search') {
		var search_result = xv_search.search(request.query),
			result = [];
			
		if (search_result.results) {
			result = _.map(search_result.results, function(n, i) {
				/** @type {String} */
				var label = n.label;
				if (n.query_start != -1) {
					label = label.substring(0, n.query_start) + 
						'<match>' + label.substring(n.query_start, n.query_end) + '</match>' +
						label.substring(n.query_end)
				}
				
				return {
					content: n.label + ' (id ' + i + ')',
					description: '<url>' + label + '</url>  <dim>' + n.xpath + '</dim>'
				};
			})
		}
		
		sendResponse(result);
	} else if (request.action == 'xv.search-apply') {
		try {
			var id = request.query.match(/\(id\s+(\d+)\)$/i)[1];
			xv_search.applyProposal(parseInt(id));
		} catch(e) {}
	}
});
