/**
 * Module for working with user preferences. Possible values:
 * <p>
 * <b>init_depth</b> : Number — Initial tree render depth<br>  
 * <b>search.max_visible</b> : Number — Maximum visible results in search popup<br>  
 * <b>dnd.xpath_quote</b> : String — Quote character used in Quick XPath expressions<br>
 *   
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
var xv_settings = (function(){
	var settings = {};

	chrome.storage.local.get(resp => settings = resp);
	
	return {
		/**
		 * Returns preference value
		 * @param {String} name
		 * @return {Object}
		 */
		getValue: function(name, default_value) {
			var value = settings[name];
				
			if (value == null) {
				value = default_value;
			}
				
			switch (typeof default_value) {
				case 'number':
					return parseFloat(value);
				case 'boolean':
					if (typeof value == 'string' && value.toLowerCase() == 'false')
						value = false;
					return !!value;
				default:
					return value;
			}
		},
		
		/**
		 * Set new preference value
		 * @param {String} name
		 * @param {Object} value
		 */
		setValue: function(name, value) {
			settings[name] = value;
			chrome.storage.local.set(settings);
		},
		
		/**
		 * Removes all stored data
		 */
		reset: function() {
			settings = {};
			chrome.storage.local.clear();
		},
		
		/**
		 * Returns dump of all user settings as object
		 * @return {Object}
		 */
		dump: function() {
			Object.assign({}, settings);
		}
	};
})();
