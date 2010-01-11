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
		return String(++_id);
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
				this.attributes[name] = String(value);
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
		return _cl && (' ' + _cl + ' ').indexOf(class_name) >= 0;
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
	 * Returns list of child elements with specified class name
	 * @param {Element} parent
	 * @param {String} class_name
	 * @return {Element[]}
	 */
	function byClass(parent, class_name, is_single) {
		var result = [],
			children = parent.childNodes;
			
		// one 'if' is faster that 100 'if's
		if (is_single) {
			for (var i = 0, il = children.length; i < il; i++) {
				/** @type {Element} */
				var child = children[i];
				if (child.nodeType == 1 && hasClass(child, class_name))
					return child;
			}
		} else {
			for (var i = 0, il = children.length; i < il; i++) {
				/** @type {Element} */
				var child = children[i];
				if (child.nodeType == 1 && hasClass(child, class_name))
					result.push(child);
			}
		}
			
		return result;
	}
	
	/**
	 * Returns first element's <code>nodeValue</code> from <code>byClass()</code>
	 * function call
	 * @param {Element} parent
	 * @param {String} class_name
	 * @return {String}
	 */
	function valueByClass(parent, class_name) {
		var elem = byClass(parent, class_name, true);
		if (elem && elem.firstChild)
			return elem.firstChild.nodeValue;
		else
			return '';
	}
	
	/**
	 * Transforms current colorized document tree into a XML string
	 * for parsing using
	 * @param {Element} context Search starting point (default is <code>document</code>) 
	 * @param {Tag} [root] Root tag 
	 */
	function documentToXMLString(context, root) {
		root = root || new Tag();
		
		if (!context) return;
		
		var children = context.childNodes;
		for (var i = 0, il = children.length; i < il; i++) {
			var child = children[i];
			switch (child.nodeType) {
				case 1:
					if (hasClass(child, 'x-tag') || hasClass(child, 'x-tag-compact')) {
						var tag = parseTag(child);
						root.addChild(tag);
						documentToXMLString(byClass(child, 'x-tag-content')[0], tag);
					}
					break;
				case 3: // text node
					if (!isWhiteSpace(child.nodeValue))
						root.addChild(new TextNode(child.nodeValue));
					break;
			}
		}
		
		return root;
	}
	
	/**
	 * Parses HTML tag structure into a simple tag object
	 * @param {Element} elem 
	 * @return {Tag}
	 */
	function parseTag(elem) {
//		elem = $(elem);
		var open_tag = byClass(elem, 'x-tag-open')[0];
		var tag = new Tag(valueByClass(open_tag, 'x-tag-name'));
		
		var tag_id = generateId();
		tag.addAttribute('x__xmlview_id', tag_id);
		element_map[tag_id] = elem;
		
		var attrs = byClass(open_tag, 'x-tag-attr');
		for (var i = 0, il = attrs.length; i < il; i++) {
			var attr = attrs[i];
			tag.addAttribute(valueByClass(attr, 'x-tag-attr-name'), valueByClass(attr, 'x-tag-attr-value'));
		}
		
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
	};
})();