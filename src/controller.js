/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "renderer.js"
 * @include "dom.js"
 * @include "search.js"
 * @include "signals.js"
 */
var xv_controller = (function(){
	/** @type {Element} Currently selected element */
	var selected_elem,
		/** Cache for rendered nodes */
		rendered_nodes = {},
		
		/** @type {Element} Pane for rendered nodes */
		pane;
	
	/**
	 * Highlight element
	 * @param {jQuery} element
	 */
	function highlightElement(elem, no_signal) {
		if (selected_elem && selected_elem != elem)
			xv_dom.removeClass(selected_elem, 'selected');
			
		selected_elem = elem;
		xv_dom.toggleClass(selected_elem, 'selected');
		if (!no_signal)
			xv_signals.nodeFocused.dispatch(xv_renderer.getOriginalNode(selected_elem), 'main');
	}
	
	/**
	 * Check if element contains unprocessed child nodes
	 * @param {Element} elem
	 * @return {Boolean}
	 */
	function hasUnprocessedChildren(elem) {
		return xv_dom.hasClass(elem, 'xv-has-unprocessed');
	}
	
	/**
	 * Expand node
	 * @param {Element|jQuery} elem Node to expand
	 * @param {Boolean} is_recursive Recursively expand all child nodes
	 */
	function expandNode(elem, is_recursive) {
		if (!xv_dom.hasClass(elem, 'xv-collapsed')) // additional check for recursive calls
			return;
		
		// check if current node has unprocessed children
		xv_dom.removeClass(elem, 'xv-collapsed');
		if (hasUnprocessedChildren(elem)) {
			// render all first-level child nodes
			var orig_elem = xv_renderer.getOriginalNode(elem),
				/** @type {Element} */
				cur_child = _.detect(elem.childNodes, function(n) {
					return n.nodeType == 1 && xv_dom.hasClass(n, 'xv-tag-children');
				});
				
			var f = document.createDocumentFragment();
			_.each(orig_elem.childNodes, function(n) {
				var r = xv_renderer.render(n, 0);
				if (r) f.appendChild(r);
			});
			
			xv_dom.empty(cur_child);
			cur_child.appendChild(f);
			xv_dom.removeClass(elem, 'xv-has-unprocessed');
		}
		
		if (is_recursive) {
			_.each(xv_dom.getByClass('xv-collapsed', elem), function(n) {
				expandNode(n, is_recursive);
			});
		}
	}
	
	/**
	 * Collapse expanded node
	 * @param {Element|jQuery} elem Node to collapse
	 * @param {Boolean} is_recursive Recursively collapse all child nodes
	 */
	function collapseNode(elem, is_recursive) {
		if (xv_dom.hasClass(elem, 'xv-collapsed')) // additional check for recursive calls
			return;
			
		xv_dom.addClass(elem, 'xv-collapsed');
		
		if (is_recursive) {
			_.each(xv_dom.getByClass('xv-node', elem), function(n) {
				if (!xv_dom.hasClass(n, 'xv-collapsed') && !xv_dom.hasClass(n, 'xv-one-line'))
					collapseNode(n);
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
			_.detect(xv_dom.getByClass('xv-node', pane), function(n) {
				if (xv_renderer.getId(n) == id) {
					rendered_nodes[id] = n;
					return true;
				}
			});
		}
		
		return rendered_nodes[id];
	}
	
	// listen to signals
	xv_signals.documentProcessed.addOnce(function() {
		xv_dom.addEvent(document, 'click', function(/* Event */ evt) {
			var elem = xv_dom.bubbleSearch(evt.target, 'xv-tag-open,xv-tag-close,xv-comment-start');
			if (elem) {
				elem = xv_dom.bubbleSearch(elem, 'xv-node');
				if (xv_dom.hasClass(elem, 'xv-collapsed')) {
					expandNode(elem, !!evt.altKey);
				} else {
					highlightElement(elem);
				}
			}
		});
		
		xv_dom.addEvent(document, 'click', function(/* Event */ evt) {
			if (xv_dom.hasClass(evt.target, 'xv-tag-switcher')) {
				var elem = xv_dom.bubbleSearch(evt.target, 'xv-node');
				if (xv_dom.hasClass(elem, 'xv-collapsed')) {
					expandNode(elem, !!evt.altKey);
				} else {
					collapseNode(elem, !!evt.altKey);
				}
			}
		});
	});
		
	xv_signals.nodeFocused.add(function(/* Element */ node, /* String */ source) {
		// handle focused node
		if (source != 'main' && node) {
			// create list of nodes to expand
			var node_list = [], n = node;
			do {
				if (n.nodeType == 1)
					node_list.push(n);
			} while (n = n.parentNode);
			
			// expand each node, from top to bottom
			node_list.reverse();
			_.each(node_list, function(n) {
				expandNode(getRenderedNode(n));
			});
			
			var cur_node = getRenderedNode(node);
			highlightElement(cur_node, true);
			if ('scrollIntoViewIfNeeded' in cur_node)
				cur_node.scrollIntoViewIfNeeded();
			else
				cur_node.scrollIntoView();
		}
	});
	
	return {
		/**
		 * Process XML/JSON document
		 * @param {Document|Object} data 
		 */
		process: function(data) {
			if (typeof data == 'string') {
				try {
					data = xv_utils.toXml(data);
				} catch(e) {
					var error_msg = xv_dom.fromHTML('<div class="xv-error">' + e.toString() + '</div>');
					var root_elem = document.body || document.documentElement;
					
					root_elem.appendChild(error_msg);
					xv_dom.addClass(root_elem, 'xv-error-state');
					data = null;
				}
			}
			
			if (data) {
				var tree = xv_renderer.render(data, 2);
				
				if (!pane)
					pane = xv_dom.getOneByClass('xv-source-pane-inner');
					
				rendered_nodes = {};
				
				xv_dom.empty(pane);
				pane.appendChild(tree);
				
				xv_signals.documentProcessed.dispatch(tree, data);
				return tree;
			}
		},
		
		expandNode: expandNode,
		collapseNode: collapseNode
	};
})();