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

modulo.register('command', function edit (modulo) {

    modulo.childData = { };
    //const currentPath = modulo.registry.utils.getPath(window.location);
    let url = (window.location.protocol === 'file:') ? 'file://' : window.location.origin;
    url += window.location.pathname; // Ignore get params, eg ?GET=params
    Object.assign(modulo.childData, modulo.fetchQueue.data);
    modulo.childData[url] = modulo.definitions._page.source;
    /*
    //console.log('this si modulo.fetchQueue', modulo.fetch
    // For now, just implement "file://" proto
    // Mirror FS with modulo.fetchQueue
    modulo.fs.set(currentPath, );
    for (const [ url, data ] of Object.entries(modulo.fetchQueue.data)) {
        const path = modulo.registry.utils.getPath(url);
        modulo.fs.set(path, data);
    }
    */
    // Change URL to prevent auto-loading
    console.log('replace state hapening');
    window.history.replaceState({ }, 'EDIT / ' + window.document.title, url);

    // Escape all double quotes
    const val = modulo.definitions._page.source.replace(/"/g, '&quot;');
    window.document.body.innerHTML = '<x-DemoEditor layout="fullscreen" value="' + val + '"></x-DemoEditor>';
});
/*
New CPart structure:

VirtualBrowser


on updateCallback() - checks if value has changed, if so, remves iframe
- and writes new one



*/

/*
modulo.registry.cparts.VirtualBrowser = class VirtualBrowser {
  connectedCallback() {
      // Check GET parameters
      const params new URLSearchParams(window.location.search);
      this.path = params.get('p');
      if (this.path) { // we should immediately navigate
          this.backHistory = params.getAll('b');
          this.forwardHistory = params.getAll('f');
          this.navigate(this.path);
      } else if (this.getAttribute('loadfs')) {
          // Could be first load, restore from meta tags
          this.fs = new ModuloFS(this.getAttribute('loadfs'), 5 * 1000 * 1000); // a little under 5MB
          for (const elem of win.document.querySelectorAll("meta[modulo-fs]")) {
              if (elem.hasAttribute('modulo-fs-lmza')) {
                  this.fs.setItem(elem.getAttribute('modulo-fs'), elem.getAttribute('modulo-fs-lmza'));
              } else {
                  this.fs.writeFile(elem.getAttribute('modulo-fs'), elem.getAttribute('modulo-fs-data'));
              }
          }
          // TODO: need to wait for lmza compression
          setTimeout(() => {
              const url = win.location.pathname + '?p=' + this.getAttribute('file') || 'index.html';
              window.location = url; // attempt to load
          }, 10);
      }
  }
    
    substituteURLOld(url, remainingText, attr) {
        let s = '';
        if (/\.js$/i.test(url) && attr === 'src') { // Assume is script tag
            let split = remainingText.split(/<\*[\/]script\s*>/i);
            s += '-fsinjected' + split[0] + '<' + '/script>\n<script modulo-asset=y>';
            s += this.getFile(url) + '<' + '/script>';
            //s += this.getJavaScriptInjection();
        } else if (/\.css$/i.test(url) && attr === 'href') { // Assume is script tag
            let split = remainingText.split(/>/i);
            s += '-fsinjected' + split[0] + '>\n<style modulo-asset=y>';
            s += this.getFile(url) + '<' + '/style>';
        } else if (attr === 'src') { // Assume is binary media
            // TODO: convert to base64
        } else if (attr === 'href') { // Assume is binary media
            // TODO: convert to base64
        } else {
            // ignore?
        }
        return s;
    }
    
    substituteHTMLOld(html) { // small recursive descent to substitute href and srcs
        let s = '';
        const tokens = html.split(/(?:src|href)\s*=/im);
        let nextToken = null;
        let previousToken = null;
        let split = null;
        let urlType = null;
        while (tokens.length > 0) { // parse HTML and replace src and hrefs
            nextToken = tokens.shift();
            if (previousToken) { // we never modify previous-token
                const quote = nextToken.match(/^\s*['"]/);
                const delim = quote ? quote[0] : /[\s>]/;
                const attr = previousToken.endsWith('href') ? 'href' : 'src';
                split = nextToken.split(delim);
                console.log('split', split[0], );
                s += this.substituteURL(split[0], nextToken.slice(split[0].length), attr);
            }
            previousToken = nextToken;
    if (window.location.protocol === 'file:') {
        // Is file protocol
        
        
    }
    //el.innerHTML = '<iframe src="' + window.location + '" />';
    console.log('window.location', window.location);
    const iframe = el.querySelector('iframe');
    window.iframe = iframe;
    console.log('iframe value', value);
    iframe.contentDocument.open(); // TODO: Need to do stuff
    iframe.contentDocument.write(value); // TODO: Need to do stuff
    iframe.contentDocument.close(); // TODO: Need to do stuff
        }
        return s;
    }
  substituteURL(url, remainingText, attr) {
        let s = '';
        if (/\.js$/i.match(url) && attr === 'src') { // Assume is script tag
            let split = remainingText.split(/<\*[\/]script\s*>/i);
            s += '-fsinjected' + split[0] + '<' + '/script>\n<script modulo-asset=y>';
            s += this.getFile(url) + '<' + '/script>';
            //s += this.getJavaScriptInjection();
        } else if (/\.css$/i.match(url) && attr === 'href') { // Assume is script tag
            let split = remainingText.split(/>/i);
            s += '-fsinjected' + split[0] + '>\n<style modulo-asset=y>';
            s += this.getFile(url) + '<' + '/style>';
        } else if (attr === 'src') { // Assume is binary media
            // TODO: convert to base64
        } else if (attr === 'href') { // Assume is binary media
            // TODO: convert to base64
        } else {
            // ignore?
        }
        return s;
  }
  substituteHTML(path, html) { // small recursive descent to substitute href and srcs
      let s = '';
      const tokens = html.split(/(?:src|href)\s*=/im);
      let nextToken = null;
      let previousToken = null;
      let split = null;
      let urlType = null;
      while (tokens.length > 0) { // parse HTML and replace src and hrefs
          nextToken = tokens.shift();
          if (previousToken) { // we never modify previous-token
              const quote = nextToken.match(/^\s*['"]/);
              const delim = quote ? quote[0] : /[\s>]/;
              const attr = previousToken.endsWith('href') : 'href' : 'src';//match(/(src|href)$/)[0];
              split = nextToken.split(delim);
              s += this.substituteURL(split[0], nextToken.slice(split[0].length), attr);
          }
          previousToken = nextToken;
      }
      return s;
  }

  navigate(path) {
      if (!this.shadowRoot && this.hasAttribute('shadow')) { // Use shadow
          console.log('ERROR: Shadow not impl.'); //this.shadowRoot = this.attachShadow({ mode: "open" });
      }
      if (!this.doc) { // attach iframe if first time
          this._iframe = win.document.createElement('iframe');
          (this.shadowRoot || this).append(this._iframe);
          this.doc = this._iframe.contentWindow.document;
      }
      this.fs.readFile(path, html => {
          html = this.substituteHTML(path, html);
          this.doc.open();
          this.doc.write(html);
          this.doc.close();
      });
  }
  rerender() {
      // Don't do anything if this is in a Modulo component and a rerender was attempted
  }
  inlineFileProtocol(elem) {
      // Find broken file protocols and attach them to ModuloFS
      let newElem = elem;
      const url = elem.getAttribute('src') || elem.getAttribute('href');
      if (!url || !url.startsWith('file://')) {
          continue; // TODO: Add another 
      }
      if (elem.tagName !== 'IMG') {
          // Create duplicate underneath for scripts and links
          newElem = win.document.createElement(elem.tagName);
          //newElem.setAttribute('modulo-asset', 'y'); // do we want to do this?
      }
      this.fs.realpath(url, path => {
          elem.setAttribute('src', ''); // clear tag so it won't be 
          const replacement = win.document.createElement(elem.tagName);
          this.fs.readFile(path, data => {
              replacement.textContent = data;
          });
      });
  }

  listen(doc, selector = null) {
      selector = selector || 'script[src=^file://],link[href=^file://],img[src=^file://],a[href=^file://]' +
                              'script[modfs-src],link[modfs-href],img[modfs-src],a[modfs-href]';
      win.setTimeout(() => {
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
}
*/

