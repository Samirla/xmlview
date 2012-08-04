/**
 * Generates outline (simplifed structure) of XML document or node
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "renderer.js"
 * @include "signals.js"
 */
var xv_outline = (function(){
	
	function processText(text) {
		return xv_utils.escapeHTML(xv_utils.trim(text));
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
				case 4: // cdata
					return stylizeCDATA(node, depth);
				case 7: // processing instruction
					return stylizeProcessingInstruction(node, depth);
				case 8: // comment
					return stylizeComment(node, depth);
				case 9: // document
					return _.map(node.childNodes, function(n) {
						return stylize(n, depth);
					}).join('');
			}
		}
		
		return '';
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
			return n.name + ': ' + processText(n.value);
		});
		
		var result = [],
			add_class = '',
			skip_children = false;
			
		var has_children = !!_.detect(node.childNodes, function(n){
			var nt = n.nodeType;
			return nt == 1 || nt == 7 || nt == 8;
		});
			
		if (!has_children)
			add_class += ' xv-outline-node-empty';
			
		if (!depth && canBeCollapsed(node)) {
			skip_children = true;
			add_class += ' xv-collapsed xv-has-unprocessed';
		}
			
		result.push('<span class="xv-node xv-outline-node xv-outline-tag' + add_class + '" data-xv-id="' + xv_renderer.getId(node) + '">');
		result.push('<span class="xv-tag-switcher"></span>');
		result.push('<span class="xv-outline-node-inner">');
		result.push('<span class="xv-outline-item xv-outline-tag-name">' + node.nodeName +'</span>');
		if (attrs && attrs.length)
			result.push(' ' + attrs.join(', '));
			
		result.push('</span>');
			
		if (node.childNodes.length) {
			result.push('<span class="xv-outline-tag-children">');
			
			if (!skip_children) {
				_.each(node.childNodes, function(n) {
					result.push(stylize(n, depth - 1));
				});
			}
			
			result.push('</span>');
		}
		
		result.push('</span>');
		
		return result.join('');
	}
	
	/**
	 * @param {Element} node
	 * @return {String} 
	 */
	function stylizeProcessingInstruction(node) {
		return '<span class="xv-node xv-outline-node xv-outline-pi" data-xv-id="' + xv_renderer.getId(node) + '">' +
				'<span class="xv-outline-node-inner">' +
				'<span class="xv-outline-item xv-outline-pi-name">' + node.nodeName+ '</span>' +
				'</span>' +
				'</span>';
	}
	
	/**
	 * @param {Element} node
	 * @return {String} 
	 */
	function stylizeComment(node) {
		var v = _.detect(processText(node.nodeValue || '').split(/\r?\n/), function(n) {return !!n;}) || '';
		if (v.length > 50)
			v = v.substring(0, 50) + '...';
			
		return '<span class="xv-node xv-outline-node xv-outline-comment" ' +
				'data-xv-id="' + xv_renderer.getId(node) + '">' +
				'<span class="xv-outline-node-inner">' + v + '</span>' +
				'</span>';
	}
	
	/**
	 * @param {Element} node
	 * @return {String} 
	 */
	function stylizeCDATA(node) {
		var v = _.detect(processText(node.nodeValue || '').split(/\r?\n/), function(n) {return !!n;}) || '';
		if (v.length > 50)
			v = v.substring(0, 50) + '...';
			
		return '<span class="xv-node xv-outline-node xv-outline-cdata" ' +
				'data-xv-id="' + xv_renderer.getId(node) + '">' +
				'<span class="xv-outline-node-inner">' +
				'<span class="xv-outline-item xv-outline-cdata-name">CDATA</span> ' +
				v +
				'</span>' +
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
		}
	};
})();