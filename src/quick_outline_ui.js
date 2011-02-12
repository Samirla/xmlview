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
	var popup_html = '<div class="xv-quick-outline">' +
			'<span class="xv-quick-outline-close">×</span>' +
			'<div class="xv-quick-outline-search"></div>' +
			'<div class="xv-quick-outline-content"></div>' +
			'</div>';
	
	/** @type {Element} */
	var popup,
		/** @type {Element} */
		search_fld;
			
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
		var popup = xv_dom.getOneByClass('xv-quick-outline');
		if (!popup)
			popup = xv_dom.fromHTML(popup_html);
		
		search_fld = popup.getElementsByTagName('input')[0];
		
//		hidePopup();
		
		var source_pane = xv_dom.getOneByClass('xv-source-pane');
		source_pane.parentNode.appendChild(popup);
		
	});
})();