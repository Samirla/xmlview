/**
 * DOM utils
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
var xv_dom = {
	xhtml_ns: 'http://www.w3.org/1999/xhtml',
	
	/**
	 * Context document used to produce nodes of 
	 * <code>HTMLElement</code> class. If renderer is used in a XML document
	 * (like in Google Chrome extension), the default elements produced by
	 * <code>document.createElement</code> method will be objects of 
	 * <code>Element</code> class with limited styling support. 
	 * @type {Document}
	 * @private
	 */
	_html_context: null,
	
	/**
	 * Set HTML context document
	 * @param {Document} ctx
	 */
	setHTMLContext: function(ctx) {
		this._html_context = ctx;
	},
	
	/**
	 * Trims whitespace from string
	 * @param {String} text
	 * @return {String}
	 */
	trim: function(text) {
		return (text || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
	},
	
	/**
	 * Returns 'class' attribute value of the element
	 * @param {Element} elem
	 * @return {String}
	 */
	getClassName: function(elem) {
		if ('className' in elem)
			return elem.className;
		else if (elem.getAttribute)
			return elem.getAttribute('class') || '';
		
		return '';
	},
	
	/**
	 * Updates 'class' attribute of the element
	 * @param {Element} elem
	 * @param {String} value
	 */
	setClassName: function(elem, value) {
		if ('className' in elem)
			elem.className = value;
		else
			elem.setAttribute('class', value);
	},
	
	/**
	 * Check if element contains specified class name
	 *
	 * @param {Element} elem
	 * @param {String} class_name
	 * @return {Boolean}
	 */
	hasClass: function(elem, class_name) {
		class_name = ' ' + class_name + ' ';
		var _cl = this.getClassName(elem);
		return _cl && (' ' + _cl + ' ').indexOf(class_name) >= 0;
	},
	
	/**
	 * Toggle class name on element
	 * @param {Element} elem
	 * @param {String} class_name
	 * @param {Boolean} [cond] True-false condition on class switching
	 */
	toggleClass: function(elem, class_name, cond) {
		if (typeof cond == 'undefined')
			cond = this.hasClass(elem, class_name);
			
		if (cond)
			this.removeClass(elem, class_name);
		else
			this.addClass(elem, class_name);
	},
	
	/**
	 * Add class to element
	 *
	 * @param {Element} elem
	 * @param {String} class_name
	 */
	addClass: function(elem, class_name) {
		var classes = [];
		var _c = class_name.split(/\s+/g);
		for (var i = 0, il = _c.length; i < il; i++) {
			if (_c[i] && !this.hasClass(elem, _c[i]))
				classes.push(_c[i]);
		}
		
		var value = this.getClassName(elem);
		if (classes.length)
			value += (value ? ' ' : '') + classes.join(' ');
		this.setClassName(elem, this.trim(value));
	},
	
	/**
	 * Removes class from element
	 *
	 * @param {Element} elem
	 * @param {String} class_name
	 */
	removeClass: function(elem, class_name) {
		var elem_class = this.getClassName(elem) || '';
		var _c = class_name.split(/\s+/g);
		for (var i = 0, il = _c.length; i < il; i++) {
			elem_class = elem_class.replace(new RegExp('\\b' + _c[i] + '\\b'), '');
		}
		
		this.setClassName(elem, this.trim(elem_class));
	},
	
	/**
	 * Returns list with specified class name
	 * @param {String} class_name Class name
	 * @param {Element|Document} [context] Context element
	 * @return {NodeList}
	 */
	getByClass: function(class_name, context) {
		return (context || document).getElementsByClassName(class_name);
	},
	
	/**
	 * Returns single element with specified class name
	 * @param {String} class_name Class name
	 * @param {Element|Document} [context] Context element
	 * @return {Element}
	 */
	getOneByClass: function(class_name, context) {
		var list = this.getByClass(class_name, context);
		return list ? list[0] : null;
	},
	
	/**
	 * Returns node list by CSS selector
	 * @param {String} selector CSS selector
	 * @param {Element} [context] Context node (<code>document</code> by default)
	 * @return {NodeList}
	 */
	getBySelector: function(selector, context) {
		return (context || document).querySelectorAll(selector);
	},
	
	/**
	 * Removes element from tree
	 * @param {Element} elem
	 */
	removeElement: function(elem) {
		if (elem && elem.parentNode)
			elem.parentNode.removeChild(elem);
	},
	
	/**
	 * Add event listener to element
	 * @param {Element} elem
	 * @param {String} type
	 * @param {Function} fn
	 */
	addEvent: function(elem, type, fn) {
		var items = type.split(/\s+/);
		for (var i = 0; i < items.length; i++) {
			elem.addEventListener(items[i], fn, false);
		}
	},
	
	/**
	 * Removes event listener from element
	 * @param {Element} elem
	 * @param {String} type
	 * @param {Function} fn
	 */
	removeEvent: function(elem, type, fn) {
		var items = type.split(/\s+/);
		for (var i = 0; i < items.length; i++) {
			elem.removeEventListener(items[i], fn, false);
		}
	},
	
	/**
	 * Transforms string to camelCase
	 * @private
	 * @param {String} name
	 * @return {String}
	 */
	toCamelCase: function(name) {
		return name.replace(/\-(\w)/g, function(str, p1) {
			return p1.toUpperCase();
		});
	},
	
	/**
	 * Set CSS rules defined in <code>params</code> object for specified element
	 *
	 * @param {Element} elem
	 * @param {Object} params CSS properties
	 */
	setCSS: function(elem, params) {
		if (!elem)
			return;
		
		var props = [],
			num_props = {'line-height': 1, 'z-index': 1, 'opacity': 1};
	
		for (var p in params) if (params.hasOwnProperty(p)) {
			var name = p.replace(/([A-Z])/g, '-$1').toLowerCase(),
				value = params[p];
			props.push(name + ':' + ((typeof(value) == 'number' && !(name in num_props)) ? value + 'px' : value));
		}
		
		if (elem.style) {
			elem.style.cssText += ';' + props.join(';');
		} else {
			var style = elem.getAttribute('style') || '';
			style += (style ? ';' : '') + props.join(';');
			elem.setAttribute(style);
		}
	},
	
	/**
	 * Returns value of <b>name</b> CSS property (or properties) of <b>elem</b> element
	 * @author John Resig (http://ejohn.org)
	 * @param {Element} elem 
	 * @param {String|Array} name CSS property name
	 * @return {String|Object}
	 */
	getCSS: function(elem, name) {
		var cs, result = {}, n, name_camel, is_array = name instanceof Array;
		
		var _name = is_array ? name : [name];
		for (var i = 0, il = _name.length; i < il; i++) {
			n = _name[i];
			name_camel = this.toCamelCase(n);
	
			// If the property exists in style[], then it's been set
			// recently (and is current)
			if (elem.style[name_camel]) {
				result[n] = result[name_camel] = elem.style[name_camel];
			}
			// Or the W3C's method, if it exists
			else {
				if (!cs)
					cs = window.getComputedStyle(elem, "");
				result[n] = result[name_camel] = cs && cs.getPropertyValue(n);
			}
		}
	
		return is_array ? result : result[this.toCamelCase(name)];
	},
	
	/**
	 * Creates node set from HTML fragment
	 * @param {String} html
	 * @return {Element|DocumentFragment}
	 */
	fromHTML: function(html) {
		var context = this._html_context || document,
			div = context.createElement('div'),
			f = document.createDocumentFragment();
		
		if ('innerHTML' in div) {
			// working inside HTML document
			div.innerHTML = html;
			while (div.firstChild) {
				if (div.firstChild.ownerDocument == document)
					f.appendChild(div.firstChild);
				else
					f.appendChild(document.adoptNode(div.firstChild));
			}
		} else {
			// working inside XML document
			var doc = xv_utils.toXml('<d>' + html + '</d>'),
				doc_elem = doc.documentElement;
			
			while (doc_elem.firstChild) {
				f.appendChild(document.adoptNode(doc_elem.firstChild));
			}
		}
		
		if (!f.hasChildNodes())
			return null;
		
		return f.childNodes.length == 1 ? f.firstChild : f;
	},
		
	/**
	 * Empty node: removes all child elements
	 * @param {Element} elem
	 * @return {Element} Passed element
	 */
	empty: function(elem) {
		while (elem && elem.firstChild)
			elem.removeChild(elem.firstChild);
			
		return elem;
	},
	
	/**
	 * Adds <code>DOMContentLoaded</code> event listener
	 * @param {Function} fn
	 */
	onDomReady: function(fn) {
		this.addEvent(document, 'DOMContentLoaded', fn);
	},
	
	/**
	 * Simple bubbling search that tests if specified class name exists on element
	 * or its parents
	 * @param {Element} elem
	 * @param {String} class_name
	 * @return {Element} First element that contains class name
	 */
	bubbleSearch: function(elem, class_name) {
		var classes = class_name.split(',');
		
		do {
			if (elem) {
				for (var i = 0, il = classes.length; i < il; i++) {
					if (this.hasClass(elem, classes[i]))
						return elem;
				}
			}
		} while(elem && (elem = elem.parentNode));
		
		return null;
	},
	
	/**
	 * Set text content for element
	 * @param {Element} elem
	 * @param {String} text
	 */
	setText: function(elem, text) {
		this.empty(elem);
		elem.appendChild(document.createTextNode(text));
	}
};