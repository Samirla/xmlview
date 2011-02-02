/**
 * Init XML Viewer. Pass XML document to <code>xv_controller</code> as text or
 * <code>Document</code> object (loaded with AJAX)
 * 
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
$(function() {
	xv_controller.process($('#xv-source-data').text());
});