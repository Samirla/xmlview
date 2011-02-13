/**
 * Provide visual feedback on selected node in source pane
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "dom.js"
 * @include "signals.js"
 * @include "controller.js"
 */(function(){
	/** @type {Element} Reference element for selection notifiers */
	var notifier;
	
	/**
	 * Create selection notifier of rendered element
	 * @param {Element} elem
	 */
	function createSelectionNotifier(elem) {
		if (!notifier)
			notifier = xv_dom.fromHTML('<span class="xv-selection-notifier"></span>');
			
		var _notifier = notifier.cloneNode(true);
		
		// find target element
		var target = elem;
		if (xv_dom.hasClass(elem, 'xv-tag')) {
			target = _.detect(elem.childNodes, function(n) {
				return n.nodeType == 1 && xv_dom.hasClass(n, 'xv-tag-open');
			});
		}
		
		if (target) {
			xv_dom.setCSS(_notifier, {
				left: target.offsetLeft,
				top: target.offsetTop,
				width: target.offsetWidth,
				height: target.offsetHeight
			});
			
			target.parentNode.insertBefore(_notifier, target);
			
			//fallback for browsers that doesn‘t support CSS animations
			setTimeout(function() {
				xv_dom.removeElement(_notifier);
			}, 1500);
		}
	}
	
	xv_signals.documentProcessed.addOnce(function() {
		xv_dom.addEvent(document, 'webkitAnimationEnd mozAnimationEnd', function(evt) {
			if (xv_dom.hasClass(evt.target, 'xv-selection-notifier'))
				xv_dom.removeElement(evt.target);
		});
	});
	
	xv_signals.nodeFocused.add(function(/* Element */ node, /* String */ source) {
		// handle focused node
		if (source != 'main' && node) {
			var cur_node = xv_controller.getRenderedNode(node);
			createSelectionNotifier(cur_node);
		}
	});
	
})();