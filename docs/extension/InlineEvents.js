


modulo.part.InlineEvents = class InlineEvents {
    initializedCallback() {
        this.states = { }
        this.scripts = { }
    }

    prepareCallback({ component }) {
        this.lastHash = this.stateHash || modulo.util.hash('')
        this.edges[this.lastHash] = this.edges[this.lastHash] || { }
    }

    renderCallback({ component }) {
        this.stateHash = modulo.util.hash(component.innerHTML)
    }

    _getPath(node) {
        const i = Array.from(node.parentNode.children).indexOf(node)
        const end = !node.parentNode || node.parentNode === this.element
        return `${ end ? '' : this._getPath(node.parentNode) }.children[${ i }]`
    }

    updateCallback() {
        // Step 1: Collect elements
        let count = 0
        let s = 'let N = [];\n'
        const nodes = Array.from(this.element.querySelectorAll('*'))
        for (const [ node ] of patches) {
            if (typeof node._inlineIndex === 'number') { // already seen
                continue
            }
            node._inlineIndex = count
            s += `N[${ count }] = P${ this._getPath(node) };\n`
            count++
        }

        // Step 2: Inline patches
        const { patches } = this.element.parts.component
        for (const [ node, method, arg1, arg2 ] of patches) {
            if (arg1 && arg1.rawName) { // ignore directives
                continue;
            } 
            // Assume is DOM event, compute args
            let a = typeof arg2 !== "undefined" ? [ arg1, arg2 ] + arg1;
            a = (typeof arg2 !== "undefined" ? '...' : '') + JSON.stringify(a);
            s += `N[${ node._inlineIndex }].${ method }(${ a });\n`
        }
        // Step 3: Attach generated script as DOM-patch-edge-script
        this.stateScript = s
        this.stateHash = modulo.util.hash(this.stateScript)
        this.scripts[this.stateHash] = this.stateScript
        this.states[this.stateHash] = this.states[this.stateHash] || { }
    }

    /*
    buildCallback() { // TODO: make another command that does simulated build + non
        const nodes = Array.from(this.element.querySelectorAll('*'))
        for (const node of nodes) {
            if (!node.moduloEvents) {
                continue;
            }
            const count = nodes.filter(e => e.contains(node)).length
            for (const [ evName, listener ] of node.moduloEvents) {
                //listener() // simulate event
                //let script = `let P=this${ '.parentNode'.repeat(count) };`
                //script += this.lastEdge
            }
        }
    }
    */
}






/*
            // Count how "deep" we are to get to the parent element
            const deep = node ? nodes.filter(e => e.contains(node)).length : 0;

        const { get } = this.modulo.registry.utils;
        for (const elem of this.element.querySelectorAll(`[${ ATTR }]`)) {
            for (const line of elem.getAttribute(ATTR).split('\n')) {
                const [ count, rawName ] = line.split(','); // Comma seperated
                const nodePath = '.parentNode'.repeat(count).substr(1);
                if (this.element === get(elem, nodePath)) { // It's me!
                    this.reconciler.patchDirectives(elem, rawName, 'Mount');
                    const newVal = elem.getAttribute(ATTR).replace(line, '');
                    elem.setAttribute(ATTR, newVal); // "Consume" line from attr
                }
            }
        }



        for (const [ node, method, arg ] of this._mountPatchset || []) {
            const { rawName, el } = arg || {}; // Extract needed directive info
            const count = el ? nodes.filter(e => e.contains(el)).length : 0;
            if (count) { // count = number of steps in tree hierarchy (or 0)
                const existing = el.getAttribute(PRE + 'patches') || '';
                if (!existing.includes(count + ',' + rawName)) { // Not a dupe
                    const value = existing + '\n' + count + ',' + rawName;
                    el.setAttribute(PRE + 'patches', value.trim());
                }
            }
        }
*/
