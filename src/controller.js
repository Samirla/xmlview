/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "xmlview.js"
 */$(function(){
	console.profile();
	var xml_str = xmlview.parser.run($('.b-page')[0]);
	var xml_doc = xmlview.parser.toXml(xml_str);
	console.profileEnd();
	console.log(xml_doc);
});