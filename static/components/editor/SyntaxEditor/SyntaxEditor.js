!DOCTYPE_MODULO(`
const SIGIL = String.fromCharCode(160); // NBSP (non-breaking space)

function wrapperMount({ el }){
    element.wrapper = el;
}

function textMount({ el }){
    // Mounting of the actual <textarea>, which functions as the main
    // "initialized" callback where everything gets set-up and rerendered with
    // the value provided
    let value =  (state.value || '').trim();
    if (element.hasAttribute('modulo-mount-text')) {
        value = element.getAttribute('modulo-mount-text');
    } else if (element.hasAttribute('readonly-value')) {
        value = element.getAttribute('readonly-value');
    } else if (element.hasAttribute('value')) {
        value = element.getAttribute('value');
    }
    const textarea = el;
    element.textarea = textarea;
    textarea.value = value;

    // For low-level control over speed, we 1) manually rerender, and 2)
    // manually handle single event listeners
    setStateAndRerender(textarea);
    textarea.addEventListener('keydown', keyDown);
    textarea.addEventListener('keyup', keyUp);

    // The stateChangedCallback is required for [state.bind] compatibility:
    // Parent components can bind this as though it were a normal textarea
    element.stateChangedCallback = (name, val, originalEl) => {
        if (element.hasAttribute('readonly-value')) {
            val = element.getAttribute('readonly-value');
        }
        textarea.value = val;
        // Keep cursor and/or selection at correct location:
        textarea.setSelectionRange(state.selectionStart, state.selectionStart);
        setStateAndRerender(textarea);
    };

    // Finally, attach a resize observer, so it can keep the backing mirror the
    // exact same size as the textarea
    try {
        new ResizeObserver(updateDimensions).observe(textarea);
    } catch {
        console.error('Could not listen to resize of textarea');
    }
}

function buildCallback() {
    element.removeAttribute('modulo-mount-html');
    element.setAttribute('modulo-mount-text', state.value);
}

function renderCallback(renderObj) {
    if (element.hasAttribute('modulo-mount-text')) {
        state.value = element.getAttribute('modulo-mount-text');
        element.removeAttribute('modulo-mount-text');
        element.textarea.value = state.value;
        renderObj.component.innerHTML = null; // lock first render if original HTML was set
    }
}


/*
    Given a base text, merge another text with it, ignoring SIGILs as
    placeholders.
*/
function mergeStrings(baseText, overlayText) {
    let baseIndex = 0;
    let overlayIndex = 0;
    let results = '';
    while (baseIndex < baseText.length || overlayIndex < overlayText.length) {
        const overlayChar = overlayText[overlayIndex];
        const baseChar = (baseIndex < baseText.length) ? baseText[baseIndex] : SIGIL;
        if (baseChar === SIGIL || baseChar === overlayChar) {
            results += (overlayChar && overlayChar !== SIGIL) ? overlayChar : ''; // Ensure str
            overlayIndex++;
        } else { // We are dealing with an insertion in the base:
            results += baseChar ? baseChar : ''; // Ensure str
        }
        baseIndex++; // Always progress through base
    }
    return results;
}

function isCharacterKeyPress(ev) {
    if (typeof ev.which === "number" && ev.which > 0) {
        return !ev.ctrlKey && !ev.metaKey && !ev.altKey && ev.which !== 8 && ev.which !== 16;
    }
    return false;
}

function keyUp(ev) {
    // Always clear globalDebounce if it exists
    if (globalDebounce) {
        clearTimeout(globalDebounce);
        globalDebounce = null;
    }
    setStateAndRerender(ev.target); // Ensure state is updated with val 
}

// TODO wrap cbs below in callback
let globalDebounce = null;
function keyDown(ev) {
    const textarea = ev.target;

    if (globalDebounce) { // Always clear globalDebounce if it exists
        clearTimeout(globalDebounce);
        globalDebounce = null;
    }
    // Need to check if nothing / whitespace is after this (if can use fast lookahead)
    const originalValue = textarea.value;
    const after = originalValue.substr(state.selectionStart);
    const isOnEmptyLine = /^\\s*$/.test(after) || /^\\s*[\\n\\r]+/.test(after);
    if (!props.fast || !isOnEmptyLine || !isCharacterKeyPress(ev)) {
        globalDebounce = setTimeout(() => setStateAndRerender(textarea), 10);
        return; // Don't do fast-type-ahead
    }

    // Fast type ahead: Remove keydown, and make textarea text visible, then
    // after debounce timeout, "settle up" with what has been typed-ahead,
    // actually rerendering (e.g. for syntax highlighting)

    // Person is typing, remove keydown for as fast as possible interaction
    textarea.removeEventListener('keydown', keyDown);
    textarea.removeEventListener('keyup', keyUp);

    setStateAndRerender(textarea); // Ensure state is updated with val 

    // Replace all non-space with sigils, and add sigil to reserve space at caret
    let value = originalValue;
    value = value.replace(/[^\\r\\n ]/g, SIGIL);
    //value = value.substr(0, state.selectionStart - 1) + SIGIL + value.substr(state.selectionStart - 1);
    textarea.value = value; // Set "blanked" version of textarea
    textarea.style.color = 'black'; // Ensure their text is visible
    textarea.setSelectionRange(state.selectionStart, state.selectionStart);

    globalDebounce = setTimeout(() => {
        state.selectionStart = textarea.selectionStart;
        textarea.value = mergeStrings(textarea.value, originalValue);
        textarea.setSelectionRange(state.selectionStart, state.selectionStart);
        setStateAndRerender(textarea);
        textarea.addEventListener('keydown', keyDown); // restore keydown
        textarea.addEventListener('keyup', keyUp); // restore keydown
    }, 100); // Debounce at 100
}

function updateDimensions() {
    // Updates the backing div to mirror the textarea
    const { textarea, wrapper } = element;
    if (!textarea) {
        return;
    }
    let _needsRerender = false;
    const { scrollLeft, scrollTop, clientWidth, clientHeight } = textarea;
    if (state.scrollLeft !== scrollLeft || state.scrollTop !== scrollTop) {
        // Scrolled textarea, update state to reflect
        state.scrollTop = scrollTop; // update state to reflect
        state.scrollLeft = scrollLeft;
        if (wrapper) { // Possibly a quick update path: Just update scroll, nothing else
            wrapper.style['left'] = '-' + scrollLeft + 'px';
            wrapper.style['top'] = '-' + scrollTop + 'px';
        } else {
            _needsRerender = true; // More complicated (wrapper hasn't mounted), force rerender
        }
    }
    if (state.width !== clientWidth || state.height !== clientHeight) {
        state.width = clientWidth; // textarea was resized, need to update state size
        state.height = clientHeight;
        _needsRerender = true; // More complicated (resize happened), force rerender
    }
    if (_needsRerender) {
        element.rerender();
    }
}

function setStateAndRerender(textarea) {
    state.selectionStart = textarea.selectionStart;
    if (props.readonly) {
        textarea.value = element.getAttribute('readonly-value');
    }
    if (state.value !== textarea.value) {
        state.value = textarea.value;
        element.value = state.value;
        if ('_onEditorValueChange' in element) { // quick hack for an easy callback
            element._onEditorValueChange(state.value);
        }
        element.rerender();
    }
}
`)

