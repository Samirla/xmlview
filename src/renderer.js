/**
 * Renders XML document
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */var xv_renderer = (function() {
	
	var _id = 0,
		orig_elems = {};
		
	function trim(text) {
		return (text || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
	}
		
	/**
	 * Returns node internal id, if exists
	 * @param {Element} node
	 * @return {String}
	 */
	function getId(node) {
		return node.getAttribute('data-xv-id');
	}
	
	/**
	 * Generates or retrieves internal ID from node
	 * @param {Element} node
	 * @returns {String}
	 */
	function generateId(node) {
		if (!getId(node)) {
			var id = _id++;
			node.setAttribute('data-xv-id', id);
			orig_elems[id] = node;
		}
			
		return getId(node);
	}
	
	/**
	 * Stylize DOM node
	 * @param {HTMLElement} node Node to render
	 * @param {Number} depth Depth level of child elements should be rendered
	 * @return {String}
	 */
	function stylize(node, depth) {
		if (node) {
			switch (node.nodeType) {
			case 1: // element
				return stylizeElement(node, depth);
			case 3: // text node
				return stylizeTextNode(node, depth);
			case 9: // document
				return stylize(node.documentElement, depth);
			}
		}
		
		return '';
	}
	
	/**
	 * Test if node can be collapsed
	 * @param {Element} node
	 * @return {Boolean}
	 */
	function canBeCollapsed(node) {
		var child = node.childNodes;
		return node.childNodes.length && (child.length > 1 || node.firstChild.nodeType != 3);
	}
	
	/**
	 * Stylize element node as tokenized HTML fragment
	 * @param {HTMLElement} node Node to render
	 * @param {Object} counter Counter data
	 * @param {Number} depth Element depth
	 * @return {String} 
	 */
	function stylizeElement(node, depth) {
		var attrs = [], i, il;
		
		for (i = 0, il = node.attributes.length; i < il; i++) {
			var n = node.attributes[i];
			attrs.push('<span class="xv-attr"><span class="xv-attr-name">' + n.nodeName + '</span>' +					'="' +					'<span class="xv-attr-value">' + n.nodeValue + '</span>' +					'"</span>');
		}
		
		// test if current node should be displayed on one line
		var is_one_liner = node.childNodes.length == 1 
			&& node.firstChild.nodeType == 3 
			&& node.firstChild.nodeValue.length < 100;
		
		var result = [],
			add_class = '',
			skip_children = false;
			
		if (is_one_liner || !node.childNodes.length)
			add_class += ' xv-one-line';
			
		if (!depth && canBeCollapsed(node)) {
			skip_children = true;
			add_class += ' xv-collapsed xv-has-unprocessed';
		}
			
		result.push('<span class="xv-tag' + add_class + '" data-xv-id="' + generateId(node) + '">');
		result.push('<span class="xv-tag-switcher"></span>');
		result.push('<span class="xv-tag-open">&lt;');
		result.push('<span class="xv-tag-name">' + node.nodeName +'</span>');
		if (attrs.length)
			result.push(' ' + attrs.join(' '));
			
		if (!node.childNodes.length) {
			result.push(' /&gt;</span></span>');
		} else {
			result.push('&gt;</span>');
			
			result.push('<span class="xv-tag-children">');
			
			if (!skip_children || is_one_liner) {
				for (i = 0, il = node.childNodes.length; i < il; i++) {
					result.push(stylize(node.childNodes[i], depth - 1));
				}
			}
			
			result.push('</span>');
			
			result.push('<span class="xv-tag-close">&lt;/' +
				'<span class="xv-tag-name">' + node.nodeName +'</span>' +
				'&gt;</span></span>');
		}
		
		return result.join('');
	}
	
	/**
	 * Stylize element node as tokenized HTML fragment
	 * @param {Element} node
	 * @return {String} 
	 */
	function stylizeTextNode(node) {
		var v = trim(node.nodeValue);
		return v ? '<span class="xv-text">' + trim(node.nodeValue) + '</span>' : '';
	}
	
	return {
		/**
		 * Render XML fragment as styled HTML tree
		 * @param {HTMLElement} elem
		 * @param {Number} depth Depth level of child elements should be rendered
		 * (pass <code>-1</code> to render full tree)
		 * @return {DocumentFragment}
		 */
		render: function(elem, depth) {
			if (typeof depth == 'undefined')
				depth = -1;
				
			var div = document.createElement('div'),
				f = document.createDocumentFragment();
			
			if (!elem) return f;
			
			div.innerHTML = stylize(elem, depth);
			
			for (var i = 0, il = div.childNodes.length; i < il; i++) {
				f.appendChild(div.childNodes[i]);
			}
			
			return f;
		},
		
		/**
		 * Check if node already rendered
		 * @param {Element} node
		 * @return {Boolean}
		 */
		isRendered: function(node) {
			return !!getId(node);
		},
		
		/**
		 * Returns original node from which passed rendered node was created
		 * @param {Element|String} id
		 * @return {Element}
		 */
		getOriginalNode: function(id) {
			if (typeof id != 'string' && 'nodeType' in id)
				id = getId(id);
				
			return orig_elems[id];
		}
	};
})();