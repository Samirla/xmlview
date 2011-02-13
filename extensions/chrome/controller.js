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
		chrome.extension.sendRequest({
			action: 'xv.store-settings', 
			name: name, 
			value: value}, dummy);
	},
	
	load: function(obj) {
		this._data = obj;
	}
};


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
	var source_doc = document.documentElement;
	
	chrome.extension.sendRequest({action: 'xv.get-xsl', filePath: 'process.xsl'},
		function(response) {
			
			var xsl_proc = new XSLTProcessor();
			xsl_proc.importStylesheet(xv_utils.toXml(response.fileText));
			
			chrome.extension.sendRequest({action: 'xv.get-settings'}, function(response){
				xv_settings.load(response.data);
				xsl_proc.setParameter(null, 'css', chrome.extension.getURL('xv.css'));
				xsl_proc.setParameter(null, 'options_url', chrome.extension.getURL('options.html'));
				xsl_proc.setParameter(null, 'custom_css', xv_settings.getValue('custom_css', ''));
				
				var result = xsl_proc.transformToDocument(document);
				document.replaceChild(document.adoptNode(result.documentElement), document.documentElement);
				
				xv_dom.setHTMLContext(result);
				
				var xml_doc = document.implementation.createDocument();
				xml_doc.replaceChild(xml_doc.adoptNode(source_doc), xml_doc.documentElement);
				
				xv_controller.process(xml_doc);
				
				// handle clicks to copy xpath
				handleDndClicks();
			});
		}
	);
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