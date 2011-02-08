/**
 * Search module
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "utils.js"
 * @include "dom.js"
 * @include "signals.js"
 */
(function(){
	var search_index = [],
		/** @type {Document} */
		doc,
		
		/** @type {Array} List of last matched elements */
		last_search,
		
		last_query,
		/** @type {Element} Popup container */
		popup = xv_dom.fromHTML('<div class="xv-search-result"><ul class="xv-search-result-content"></ul></div>'),
		max_visible_results = 20,
		max_results = 200,
		
		selected_item = -1,
		
		is_visible = false,
		
		/** @type {Element} Search field */
		search_field,
		
		hover_lock_timeout,
		is_hover_locked = false;
	
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
	 * Returns list of search result items
	 * @return {NodeList}
	 */
	function getSearchResultItems() {
		return xv_dom.getByClass('xv-search-result-item');
	}
	
	/**
	 * Select search reult item
	 * @param {Number} ix Index of item
	 * @param {Boolean} no_scroll Do not scroll popup content to make shure that
	 * selected item is always visible
	 */
	function selectItem(ix, no_scroll) {
		var result_items = getSearchResultItems(),
			/** @type {Element} */
			cur_item;
			
		_.each(result_items, function(n, i) {
			xv_dom.removeClass(n, 'xv-search-result-item-selected');
			if (i == ix) {
				cur_item = n;
				xv_dom.addClass(n, 'xv-search-result-item-selected');
			}
		});
		
		if (!no_scroll && cur_item) {
			var content = cur_item.parentNode;
			// make sure that selected proposal is visible
			var proposal_top = cur_item.offsetTop,
				proposal_height = cur_item.offsetHeight,
				popup_scroll = content.scrollTop,
				popup_height = content.offsetHeight;
				
			if (proposal_top < popup_scroll) {
				content.scrollTop = proposal_top;
			} else if (proposal_top + proposal_height > popup_scroll + popup_height) {
				content.scrollTop = proposal_top + proposal_height - popup_height;
			}
		}
		
		selected_item = ix;
		xv_signals.searchItemSelected.dispatch(cur_item, selected_item);
	}
	
	/**
	 * Temporary lock popup hover events.
	 * Hover lock is used to prevent accident mouseover event callback when
	 * mouse cursor is over popup window and user traverses between proposals
	 * with arrow keys
	 */
	function lockHover() {
		if (hover_lock_timeout)
			clearTimeout(hover_lock_timeout);
		
		is_hover_locked = true;
		setTimeout(function() {
			is_hover_locked = false;
		}, 100);
	}
	
	/**
	 * Creates label that will be displayed as a search result
	 * @param {Object} item Search result item
	 * @param {String} query Search query
	 */
	function createSearchResultLabel(item, query) {
		/** @type {Element} */
		var node = item.node,
			name = node.nodeName,
			ql = query.length,
			xpath = node.getAttribute('data-xv-xpath');
			
		if (!xpath) {
			xpath = xv_utils.createXPath(node);
			node.setAttribute('data-xv-xpath', xpath);
		}
			
		if ('ix' in item) { // simple text search result
			if (item.ix < name.length) {  // mark search result in node name
				name = name.substr(0, item.ix) + 
					'<em>' + name.substr(item.ix, ql) + '</em>'
					+ name.substr(item.ix + ql);
			} else { // match found somethere in attribute, add it
				for (var i = 0, n, _ix, il = node.attributes.length; i < il; i++) {
					n = node.attributes[i];
					_ix = n.name.indexOf(query);
					if (_ix != -1) {
						name += '[@' + n.name.substr(0, _ix) + 
							'<em>' + n.name.substr(_ix, ql) + '</em>'
							+ n.name.substr(_ix + ql) + ']';
							
						break;
					}
				}
			}
		}
		
		return name + ' <span class="xv-search-result-xpath">' + xpath + '</span>';
	}
	
	/**
	 * Creates HTML list of found nodes
	 * @param {Array} found List of matched nodes
	 * @param {String} query Search query
	 * @return {jQuery}
	 */
	function buildSearchResult(found, query) {
		var items = _.map(found, function(n, i) {
			return '<li class="xv-search-result-item" data-xv-search-ix="' + i + '">' + createSearchResultLabel(n, query) + '</li>';
		});
		
		// reset selected item
		selected_item = -1;
		
		var content = xv_dom.getOneByClass('xv-search-result-content');
		xv_dom.empty(content);
		content.appendChild(xv_dom.fromHTML(items.join('')));
			
		if (found.length > max_visible_results) {
			xv_dom.addClass(popup, 'xv-search-result-overflow');
			xv_dom.setCSS(content, {'height': getSearchResultItems()[0].offsetHeight * max_visible_results});
		} else {
			xv_dom.removeClass(popup, 'xv-search-result-overflow');
			xv_dom.setCSS(content, {'height': 'auto'});
		}
	}
	
	function hidePopup() {
		xv_dom.addClass(popup, 'xv-search-result-hidden');
		is_visible = false;
	}
	
	function showPopup() {
		xv_dom.removeClass(popup, 'xv-search-result-hidden');
		is_visible = true;
	}
	
	function performSearch() {
		var query = xv_utils.trim(search_field.value).toLowerCase();
		
		if (!query) {
			hidePopup();
			return;
		}
		
		if (query == last_query && is_visible)
			return;
		
		last_query = query;
		last_search = xv_utils.isXPath(query) ? searchXPath(query) : searchText(query);
		
		if (last_search) {
			showPopup();
			buildSearchResult(last_search, query);
		} else {
			hidePopup();
		}
	}
	
	function applyProposal(ix) {
		xv_signals.nodeFocused.dispatch(last_search[ix].node, 'search');
		hidePopup();
	}
	
	var _doSearch = _.debounce(performSearch, 150);
	
	/**
	 * Handle keyboard event performed on search field
	 * @param {Event} evt
	 */
	function handleKeyEvent(evt) {
		if (is_visible) {
			switch (evt.keyCode) {
				case 38: //up
					selectItem(Math.max(selected_item - 1, 0));
					lockHover();
					evt.preventDefault();
					return;
				case 40: //down
					selectItem(Math.min(selected_item + 1, last_search.length - 1));
					lockHover();
					evt.preventDefault();
					return;
				case 13: //enter
					applyProposal(selected_item);
					hidePopup();
					evt.preventDefault();
					return;
				case 27: // escape
					hidePopup();
					evt.preventDefault();
					return;
			}
		}
		
		_doSearch();
	}
	
	function runOnDelegated(cur_elem, fn) {
		var elem = xv_dom.bubbleSearch(cur_elem, 'xv-search-result-item');
		if (elem) {
			var ix = _.indexOf(getSearchResultItems(), elem);
			if (ix != -1)
				fn(ix);
		}
	}
	
	xv_signals.documentProcessed.addOnce(function() {
		hidePopup();
		
		var panel = xv_dom.getOneByClass('xv-search-panel');
		panel.appendChild(popup);
		
		search_field = xv_dom.getOneByClass('xv-search-field', panel);
		
		// bind events to search field
		xv_dom.addEvent(search_field, 'keydown', handleKeyEvent);
		
		// delegate hover event: hilight proposal
		xv_dom.addEvent(popup, 'mouseover', function(/* Event */ evt) {
			if (is_hover_locked) return;
			runOnDelegated(evt.target, function(ix) { selectItem(ix, true); });
		});
		
		// delegate click event: apply proposal
		xv_dom.addEvent(popup, 'click', function(/* Event */ evt) {
			runOnDelegated(evt.target, function(ix) {
				applyProposal(ix);
				hidePopup();
			});
		});
		
		var dont_hide = false;
		
		xv_dom.addEvent(search_field, 'blur', function() {
			// use delayed execution in to handle popup click event correctly
			setTimeout(function() {
				if (!dont_hide) hidePopup();
				dont_hide = false;
			}, 200);
		});
		
		xv_dom.addEvent(search_field, 'focus', performSearch);
		
		xv_dom.addEvent(popup, 'mousedown', function(/* Event */ evt) {
			evt.preventDefault();
			evt.stopPropagation();
			dont_hide = true;
			return false;
		});
		
		xv_dom.addEvent(document, 'mousedown', hidePopup);
	});
	
	xv_signals.documentProcessed.add(function(render_tree, original_tree) {
		search_index.length = 0;
		buildIndex(original_tree.nodeType == 9 ? original_tree.documentElement : original_tree);
		doc = original_tree;
	});
})();