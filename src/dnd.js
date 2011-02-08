/**
 * Drag'n'drop support for XML nodes.<br><br>
 *  
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "controller.js"
 * @include "dom.js"
 */
(function(){
	var canvas = document.createElement('canvas'),
		/** @type {CanvasRenderingContext2D} */
		ctx = canvas.getContext('2d'),
		bg = new Image,
		font_size = 11,
		font = 'normal ' + font_size + 'px "Lucida Grande", sans-serif',
		padding_left = 6,
		padding_top = 4,
		bg_pattern,
		
		/** @type {Element} */
		drag_elem,
		is_dragging = false,
		data_transfer,
		
		/** @type {Element} */
		source_node,
		dnd_tooltip = xv_dom.fromHTML('<span class="xv-dnd-tooltip"></span>');
		
	var META_KEY = 1, 
		ALT_KEY = 2,
		SHIFT_KEY = 4,
		CTRL_KEY = 8;
	
	bg.onload = function() {
		bg_pattern = ctx.createPattern(bg, 'repeat');
	};
	
	bg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAbCAIAAAA70dJZAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHdJREFUeNp0j1EOwCAIQ8Fw/3t6CGW4sg7N1kQ/6qNU7b3POd1dRFpIHqlquOZFYb3vQFqcDz4i9dbiMQnKOAwwebqGMv99mJQIy+M2LBtjgFrzW6TsMpRlRMMmrmg1/ORX3tHHKp957J//r18++2/9cj8V1iXAAFG7oYASmw8VAAAAAElFTkSuQmCC';
	
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
	
	function roundedRect(ctx, x, y, width, height, radius) {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
	}
		
	function drawFeedback(text) {
		ctx.font = font;
		
		var tx = ctx.measureText(text),
			width = padding_left * 2 + tx.width,
			height = font_size + padding_top * 2;
		
		canvas.width = width + 2;
		canvas.height = height + 2;
		
		ctx.save();
		
		ctx.globalAlpha = 0.8;
		
		ctx.fillStyle = bg_pattern;
		roundedRect(ctx, 0, 0, width, height, 5);
		ctx.fill();
		
		// inner stroke
		roundedRect(ctx, 1, 1, width - 1, height - 1, 5);
		ctx.strokeStyle = '#f1f1f1';
		ctx.lineWidth = 2;
		ctx.stroke();
		
		// outer stroke
		roundedRect(ctx, 0.5, 0.5, width, height, 5);
		ctx.strokeStyle = '#bdbdbd';
		ctx.lineWidth = 1;
		ctx.stroke();
		
		
		ctx.fillStyle = '#000';
		ctx.textBaseline = 'middle';
		ctx.font = font;
		ctx.fillText(text, padding_left, Math.round(height / 2));
		
		ctx.restore();
	}
	
	/**
	 * Return attribute quote for XPath
	 * TODO get from settings
	 * @return {String}
	 */
	function getAttrQuote() {
		return "'";
	}
	
	/**
	 * Returns transfer data for node name (<code>drag_elem</code>)
	 * @param {Event} evt
	 * @return {String}
	 */
	function getTransferForNodeName(evt) {
		switch (getKeyMask(evt)) {
			case META_KEY: // name only
				return source_node.nodeName;
			case META_KEY | ALT_KEY: // name and attr names
				var attrs = _.map(xv_utils.filterValidAttributes(source_node), function(n) {
					return '@' + n.name;
				});
				
				return source_node.nodeName + (attrs.length ? '[' + attrs.join(' and ') + ']' : '');
			case META_KEY | SHIFT_KEY: // name and attr names and values
			case META_KEY | SHIFT_KEY | ALT_KEY:
				var attrs = _.map(xv_utils.filterValidAttributes(source_node), function(n) {
					return '@' + n.name + ' = ' + q + n.value + q;
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
			
		var getValue = function() {
			var value = _.detect(xv_utils.filterValidAttributes(source_node), function(n) {
				return n.name == name;
			});
			
			return value ? value.value : null;
		};
			
		switch (getKeyMask(evt)) {
			case META_KEY: // name only
				return '@' + name;
			case META_KEY | ALT_KEY: // name with value
				return '@' + name + ' = ' + q + getValue() + q;
			case META_KEY | SHIFT_KEY: // node name with attribute name.
				return source_node.nodeName + '[@' + name + ']';
			case META_KEY | SHIFT_KEY | ALT_KEY: // node name with attribute name.
				return source_node.nodeName + '[@' + name + ' = ' + q + getValue() + q + ']';
		}
		
		return null;
	}
	
	function updateTransferState(evt) {
		var state = null;
		
		if (xv_dom.hasClass(drag_elem, 'xv-tag-name'))
			state = getTransferForNodeName(evt);
		else if (xv_dom.hasClass(drag_elem, 'xv-attr-name'))
			state = getTransferForAttrName(evt);
			
		if (state !== null) {
			drawFeedback(state);
			
			if (is_dragging) {
				data_transfer.setData('text/plain', state);
				data_transfer.setDragImage(canvas, padding_left, canvas.height);
			} else {
				xv_dom.setCSS(dnd_tooltip, {visibility: 'visible'});
				xv_dom.setText(dnd_tooltip, state);
			}
		} else {
			xv_dom.setCSS(dnd_tooltip, {visibility: 'hidden'});
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
	
	
	var delegate_items = 'xv-tag-name,xv-attr-name';
	xv_dom.addEvent(document, 'mouseover', function(/* Event */ evt) {
		if (isHoverElement(evt.target)) {
			drag_elem = evt.target;
			source_node = xv_renderer.getOriginalNode(xv_dom.bubbleSearch(drag_elem, 'xv-node'));
			if (evt.metaKey) {
				drag_elem.draggable = true;
				attachTooltip(evt);
			}
		}
	});
	
	xv_dom.addEvent(document, 'mouseout', function(/* Event */ evt) {
		if (isHoverElement(evt.target)) {
			evt.target.draggable = false;
			detachTooltip();
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
		is_dragging = false;
	});
	
	
	xv_dom.addEvent(document, 'keydown', function(/* Event */ evt) {
		if (evt.keyCode == 91 && drag_elem) {
			drag_elem.draggable = true;
			attachTooltip(evt);
		}
			
		if (isModifierKeyTrigger(evt) && drag_elem) {
			updateTransferState(evt);
		}
	});
	
	xv_dom.addEvent(document, 'keyup', function(/* Event */ evt) {
		if (evt.keyCode == 91 && drag_elem) {
			drag_elem.draggable = false;
			detachTooltip(evt);
		}
			
		if (isModifierKeyTrigger(evt) && drag_elem) {
			updateTransferState(evt);
		}
	});
		
	canvas.className = 'xv-drag-image';
	canvas.width = canvas.height = 1;
	document.body.appendChild(canvas);
});