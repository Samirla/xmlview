/**
 * UI for search module
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "utils.js"
 * @include "dom.js"
 * @include "signals.js"
 * @include "search.js"
 */
(function(){
	var search_index = [],
		/** @type {Document} */
		doc,
		
		/** @type {Array} List of last matched elements */
		last_search,
		
		last_query,
		/** @type {Element} Popup container */
		popup,
		
		selected_item = -1,
		
		is_visible = false,
		
		/** @type {Element} Search field */
		search_field,
		/** @type {Element} Inline xpath result container */
		inline_xpath, 
		
		hover_lock_timeout,
		is_hover_locked = false;
	
	/**
	 * Returns list of search result items
	 * @return {NodeList}
	 */
	function getSearchResultItems() {
		return xv_dom.getByClass('xv-search-result-item', popup);
	}
	
	/**
	 * Returns maximum visible results in search popup
	 * @return {Number}
	 */
	function getMaxVisibleResults() {
		return xv_settings.getValue('search.max_visible', 20);
	}
	
	/**
	 * Select search result item
	 * @param {Number} ix Index of item
	 * @param {Boolean} no_scroll Do not scroll popup content to make sure that
	 * selected item is always visible
	 */
	function selectItem(ix, no_scroll) {
		var result_items = getSearchResultItems(),
			/** @type {Element} */
			cur_item;
			
		ix = Math.min(result_items.length - 1, Math.max(0, ix));
			
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
	function createSearchResultLabel(item) {
		var label = item.label;
		if (item.query_start != -1) {
			label = item.label.substring(0, item.query_start) + 
				'<em>' + item.label.substring(item.query_start, item.query_end) + '</em>' +
				item.label.substring(item.query_end);
		}
		
		return label + ' <span class="xv-search-result-xpath">' + item.xpath + '</span>';
	}
	
	/**
	 * Creates HTML list of found nodes
	 * @param {Array} found List of matched nodes
	 * @param {String} query Search query
	 * @return {jQuery}
	 */
	function buildSearchResult(found, query) {
		// reset selected item
		selected_item = -1;
		
		if (found.results.length == 1 && 'xpath_type' in found.results[0]) {
			// single xpath result
			inline_xpath.innerHTML = found.results[0].value;
			showInlineXpath();
			hidePopup();
		} else {
			var items = _.map(found.results, function(n, i) {
				return '<li class="xv-search-result-item" data-xv-search-ix="' + i + '">' + createSearchResultLabel(n) + '</li>';
			});
			
			var content = xv_dom.getOneByClass('xv-search-result-content');
			xv_dom.empty(content);
			content.appendChild(xv_dom.fromHTML(items.join('')));
			
			if (found.results.length > getMaxVisibleResults()) {
				xv_dom.addClass(popup, 'xv-search-result-overflow');
				xv_dom.setCSS(content, {'height': getSearchResultItems()[0].offsetHeight * getMaxVisibleResults()});
			} else {
				xv_dom.removeClass(popup, 'xv-search-result-overflow');
				xv_dom.setCSS(content, {'height': 'auto'});
			}
			
			hideInlineXpath();
			showPopup();
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
	
	function hideInlineXpath() {
		xv_dom.addClass(inline_xpath, 'xv-search-result-hidden');
	}
	
	function showInlineXpath() {
		xv_dom.removeClass(inline_xpath, 'xv-search-result-hidden');
	}
	
	function performSearch() {
		var query = xv_utils.trim(search_field.value).toLowerCase();
		
		if (!query) {
			hideInlineXpath();
			hidePopup();
			return;
		}
		
		if (query == last_query && is_visible)
			return;
		
		last_query = query;
		last_search = xv_search.search(query);
		
		if (last_search.results) {
			buildSearchResult(last_search);
		} else {
			hideInlineXpath();
			hidePopup();
		}
	}
	
	function applyProposal(ix) {
		xv_search.applyProposal(ix);
		hidePopup();
	}
	
	var _doSearch = _.debounce(performSearch, 400);
	
	/**
	 * Handle keyboard event performed on search field
	 * @param {Event} evt
	 */
	function handleKeyEvent(evt) {
		if (is_visible) {
			switch (evt.keyCode) {
				case 38: //up
					selectItem(selected_item - 1);
					lockHover();
					evt.preventDefault();
					return;
				case 40: //down
					selectItem(selected_item + 1);
					lockHover();
					evt.preventDefault();
					return;
				case 13: //enter
					applyProposal(selected_item);
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
		popup = xv_dom.fromHTML('<div class="xv-search-result"><ul class="xv-search-result-content"></ul></div>');
		hidePopup();
		
		var panel = xv_dom.getOneByClass('xv-search-panel');
		panel.appendChild(popup);
		
		search_field = xv_dom.getOneByClass('xv-search-field', panel);
		inline_xpath = xv_dom.getOneByClass('xv-search-xpath-result', panel);
		hideInlineXpath();
		
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
				hideInlineXpath();
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
		xv_dom.addEvent(search_field, 'search', performSearch);
		
		xv_dom.addEvent(popup, 'mousedown', function(/* Event */ evt) {
			evt.preventDefault();
			evt.stopPropagation();
			dont_hide = true;
			return false;
		});
		
		xv_dom.addEvent(document, 'mousedown', hidePopup);
	});
})();