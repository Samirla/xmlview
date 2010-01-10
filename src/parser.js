/**
 * Colorized document tree parser. Parses current document tree
 * into a clean XML tree 
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @include "xmlview.js"
 */
(function(){
	
	var _id = 0,
		/**
		 * Map of parsed elements and their ID's
		 */
		element_map = {};
		
	/** 
	 * Generates new and unique ID
	 * @return {Number}
	 */
	function generateId() {
		return _id++;
	}
	
	/**
	 * Escape non-safe XML characters
	 * @param {String} str
	 * @return {String}
	 */
	function escapeXML(str) {
		return str
			.replace(/&(?!\w+\;)/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}
	
	/**
	 * Escape single and double quotes in string
	 * @param {String} str
	 */
	function escapeQuotes(str) {
		return escapeXML(str.replace(/(["'])/g, '\\$1'));
	}
	
	/**
	 * Test if passed string contains whitespace-only characters
	 * @param {String} str
	 * @return {Boolean}
	 */
	function isWhiteSpace(str){
		return !(/[^\s\n\r]/).test(str);
	}
	
	/**
	 * Simple tag tree
	 * @class
	 */
	function Tag(name) {
		this.name = name;
		this.children = [];
		this.attributes = {};
		this.parent = null;
		this.type = 1;
	}
	
	Tag.prototype = {
		type: 1,
		/**
		 * @param {Tag} tag
		 */
		addChild: function(tag) {
			tag.parent = this;
			this.children.push(tag);
		},
		
		addAttribute: function(name, value) {
			if (name)
				this.attributes[name] = value;
		},
		
		toString: function() {
			// make attributes string
			var attr_list = [],
				attrs = this.attributes;
				
			for (var a in attrs) if (attrs.hasOwnProperty(a))
				attr_list.push(a + '="' + escapeQuotes(attrs[a]) + '"');
				
			var attrs_str = attr_list.length ? attr_list.join(' ') : '';
			
			var open = '',
				close = '';
				
			if (this.name) {
				open = '<' + this.name + ( attrs_str ? ' ' : '' ) + attrs_str + '>',
				close = '</' + this.name + '>';
			}
			
			var children = [];
			for (var i = 0, il = this.children.length; i < il; i++) {
				children.push(this.children[i].toString());
			}
			
			return open + children.join('') + close;
		}
	};
	
	/**
	 * Simple text node
	 * @class
	 */
	function TextNode(text) {
		this.value = escapeXML($.trim(text));
	}
	
	TextNode.prototype = {
		type: 3,
		
		toString: function() {
			return this.value;
		}
	};
	
	
	/**
	 * Test if passed element contains specified class
	 * @param {Element} elem
	 * @param {String} class_name
	 * @return {Boolean}
	 */
	function hasClass(elem, class_name) {
		class_name = ' ' + class_name + ' ';
		var _cl = elem.className;
		return _cl && (' ' + _cl + ' ').replace(/[\t\n]/g, ' ').indexOf(class_name) >= 0;
	}
	
	/**
	 * Returns all alement classes and hash for faster lookup
	 * @param {Element} elem
	 */
	function getClasses(elem) {
		var ar = (elem.className || '').split(/\s+/),
			result = {};
			
		for (var i = 0, il = ar.length; i < il; i++) {
			if (ar[i])
				result[ar[i]] = true;
		}
		
		return result;
	}
	
	/**
	 * Transforms current colorized document tree into a XML string
	 * for parsing using
	 * @param {Element} [context] Search starting point (default is <code>document</code>) 
	 * @param {Tag} [root] Root tag 
	 */
	function documentToXMLString(context, root) {
		context = context || document;
		root = root || new Tag();
		
		$(context).contents()
			.each(function(){
				switch (this.nodeType) {
					case 1:
						if (hasClass(this, 'x-tag') || hasClass(this, 'x-tag-compact')) {
							var tag = parseTag(this);
							root.addChild(tag);
							documentToXMLString($(this).find('>.x-tag-content'), tag);
						}
						break;
					case 3: // text node
						if (!isWhiteSpace(this.nodeValue))
							root.addChild(new TextNode(this.nodeValue));
						break;
				}
			});
		
		return root;
	}
	
	/**
	 * Parses HTML tag structure into a simple tag object
	 * @param {Element} elem 
	 * @return {Tag}
	 */
	function parseTag(elem) {
		elem = $(elem);
		var open_tag = elem.find('>.x-tag-open');
		var tag = new Tag(open_tag.find('.x-tag-name').text());
		open_tag.find('.x-tag-attr').each(function(){
			var attr = $(this);
			tag.addAttribute(attr.find('.x-tag-attr-name').text(), attr.find('.x-tag-attr-value').text());
		});
		
		return tag;
	}
	
	
	
	/**
	 * Transforms text into XML document
	 * @param {String} text
	 * @return {Document}
	 */
	function toXml(text) {
		var doc = null;
		try {
			if (window.ActiveXObject) { // IE
				doc = new ActiveXObject('Microsoft.XMLDOM');
				doc.async = false;
				doc.loadXML(text);
			} else if (window.DOMParser) { // W3C DOM
				var doc = (new DOMParser()).parseFromString(text, 'text/xml');
			}
			
			if (!doc || !doc.documentElement
					|| doc.documentElement.nodeName == 'parsererror'
					|| doc.getElementsByTagName('parsererror').length) {
				console.error(doc);
				return false;
			}
		} catch (error) {
			return false;
		}
		
		return doc;
	}
	
	xmlview.parser = {
		/**
		 * Parse rendered document tree into clean XML document, starting from
		 * <code>context</code> element
		 * @param {Element} [content]
		 * @return {String} XML string
		 */
		run: function(context) {
			return documentToXMLString(context).toString();
		},
		
		toXml: toXml
	}
})();