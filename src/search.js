/**
 * Search module
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "utils.js"
 * @include "signals.js"
 */
var xv_search = (function(){
	var search_index = [],
		/** @type {Document} */
		doc,
		
		/** @type {Array} List of last matched elements */
		last_search,
		
		last_query,
		/** @type {jQuery} */
		popup = $('<div class="xv-search-result"><ul class="xv-search-result-content"></ul></div>'),
		max_results = 10,
		
		selected_item = -1,
		
		is_visible = false,
		
		/** @type {jQuery} Search panel */
		panel,
		
		/** @type {jQuery} Search field */
		search_field,
		
		hover_lock_timeout,
		is_hover_locked = false;
	
	/**
	 * Creates search index item
	 * @param {Element} node
	 */
	function searchIndexItem(node) {
		var search_str = node.nodeName;
		var attrs = [];
		if (node.attributes) {
			for (var i = 0, il = node.attributes.length; i < il; i++) {
				if (node.attributes[i].name.indexOf('data-xv-') == -1)
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
	 * Returns list of search result items
	 * @return {jQuery}
	 */
	function getSearchResultItems() {
		return popup.find('.xv-search-result-item');
	}
	
	/**
	 * Select search reult item
	 * @param {Number} ix Index of item
	 * @param {Boolean} no_scroll Do not scroll popup content to make shure that
	 * selected item is always visible
	 */
	function selectItem(ix, no_scroll) {
		var cur_item = getSearchResultItems()
			.removeClass('xv-search-result-item-selected')
			.eq(ix)
			.addClass('xv-search-result-item-selected');
		
		if (!no_scroll && cur_item.length) {
			var content = cur_item.parent();
			// make sure that selected proposal is visible
			var proposal_top = cur_item[0].offsetTop,
				proposal_height = cur_item[0].offsetHeight,
				popup_scroll = content[0].scrollTop,
				popup_height = content[0].offsetHeight;
				
			if (proposal_top < popup_scroll) {
				content[0].scrollTop = proposal_top;
			} else if (proposal_top + proposal_height > popup_scroll + popup_height) {
				content[0].scrollTop = proposal_top + proposal_height - popup_height;
			}
		}
		
		selected_item = ix;
		xv_signals.searchItemSelected.dispatch(cur_item[0], selected_item);
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
				name = node.nodeName,
				xpath = node.getAttribute('data-xv-xpath');
				
			if (!xpath) {
				xpath = xv_utils.createXPath(node);
				node.setAttribute('data-xv-xpath', xpath);
			}
				
			if ('ix' in n && n.ix < name.length) { // mark search result
				name = name.substr(0, n.ix) + 
					'<em>' + name.substr(n.ix, query.length) + '</em>'
					+ name.substr(n.ix + query.length);
			}
			
			var label = name + ' <span class="xv-search-result-xpath">' + xpath + '</span>';
			
			items.push('<li class="xv-search-result-item" data-xv-search-ix="' + i + '">' + label + '</li>');
			
			// reset selected item
			selected_item = -1;
		});
		
		popup.find('.xv-search-result-content').empty().append(items.join(''));
			
		if (items.length > max_results) {
			popup.addClass('xv-search-result-overflow');
			// TODO fix popup height
		} else {
			popup.removeClass('xv-search-result-overflow');
		}
	}
	
	function hidePopup() {
		popup.hide();
		is_visible = false;
	}
	
	function performSearch() {
		var query = $.trim(search_field.val()).toLowerCase();
		
		if (!query) {
			hidePopup();
			return;
		}
		
		if (query == last_query && is_visible)
			return;
		
		last_query = query;
		last_search = searchText(query);
		
		if (last_search) {
			popup.show();
			buildSearchResult(last_search, query);
			is_visible = true;
		} else {
			hidePopup();
		}
	}
	
	function applyProposal(ix) {
		xv_signals.nodeFocused.dispatch(last_search[ix].node, 'search');
		hidePopup();
	}
	
	// bind events to search field
	$(function(){
		var search_timer;
		panel = $('.xv-search-panel');
		panel.append(popup.hide());
		
		search_field = $('.xv-search-field').keydown(function(evt) {
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
			
			if (search_timer)
				clearTimeout(search_timer);
				
			search_timer = setTimeout(performSearch, 150);
		});
		
		popup
			// delegate hover event: hilight proposal
			.delegate('.xv-search-result-item', 'mouseover', function(/* Event */ evt) {
				if (is_hover_locked) return;
					
				var ix = getSearchResultItems().index(this);
				if (ix != -1)
					selectItem(ix, true);
			})
			// delegate click event: apply proposal
			.delegate('.xv-search-result-item', 'click', function(/* Event */ evt) {
				var ix = getSearchResultItems().index(this);
				if (ix != -1) {
					applyProposal(ix);
					hidePopup();
				}
			});
		
		var dont_hide = false, 
			hide_timeout;
		
		search_field
			.blur(function() {
				// use delayed execution in to handle popup click event correctly
				hide_timeout = setTimeout(function() {
					if (!dont_hide) hidePopup();
					dont_hide = false;
				}, 200);
			})
			.focus(performSearch);
		
		popup.mousedown(function(/* Event */ evt) {
			evt.preventDefault();
			evt.stopPropagation();
			dont_hide = true;
			return false;
		});
		
		$(document).mousedown(hidePopup);
	});
	
	
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