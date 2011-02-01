/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "renderer.js"
 * @include "search.js"
 * @include "signals.js"
 */
var xv_controller = (function(){
	/** @type {jQuery} Currently selected element */
	var selected_elem,
		/** Cache for rendered nodes */
		rendered_nodes = {},
		
		/** @type {jQuery} Pane for rendered nodes */
		pane;
	
	/**
	 * Highlight element
	 * @param {jQuery} element
	 */
	function highlightElement(elem) {
		elem = $(elem);
		if (selected_elem && selected_elem[0] != elem[0])
			selected_elem.removeClass('selected');
			
		selected_elem = elem.toggleClass('selected');
		
		xv_signals.nodeFocused.dispatch(xv_renderer.getOriginalNode(selected_elem[0]), 'main');
	}
	
	/**
	 * Check if element contains unprocessed child nodes
	 * @param {Element} elem
	 * @return {Boolean}
	 */
	function hasUnprocessedChildren(elem) {
		return $(elem).hasClass('xv-has-unprocessed');
	}
	
	/**
	 * Expand node
	 * @param {Element|jQuery} elem Node to expand
	 * @param {Boolean} is_recursive Recursively expand all child nodes
	 */
	function expandNode(elem, is_recursive) {
		elem = $(elem);
		
		if (!elem.hasClass('xv-collapsed')) // additional check for recursive calls
			return;
		
		// check if current node has unprocessed children
		elem.removeClass('xv-collapsed');
		if (hasUnprocessedChildren(elem)) {
			// render all first-level child nodes
			var orig_elem = xv_renderer.getOriginalNode(elem[0]),
				cur_child = elem.children('.xv-tag-children');
				
			var f = document.createDocumentFragment();
			$.each(orig_elem.childNodes, function(i, n) {
				f.appendChild(xv_renderer.render(n, 0));
			});
			
			cur_child.empty().append(f);
			elem.removeClass('xv-has-unprocessed');
		}
		
		if (is_recursive) {
			elem.find('.xv-collapsed').each(function() {
				expandNode(this, is_recursive);
			});
		}
	}
	
	/**
	 * Collapse expanded node
	 * @param {Element|jQuery} elem Node to collapse
	 * @param {Boolean} is_recursive Recursively collapse all child nodes
	 */
	function collapseNode(elem, is_recursive) {
		elem = $(elem);
		
		if (elem.hasClass('xv-collapsed')) // additional check for recursive calls
			return;
			
		elem.addClass('xv-collapsed');
		
		if (is_recursive) {
			elem.find('.xv-tag, .xv-comment').not('.xv-collapsed').not('.xv-one-line').each(function() {
				collapseNode(this);
			});
		}
	}
	
	/**
	 * Returns rendered node for original one
	 * @param {Element} orig_node
	 * @return {Element} Pointer to rendered node
	 */
	function getRenderedNode(orig_node) {
		var id = xv_renderer.getId(orig_node);
		
		if (!(id in rendered_nodes)) {
			pane.find('.xv-node').each(function(i, n) {
				if (xv_renderer.getId(n) == id) {
					rendered_nodes[id] = n;
					return false;
				}
			});
		}
		
		return rendered_nodes[id];
	}
		
	$(document).delegate('.xv-tag-open, .xv-tag-close, .xv-comment-start', 'click', function(/* Event */ evt) {
		var elem = $(this).closest('.xv-tag, .xv-comment');
		if (elem.length) {
			if (elem.hasClass('xv-collapsed')) {
				expandNode(elem, !!evt.altKey);
			} else {
				highlightElement(elem);
			}
		}
	});
	
	$(document).delegate('.xv-tag-switcher', 'click', function(evt) {
		var elem = $(this).closest('.xv-tag, .xv-comment');
		if (elem.hasClass('xv-collapsed')) {
			expandNode(elem, !!evt.altKey);
		} else {
			collapseNode(elem, !!evt.altKey);
		}
	});
	
	// listen to signals
	xv_signals.nodeFocused.add(function(/* Element */ node, /* String */ source) {
		// handle focused node
		if (source != 'main') {
			// create list of nodes to expand
			var node_list = [], n = node;
			do {
				if (n.nodeType == 1)
					node_list.push(n);
			} while (n = n.parentNode);
			
			// expand each node, from top to bottom
			node_list.reverse();
			$.each(node_list, function(i, n) {
				expandNode(getRenderedNode(n));
			});
			
			var cur_node = getRenderedNode(node);
			highlightElement(cur_node);
			cur_node.scrollIntoViewIfNeeded();
		}
	});
	
	$(function(){
		pane = $('.xv-source-pane-inner');
	});
	
	return {
		/**
		 * Process XML/JSON document
		 * @param {Document|Object} data 
		 */
		process: function(data) {
			var tree = xv_renderer.render(data, 2);
			pane.empty().append(tree);
			
			xv_search.init(data);
			rendered_nodes = {};
			return tree;
		},
		
		expandNode: expandNode,
		collapseNode: collapseNode
	};
})();