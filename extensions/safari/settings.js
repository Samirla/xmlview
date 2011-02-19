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
	var settings_keys = ['init_depth', 'search.max_visible', 'dnd.xpath_quote', 'outline.width', 'outline.collapsed'];
		
	return {
		/**
		 * Returns preference value
		 * @param {String} name
		 * @return {Object}
		 */
		getValue: function(name, default_value) {
			var value;
			
			if (_.contains(settings_keys, name)) {
				value = safari.extension.settings.getItem(name);
			} else {
				value = localStorage.getItem(name);
			}
				
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
			if (_.contains(settings_keys, name))
				safari.extension.settings.setItem(name);
			else
				localStorage.setItem(name, value);
		},
		
		/**
		 * Removes all stored data
		 */
		reset: function() {
			localStorage.clear();
			safari.extension.settings.clear();
		},
		
		/**
		 * Returns dump of all user settings as object
		 * @return {Object}
		 */
		dump: function() {
			var data = {};
//			_.each(settings_keys, function(n) {
//				data[n] = safari.extension.settings.getItem(n);
//			});
			
			console.log('cloned', data);
//			console.log('dumping', safari.extension.settings, _.clone(has_ls ? localStorage : settings));
			return data;
		}
	};
})();