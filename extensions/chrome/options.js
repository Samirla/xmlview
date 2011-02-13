/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */var default_settings = {
	'init_depth': 2,
	'search.max_visible': 20,
	'dnd.xpath_quote': "'",
	'custom_css': ''
};

function loadData() {
	_.each(default_settings, function(v, k){
		document.getElementById('fld-' + k).value = xv_settings.getValue(k, v);
	});
}

function storeData(/* Event */ evt) {
	evt.preventDefault();
	_.each(default_settings, function(v, k) {
		var input = document.getElementById('fld-' + k),
			user_val = input.value;
			
		if (input.type == 'number') {
			user_val = parseInt(user_val, 10);
			if (_.isNaN(user_val))
				user_val = v;
		}
		
		xv_settings.setValue(k, user_val);
	});
}

loadData();
xv_dom.addEvent(document.getElementsByTagName('form')[0], 'submit', storeData);
