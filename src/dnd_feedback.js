/**
 * Feedback module for drag’n’drop operations: returns a data:url-encoded image
 * of text that will be dragged
 * 
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "signals.js"
 * @include "dom.js"
 */
var xv_dnd_feedback = (function(){
	var canvas = document.createElement('canvas'),
		/** @type {CanvasRenderingContext2D} */
		ctx = canvas.getContext('2d'),
		font_size = 11,
		font = 'normal ' + font_size + 'px "Lucida Grande", sans-serif',
		padding_left = 6,
		padding_top = 4,
		bg_pattern;
		
	var bg = new Image;
	bg.onload = function() {
		bg_pattern = ctx.createPattern(bg, 'repeat');
	};
	bg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAbCAIAAAA70dJZAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHdJREFUeNp0j1EOwCAIQ8Fw/3t6CGW4sg7N1kQ/6qNU7b3POd1dRFpIHqlquOZFYb3vQFqcDz4i9dbiMQnKOAwwebqGMv99mJQIy+M2LBtjgFrzW6TsMpRlRMMmrmg1/ORX3tHHKp957J//r18++2/9cj8V1iXAAFG7oYASmw8VAAAAAElFTkSuQmCC';
		
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
	
	canvas.className = 'xv-drag-image';
	canvas.width = canvas.height = 1;
	(document.body || document.documentElement).appendChild(canvas);
	
	return {
		/**
		 * Draw feedback image with <code>text</code> in it
		 * @param {String} text
		 * @param {Function} fn Callback function to be called when image is 
		 * generated. Used because of async nature of some extensions
		 * @return {String} data:url of image
		 */
		draw: function(text, fn) {
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
			
			var url = canvas.toDataURL();
			if (fn)
				fn(url);
			
			return url;
		}
	};
})();