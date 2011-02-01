/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
var xv_utils = (function(){
	var re_not_xpath = /^[\w\-\:]+$/;
	
	return {
		/**
		 * Creates XPath for specified <code>node</code> element.
		 * If <code>context</code> passed, the XPath will be built up till this
		 * element.
		 * 
		 * @param {Element} node 
		 * @param {Element} [context] 
		 * @return {String}
		 */
		createXPath: function(node, context) {
			var parts = [];
			
			function walk(node){
				var _node = node;
				var name = node.nodeName;
				var count = 1;
				while (node = node.previousSibling) {
					if (node.nodeType == 1 && node.nodeName == name) {
						count++;
					}
				}
				
				parts.unshift(name + '[' + count + ']');
				if (_node.parentNode && _node.parentNode != context && _node.ownerDocument != _node.parentNode)
					walk(_node.parentNode);
			}
			
			walk(node);
			
			return (!context ? '/' : '') + parts.join('/');
		},
		
		/**
		 * Check is passed string looks like XPath
		 * @param {String} str
		 * @return {Boolean}
		 */
		isXPath: function(str) {
			return !re_not_xpath.test(str);
		}
	};
})();