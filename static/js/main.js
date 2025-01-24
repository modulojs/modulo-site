// Example globally executed JavaScript code

/*
  Example: Registering a custom template filter
  Usage:   {{ myhtml|markdown|safe }}
*/
modulo.register('templateFilter', function markdown(text) {
    // NOTE: A tiny, "toy" markdown implementation that only supports P, H2,
    // em, strong, and img, and links (no lists, tables, hrs, etc).
    return modulo.registry.cparts
            .Template.prototype.escapeText(text)
            .replace(/^(#+)(\s*.+)/gm, '<h2>$2</h2>')
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/_([^_]+)_/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\s*\n\n+\s*([^# \n\r])/g, '<p>$1');
});



/*
  Example: Registering a custom content type

  The contentMD content type parses some Makrdown meta pages
  Usage:   <StaticData -src="some/path/to/my-page.md"></StaticData>
*/
modulo.register('processor', function contentMD (modulo, def, value) {
    // NOTE: This is a tiny Markdown meta implementation
    def.body = def.Content; // Default body to just be all content
    const chunks = def.Content.split(/(<scr.pt type=.?md.?>---\n|^\s*---\n|\n---\n)/gi);
    if (chunks.length > 2) { // Meta discovered!
        def.body = (chunks[4] || '').replace(/<.script>\s*$/i, ''); // Strip tag
        let key = null; // Used to remember multi-line keys
        for (const line of chunks[2].split(/[\n\r]/g)) { // Loop through lines
            if (key && (new RegExp('^[ \\t]')).test(line)) { // Continuation
                def[key] += line.trim();
            } else if (line.trim()) { // Skip empty fields / lines
                const keyStr = line.split(':')[0];
                key = keyStr.trim();
                def[key] = line.substr(keyStr.length + 1);
            }
        }
    }
});


/*
  Example (Not Enabled): Registering a custom Component Part

  The contentMD content type parses some Makrdown meta pages
  Usage: <MyCustomCPart a="1" b="2"></MyCustomCpart>

modulo.register('cpart', class MyCustomCPart {
    initializedCallback(renderObj) { } // Runs: Once, when the component is mounted on the page
    prepareCallback(renderObj) { } // Runs: Before each render
    renderCallback(renderObj) { } // Runs: During each render (e.g. replace Template)
    updateCallback(renderObj) { } // Runs: After every render (e.g. final DOM changes)
    exampleFunction() { } // Methods can be called by events (e.g. <a on.click:=mycustomcpart.exampleFunction>)
    exampledirMount() { } // Directives can decorate DOM (e.g. <input mycustomcpart.exampledir />)
});
*/
