/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
var xv_utils = (function(){
	var re_not_xpath = /^[\w\-\:]+$/;
	
	// regexp from http://www.regexguru.com/2008/11/detecting-urls-in-a-block-of-text/
	var reURL = /\b(?:(?:https?|ftp|file|feed):\/\/|www\.|ftp\.)[\-A-Z0-9\+&@#\/%=~_\|\$\?\!:,\.\(\)]*[A-Z0-9+&@#\/%=~_|$]/ig;
	
	return {
		/**
		 * Trim whitespace from the beginning and the end of string
		 * @param {String} text
		 * @return {String}
		 */
		trim: function(text) {
			return (text || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
		},
		
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
		},
		
		unescapeHTML: function(text) {
			var chars = {
				'&lt;': '<',
				'&gt;': '>',
				'&amp;': '&',
				'&quot;': '"',
				'&apos;': '\''
			};
			
			text = this.trim(text);
			
			return text.replace(/&(lt|gt|amp|apos|quot);/g, function(str) {
				return chars[str];
			});
		},
		
		/**
		 * Escapes unsafe HTML characters
		 * @param {String} str
		 * @return {String}
		 */
		escapeHTML: function(str) {
			var charmap = {
				'<': '&lt;',
				'>': '&gt;',
				'&': '&amp;'
			};
			
			return str.replace(/[<>&]/g, function(s) {
				return charmap[s] || s;
			});
		},
		
		toXml: function(text) {
			var result = (new DOMParser()).parseFromString(text, 'text/xml');
			
			if (!result || !result.documentElement
					|| result.documentElement.nodeName == 'parsererror'
					|| result.getElementsByTagName('parsererror').length) {
						
						
				var error = result.getElementsByTagName('parsererror')[0];
				console.log(error);
				throw "<h2>Can’t parse XML document</h2> \n" + (error ? error.textContent : '');
			}
			
			return result;
		},
		
		/**
		 * Returns list of valid attributes for node (i.e. without internal ones)
		 * @param {Element} elem
		 * @return {Array}
		 */
		filterValidAttributes: function(elem) {
			return _.filter(elem.attributes, function(n) {
				return n.name.indexOf('data-xv-') != 0;
			});
		},
		
		/**
		 * Splits text into array with URLs in odd positions
		 * @param {String} text
		 * @returns {Array}
		 */
		findURLs: function(text) {
			var reDelim = new RegExp('(' + reURL.source + ')', 'ig');
			return text.split(reDelim);
		},

		/**
		 * Formats URL as link with sanitized URL and text
		 * @param {String} text
		 * @returns {String}
		 */
		formatURL: function(url) {
			// has protocol?
			var href = url;
			if (!/^[a-z]+:\/\//i.test(href)) {
				href = 'http://' + href;
			}

			return '<a href="' + href + '" class="xv-url">' + this.escapeHTML(url) + '</a>';
		}
	};
})();