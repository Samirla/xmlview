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
		safari.self.tab.dispatchMessage('xv.store-settings', {
			action: 'xv.store-settings', 
			name: name, 
			value: value
		});
	},
	
	load: function(obj) {
		this._data = obj;
	}
};

xv_dom.getByClass = function(class_name, context) {
	return _.filter((context || document).getElementsByTagName('*'), function(n) {
		return xv_dom.hasClass(n, class_name);
	});
};

xv_dnd_feedback = {
	draw: function(text, fn) {
		xv_dnd_feedback.__fn = fn;
		safari.self.tab.dispatchMessage('xv.get-dnd-feedback', {text: text});
	}
};

xv_dnd_feedback.__fn = null;

function webkitRenderer() {
	return document && document.getElementById('webkit-xml-viewer-source-xml');
}

(function(){
	var xsl_proc;
	
	function dispatch(name, data) {
		safari.self.tab.dispatchMessage(name, data);
	}
	
	function isXML(doc) {
		return !(doc instanceof HTMLDocument || doc instanceof SVGDocument);
	}
	
	function canTransform() {
		if (webkitRenderer())
			return true;
		return document && isXML(document) && document.documentElement && !(document.documentElement instanceof HTMLElement);
	}
	
	safari.self.addEventListener('message', function(/* Event */ evt) {
		switch (evt.name) {
			case 'xv.get-xsl':
				xsl_proc = new XSLTProcessor();
				xsl_proc.importStylesheet(xv_utils.toXml(evt.message.fileText));
				dispatch('xv.get-settings');
				break;
			case 'xv.get-settings':
				xv_settings.load(evt.message.data);
				xsl_proc.setParameter(null, 'css', safari.extension.baseURI + 'xv.css');
				xsl_proc.setParameter(null, 'custom_css', xv_settings.getValue('custom_css', ''));
				
				var doc = document;
				if (webkitRenderer()) {
					doc = xv_utils.toXml(webkitRenderer().innerHTML);
				}
				
				var source_doc = doc.documentElement;
				var result = xsl_proc.transformToDocument(doc);
				document.replaceChild(document.adoptNode(result.documentElement), document.documentElement);
				
				xv_dom.setHTMLContext(result);
				
				var xml_doc = document.implementation.createDocument();
				xml_doc.replaceChild(xml_doc.adoptNode(source_doc), xml_doc.documentElement);
				
				xv_controller.process(xml_doc);
				
				break;
			case 'xv.get-dnd-feedback':
				xv_dnd_feedback.__fn(evt.message.image);
				break;
				
		}
	}, false);
	
	if (canTransform()) {
		dispatch('xv.get-xsl', {filePath: 'process.xsl'});
	}
})();