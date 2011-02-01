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
		
		last_query,
		/** @type {jQuery} */
		popup = $('<div class="xv-search-result"><ul class="xv-search-result-content"></ul></div>'),
		max_results = 10,
		
		selected_item = -1,
		
		is_visible = false,
		
		/** @type {jQuery} Search panel */
		panel,
		
		/** @type {jQuery} Search field */
		search_field;
	
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
	 * Select search reult item
	 * @param {Number} ix Index of item
	 * @param {Boolean} no_scroll Do not scroll popup content to make shure that
	 * selected item is always visible
	 */
	function selectItem(ix, no_scroll) {
		var cur_item = popup.find('.xv-search-result-item')
			.removeClass('xv-search-result-item-selected')
			.eq(ix)
			.addClass('xv-search-result-item-selected');
		
		if (!no_scroll && cur_item.length) {
			var proposal = cur_item[0];
			// make sure that selected proposal is visible
			var proposal_top = proposal.offsetTop,
				proposal_height = proposal.offsetHeight,
				popup_scroll = this.popup_content.scrollTop,
				popup_height = this.popup_content.offsetHeight;
				
			if (proposal_top < popup_scroll) {
				this.popup_content.scrollTop = proposal_top;
			} else if (proposal_top + proposal_height > popup_scroll + popup_height) {
				this.popup_content.scrollTop = proposal_top + proposal_height - popup_height;
			}
		}
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
				name = name.substr(0, n.ix) + 
					'<em>' + name.substr(n.ix, query.length) + '</em>'
					+ name.substr(n.ix + query.length);
			}
			
			items.push('<li class="xv-search-result-item" data-xv-search-ix="' + i + '">' + name + '</li>');
			
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
		var results = searchText(query);
		
		if (results) {
			popup.show();
			buildSearchResult(results, query);
			is_visible = true;
		} else {
			hidePopup();
		}
	}
	
	// bind events to search field
	$(function(){
		var search_timer;
		panel = $('.xv-search-panel');
		panel.append(popup.hide());
		
		search_field = $('.xv-search-field').keyup(function(evt) {
			
			switch (evt.keyCode) {
				case 38: //up
					that.selectProposal(Math.max(that.selected_proposal - 1, 0));
					that.lockHover();
					evt.preventDefault();
					break;
				case 40: //down
					that.selectProposal(Math.min(that.selected_proposal + 1, popup_content.childNodes.length - 1));
					that.lockHover();
					evt.preventDefault();
					break;
				case 13: //enter
					that.applyProposal(that.selected_proposal);
					that.hidePopup();
					evt.preventDefault();
					break;
				case 27: // escape
					that.hidePopup();
					evt.preventDefault();
					break;
			}
			
			
			if (search_timer)
				clearTimeout(search_timer);
				
			search_timer = setTimeout(performSearch, 200);
		});
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