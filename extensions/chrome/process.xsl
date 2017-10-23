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
<xsl:param name="custom_css" select="''"/>
<xsl:param name="options_url" select="'options.html'"/>

<xsl:template match="/">
<html lang="en-US">
	<head>
		<meta charset="UTF-8"/>
		<xsl:comment>
			<xsl:value-of select="concat(system-property('xsl:version'), '/', system-property('xsl:vendor'), '/', system-property('xsl:vendor-url'))"/>
		</xsl:comment>
		<link rel="stylesheet" type="text/css" href="{$css}" media="all" />
		<style type="text/css">
			<xsl:value-of select="$custom_css"/>
		</style>
	</head>
	<body>
		<div class="xv-search-panel">
			<input type="search" class="xv-search-field" spellcheck="false" placeholder="Search by name or XPath" />
			<span class="xv-search-xpath-result"></span>
			<!-- <xsl:if test="$options_url">
				<a href="{$options_url}" class="xv-options-href">Options</a>
			</xsl:if> -->
		</div>
		<div class="xv-source-pane">
			<div class="xv-source-pane-inner"></div>
		</div>
	</body>
</html>
</xsl:template>

</xsl:stylesheet>
