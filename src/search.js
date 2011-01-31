/**
 * Search module
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
var xv_search = (function(){
	var search_index = [],
		/** @type {Document} */
		doc,
		/** List of last matched elements */
		last_search,
		max_results = 10;
	
	/**
	 * Creates search index item
	 * @param {Element} node
	 */
	function searchIndexItem(node) {
		var search_str = node.nodeName;
		var attrs = [];
		if (node.attributes) {
			for (var i = 0, il = node.attributes.length; i < il; i++) {
				attrs.push(node.attributes[i].name);
			}
		}
		
		if (attrs.length)
			search_str += ' ' + attrs.join(' ');
			
		return {
			str: search_str.toLowerCase(),
			node: node
		};
	}
	
	/**
	 * Recursively build search index on node, preserving node order 
	 * @param {Element} node
	 */
	function buildIndex(node) {
		if (node.nodeType != 1)
			return;
			
		search_index.push(searchIndexItem(node));
		for (var i = 0, il = node.childNodes.length; i < il; i++) {
			buildIndex(node.childNodes[i]);
		}
	}
	
	/**
	 * Simple textual search on document tree
	 * @param {String} query Search query
	 * @return {Array} Array of matched nodes, null otherwise 
	 */
	function searchText(query) {
		var result = [];
		if (query) {
			$.each(search_index, function(i, /* searchIndexItem */ n) {
				var ix = n.str.indexOf(query);
				if (ix != -1)
					result.push({
						ix: ix,
						node: n.node
					});
			});
		}
		
		return result.length ? result : null;
	}
	
	/**
	 * Creates HTML list of found nodes
	 * @param {Array} found List of matched nodes
	 * @param {String} query Search query
	 * @return {jQuery}
	 */
	function buildSearchResult(found, query) {
		var items = [];
		$.each(found, function(i, n) {
			/** @type {Element} */
			var node = n.node,
				name = node.nodeName;
				
			if ('ix' in n && n.ix < name.length) { // mark search result
				name = name.substr(0, n.ix + 
					'<strong>' + name.substr(n.ix, query.length) + '</strong>'
					+ name.substr(n.ix + query.length));
			}
			
			items.push('<li class="xv-search-result-item" data-xv-search-ix="' + i + '">' + name + '</li>');
		});
		
		return $('<ul class="xv-search-result"></ul>').append(items.join(''));
	}
	
	
	return {
		/**
		 * Init search module
		 * @param {Document} tree
		 */
		init: function(tree) {
			search_index.length = 0;
			buildIndex(tree.documentElement);
			doc = tree;
		}
	};
})();