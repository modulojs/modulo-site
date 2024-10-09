// Site-wide configuration file

modulo.config.mdParserSettings = {
    scriptTagPrefix: /^\s*<script\s+type=.?(md|markdown).?>\s*(---)\s*/i,
    htmlMarkdownFirstLine: /^\s*<!doctype\s+html>.+<script\s+type=.?(md|markdown).?>\s*(---)\s*/i,
};


modulo.register('util', function parseMarkdown (source) {
    const { scriptTagPrefix, htmlMarkdownFirstLine } = modulo.config.mdParserSettings;
    source = source.replace(scriptTagPrefix, '---\n'); // Try removing partial prefix first
    source = source.replace(htmlMarkdownFirstLine, '---\n'); // Remove htmlMarkdown boilerplate if detected
    const converter = new showdown.Converter({ metadata: true });
    const html = converter.makeHtml(source);
    const data = converter.getMetadata();
    data.body = html; // attach as "body" attribute
    return data;
});

modulo.register('util', function loadContent (element) {
    const { scriptTagPrefix } = modulo.config.mdParserSettings;    
    let data;
    if (element.originalHTML && element.originalHTML.match(scriptTagPrefix)) {
        data = modulo.registry.utils.parseMarkdown(element.originalHTML);
    } else {
        data = { body: null }; // Return empty
    }
    data.currentYear = (new Date()).getFullYear(); // Attach current year so we can render that
    const pathname = window.location.pathname;
    data.currentTab = pathname.substring(pathname.lastIndexOf('/') + 1); // Get the current file handy
    if (data.breadcrumb) {
        data.currentArticle = data.currentTab;
        data.currentTab = data.breadcrumb; // Use breadcrumb instead to make sure the right tab is highlighted
    }
    return data;
});

modulo.register('util', function getPageSource() {
    // Quick hacky way to get a more pristine copy of page source (maybe later do in Modulo)
    const fragCopy = modulo.registry.utils.newNode(document.documentElement.outerHTML);
    const extra = fragCopy.querySelectorAll('script[id],link[id],meta[id],[modulo-asset]');
    extra.forEach(copy => copy.remove());
    let src = '<!DOCTYPE HTML>' + fragCopy.innerHTML;
    src = src.replace(/\s*<\/script>\s*<\/[a-z]+-[a-z]+>\s*$/gi, ''); // strip unecessary closing tags
    src = src.replace(/<script modulo=""/, '<script Modulo'); // clean up script tag prefix
    return src;
});
modulo.definitions._page = { source: modulo.registry.utils.getPageSource() }; // Extract page source

modulo.register('command', function edit (modulo) {
    const files = { };
    //const currentPath = modulo.registry.utils.getPath(window.location);
    let url = (window.location.protocol === 'file:') ? 'file://' : window.location.origin;
    url += window.location.pathname; // Ignore get params, eg ?GET=params
    Object.assign(files, modulo.fetchQueue.data);
    files[url] = modulo.definitions._page.source;
    // Change URL to prevent auto-loading
    console.log('replace state hapening');
    window.history.replaceState({ }, 'EDIT / ' + window.document.title, url);

    // Escape all double quotes
    //const valString = modulo.definitions._page.source.replace(/"/g, '&quot;');
    const urlString = url.replace(/"/g, '&quot;');
    const filesString = JSON.stringify(files).replace(/"/g, '&quot;');
    window.document.body.innerHTML = '<x-DemoEditor layout="fullscreen" open="' + urlString + '" files="' + fileString + '"></x-DemoEditor>';
});
