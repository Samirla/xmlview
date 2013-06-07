/**
 * Drag'n'drop support for XML nodes.<br><br>
 *  
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "controller.js"
 * @include "dom.js"
 * @include "dnd_feedback.js"
 */
(function(){
	/** @type {Element} */
	var drag_elem,
		is_dragging = false,
		is_drag_mode = false,
		data_transfer,
		dnd_image = null,
		
		is_mac = /mac\s+os/i.test(navigator.userAgent),
		
		os_key = 0,
		os_modifier = 0,
		
		xpath_mode = 0,
		use_cycle_mode = true,
		
		/** @type {Element} */
		source_node,
		/** @type {Element} */
		dnd_tooltip;
		
	var META_KEY = 1, 
		ALT_KEY = 2,
		SHIFT_KEY = 4,
		CTRL_KEY = 8;
		
	if (is_mac) {
		os_modifier = META_KEY;
		os_key = 91;
	} else {
		os_modifier = CTRL_KEY;
		os_key = 17;
	}
		
	
	/**
	 * Creates modifier keys mask from passed event
	 * @param {Event} evt;
	 * @return {Number}
	 */
	function getKeyMask(evt) {
		var mask = 0;
		mask |= evt.metaKey && META_KEY;
		mask |= evt.altKey && ALT_KEY;
		mask |= evt.shiftKey && SHIFT_KEY;
		mask |= evt.ctrlKey && CTRL_KEY;
		
		return mask;
	}
	
	/**
	 * Test if modifier key was the trigger of the keyboard event (keydown/keyup/etc)
	 * @param {Event} evt
	 * @return {Boolean}
	 */
	function isModifierKeyTrigger(evt) {
		// 16 - shift
		// 17 - ctrl
		// 18 - alt
		// 91 - command
		var c = evt.keyCode;
		return c == 16 || c == 17 || c == 18 || c == 91;
	}
	
	/**
	 * Return attribute quote for XPath
	 * TODO get from settings
	 * @return {String}
	 */
	function getAttrQuote() {
		return xv_settings.getValue('dnd.xpath_quote', "'");
	}
	
	/**
	 * Escape specified <code>quote</code> in <code>text</code>
	 * @param {String} text
	 * @param {String} quote
	 * @return {String}
	 */
	function escapeQuote(text, quote) {
		var quote_map = {
			'"': '&quot;',
			"'": '&apos;'
		};
		return text.replace(new RegExp(quote, 'g'), quote_map[quote]);
	}
	
	function updateTransferImage() {
		if (data_transfer && dnd_image && dnd_image.src)
			data_transfer.setDragImage(dnd_image, 6, dnd_image.height);
	}
	
	function setTransferImage(data_url) {
		if (!dnd_image) {
			dnd_image = new Image();
			dnd_image.onload = updateTransferImage;
		}
		dnd_image.src = data_url;
		updateTransferImage();
	}
	
	function getXPathModeForEvent(evt) {
		switch (getKeyMask(evt)) {
			case os_modifier | ALT_KEY:
				return 1;
			case os_modifier | SHIFT_KEY:
				return 2;
			case os_modifier | SHIFT_KEY | ALT_KEY:
				return 3;
		}
		
		return 0;
	}
	
	/**
	 * Returns transfer data for node name (<code>drag_elem</code>)
	 * @param {Event} evt
	 * @return {String}
	 */
	function getTransferForNodeName(evt) {
		var q = getAttrQuote();
		
		if (!use_cycle_mode)
			xpath_mode = getXPathModeForEvent(evt);
			
		xpath_mode %= 3;
		
		switch (xpath_mode) {
			case 0: // name only
				return source_node.nodeName;
			case 1: // name and attr names
				var attrs = _.map(xv_utils.filterValidAttributes(source_node), function(n) {
					return '@' + n.name;
				});
				
				return source_node.nodeName + (attrs.length ? '[' + attrs.join(' and ') + ']' : '');
			case 2: // name and attr names and values
			case 3:
				var attrs = _.map(xv_utils.filterValidAttributes(source_node), function(n) {
					return '@' + n.name + ' = ' + q + escapeQuote(n.value, q) + q;
				});
				
				return source_node.nodeName + (attrs.length ? '[' + attrs.join(' and ') + ']' : '');
		}
		
		return null;
	}
	
	/**
	 * Returns transfer data for node name (<code>drag_elem</code>)<br>
	 * @param {Event} evt
	 * @return {String}
	 */
	function getTransferForAttrName(evt) {
		var name = drag_elem.textContent,
			q = getAttrQuote(),
			value = '';
			
		if (!use_cycle_mode)
			xpath_mode = getXPathModeForEvent(evt);
			
		xpath_mode %= 4;
			
		var getValue = function() {
			var value = _.detect(xv_utils.filterValidAttributes(source_node), function(n) {
				return n.name == name;
			});
			
			return value ? value.value : null;
		};
			
		switch (xpath_mode) {
			case 0: // name only
				return '@' + name;
			case 1: // name with value
				return '@' + name + ' = ' + q + getValue() + q;
			case 2: // node name with attribute name.
				return source_node.nodeName + '[@' + name + ']';
			case 3: // node name with attribute name.
				return source_node.nodeName + '[@' + name + ' = ' + q + escapeQuote(getValue(), q) + q + ']';
		}
		
		return null;
	}
	
	function updateTransferState(evt) {
		var state = null,
			elem = drag_elem || evt.target;
			
		if (xv_dom.hasClass(elem, 'xv-tag-name'))
			state = getTransferForNodeName(evt);
		else if (xv_dom.hasClass(elem, 'xv-attr-name'))
			state = getTransferForAttrName(evt);
			
		xv_signals.dndMessageChanged.dispatch(state);
			
		if (state !== null) {
			
			xv_dnd_feedback.draw(state, setTransferImage);
//			drawFeedback(state);
			
			if (is_dragging) {
				data_transfer.setData('text/plain', state);
				updateTransferImage();
			} else {
				xv_dom.removeClass(dnd_tooltip, 'xv-dnd-tooltip-hidden');
				xv_dom.setText(dnd_tooltip, state);
			}
		} else {
			xv_dom.addClass(dnd_tooltip, 'xv-dnd-tooltip-hidden');
		}
	}
	
	function attachTooltip(evt) {
		updateTransferState(evt);
		drag_elem.parentNode.insertBefore(dnd_tooltip, drag_elem);
	}
	
	function detachTooltip() {
		xv_dom.removeElement(dnd_tooltip);
	}
	
	function isHoverElement(elem) {
		return xv_dom.hasClass(elem, 'xv-tag-name') || xv_dom.hasClass(elem, 'xv-attr-name');
	}
	
	/**
	 * Make element draggable
	 * @param {Element} elem
	 */
	function makeDraggable(elem) {
		elem.draggable = true;
		elem.setAttribute('draggable', 'true');
	}
	
	/**
	 * Make element normal (undraggable)
	 * @param {Element} elem
	 */
	function makeNormal(elem) {
		elem.draggable = false;
		elem.setAttribute('draggable', 'false');
	}
	
	function enterDndMode(evt) {
		if (drag_elem)
			makeDraggable(drag_elem);
		
		if (!is_drag_mode) {
			is_drag_mode = true;
			xv_signals.dndModeEntered.dispatch(drag_elem, evt);
		}
		
		xpath_mode = 0;
	}
	
	function exitDndMode() {
		if (drag_elem)
			makeNormal(drag_elem);
			
		is_dragging = false;
		
		if (is_drag_mode) {
			is_drag_mode = false;
			xv_signals.dndModeQuit.dispatch();
		}
		xpath_mode = 0;
	}
	
	xv_signals.dndModeEntered.add(function(elem, evt) {
		attachTooltip(evt);
	});
	
	xv_signals.dndModeQuit.add(function(evt) {
		detachTooltip();
	});
	
	// init module
	xv_signals.documentProcessed.addOnce(function() {
		dnd_tooltip = xv_dom.fromHTML('<span class="xv-dnd-tooltip"></span>');
		
		use_cycle_mode = xv_settings.getValue('dnd.cycle_mode', true);
		
		var delegate_items = 'xv-tag-name,xv-attr-name';
		xv_dom.addEvent(document, 'mouseover', function(/* Event */ evt) {
			if (isHoverElement(evt.target)) {
				drag_elem = evt.target;
				source_node = xv_renderer.getOriginalNode(xv_dom.bubbleSearch(drag_elem, 'xv-node'));
				if (is_mac ? evt.metaKey : evt.ctrlKey) {
					enterDndMode(evt);
				}
			}
		});
		
		xv_dom.addEvent(document, 'mouseout', function(/* Event */ evt) {
			if (isHoverElement(evt.target)) {
				exitDndMode();
				drag_elem = null;
			}
		});
		
		xv_dom.addEvent(document, 'dragstart', function(/* Event */ evt) {
			is_dragging = true;
			
			data_transfer = evt.dataTransfer;
			data_transfer.effectAllowed = 'copy';
			updateTransferState(evt);
			detachTooltip();
		});
		
		xv_dom.addEvent(document, 'dragend', function(/* Event */ evt) {
			exitDndMode();
		});
		
		
		xv_dom.addEvent(document, 'keydown', function(/* Event */ evt) {
			if (evt.keyCode == os_key && drag_elem) {
				enterDndMode(evt);
			}
			
			if (drag_elem) {
				if (!use_cycle_mode && isModifierKeyTrigger(evt)) {
					updateTransferState(evt);
				} else if (use_cycle_mode && evt.keyCode == 16) {
					xpath_mode++;
					updateTransferState(evt);
				}
			}
		});
		
		xv_dom.addEvent(document, 'keyup', function(/* Event */ evt) {
			if (evt.keyCode == os_key && drag_elem) {
				exitDndMode();
			}
				
			if (!use_cycle_mode && isModifierKeyTrigger(evt) && drag_elem) {
				updateTransferState(evt);
			}
		});
	});
})();