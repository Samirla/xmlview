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
	var settings = {},
		has_ls = hasLocalStorage();
		
	function hasLocalStorage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	}
	
	return {
		/**
		 * Returns preference value
		 * @param {String} name
		 * @return {Object}
		 */
		getValue: function(name, default_value) {
			var value;
			
			if (has_ls)
				value = localStorage.getItem(name);
			else
				value = settings[name];
				
			if (_.isNull(value) || _.isUndefined(value))
				value = default_value;
				
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
			if (has_ls)
				localStorage.setItem(name, value);
			else
				settings[name] = value;
		},
		
		/**
		 * Removes all stored data
		 */
		reset: function() {
			if (has_ls)
				localStorage.clear();
			else
				settings = {};
		},
		
		/**
		 * Returns dump of all user settings as object
		 * @return {Object}
		 */
		dump: function() {
			return _.clone(has_ls ? localStorage : settings);
		}
	};
})();