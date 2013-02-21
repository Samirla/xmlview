/**
 * Renders XML document
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "utils.js"
 */var xv_renderer = (function() {
	
	var _id = 0,
		orig_elems = {},
		oneline_text_len = 100;
	
		
	/**
	 * Returns node internal id, if exists
	 * @param {Element} node
	 * @return {String}
	 */
	function getId(node) {
		if ('__xv_id' in node)
			return node.__xv_id;
		if ('getAttribute' in node)
			return node.getAttribute('data-xv-id');
		
		return null;
	}
	
	/**
	 * Generates or retrieves internal ID from node
	 * @param {Element} node
	 * @returns {String}
	 */
	function generateId(node) {
		var id = getId(node);
		if (id === null || typeof id == 'undefined') {
			id = _id++;
			node.__xv_id = id;
			orig_elems[id] = node;
		}
			
		return id;
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
				case 4: // text node
					return stylizeCDATA(node, depth);
				case 7: // processing instruction
					return stylizeProcessingInstruction(node, depth);
				case 8: // comment
					return stylizeComment(node, depth);
				case 9: // document
					var result = [];
					for (var i = 0, il = node.childNodes.length; i < il; i++) {
						result.push(stylize(node.childNodes[i], depth));
					}
					return result.join('');
				default:
					if (window.console)
						console.log('processing unknown type:', node.nodeType);
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
		var attrs = _.map(xv_utils.filterValidAttributes(node), function(n) {
			return '<span class="xv-attr"><span class="xv-attr-name">' + n.name + '</span>' +
				'="' +
				'<span class="xv-attr-value">' + processText(n.value) + '</span>' +
				'"</span>';
		});
		
		
		// test if current node should be displayed on one line
		var is_one_liner = node.childNodes.length == 1 
			&& node.firstChild.nodeType == 3 
			&& node.firstChild.nodeValue.length < oneline_text_len;
		
		var result = [],
			add_class = '',
			skip_children = false;
			
		if (is_one_liner || !node.childNodes.length)
			add_class += ' xv-one-line';
			
		if (!depth && canBeCollapsed(node)) {
			skip_children = true;
			add_class += ' xv-collapsed xv-has-unprocessed';
		}
			
		result.push('<span class="xv-node xv-tag' + add_class + '" data-xv-id="' + generateId(node) + '">');
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
				_.each(node.childNodes, function(n) {
					result.push(stylize(n, depth - 1));
				});
			}
			
			result.push('</span>');
			
			result.push('<span class="xv-tag-close">&lt;/' +
				'<span class="xv-tag-name">' + node.nodeName +'</span>' +
				'&gt;</span></span>');
		}
		
		return result.join('');
	}
	
	function processText(text) {
		var urls = xv_utils.findURLs(xv_utils.trim(text));

		var result = _.map(urls, function (text, i) {
			// odd elements are urls
			if (i % 2 === 1) {
				return xv_utils.formatURL(text);
			} else {
				return xv_utils.escapeHTML(text);
			}
		});

		return result.join('');
	}
	
	/**
	 * Stylize element node as tokenized HTML fragment
	 * @param {Element} node
	 * @return {String} 
	 */
	function stylizeTextNode(node) {
		var v = xv_utils.trim(node.nodeValue);
		return v ? '<span class="xv-text" data-xv-id="' + generateId(node) + '">' + processText(node.nodeValue) + '</span>' : '';
	}
	
	/**
	 * @param {Element} node
	 * @return {String} 
	 */
	function stylizeProcessingInstruction(node) {
		return '<span class="xv-node xv-pi" data-xv-id="' + generateId(node) + '">&lt;?<span class="xv-pi-name">' + node.nodeName + '</span> ' +
				'<span class="xv-pi-value">' + processText(node.nodeValue) + '</span>?&gt;</span>';
	}
	
	/**
	 * @param {Element} node
	 * @return {String} 
	 */
	function stylizeComment(node) {
		var v = xv_utils.trim(node.nodeValue),
			class_name = 'xv-node xv-comment';
			
		if (v.length < oneline_text_len) {
			class_name += ' xv-one-line';
		}
		
		return '<span class="' + class_name + '" data-xv-id="' + generateId(node) + '">' +
				'<span class="xv-tag-switcher"></span>' +
				'<span class="xv-comment-start">&lt;!-- </span>' +
				'<span class="xv-comment-value">' + processText(v) + '</span>' +
				'<span class="xv-comment-end"> --&gt;</span>' +
				'</span>';
	}
	
	/**
	 * @param {Element} node
	 * @return {String} 
	 */
	function stylizeCDATA(node) {
		var v = xv_utils.trim(node.nodeValue),
			class_name = 'xv-node xv-cdata';
			
		if (v.length < oneline_text_len) {
			class_name += ' xv-one-line';
		}
		
		return '<span class="' + class_name + '" data-xv-id="' + generateId(node) + '">' +
				'<span class="xv-tag-switcher"></span>' +
				'<span class="xv-cdata-start">&lt;![CDATA[</span>' +
				'<span class="xv-cdata-value">' + processText(v) + '</span>' +
				'<span class="xv-cdata-end"> ]]&gt;</span>' +
				'</span>';
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
				
			if (!elem) return document.createDocumentFragment();
			return xv_dom.fromHTML(stylize(elem, depth));
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
				id = id.getAttribute('data-xv-id');
				
			return orig_elems[id];
		},
		
		getId: generateId
	};
})();