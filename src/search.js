/**
 * Search module
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "utils.js"
 * @include "dom.js"
 * @include "signals.js"
 */
var xv_search = (function(){
	var search_index = [],
		/** @type {Document} */
		doc,
		
		/** @type {Array} List of last matched elements */
		last_search,
		
		/** Mac results to be matched */
		max_results = 200;
		
	
	/**
	 * Creates search index item
	 * @param {Element} node
	 */
	function searchIndexItem(node) {
		var search_str = node.nodeName,
			attrs = xv_utils.filterValidAttributes(node);
		
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
		_.each(node.childNodes, buildIndex);
	}
	
	/**
	 * Simple textual search on document tree
	 * @param {String} query Search query
	 * @return {Array} Array of matched nodes, null otherwise 
	 */
	function searchText(query) {
		var result = [];
		if (query) {
			_.each(search_index, function(/* searchIndexItem */ n) {
				var ix = n.str.indexOf(query);
				if (ix != -1) {
					result.push({
						ix: ix,
						node: n.node
					});
					
					if (result.length >= max_results)
						return false;
				}
			});
		}
		
		return result.length ? result : null;
	}
	
	function searchXPath(query) {
		var result = [], i = 0;
		try {
			// TODO handle namespaces
			var nodes = doc.evaluate(query, doc, null, XPathResult.ANY_TYPE, null);
			var n = nodes.iterateNext();
			while (n && i < max_results) {
				result.push({node: n});
				n = nodes.iterateNext();
				i++;
			}
		} catch(e) {}
		
		return result.length ? result : null;
	}
	
	/**
	 * Post-process search result item: add label and found query range
	 * @param {Object} item Search result item
	 * @param {String} query Search query
	 * @return {Object} Augumented item
	 */
	function postProcessResult(item, query) {
		/** @type {Element} */
		var node = item.node,
			name = node.nodeName,
			ql = query.length,
			xpath = node.getAttribute('data-xv-xpath');
			
		if (!xpath) {
			xpath = xv_utils.createXPath(node);
			node.setAttribute('data-xv-xpath', xpath);
		}
		
		item.label = name;
		item.query_start = -1;
		item.query_end = -1;
		item.xpath = xpath;
			
		if ('ix' in item) { // simple text search result
			if (item.ix < name.length) {  // mark search result in node name
				item.query_start = item.ix;
				item.query_end = item.ix + ql;
			} else { // match found somethere in attribute, add it
				_.detect(node.attributes, function(n) {
					var _ix = n.name.indexOf(query);
					if (_ix != -1) {
						item.label += '[@' + n.name + ']';
						item.query_start = name.length + _ix + 2;
						item.query_end = item.query_start + ql;
						return true;
					}
				});
			}
		}
		
		return item;
	}
	
	
	xv_signals.documentProcessed.add(function(render_tree, original_tree) {
		search_index.length = 0;
		buildIndex(original_tree.nodeType == 9 ? original_tree.documentElement : original_tree);
		doc = original_tree;
	});
	
	return {
		/**
		 * Search for XML node (simple or XPath search)
		 * @param {String} query
		 * @return {Object} JSON object with search results
		 */
		search: function(query) {
			query = xv_utils.trim(query).toLowerCase();
			last_search = xv_utils.isXPath(query) ? searchXPath(query) : searchText(query);
			
			if (last_search)
				last_search = _.map(last_search, function(n) {
					return postProcessResult(n, query);
				});
			
			return {
				query: query,
				results: last_search
			};
		},
		
		/**
		 * Apply search result to document (i.e. select matched node)
		 * @param {Number} ix Last search result index
		 */
		applyProposal: function(ix) {
			xv_signals.nodeFocused.dispatch(last_search[ix].node, 'search');
		}
	};
})();