/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
var xv_utils = (function(){
	return {
		/**
		 * Creates XPath for element
		 * @param {Element} elem
		 */
		createXPath: function(elem) {
			var result = [];
			do {
				if (elem.nodeType == 1)
					result.push(elem.nodeName);
			} while (elem = elem.parentNode);
			
			result.reverse();
			return '/' + result.join('/');
		}
	};
})();