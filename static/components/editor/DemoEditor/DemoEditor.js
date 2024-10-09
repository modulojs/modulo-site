!DOCTYPE_MODULO(`
const EDITOR_LOCATION = '/static/demos/editor.html'
const LOCAL_STORAGE_PREFIX = 'mdufs-';
//const { toEmbed } = modulo.registry.cparts.ModuloDemo; // Retrieve helper funcs
const toEmbed = () => 'TMP';
const { saveFileAs } = modulo.registry.utils;













// MOST IS DEAD CODE...
function demoMount({ el, value }) {
    modulo.registry.utils.iframeBrowserSetup(el, value);
}

function demoUnmount({ el, value }) {
}



// TODO: Clean up everything below, many things outdated
const DEFAULT_EXPORT_TEMPLATE = 'REMOVED EXPORT TEMPLATE'; /*
<!DOCTYPE html>
<template Modulo>{{ includes|safe }}
  <Component name="{{ name }}">{{ indentText|safe }}
  </Component>
</template>
<script src="https://unpkg.com/mdu.js"></script>
{{ usage|safe }}
*/

function editorMount({ el, value }) {
    if (state.buffers.length === 0) {
        _updateState(); // getting called from hydrating mount
    }
    element.editor = el;
    el._onEditorValueChange = bufferValue => {
        state.buffers[state.selectedBuffer].value = bufferValue;
    };
    el.rerender(); // Force editor immediate rerender, so the stateChangedCallback gets attached
    el.stateChangedCallback(null, state.buffers[state.selectedBuffer].value, null); // Force update
}

function editorUnmount({ el, value }) {
    delete el._onEditorValueChange; // tidy up references
    delete element.editor;
}


function newBuffersFromElement({ value, src, example, exptemplate }, elem) {
    let isFetching = false;
    const buffers = [
        {
            name: 'default',
            value: value,
        },
        {
            title: 'Usage',
            name: 'usage',
            subpaneClass: true,
            bannerClass: true,
            value: example || '<x-' + state.componentName + '></x-' + state.componentName + '>',
        },
        {
            title: 'Export Template (Read Only)',
            name: 'export',
            subpaneClass: true,
            bannerClass: true,
            isHidden: true, // (implemented)
            isReadOnly: true,
            value: DEFAULT_EXPORT_TEMPLATE,
        },
    ];
    if (elem.hasAttribute('modulo-value') && !value) {
        buffers[0].value = elem.getAttribute('modulo-value');
    } else if (src && !buffers[0].value) {
        buffers[0].isFetching = true;
        window.fetch(src)
            .then(response => response.text())
            .then(text => {
                delete buffers[0].isFetching; // Clear fetching status
                buffers[0].value = text; // update the text with fetch results
                elem.setAttribute('modulo-value', text); // store in DOM for built page
                elem.rerender(); // Force container rerender
            });
    }
    return buffers;
}

function setBuffer(index) {
    state.selectedBuffer =  index;
}

function getDemoValue(name) {
    if (name === 'component') {
        return getComponentName(); // special one!
    }
    modulo.assert(state.buffers[0].name === 'default', '...');
    const i = ['value', 'example', 'export' ].indexOf(name);
    modulo.assert(i > -1, 'Not expected: ' + name);
    const buffer = state.buffers[i];
    return buffer.value || '';
}

function _updateState() {
    state.showEditor = !props.collapsed;
    state.componentName = getComponentName();
    if (state.buffers.length === 0) { // No buffers! Populate from props and element
        state.buffers = newBuffersFromElement(props, element);
        state.selectedBuffer = props.editex ? 1 : 0; // First time, set to 0 if not an example editor
    }
    state.demoBox = { // "Transform" the buffers into the expected demo arrangement
        value: getDemoValue('value'),
        component: getDemoValue('component'),
        example: getDemoValue('example'),
    };
    
    // Ensure state.divider is set if it starts as null
    const width = window.screen.width;
    if (state.divider === null) {
        state.divider = width / 2;
    }
    if (state.dividerOffset === null) {
        state.dividerOffset = width;
    }
    console.log('prepare:', state);
    
}

function parsePath(path, relativeTo = null) {
    path = path.endsWith('/') ? path + 'index.html' : path;
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    const dir = path.substr(0, path.length - filename.length);
    const [ barename, extension ] = filename.split('.');
    const relpath = relativeTo ? path.replace(relativeTo.dir, './') : null;
    return { path, barename, relpath, filename, extension, dir, parts };
}

function prepareCallback() {
    _updateState();
    const buffer = state.buffers[state.selectedBuffer];
    
    const files = [];
    if (state.showFiles) {
        const paths = Array.from(new Set(Object.keys(modulo.childData)));
        paths.sort();
        const currentFile = parsePath(new String(window.location), '');
        for (const path of paths) {
            files.push(parsePath(path, currentFile));
        }
    }
    return { buffer, files };
}

function renderCallback() {
    if (element.hasAttribute('modulo-mount-html')) {
        element.removeAttribute('modulo-mount-html');
        component.innerHTML = null; // Lock first render when re-hydrating
    }
}

function getComponentName(src = false) {
    if (props.component) { // takes precedence
        return props.component;
    }
    src = src || props.src;
    if (src) {
        return src.split('/').pop().split('.').shift();
    } else {
        return 'App';
    }
}


/*
function run() {
    // TODO: Issue with hydrating, need to figure out why, but in built version need this:
    if (!element.editor && element.querySelector('x-SyntaxEditor')) {
        element.editor = element.querySelector('x-SyntaxEditor');
        const newVal = element.editor.value; // did we get a value already?
        if (newVal) {
            state.buffers[0].value = newVal;
        }
        element.cparts.state.bindMount({ el: element.editor }); // ensure bound
    }
    state.runcount++; // increment run count
    _updateState(); // Will auto-rerender, which will also auto run if changed
}
*/

function save() {
    // Saves as HTML
    // TODO: Add different save template options:
    //    -  Editor: Includes <Modulo -src="https://modulojs.org/static/components/editor/"></Modulo>
    //        then embeds editor in exact current state as this one
    //    -  Embed: Saves a single HTML file with all scripts inlined (can be with above, as well)
    //    -  Embed with Editor: (Combo of above)
    _updateState();
    const { component, value, example } = state.demoBox;
    const includesCode = '';
    const exportCode = getDemoValue('export');
    const fullText = toEmbed(value, component, example, includesCode, exportCode);
    saveFileAs('Modulo_' + component + '.html', fullText);
}


function open() {
    // Opens in ACE editor
    _updateState();
    const { component, value, example } = state.demoBox;
    const includesCode = '';
    const exportCode = getDemoValue('export');
    const fullText = toEmbed(value, component, example, includesCode, exportCode);
    const path = '/demo/' + component + '.html';
    localStorage.setItem(LOCAL_STORAGE_PREFIX + path, fullText);
    window.location.href = (EDITOR_LOCATION + '?ls=' + path);
}

`)
