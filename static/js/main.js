modulo.config.virtualbrowser = { inject: '' };
modulo.config.virtualbrowser.patchLoadHead = `
// Load child data
console.log('before', Object.keys(modulo.fetchQueue.data).length);
modulo.fetchQueue.data = window.parent.modulo.childData;
console.log(Object.keys(modulo.fetchQueue.data));
console.log('attaching load to this');
modulo.registry.send.load = () => {
// talk to the parent now
console.log('loaded now!!');
}
`;

/*
modulo.registry.utils.originalLoadHead = modulo.registry.utils.loadHead;
modulo.register('util', function loadHead(modulo, loadMode, elem, knownBundled, doc = null) {
    if (elem.hasAttribute('src')) {
        console.log('TODO: INSERTING',  elem.getAttribute('src'));
        elem.setAttribute('vb-src', elem.getAttribute('src'));
        elem.removeAttribute('src');
    }
    if (elem.hasAttribute('href')) {
        console.log('TODO: INSERTING',  elem.getAttribute('href'));
        elem.setAttribute('vb-href', elem.getAttribute('href'));
        elem.removeAttribute('href');
    }
    modulo.registry.utils.originalLoadHead(modulo, loadMode, elem, knownBundled, doc);
});
*/
modulo.registry.cparts.VirtualBrowser = class VirtualBrowser {
    initializedCallback() {
        const loaded = null;
        let url = (window.location.protocol === 'file:') ? 'file://' : window.location.origin;
        url += window.location.pathname; // Ignore get params, eg ?GET=params
        this.data = { loaded, url };
        return this.data;
    }

    updateCallback() {
        if (this.data.url !== this.data.loaded) { // URL has changed
            if (!this._iframe) {
                this._iframe = this.element.querySelector('iframe');
            }
            this.refresh(this.data.url);
        }
    }

  listen(doc, selector = null) {
      window.setTimeout(() => {
          for (const elem of doc.querySelectorAll(selector)) {
              this.inlineFileProtocol(elem);
          }
          doc.addEventListener("DOMSubtreeModified", (ev) => { // only attach after
              win.clearTimeout(this.timeout);
              this.timeout = win.setTimeout(() => {
                  this.inlineFileProtocol(ev.target);
              }, 200); // 200 ms debounce to let DOM changes "settle down"
          });
      }, 0); // 0ms: Do initial scan right away in next tick
  }
    
    
    pauseDOM(parentElem) {
        const elems = parentElem.querySelectorAll('script[src],link[href],img[src],a[href]');
        for (const elem of elems) {
            if (elem.hasAttribute('src')) {
                elem.setAttribute('vb-src', elem.getAttribute('src'));
                elem.removeAttribute('src');
            }
            if (elem.hasAttribute('href')) {
                elem.setAttribute('vb-href', elem.getAttribute('href'));
                elem.removeAttribute('href');
            }
        }
    }
    
    playDOM(parentElem) {
        const elems = parentElem.querySelectorAll('script[vb-src],link[vb-href],img[vb-src],a[vb-href]');
        for (const elem of elems) {
            const attrName = elem.hasAttribute('vb-src') ? 'vb-src' : 'vb-href';
            const path = this.modulo.registry.utils.getPath(elem.getAttribute(attrName));
            let text = this.modulo.fs.get(path);
            if (elem.tagName === 'SCRIPT') {
                console.log('TODO: Insert script with:', text && text.substr(0, 100), '...');
                if (typeof text === 'undefined' || text === null) {
                    elem.src = elem.getAttribute('vb-src'); // Reassign src, evaluate now
                    if (elem.src.endsWith('mdu.js') || elem.src.endsWith('Modulo.js')) {
                        elem.onload = () => {
                            const newScript = elem.ownerDocument.createElement('script');
                            newScript.setAttribute('modulo-asset', 'y');
                            elem.after(newScript);
                            newScript.textContent = this.attrs.patchLoadHead + this.attrs.inject;
                        }
                    }
                }
                if (text) { // non empty string
                    const newScript = elem.ownerDocument.createElement('script');
                    newScript.setAttribute('modulo-asset', 'y');
                    elem.after(newScript);
                    newScript.textContent = text; // assing text
                }
            } else if (elem.tagName === 'LINK') {
                console.log('TODO: Insert style with:', text && text.substr(0, 100), '...');
            } else if (elem.tagName === 'IMG') {
                console.log('TODO: Insert img with:', text && text.substr(0, 100), '...');
            } else if (elem.tagName === 'A') {
                console.log('TODO: Block clicks to this "A" element (prompt?)');
            }
        }
    }
    
    getURL(urlString) {
        let fileContent = this.modulo.fs.get(this.modulo.registry.utils.getPath(urlString));
        // TODO: Add "mimetype" behavior, select a template based on this (e.g. an <img> in a frame)
        if (fileContent === null || fileContent === undefined) {
            console.error('404 - ', path);
            fileContent = '<!DOCTYPE HTML><h1>404</h1><h2>Could not find:</h2>' + urlString;
        }
        return fileContent;
    }
 
    refresh(urlString) {
        this.data.url = urlString;
        let fileContent;
    	    console.log('this is urlString', urlString, Object.keys(modulo.childData));
    	if (urlString in modulo.childData) {
    	    fileContent = modulo.childData[urlString];
        } else {
            fileContent = '<!DOCTYPE HTML><h1>404</h1><h2>Could not find:</h2>' + urlString;
        }
        //const fragment = modulo.registry.utils.newNode(this.getURL(urlString));
        //this.pauseDOM(fragment);
        //const fileContent = fragment.innerHTML;
        const oldFrame = this._iframe;
        this._iframe = window.document.createElement('iframe');
        oldFrame.after(this._iframe); // Insert new frame after
        oldFrame.remove(); // remove old frame
        this.doc = this._iframe.contentWindow.document;
        this.doc.open();
        this.doc.write(fileContent);
        this.doc.close();
        this.data.loaded = urlString; // Show that this has been loaded
        // Now, we can "PLAY"
        //this.playDOM(this.doc);
    }

};

modulo.register('cpart', modulo.registry.cparts.VirtualBrowser);


/*
modulo.registry.send.load = () => {
    const params = new URLSearchParams(window.location.search);
    const path = params.get('p');
    let start = () => {
        window.document.body.innerHTML += '<cmdebug-CommandToolbar></cmdebug-CommandToolbar>';
    };
    if (params.get('argv') && !path) { // Command specified, skip dev menu
	    start = () => modulo.registry.commands[params.get('argv')](modulo, { callback: () => {} });
	}
	if (!path) { // No path specified, show debug toolbar or run command
        window.setTimeout(start, modulo.config.commandDelay || 1000);
    }
}; // disable debug toolbar
*/

modulo.register('util', function iframeBrowserSetup (el, value) {
});

modulo.register('util', function getPath (urlString) {
    const url = new window.URL(urlString, window.location);
    let path = url.protocol === 'file:' ?
        '/app/local/' + url.pathname :
        '/app/' + url.host + url.pathname;
    path = path.replace(/\/\//g, '/'); // replace double slashes from path concatenation
    if (path.endsWith('/')) {
        path = path + 'index.html'; // Add in index.html to directory paths
    }
    return path;
});



