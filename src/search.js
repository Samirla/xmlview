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
		
		/** Max results to be matched */
		max_results = 200,
		namespaces = {};
		
		
	function collectNamespaces(doc) {
		namespaces = {};
		_.each(doc.getElementsByTagName('*'), function(node) {
			_.each(node.attributes, function(attr) {
				if (startsWith(attr.nodeName, 'xmlns'))
					namespaces[attr.nodeName.substring(attr.nodeName.indexOf(':') + 1)] = attr.nodeValue;
			});
		});
	}
	
	function nsResolver(prefix) {
		return namespaces[prefix] || null;
	}
	
	function startsWith(str, val) {
		return str.substr(0, val.length) == val;
	}
	
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
			var xpath_rs = doc.evaluate(query, doc, nsResolver, XPathResult.ANY_TYPE, null);
			
			switch(xpath_rs.resultType) {
				case XPathResult.NUMBER_TYPE:
					result.push({
						xpath_type: xpath_rs.resultType,
						value: xpath_rs.numberValue
					});
					break;
				case XPathResult.STRING_TYPE:
					result.push({
						xpath_type: xpath_rs.resultType,
						value: xpath_rs.stringValue
					});
					break;
				case XPathResult.BOOLEAN_TYPE:
					result.push({
						xpath_type: xpath_rs.resultType,
						value: xpath_rs.booleanValue
					});
					break;
				case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
					var n = xpath_rs.iterateNext();
					while (n && i < max_results) {
						result.push({node: n});
						n = xpath_rs.iterateNext();
						i++;
					}	
					break;
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
		collectNamespaces(original_tree);
		if (original_tree.nodeType == 9) {
			buildIndex(original_tree.documentElement);
			doc = original_tree;
		} else {
			buildIndex(original_tree);
			doc = original_tree.ownerDocument;
		}
	});
	
	return {
		/**
		 * Search for XML node (simple or XPath search)
		 * @param {String} query
		 * @return {Object} JSON object with search results
		 */
		search: function(query) {
			query = xv_utils.trim(query).toLowerCase();
			
			try {
				last_search = xv_utils.isXPath(query) ? searchXPath(query) : searchText(query);
				
				if (last_search && !(last_search.length == 1 && 'xpath_type' in last_search[0]))
					last_search = _.map(last_search, function(n) {
						return postProcessResult(n, query);
					});
				
			} catch(e) {
				last_search = null;
			}
			
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