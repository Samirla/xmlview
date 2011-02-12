<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet version="1.0" xmlns="http://www.w3.org/1999/xhtml" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output
	method="html"
	version="1.0"
	encoding="utf-8"
	indent="no"
	cdata-section-elements="script"
/>

<xsl:param name="css" select="'xv.css'"/>

<xsl:template match="/">
<html lang="en-US">
	<head>
		<meta charset="UTF-8"/>
		<xsl:comment>
			<xsl:value-of select="concat(system-property('xsl:version'), '/', system-property('xsl:vendor'), '/', system-property('xsl:vendor-url'))"/>
		</xsl:comment>
		
		<link rel="stylesheet" type="text/css" href="{$css}" media="all" />
	</head>
	<body>
		<div class="xv-search-panel">
			<input type="search" class="xv-search-field" spellcheck="false" placeholder="Search by name or XPath" />
		</div>
		<div class="xv-source-pane">
			<div class="xv-source-pane-inner"></div>
		</div>
		<div class="xv-quick-outline">
			<span class="xv-quick-outline-close">×</span>
			<h2><input type="search" name="xv-quick-outline-search" id="fld-xv-quick-outline-search" /></h2>
			<div class="xv-quick-outline-content"></div>
		</div>
	</body>
</html>
</xsl:template>

</xsl:stylesheet>