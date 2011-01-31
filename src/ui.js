/**
 * User interface for XSL tracer
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "xsl_tracer.js"
 * @include "renderer.js"
 */(function(){
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
		
	$(document).delegate('.xv-tag-open, .xv-tag-close', 'click', function(/* Event */ evt) {
		var elem = $(this).closest('.xv-tag');
		if (elem.length) {
			if (elem.hasClass('xt-collapsed')) {
				// expand collapsed data
				elem.removeClass('xt-collapsed');
			} else {
				highlightElement(elem);
			}
		}
	});
	
	$(document).delegate('.xv-tag-switcher', 'click', function(evt) {
		$(this).closest('.xv-tag').toggleClass('xt-collapsed');
	});
	
})();