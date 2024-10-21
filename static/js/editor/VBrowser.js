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
        for (const methName of [ 'toggleMenu', 'refresh', 'saveSnippet', 'edit', 'view' ]) {
            this.data[methName] = this[methName].bind(this); // Attaching public methods
        }
        this.prepFiles();
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
                this.files[template.conf.File] = template.render(renderObj);
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

    onReady() {
        this.childModulo = 'modulo' in this.demoWindow ? this.demoWindow.modulo : null;
        if (this.childModulo) {
            this.childModulo.loadFromDOM(this.demoWindow.document.head, null, true); // Blocking load
            this.childModulo.loadFromDOM(this.demoWindow.document.body, null, true); // Async load
            this.childModulo.preprocessAndDefine(() => {});
        }
        this.data.demo = this.conf.demoCode; // Ready, ensure iframe is rendered this way
        
        
        
        // A "route-list" of resolved URLs that it matches for resources
        this.virtualServerRoutes = {};
        for (const filename of Object.keys(this.files)) {
            const url = (new window.URL(filename, window.location)).toString();
            this.virtualServerRoutes[url] = filename;
        }
        
        // Attempt any initial injections that are needed
        for (const elem of this.demoWindow.document.querySelectorAll('script[src],link[href],a[href],img[src]')) {
            this.injectChildElement(elem);
        }
        
        // Create a mutation observer for future injections
        this.childMutation = new this.demoWindow.MutationObserver(mutations => {
            console.log('mutating!', mutations);
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
        console.log('this is node', attrName);
        if (node.hasAttribute(attrName)) {
            //const url = (new window.URL(node.getAttribute('src'), window.location)).toString();
            const url = (new window.URL(node.getAttribute(attrName), window.location)).toString();
            if (url in this.virtualServerRoutes) {
                console.log('VIRTUAL SERVER: found match', url);
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
        const filename = this.virtualServerRoutes[url];
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
        this.demoElement = this.element.querySelector('.demo-area'); // Find the demo
        this.demoElement.innerHTML = this.conf.demoLoading; // Destroy old iframe
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
        const injection = '<script>window.parent._INJECT(window)<' + '/script>';
        const preinjection = '<script>window.parent._PREINJECT(window)<' + '/script>';
        
        // TODO: Do inline find & replace injection here!
        content += injection;
        content = content.replace(/<script/i, preinjection + '<script');           
        doc.open();
        doc.write(content);
        doc.close();
    }

    edit(file) {
        this.data.editing = file;
        this.data.text = this.files[file];
    }

    view(file) {
        this.data.url = file;
        this.refresh();
    }

    refresh() {
        if (this.data.editing) {
            this.files[this.data.editing] = this.data.text; // Copy text value to files
            this.copyFile(this.data.editing); // Ensure copied to child
        }
        this.run();
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
        }
        this.data.menu = this.data.menu === menuName ? null : menuName;
    }

};

modulo.register('cpart', modulo.registry.cparts.VBrowser);
