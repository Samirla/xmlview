/**
 * UI for quick outline: open small window by keyboard shortcut, search for 
 * element and select it
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "dom.js"
 * @include "controller.js"
 * @include "outline.js"
 * @include "signals.js"
 */(function(){
	var popup = xv_dom.fromHTML('<div class="xv-quick-outline">' +
			'<span class="xv-quick-outline-close">×</span>' +
			'<h2><input type="search" name="quick-outline-search" id="fld-quick-outline-search" /></h2>' +
			'<div class="xv-quick-outline-content"></div>' +
			'</div>'),
		/** @type {Element} */
		search_fld = popup.getElementsByTagName('input')[0];
			
	function showPopup() {
		xv_dom.removeClass(search_fld, 'xv-quick-outline-hidden');
	}
	
	function hidePopup() {
		xv_dom.addClass(search_fld, 'xv-quick-outline-hidden');
	}
	
	function isVisible() {
		xv_dom.hasClass(search_fld, 'xv-quick-outline-hidden');
	}
	
	
	xv_signals.documentProcessed.addOnce(function() {
//		hidePopup();
		var source_pane = xv_dom.getOneByClass('xv-source-pane');
		source_pane.parentNode.appendChild(popup);
		
	});
})();