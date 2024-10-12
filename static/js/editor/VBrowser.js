/*
  A Component Part that provides "Virtual Browser" capabilities, intended
  for making sandboxed iframes in editors.
*/


modulo.config.vbrowser = {
    previewMode: 'iframe',
    previewElement: null,
    injection: '<script>window.parent._INJECT(window)<' + '/script>',
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
            recent: [ ], // TODO: { url: ..., files: ..., prefix: ... }  (copies all files to prefix)
        };
        for (const methName of [ 'toggleMenu', 'refresh', 'saveSnippet', 'edit', 'view' ]) { // TODO: Should be "-methods"..
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

    _getDemoContent(url) {
        if (url in this.files) {
            return this.files[url];
        } else {
            return '<!DOCTYPE HTML><h1>Editor 404</h1><h2>Could not find:</h2>' + url;
        }
    }

    copyFile(name) {
        //  Do URL resolution here to merge fake with real
        const url = (new window.URL(name, window.location)).toString();
        if (this.childModulo) {
            if (url in this.childModulo.fetchQueue.queue) {
                this.childModulo.fetchQueue.receiveData(this.files[name], url);
            } else {
                this.childModulo.fetchQueue.data[url] = this.files[name];
            }
        } else {
            console.log('Warning: No child modulo to copy to:', name);
        }
    }

    inject(demoWindow) {
        //this.element.demoModulo = demoModulo;
        this.childModulo = 'modulo' in demoWindow ? demoWindow.modulo : null;
        if (this.childModulo) {
            window.demoModulo = this.childModulo;
            for (const filename of Object.keys(this.files)) {
                this.copyFile(filename);
            }
            //childModulo.definitions = {}; // clear definitions (???)
            this.childModulo.loadFromDOM(demoWindow.document.head, null, true); // Blocking load
            demoWindow.document.addEventListener('DOMContentLoaded', () => {
                this.childModulo.loadFromDOM(demoWindow.document.body, null, true); // Async load
                this.childModulo.preprocessAndDefine(this.onReady.bind(this));
                /// TODO: Attach new "fs" that saves to outer frame localStorage
            });
        } else {
            // Non-modulo project
            demoWindow.document.addEventListener('DOMContentLoaded', this.onReady.bind(this));
        }

        // TODO: Listen to changes to demoWindow
        //      - Attach click events to navigate internally or do a _target blank
    }

    onReady() {
        this.data.demo = this.conf.demoCode; // Ready, ensure iframe is rendered this way
        this.element.rerender(); // Trigger rerender to show new demo code
    }

    run() {
        this.demoElement.innerHTML = this.conf.demoLoading; // Destroy old iframe
        this.iframe = this.demoElement.firstChild; // Can I do "iframe reuse"?
        const doc = this.iframe.contentWindow.document;
        doc.open();
        let content = this._getDemoContent(this.data.url);
        window._INJECT = this.inject.bind(this); // Globally attach
        const re = new RegExp('</scrip.>', 'i');
        if (re.test(content)) { // No script tags present, append to end
            content = content.replace(re, '</scrip' + 't>' + this.conf.injection);
            content = '<script>window.moduloBuild = {}<' + '/script >' + content;
        } else { // No script tags present, append to end
            content += this.conf.injection;
        }
        doc.write(content);
        doc.close();
    }

    demoMount({ el }) {
        this.demoElement = el;
        this.run();
    }

    demoUnmount({ el }) {
        el.innerHTML = '';
        this.demoElement = null;
    }

    edit(file) {
        this.data.editing = file;
        this.data.text = this.files[file];
    }

    view(file) {
        console.log('viewing!');
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
/*


        if (this.conf.previewElement) {
            const { component } = this.childModulo.config;
            //this.data.demoPrefix = 'vbrowser' + this.id + '-' + (++window._moduloID);
            //const newLine = 'console.log("' + this.data.demoPrefix + '-" + def.TagName);\n'
            // + 'window.parent.customElements.define("' + this.data.demoPrefix + '-" + def.TagName';
            
            const line = 'window.customElements.define(def.TagName';
            const newLine = 'window.parent.customElements.define(def.TagName';
            component.CodeTemplate = component.CodeTemplate.replace(line, newLine);
            console.log(component.CodeTemplate);
        }
        if (this.conf.previewElement && childModulo) {
            const cls = childModulo.registry.elements[this.conf.previewElement];
            console.log('cls', cls)
            if (!cls) {
                console.error('Warning: Preview Element was not registered.', this.conf.previewElement);
            }
            const demoTag = this.conf.previewElement.replace('_', '-');// + '-' + this.conf.previewElement.replace('_', '-');
            this.data.demo = this.conf.demoLoading + '<' + demoTag + '></' + demoTag + '>';
            const demoCustomElement = new cls();
            this.demoElement.append(demoCustomElement);
        } else {
        
    prepareCallback(renderObj) {

        const { state, props } = this.element.renderObj; // Get relevant from renderObj (TODO: Move to data)
        if (state.editing === null) {
            state.editing = Array.from(Object.keys(this.files)).shift();
        }
        if (state.url === null) {
            state.url = state.editing;
        }
        if (state.text === null) {
            state.text = this.files[state.editing]; // First update, get stashed
        } else {
            this.files[state.editing] = state.text; // Update stashed version
            this.copyFile(state.editing);
        } 
    }
        */
