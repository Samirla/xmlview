/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "renderer.js"
 */
var xv_controller = (function(){
	/** @type {jQuery} Currently selected element */
	var selected_elem;
	
	/**
	 * Highlight element
	 * @param {jQuery} element
	 */
	function highlightElement(elem) {
		elem = $(elem);
		if (selected_elem)
			selected_elem.removeClass('selected');
			
		selected_elem = elem.addClass('selected');
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
	
	return {
		/**
		 * Process XML/JSON document
		 * @param {Document|Object} data 
		 */
		process: function(data) {
			var tree = xv_renderer.render(data, 1);
			return tree;
			
		}
	};
})();