/*
  A Component Part that provides "Virtual Browser" capabilities, intended
  for making sandboxed iframes in editors.
*/


modulo.config.vbrowser = {
    previewMode: 'iframe',
    previewElement: null,
    demoLoading: '<iframe style="opacity: 0.0"></iframe>',
    demoCode: '<iframe style="opacity: 1.0"></iframe>',
    settings: { divider: 70, fontSize: 16, fullscreen: false, dividerSplit: 50 },
    Directives: [ 'demoMount', 'demoUnmount' ],
    DefBuilders: [ 'Content|FetchFiles' ],
};
modulo.registry.cparts.VBrowser = class VBrowser {
    initializedCallback() {
        const templates = Object.values(this.element.cparts).filter(({ conf }) => conf.Type === 'Template');
        this.childModulo = null;
        this.iframe = null;
        this.files = this.conf.files || {};
        this.data = {
            files: this.files,
            demo: this.conf.demoLoading,
            settings: Object.assign({}, this.conf.settings),
            buttonTemplates: templates.filter(({ conf }) => 'Button' in conf),
            fileTemplates: templates.filter(({ conf }) => 'File' in conf),
            menu: null,
            text: null,
            url: null,
            editing: null,
            runCount: 0,
            recent: [ ], // TODO: { url: ..., files: ..., prefix: ... }  (copies all files to prefix)
        };
        for (const methName of [ 'toggleMenu', 'refresh', 'saveSnippet', 'edit', 'view', 'create' ]) {
            this.data[methName] = this[methName].bind(this); // Attaching public methods
        }
        this.prepFiles();
        this.syncRoutes();
        const state = this.element.cparts[this.conf.stateName || 'state']; // Retrieve State Component Part
        state.data.vbrowser = this.data; // Expose my data in state (TODO: Respect -name)
        return this.data;
    }

    static FetchFiles (modulo, def, value) {
        const paths = value.split(/[ \s\n\r]+/g).filter(v => v);
        def.files = {};
        def.filePaths = {};
        for (const path of paths) {
            const { getParentDefPath } = modulo.registry.utils;
            const url = (new window.URL(path, getParentDefPath(modulo, def))).href;
            modulo.fetchQueue.fetch(url).then(text => {
                def.files[url] = text; // Populate file
                def.filePaths[url] = path; // Ensure relative path is here too i guess
            });
        }
    }

    prepFiles() {
        // TODO: allow for a -src=".list", to autoload all as Templates, thus allowing for entire directory inclusion
        let valueOverride = this.element.hasAttribute('value') ? this.element.getAttribute('value') : null;
        if (this.element.originalHTML && valueOverride === null) {
            valueOverride = this.element.originalHTML;
        }
        for (const template of this.data.fileTemplates) {
            if ('DefaultEdit' in template.conf) {
                this.data.editing = template.conf.File;
                if (valueOverride !== null) {
                    this.files[template.conf.File] = valueOverride; // Override default to be this instead
                }
            }
            if ('DefaultView' in template.conf) {
                this.data.url = template.conf.File;
            }
        }
    }

    renderCallback(renderObj) {
        for (const template of this.data.fileTemplates) {
            if (!(template.conf.File in this.files)) { // Render any missing files
                const conf = template.conf;
                const combinedRenderObj = Object.assign({ }, renderObj, { conf });
                this.files[template.conf.File] = template.render(combinedRenderObj);
                this.copyToParent(template.conf.File); // Ensure copied to parent
            }
        }
        if (this.data.text === null && this.data.editing) {
            this.data.text = this.files[this.data.editing];
        }
    }

    updateCallback() {
        if (this.data.runCount < 1) {
            this.run(); // Ensure we run right away on first render
        }
    }

    _getDemoContent(url) {
        if (url in this.files) {
            return this.files[url];
        } else {
            return '<!DOCTYPE HTML><h1>Editor 404</h1><h2>Could not find:</h2>' + url;
        }
    }

    syncWithChild() {
        const injectables = this.demoWindow.document.querySelectorAll('script[src],link[href]');
        this._injectElements = {};
        for (const elem of injectables) {
            const path = elem.src || elem.href;
            // TODO: normalize somehow
            const url = (new window.URL(path, window.location)).toString();
            let newElemTagName = elem.tagName === 'LINK' ? 'STYLE' : elem.tagName;
            if (!(url in this._injectElements)) {
                this._injectElements[url] = this.demoWindow.document.createElement(newElemTagName);
                // TODO: Add remote URL support for a "remoteCache" -- this will later be used for bundling in flat HTML or ZIP formats
                // Cache to /static/cache/http/whatever.com/name-of-file.js or something
                elem.after(this._injectElements[url]);
            }
        }
        for (const filename of Object.keys(this.files)) {
            this.copyFile(filename);
        }
    }

    copyFile(name) {
        //  Do URL resolution here to merge fake with real
        const url = (new window.URL(name, window.location)).toString();
        const text = this.files[name];
        if (this.childModulo) {
            if (url in this.childModulo.fetchQueue.queue) {
                this.childModulo.fetchQueue.receiveData(text, url);
            } else {
                this.childModulo.fetchQueue.data[url] = text;
            }
        }
        if (this._injectElements && url in this._injectElements) {
            const elem = this._injectElements[url];
            const hash = this.modulo.registry.utils.hash(text);
            if (!elem.__lastInjection || elem.__lastInjection !== hash) {
                elem.textContent = text;
                elem.__lastInjection = hash;
            }
        }
    }

    syncRoutes() {
        // A "route-list" of resolved URLs that it matches for resources
        this.data.virtualServerRoutes = {};
        for (const filename of Object.keys(this.files)) {
            const url = (new window.URL(filename, window.location)).toString();
            this.data.virtualServerRoutes[url] = filename;
        }
    }

    onReady() {
        this.childModulo = 'modulo' in this.demoWindow ? this.demoWindow.modulo : null;
        if (this.childModulo) {
            this.childModulo.parentVBrowser = this; // Add back reference
            this.childModulo.loadFromDOM(this.demoWindow.document.head, null, true); // Blocking load
            this.childModulo.loadFromDOM(this.demoWindow.document.body, null, true); // Async load
            this.childModulo.preprocessAndDefine(() => {});
        }
        this.data.demo = this.conf.demoCode; // Ready, ensure iframe is rendered this way
        // Attempt any initial injections that are needed
        for (const elem of this.demoWindow.document.querySelectorAll('script[src],link[href],a[href],img[src]')) {
            this.injectChildElement(elem);
        }
        // Create a mutation observer for future injections
        this.childMutation = new this.demoWindow.MutationObserver(mutations => {
            for (const mutationRecord of mutations) {
                for (const node of mutationRecord.addedNodes) {
                    if (node.nodeType === 1) { // Check for element-like
                        this.injectChildElement(node);
                    }
                }
            }
        });
        // have the observer observe for changes in children
        this.childMutation.observe(this.demoWindow.document, { childList: true, subtree: true });
        // TODO: Make sure Child can do file:// mode. Then, have "thin copy file:// mode" option for vbrowser, where it
        // generates "jsonp" files like "!DOCTYPE_MODULO(window.parent.modulo.store.files.data['myfilename'])" or something
        // This way the base64 is rather small! Can laod binary data this way too.
        // Maybe always use sessionStore for this?

        /*
        // TODO: Integrate new sync process here
        this.syncWithChild();
        setTimeout(() => {
            this.element.rerender();
            this.syncWithChild(); // Ensure synced after next tick as well
        }, 0);
        */
    }

    fixChildAttribute(node, attrName) {
        if (node.hasAttribute(attrName)) {
            //const url = (new window.URL(node.getAttribute('src'), window.location)).toString();
            const url = (new window.URL(node.getAttribute(attrName), window.location)).toString();
            if (url in this.data.virtualServerRoutes) {
                node.removeAttribute(attrName);
                node.setAttribute('data-ready', attrName);
                node.setAttribute('data-ready-' + attrName, url);
            } else {
                console.log('VIRTUAL SERVER: 404, falling through', url);
            }
        }
    }

    injectChildAttribute(node, attrName) {
        const url = node.getAttribute('data-ready-' + attrName);
        const filename = this.data.virtualServerRoutes[url];
        const text = window.btoa(this.files[filename]);
        // TODO: If it's a a[href], make it "javascript: window.history.pushState('...'); window.document.innerHTML = ...;"
        const dataType = name.endsWith('.js') ? 'javascript' : 'css'; // TODO: have default to extension
        node.setAttribute(attrName, 'data:text/' + dataType + ';base64,' + text);
        node.setAttribute('data-injected', text.length);
    }

    injectChildElement(node) {
        if (node.hasAttribute('data-injected')) {
            // Ignore, already injected
            return false;
        } else if (!node.hasAttribute('data-ready')) {
            this.fixChildAttribute(node, 'src'); // Check for "src"
            this.fixChildAttribute(node, 'href'); // Check for "href"
        }
        if (node.hasAttribute('data-ready')) { // Might have gotten fixed, do last steps
            this.injectChildAttribute(node, node.getAttribute('data-ready'));
        }
    }

    run() {
        // TODO: Allow for X "processes" / slots of iframes. Eventually allow custom grid alignment etc.
        // (So in Modulo Studio you can "pin" docs next to editor)
        // Note: Will require refactoring to allow plural childModulo, mutation observers, etc
        this.data.runCount++; // Count our run attempt
        this.syncRoutes(); // Ensure routes are always synced up before injections
        this.demoElement = this.element.querySelector('.demo-area'); // Find the demo
        //this.demoElement.innerHTML = this.conf.demoLoading; // Destroy old iframe
        this.demoElement.innerHTML = this.conf.demoCode; // Destroy old iframe
        this.iframe = this.demoElement.firstChild; // Can I do "iframe reuse"?
        const doc = this.iframe.contentWindow.document;
        let content = this._getDemoContent(this.data.url);
        window._PREINJECT = demoWindow => {
            this.demoWindow = demoWindow;
            demoWindow.moduloBuild = {}; // set to prod mode
        };
        window._INJECT = demoWindow => { // Globally attach
            demoWindow.document.addEventListener('DOMContentLoaded', this.onReady.bind(this));
        };
        window._INJECT_NAVIGATE = url => { // Globally attach
            this.navigate(url);
        };
        const injection = '<script>window.parent._INJECT(window)<' + '/script>';
        const preinjection = '<script>window.parent._PREINJECT(window)<' + '/script>';

        // TODO: Do inline find & replace injection here!
        content += injection;
        content = content.replace(/<script/i, preinjection + '<script');           

        content = content.replace(/([  \n\r\t])(src|href)(\s*=\s*)("[^"]+"|'[^']+'|[^ \n\r\t]+)/ig, (match, space, attrName, eq, rawValue) => {
            // todo strip quotes correctly, to avoid src="mystuff.asdf'" stripping the '
            const value = rawValue.replace(/(^["']|["']$)/g, '');
            const url = (new window.URL(value, window.location)).toString();
            if (url in this.data.virtualServerRoutes) {
                return this.inlineReplace(attrName, url);
            } else {
                console.log('Warning: Ignoring unknown URL:', url);
                return space + attrName + eq + rawValue;
            }
        });
        doc.open();
        doc.write(content);
        doc.close();
    }

    inlineReplace(attrName, url) {
        const filename = this.data.virtualServerRoutes[url];
        let newRawValue = '';
        if (attrName === 'href' && !filename.endsWith('.css')) { // Detect link to HTML -- TODO make more robust
            newRawValue = "javascript:window.parent._INJECT_NAVIGATE('" + url + "');";
        } else {
            const text = window.btoa(this.files[filename]);
            const dataType = filename.endsWith('.js') ? 'javascript' : 'css'; // TODO: have default to extension
            newRawValue = '"data:text/' + dataType + ';base64,' + text + '"';
        }
        const newPrefix = ' data-injected="' + newRawValue.length + '" data-ready-' + attrName + '="' + url + '" ';
        return newPrefix + attrName + '=' + newRawValue;
    }

    edit(file) {
        this.data.editing = file;
        this.data.text = this.files[file];
    }

    view(file) {
        this.data.url = file;
        this.refresh();
    }

    create(filename) {
        // New procedure:
        // Each preset will be a JSON object (or another data structure?)
        // It will encode options meta info etc
        // It will also specify an editor template
        // It will render that viewer template to a new name like projects/p1.html
        // It will copy meta data to projects/p1.json
        // It will copy all files to a ZIP file with projects/p1.zip
        // The zip file it stores in local storage, and passes to projects/p1.html
        // OR: It extracts to "sessions/p1/" directory, inner editor knows to silo to "sessions/p1/"
        // - When you navigate away, and/or setTimeout, session directory gets zipped up as auto-save
        // - Every directory in "session" is considered "open"
        // - By default, will attempt to close the 3 least recently used sesions
        // - Closing session means compressing to zip

        const newName = 'New-' + filename; // beautify and search for empty
        this.files[newName] = this.files[filename]; // copy to new name
        // TODO: Add to recent
        this.view(newName);
    }

    navigate(urlOrPath) {
        // TODO: Add "back" history, modify src, etc
        const url = (new window.URL(urlOrPath, window.location)).toString();
        const filename = this.data.virtualServerRoutes[url];
        this.view(filename);
    }

    refresh() {
        if (this.data.editing) {
            this.files[this.data.editing] = this.data.text; // Copy text value to files
            //this.copyFile(this.data.editing); // Ensure copied to child
            this.copyToParent(this.data.editing); // Ensure copied to parent
        }
        this.run();
    }

    copyToParent(filename) {
        if (this.modulo.parentVBrowser) {
            this.modulo.parentVBrowser.receiveUpdate(filename, this.data.editing[filename], this);
        }
    }

    receiveUpdate(filename, text, vbrowser) {
        if (this.conf.subEditorPrefix) {
            /*
            const prefix = '_' + this.data.url + '/';
            const parentFN = prefix + filename;
            this.files[parentFN]
            this.modulo.parentVBrowser.files[parentFN] = this.data.editing[filename];
            this.modulo.parentVBrowser.copyToParent(parentFN);
            */
        }
    }

    saveSnippet(payload) { // Should be ButtonPayload or Button of a Template
        const templates = Object.values(this.element.cparts).filter(({ conf }) => conf.Type === 'Template');
        const buttonTemplates = templates.filter(({ conf }) => 'Button' in conf);
        const tmplt = templates.find(({ conf }) => conf.ButtonPayload === payload) || 
                      templates.find(({ conf }) => conf.Button === payload);
        this.modulo.registry.utils.saveFileAs(payload, tmplt.render(this.element.renderObj));
    }

    toggleMenu(menuName) {
        if (this.data.editing) {
            this.files[this.data.editing] = this.data.text; // Copy text value to files
            this.copyToParent(this.data.editing); // Ensure copied to parent
        }
        this.data.menu = this.data.menu === menuName ? null : menuName;
    }

};

modulo.register('cpart', modulo.registry.cparts.VBrowser);

modulo.config.mdParserSettings = {
    scriptTagPrefix: /^\s*<script\s+type=.?(md|markdown).?>\s*(---)\s*/i,
    htmlMarkdownFirstLine: /^\s*<!doctype\s+html>.+<script\s+type=.?(md|markdown).?>\s*(---)\s*/i,
    field: /\n\w[\w_0-9 -]*:/,
    blockDeliminator: /\n\n/g,
    blocks: [
        ['', /^</],
        ['blockquote', /^>/],
        ['h6', /^######\s*/],
        ['h5', /^#####\s*/],
        ['h4', /^####\s*/],
        ['h3', /^###\s*/],
        ['h2', /(^##\s*|\n---+$)/],
        ['h1', /(^#\s*\w|\n===+$)/],
        ['p', /^/],
    ],
    inline: [
        ['em', '*|_'],
        ['strong', '**|__'],
        ['a', '[]()'],
        ['img', '![]()'],
    ],
};

modulo.register('util', function markdownToHTML (modulo, value) {
    const { blockDeliminator, blocks } = modulo.config.mdParserSettings;
    const blockText = value.split(blockDeliminator);
    const out = [];
    for (const block of blockText) {
        let tag = blocks.find(([ tag, regexp ]) => regexp.exec(block));
        if (!tag || tag[0] === '') {
            out.push(block); // Push content verbatim if no match or is literal HTML
        } else {
            block = block.replace(tag[1], ''); // Remove matching text
            // TODO: Remove, handle inline, and then escape block
            out.push('<' + tag[0] + '>' + block + '</' + tag[0] + '>');
        }
    }
    return out;
});

modulo.register('processor', function contentMD (modulo, def, value) {
    const { field, scriptTagPrefix, htmlMarkdownFirstLine } = modulo.config.mdParserSettings;
    const data = { };
    data.body = def.Content.trim();
    data.body = data.body.replace(scriptTagPrefix, '---\n'); // Try removing partial prefix first
    data.body = data.body.replace(htmlMarkdownFirstLine, '---\n'); // Remove htmlMarkdown boilerplate if detected
    if (data.body.startsWith('---\n')) {
        const parts = data.content.split(/---\n/g);
        let headText = parts[1];
        data.body = data.body.substr(headText + 8, data.body.length); // Slice out, + 8 for ---\n
        let field = null;
        while (headText.length) {
            headText = headText.trim();
            if (field === null) {
                field = headText.split(':')[0];
                headText = headText.substr(field, headText.length + 1); // Consume the field, plus ':' token
            } else {
                const match = regexp.exec(field); // next field match
                const nextFieldIndex = match ? match.index : headText.length;
                data[field] = headText.substr(0, nextFieldIndex); // Copy to data
                headText = headText.substr(nextFieldIndex, headText.length);
                field = null;
            }
        }
    }
    // TODO add filename? data.filename = def.Source.split(/\//g
    
    def.Code = 'return ' + JSON.stringify(data);
});


modulo.register('util', function parseMarkdown (source) {
    source = source.replace(scriptTagPrefix, '---\n'); // Try removing partial prefix first
    source = source.replace(htmlMarkdownFirstLine, '---\n'); // Remove htmlMarkdown boilerplate if detected
    const converter = new showdown.Converter({ metadata: true });
    const html = converter.makeHtml(source);
    const data = converter.getMetadata();
    data.body = html; // attach as "body" attribute
    return data;
});

// https://gist.github.com/rvaiya/4a2192df729056880a027789ae3cd4b7
modulo.register('util', function zipBlob(k){
function f(a,b,...d){const c=new DataView(a.buffer);d.forEach((e,g)=>c.setUint32(b+4*g,e,!0))}function n(a,b,...d){const c=new DataView(a.buffer);d.forEach((e,g)=>c.setUint16(b+2*g,e,!0))}const q=function(){const a=[];for(var b,d=0;256>d;d++){b=d;for(var c=0;8>c;c++)b=b&1?3988292384^b>>>1:b>>>1;a[d]=b}return a}(),h=[],r=new TextEncoder("utf8");var l=0,p=0;k.forEach(a=>{const b=new Uint8Array(30+a.name.length),d=r.encode(a.name);var c=a.data;for(var e=-1,g=0;g<c.length;g++)e=e>>>8^
q[(e^c[g])&255];c=(e^-1)>>>0;f(b,0,67324752);f(b,14,c,a.data.length,a.data.length);n(b,26,a.name.length);b.set(d,30);a.header=b;a.offset=l;h.push(b);h.push(a.data);a.cdr=new Uint8Array(46+a.name.length);f(a.cdr,0,33639248);f(a.cdr,16,c,a.data.length,a.data.length);n(a.cdr,28,a.name.length);f(a.cdr,42,l);a.cdr.set(d,46);p+=a.cdr.length;l+=a.header.length+a.data.length});k.forEach(a=>h.push(a.cdr));const m=new Uint8Array(22);f(m,0,101010256);n(m,8,k.length,k.length);f(m,12,p,l);h.push(m);return new Blob(h,
{type:"application/zip"})
});



/*
modulo.register('util', function markdownToHTML (modulo, value) {
    const { blockDeliminator, blocks } = modulo.config.mdParserSettings;
    const blockText = value.split(blockDeliminator);
    const out = [];
    const currentTag = null;
    for (const block of blockText) {
        let match = null;
        let tag = null;
        let text = block;
        for (const [ tagName, regexp ] of blocks) {
            match = regexp.exec(block);
            if (match) {
                tag = tagName;
                text = block.replace(regexp, ''); // Strip matching 
                break;
            }
        }
        if (!tag || currentTag || tag[0].startsWith('_')) {
            out.push(block); // Push content verbatim if no match
            if (tag[0] === '_start') {
                currentTag = text;
            }
            if (tag[0] === '_end') { // For now, assume ALWAYS good about matching
                currentTag = null;
            }
        } else {
            out.push('<' + tag[0] + '>' + block
        }
    }
});
*/
