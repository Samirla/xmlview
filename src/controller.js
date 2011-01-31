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
	
	function expandNode(elem) {
		elem = $(elem);
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
	}
		
	$(document).delegate('.xv-tag-open, .xv-tag-close', 'click', function(/* Event */ evt) {
		var elem = $(this).closest('.xv-tag');
		if (elem.length) {
			if (elem.hasClass('xv-collapsed')) {
				expandNode(elem);
			} else {
				highlightElement(elem);
			}
		}
	});
	
	$(document).delegate('.xv-tag-switcher', 'click', function(evt) {
		var elem = $(this).closest('.xv-tag');
		if (elem.hasClass('xv-collapsed')) {
			expandNode(elem);
		} else {
			elem.addClass('xv-collapsed');
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