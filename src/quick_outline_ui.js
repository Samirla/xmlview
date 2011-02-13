/**
 * UI for quick outline: open small window by keyboard shortcut, search for 
 * element and select it
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "dom.js"
 * @include "controller.js"
 * @include "outline.js"
 * @include "signals.js"
 */(function(){
	var popup_html = '<div class="xv-quick-outline">' +
			'<span class="xv-quick-outline-close">×</span>' +
			'<div class="xv-quick-outline-search"></div>' +
			'<div class="xv-quick-outline-content"></div>' +
			'</div>';
	
	/** @type {Element} */
	var popup,
		/** @type {Element} */
		search_fld,
		/** @type {Element} */
		content,
		
		last_query,
		last_search,
		selected_item,
		is_hover_locked;
			
	function showPopup() {
		xv_dom.removeClass(search_fld, 'xv-quick-outline-hidden');
	}
	
	function hidePopup() {
		xv_dom.addClass(search_fld, 'xv-quick-outline-hidden');
	}
	
	function isVisible() {
		xv_dom.hasClass(search_fld, 'xv-quick-outline-hidden');
	}
	
	function emptyContent() {
		xv_dom.empty(content);
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
			xv_dom.removeClass(n, 'xv-outline-node-selected');
			if (i == ix) {
				cur_item = n;
				xv_dom.addClass(n, 'xv-outline-node-selected');
			}
		});
		
		if (!no_scroll && cur_item) {
			// TODO дописать
		}
		
		selected_item = ix;
	}
	
	/**
	 * Returns list of search result items
	 * @return {NodeList}
	 */
	function getSearchResultItems() {
		return xv_dom.getByClass('xv-outline-node', content);
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
		
		
		
	}
	
	function performSearch() {
		var query = xv_utils.trim(search_field.value).toLowerCase();
		
		if (!query) {
			emptyContent();
			return;
		}
		
		if (query == last_query)
			return;
		
		last_query = query;
		last_search = xv_search.search(query);
		
		if (last_search.results) {
			buildSearchResult(last_search);
		} else {
			emptyContent();
		}
	}
	
	function applyProposal(ix) {
		xv_search.applyProposal(ix);
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
	
	
	xv_signals.documentProcessed.addOnce(function() {
		var popup = xv_dom.getOneByClass('xv-quick-outline');
		if (!popup) {
			popup = xv_dom.fromHTML(popup_html);
			xv_dom.getOneByClass('xv-source-pane').parentNode.appendChild(popup);
		}
		
		search_fld = popup.getElementsByTagName('input')[0];
		content = xv_dom.getOneByClass('xv-quick-outline-content');
		
		hidePopup();
		
		
	});
})();