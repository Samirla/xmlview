/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */var defaultSettings = {
	'init_depth': 2,
	'search.max_visible': 20,
	'dnd.xpath_quote': "'",
	'custom_css': '',
	'intercept_requests': false
};

function loadData() {
	_.each(defaultSettings, function(v, k) {
		var fld = document.getElementById('fld-' + k);
		if (fld.type == 'checkbox') {
			fld.checked = xv_settings.getValue(k, v);
		} else {
			document.getElementById('fld-' + k).value = xv_settings.getValue(k, v);
		}
	});
}

function storeData(/* Event */ evt) {
	evt.preventDefault();
	_.each(defaultSettings, function(v, k) {
		var input = document.getElementById('fld-' + k),
			user_val = input.value;
			
		if (input.type == 'number') {
			user_val = parseInt(user_val, 10);
			if (_.isNaN(user_val))
				user_val = v;
		} else if (input.type == 'checkbox') {
			user_val = input.checked;
		}
		
		xv_settings.setValue(k, user_val);
	});
}

loadData();
xv_dom.addEvent(document.getElementsByTagName('form')[0], 'submit', storeData);
