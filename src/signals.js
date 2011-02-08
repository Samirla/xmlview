/**
 * Signal manager that broadcasts messages between modules
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "lib/js-signals.js"
 */
var xv_signals = {
	searchItemSelected: new signals.Signal,
	/**
	 * Original node is (or should be) focused
	 * @param {Element} node Focused node
	 * @param {String} source Signal source 
	 */
	nodeFocused: new signals.Signal,
	
	/**
	 * New XML is feeded to XV component
	 * @param {Element} render_tree Rendered tree
	 * @param {Document} original_tree Original tree feeded to XV component
	 */
	documentProcessed: new signals.Signal
};