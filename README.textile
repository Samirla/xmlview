XV is a browser-based XML viewer, available as a Google Chrome and Safari extensions.

!http://files.chikuyonok.ru/xv/screenshot.png?v=2!

"Online demo":http://files.chikuyonok.ru/xv/ (works in Chrome, Safari, Firefox)

h2. Current features

* *Collapsable elements*: Alt+click to expand/collapse all descendant elements
* *Outline* for better document overview
* *Search by name or XPath*. By default uses simple search mode which looks for a partial match in element‘s or attribute’s name; use special symbols like '/' or '[' to search by XPath
* *Quick XPath mode*: hold down Command (Mac) or Ctrl (PC) key while moving mouse cursor over element‘s or attribute’s name to enter Quick XPath mode. Use Shift key to cycle through available XPath variants and then drag’n’drop element under cursor into text editor.
_Google Chrome users: click on element will copy XPath to clipboard_

h3. Download

* "Google Chrome extension":https://chrome.google.com/webstore/detail/eeocglpgjdpaefaedpblffpeebgmgddk
* "Safari extension":http://files.chikuyonok.ru/xv/xv.safariextz

You can also download an "XSL stylesheet":https://github.com/sergeche/xmlview/downloads and use it for styling XML files with @<?xml-stylesheet type="text/xsl" href="xv-browser.xsl"?>@

h3. Installation

h4. Chrome
* Got to chrome://extensions/ and Enable XV — XML Viewer. If you want the viewer to automatically process XML feeds, Click on Options and tick the box <strong>Intercept requests for XML, RSS and ATOM documents</strong>

h3. Note for Safari on Mac plugin

Due to plugin’s nature, the styled XML is very unresponsive on mouse hover events (like Quick XPath mode) so you have to click on area of interest to get focus. I’m looking for a solutions of this problem.

------------------
XV design is inspired by MacRabbit’s "Espresso editor":http://macrabbit.com/espresso/
