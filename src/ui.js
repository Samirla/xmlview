/**
 * User interface for XSL tracer
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "xsl_tracer.js"
 * @include "renderer.js"
 * @include "dom.js"
 */(function(){
	/** @type {Element} Currently selected element */
	var selected_elem;
	
	/**
	 * Highlight element
	 * @param {Element} element
	 */
	function highlightElement(elem) {
		if (selected_elem)
			xv_dom.removeClass(selected_elem, 'selected');
		
		xv_dom.addClass(elem, 'selected');
		selected_elem = elem;
	}
	
	xv_dom.addEvent(document, 'click', function(/* Event */ evt) {
		var elem = xv_dom.bubbleSearch(evt.target, 'xv-tag-switcher');
		if (elem) {
			xv_dom.toggleClass(xv_dom.bubbleSearch(elem, 'xv-tag'), 'xt-collapsed');
			return;
		}
		
		elem = xv_dom.bubbleSearch(evt.target, 'xv-tag');
		if (elem) {
			if (xv_dom.hasClass(elem, 'xt-collapsed')) {
				// expand collapsed data
				xv_dom.removeClass(elem, 'xt-collapsed');
			} else {
				highlightElement(elem);
			}
		}
	});
})();