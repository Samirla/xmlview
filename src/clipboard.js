/**
 * Module for copying Quick XPath values to clipboard on click where available
 * (in IDE mostly)
 */
(function(GLOBAL) {
	var is_dnd_mode = false,
		copy_text = '';
	
	xv_signals.dndModeEntered.add(function() {
		is_dnd_mode = true;
	});
	
	xv_signals.dndModeQuit.add(function() {
		is_dnd_mode = false;
	});
	
	xv_signals.dndMessageChanged.add(function(message) {
		copy_text = message;
	});
	
	xv_dom.addEvent(document, 'click', function(evt) {
		if (is_dnd_mode && copy_text && 'copyToClipboard' in GLOBAL) {
			GLOBAL.copyToClipboard(copy_text);
			evt.preventDefault();
			evt.stopPropagation();
		}
	});
})(this);