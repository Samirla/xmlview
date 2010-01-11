<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output encoding="utf-8" method="html" indent="no"/>
	
	<xsl:param name="escape_chars" select="true()"/>
	
	<!-- Maximum characters length for cor compact (e.g. on single line) tag representation -->
	<xsl:param name="compact_length" select="number(50)"/>
	
	<xsl:template match="/">
		<xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html&gt;</xsl:text>
		<html>
			<head>
				<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
				<title>XML view</title>
				<link rel="stylesheet" href="../css/main.css" />
				<script type="text/javascript" src="../src/jquery-1.3.2.min.js"></script>
				<script type="text/javascript" src="../src/xmlview.js"></script>
				<script type="text/javascript" src="../src/parser.js"></script>
			 	<script type="text/javascript" src="../src/controller.js"></script>
			</head>
			<body>
				<div class="b-page">
					<xsl:apply-templates select="* | comment()" mode="xmlview"/>
				</div>
			</body>
		</html>
	</xsl:template>
	
	<!-- Tag -->	<xsl:template match="*" mode="xmlview">		<div class="x-tag">
			<xsl:attribute name="class">
				<xsl:text>x-tag</xsl:text>				<xsl:if test="not(./*) and string-length(text()) &lt;= $compact_length">					x-tag-compact				</xsl:if>			</xsl:attribute>			<div class="x-tag-open">				<xsl:text>&lt;</xsl:text>				<xsl:apply-templates select="." mode="xmlview_open_tag"/>				<xsl:text>&gt;</xsl:text>			</div>			<xsl:apply-templates select="." mode="xmlview_tag_content"/>						<div class="x-tag-close">&lt;/<span class="x-tag-name"><xsl:value-of select="name()"/></span>&gt;</div>		</div>
	</xsl:template>
	
	<!-- Selfclosing tag -->	<xsl:template match="*[not(node())]" mode="xmlview">		<div class="x-tag-selfclosing">
			<div class="x-tag-open">
				<xsl:text>&lt;</xsl:text>
				<xsl:apply-templates select="." mode="xmlview_open_tag"/>
				<xsl:text>/&gt;</xsl:text>
			</div>
		</div>	</xsl:template>
	
	<!-- Opening tag contents -->	<xsl:template match="*" mode="xmlview_open_tag">		<span class="x-tag-name"><xsl:value-of select="name()"/></span>
		<xsl:apply-templates select="." mode="xmlview_namespaces"/>
		<xsl:apply-templates select="@*" mode="xmlview"/>	</xsl:template>
	
	<!-- Tag content -->	<xsl:template match="*" mode="xmlview_tag_content">		<div class="x-tag-content">			<xsl:apply-templates select="." mode="xmlview_content"/>		</div>	</xsl:template>
	
	<!-- Attribute -->	<xsl:template match="@*" mode="xmlview">
		<xsl:text> </xsl:text>		<span class="x-tag-attr">
			<span class="x-tag-attr-name">
				<xsl:value-of select="name()"/>
			</span>
			<xsl:text>="</xsl:text>
			<span class="x-tag-attr-value">
				<xsl:apply-templates select="." mode="xmlview_escape"/>
			</span>
			<xsl:text>"</xsl:text>
		</span>	</xsl:template>
	
	<!-- Output descending elements -->	<xsl:template match="*" mode="xmlview_content">		<xsl:apply-templates select="node()" mode="xmlview"/>	</xsl:template>
	
	<!-- Comment -->
	<xsl:template match="comment()" mode="xmlview">
		<div class="x-comment">&lt;-- <div class="x-comment-content"><xsl:value-of select="."/></div> --&gt;</div>
	</xsl:template>
	
	<!-- Text -->
	<xsl:template match="text()" mode="xmlview">
		<xsl:apply-templates select="." mode="xmlview_escape"/>
	</xsl:template>
	
	<!-- Processing instruction -->
	<xsl:template match="processing-instruction()" mode="xmlview">
		<div class="x-pi">&lt;?<xsl:value-of select="name()"/><xsl:if test="string(.)"><xsl:text> </xsl:text><xsl:value-of select="."/></xsl:if>?&gt;</div>
	</xsl:template>
	
	<!-- Emit namespace declarations -->
	<xsl:template match="*" mode="xmlview_namespaces">
		<xsl:for-each select="@*|.">
			<xsl:variable name="my_ns" select="namespace-uri()"/>
			<!-- 
				Emit a namespace declaration if this element or attribute has 
				a namespace and no ancestor already defines it.
				Currently this produces redundant declarations for namespaces 
				used only on attributes.
			-->
			<xsl:if test="$my_ns and not(ancestor::*[namespace-uri() = $my_ns])">
				<xsl:variable name="prefix" select="substring-before(name(), local-name())"/>
				<span class="x-tag-attr">
					<span class="x-tag-attr-name">						<xsl:text> xmlns</xsl:text>						<xsl:if test="$prefix">							<xsl:value-of select="concat(':', substring-before($prefix, ':'))"/>						</xsl:if>					</span>
					<xsl:text>="</xsl:text>
						<span class="x-tag-attr-value">							<xsl:value-of select="namespace-uri()"/>						</span>
					<xsl:text>"</xsl:text>
				</span>
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
	
	<!-- Wrapper for 'xmlview_escape' template -->
	<xsl:template match="@*" mode="xmlview_escape">
		<xsl:choose>			<xsl:when test="string($escape_chars) != 'false'">				<xsl:call-template name="xmlview_escape">					<xsl:with-param name="text" select="."/>				</xsl:call-template>			</xsl:when>			<xsl:otherwise>
				<xsl:value-of select="."/>			</xsl:otherwise>		</xsl:choose>	</xsl:template>
	
	<xsl:template match="text()" mode="xmlview_escape">
		<xsl:choose>
			<xsl:when test="string($escape_chars) != 'false'">
				<xsl:call-template name="xmlview_escape_symbol">
					<xsl:with-param name="symbol">&amp;</xsl:with-param>
					<xsl:with-param name="escape">&amp;amp;</xsl:with-param>
					<xsl:with-param name="text" select="string(.)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="."/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<!-- Escape quotes and ampersands to allow users to copy valid XML -->
	<xsl:template name="xmlview_escape">
		<xsl:param name="text"/>
		
		<xsl:variable name="escaped_text">
			<xsl:call-template name="xmlview_escape_symbol">
				<xsl:with-param name="symbol">&amp;</xsl:with-param>
				<xsl:with-param name="escape">&amp;amp;</xsl:with-param>
				<xsl:with-param name="text" select="string($text)"/>
			</xsl:call-template>
		</xsl:variable>
		
		<xsl:variable name="escaped_text2">
			<xsl:call-template name="xmlview_escape_symbol">
				<xsl:with-param name="symbol">'</xsl:with-param>
				<xsl:with-param name="escape">&amp;apos;</xsl:with-param>
				<xsl:with-param name="text" select="string($escaped_text)"/>
			</xsl:call-template>
		</xsl:variable>
		
		<xsl:call-template name="xmlview_escape_symbol">
			<xsl:with-param name="symbol">"</xsl:with-param>
			<xsl:with-param name="escape">&amp;quot;</xsl:with-param>
			<xsl:with-param name="text" select="$escaped_text2"/>
		</xsl:call-template>
	</xsl:template>
	
	<xsl:template name="xmlview_escape_symbol">
		<xsl:param name="symbol"/>
		<xsl:param name="escape"/>
		<xsl:param name="text"/>
		<xsl:variable name="raw_data">
			<xsl:call-template name="xmlview_escape_symbol_runner">
				<xsl:with-param name="symbol" select="$symbol"/>
				<xsl:with-param name="escape" select="$escape"/>
				<xsl:with-param name="text" select="$text"/>
			</xsl:call-template>
		</xsl:variable>
		
		<xsl:value-of select="normalize-space($raw_data)"/>
	</xsl:template>
	
	<xsl:template name="xmlview_escape_symbol_runner">
		<xsl:param name="symbol"/>
		<xsl:param name="escape"/>
		<xsl:param name="text"/>
		<xsl:choose>
			<xsl:when test="contains($text, $symbol)">
				<xsl:value-of select="concat(substring-before($text, $symbol), $escape)"/>
				<xsl:call-template name="xmlview_escape_symbol_runner">
					<xsl:with-param name="symbol" select="$symbol"/>
					<xsl:with-param name="escape" select="$escape"/>
					<xsl:with-param name="text" select="substring-after($text, $symbol)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$text"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
</xsl:stylesheet>