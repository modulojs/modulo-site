 
var Modulo = function Modulo (OPTS = { }) {
const Lib = OPTS.globalLibrary || window.Modulo || Modulo; 
Lib.instanceID = Lib.instanceID || 0;
this.id = ++Lib.instanceID;
const globals = OPTS.globalProperties || [ 'config', 'util', 'engine',
'processor', 'part', 'core', 'templateMode', 'templateTag',
'templateFilter', 'contentType', 'command', 'build', 'definitions',
'stores', 'fetchQueue' ];
for (const name of globals) {
const stdLib = Lib[name.charAt(0).toUpperCase() + name.slice(1) + 's'];
this[name] = stdLib ? stdLib(this) : { }; 
}
}

Modulo.Parts = function ComponentParts (modulo) {

class Include {
static LoadMode(modulo, def, value) {
const { bundleHead, newNode, urlReplace, getParentDefPath } = modulo.util;
const text = urlReplace(def.Content,  getParentDefPath(modulo, def));
for (const elem of newNode(text).children) { 
bundleHead(modulo, elem); 
} 
}
static Server({ part, util }, def, value) {
def.Content = (def.Content || '') + new part.Template(def.TagTemplate)
.render({ entries: util.keyFilter(def), value });
}
intitializedCallback(renderObj) {
Include.LoadMode(this.modulo, this.conf, 'lazy');
}
}
class Props { 
static factoryCallback({ elementClass }, def, modulo) {
const isLower = key => key[0].toLowerCase() === key[0]; 
const keys = Array.from(Object.keys(def)).filter(isLower);
elementClass.observedAttributes.push(...keys); 
}


initializedCallback() { 
this.data = { }; 
Object.keys(this.attrs).forEach(attrName => this.updateProp(attrName));
return this.data; 
}
updateProp(attrName) { 
this.data[attrName] = this.element.hasAttribute(attrName) ?
this.element.getAttribute(attrName) : this.attrs[attrName];
}
attrCallback({ attrName }) {
if (attrName in this.attrs) {
this.updateProp(attrName);
this.element.rerender();
}
}
}



class Style {
static AutoIsolate(modulo, def, value) { 
const { AutoIsolate } = modulo.part.Style; 
const { namespace, mode, Name } = modulo.definitions[def.Parent] || {};
if (value === true) { 
AutoIsolate(modulo, def, mode); 
} else if (value === 'regular' && !def.isolateClass) {
def.prefix = def.prefix || `${namespace}-${Name}`; 
} else if (value === 'vanish') { 
def.isolateClass = def.isolateClass || def.Parent;
} 
}
domCallback(renderObj) {
const { mode } = modulo.definitions[this.conf.Parent] || {};
const { innerDOM, Parent } = renderObj.component;
const { isolateClass, isolateSelector, shadowContent } = this.conf;
if (isolateClass && isolateSelector && innerDOM) { 
const selector = isolateSelector.filter(s => s).join(',\n');
for (const elem of innerDOM.querySelectorAll(selector)){
elem.classList.add(isolateClass);
}
} 
if (shadowContent && innerDOM) { 
innerDOM.prepend(this.modulo.util.newNode(shadowContent, 'STYLE'));
}
}
static processSelector (modulo, def, selector) {
const hostPrefix = def.prefix || ('.' + def.isolateClass);
if (def.isolateClass || def.prefix) {
const hostRegExp = new RegExp(/:(host|root)(\([^)]*\))?/, 'g');
selector = selector.replace(hostRegExp, hostClause => {
hostClause = hostClause.replace(/:(host|root)/gi, '');
return hostPrefix + (hostClause ? `:is(${ hostClause })` : '');
});
}
let selectorOnly = selector.replace(/\s*[\{,]\s*,?$/, '').trim();
if (def.isolateClass && selectorOnly !== hostPrefix) {

let suffix = /{\s*$/.test(selector) ? ' {' : ', ';
selectorOnly = selectorOnly.replace(/:(:?[a-z-]+)\s*$/i, (all, pseudo) => {
if (pseudo.startsWith(':') || def.corePseudo.includes(pseudo)) {
suffix = ':' + pseudo + suffix; 
return ''; 
}
return all;
});
def.isolateSelector.push(selectorOnly); 
selector = `.${ def.isolateClass }:is(${ selectorOnly })` + suffix;
}
if (def.prefix && !selector.startsWith(def.prefix)) {

selector = `${ def.prefix } ${ selector }`;
}
return selector;
}
static ProcessCSS (modulo, def, value) {
const { bundleHead, newNode, urlReplace, getParentDefPath } = modulo.util;
value = value.replace(/\/\*.+?(\*\/)/g, ''); 
value = urlReplace(value, getParentDefPath(modulo, def), def.urlMode);
if (def.isolateClass || def.prefix) {
def.isolateSelector = []; 
value = value.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/gi, selector => {
selector = selector.trim();
return /^(from|to|@)/.test(selector) ? selector :
this.processSelector(modulo, def, selector);
});
}
if ((modulo.definitions[def.Parent] || {}).mode === 'shadow') {
def.shadowContent = (def.shadowContent || '') + value;
} else { 
bundleHead(modulo, newNode(value, 'STYLE'), modulo.bundles.modstyle);
}
}
}



class StaticData {
prepareCallback() { 
return this.conf.data;
}
}
class Script { 



static AutoExport (modulo, def, value) {
const nameRE = /(function|class)\s+(\w+)/; 
const matches = def.Content.match(new RegExp(nameRE, 'g')) || [];
const isSym = sym => sym && !(sym in modulo.config.syntax.jsReserved);
const symbols = matches.map(sym => sym.match(nameRE)[2]);
const ifUndef = n => `"${n}":typeof ${n} !=="undefined"?${n}:undefined`;
const expStr = symbols.filter(isSym).map(ifUndef).join(',');
const { ChildrenNames } = modulo.definitions[def.Parent] || { };
const sibs = (ChildrenNames || []).map(n => modulo.definitions[n].Name);
sibs.push('component', 'element', 'parts', 'ref'); 
const locals = sibs.filter(name => def.Content.includes(name));
const setLoc = locals.map(name => `${ name }=o.${ name }`).join(';')
def.Content += locals.length ? ('var ' + locals.join(',')) : '';
def.Content += `;return{_setLocal:function(o){${ setLoc }}, ${ expStr }}`;
}
initializedCallback(renderObj) { 
const func = modulo.registry.modules[this.conf.DefinitionName];
this.exports = func.call(window, modulo);
for (const method of Object.keys(this.exports)) { 
if (method === 'initializedCallback' || !method.endsWith('Callback')) {
continue; 
} 
this[method] = arg => {
const renderObj = this.element.getCurrentRenderObj();
const script = renderObj[this.conf.Name];
this.eventCallback(renderObj);
Object.assign(script, this.exports[method](arg) || {}); 
};
}
this.ref = { };
this.eventCallback(renderObj);
return Object.assign(this.exports, this.exports.initializedCallback ?
this.exports.initializedCallback(renderObj) : { }); 
}
eventCallback(renderObj) {
this.exports._setLocal(Object.assign({ ref: this.ref,
element: this.element, parts: this.element.cparts }, renderObj));
}
refMount({ el, nameSuffix, value }) { 
const refVal = value ? modulo.util.get(el, value) : el; 
this.ref[nameSuffix || el.tagName.toLowerCase()] = refVal; 
} 
refUnmount({ el, nameSuffix }) { 
delete this.ref[nameSuffix || el.tagName.toLowerCase()]; 
}
}



class State { 
static factoryCallback(renderObj, def, modulo) {
if (def.Store) { 
const store = modulo.util.makeStore(modulo, def);
if (!(def.Store in modulo.stores)) { 
modulo.stores[def.Store] = store; 
} else { 
Object.assign(modulo.stores[def.Store].data, store.data);
} 
} 
}
initializedCallback(renderObj) {
const store = this.conf.Store ? this.modulo.stores[this.conf.Store]
: this.modulo.util.makeStore(this.modulo,
Object.assign(this.conf, renderObj[this.conf.Init]));
store.subscribers.push(Object.assign(this, store));
this.types = { range: Number, number: Number }
this.types.checkbox = (v, el) => el.checked;
return store.data;
}
bindMount({ el, nameSuffix, value, listen }) {
const name = value || el.getAttribute('name');
const val = this.modulo.util.get(this.data, name, this.conf.Dot);
this.modulo.assert(val !== undefined, `state.bind "${name}" undefined`);
const isText = el.tagName === 'TEXTAREA' || el.type === 'text';
const evName = nameSuffix ? nameSuffix : (isText ? 'keyup' : 'change');

listen = listen ? listen : () => this.propagate(name, el.value, el);
el.addEventListener(evName, listen);
this.boundElements[name] = this.boundElements[name] || [];
this.boundElements[name].push([ el, evName, listen ]);
this.propagate(name, val, null, [ el ]); 
}
bindUnmount({ el, nameSuffix, value }) {
const name = value || el.getAttribute('name');
const remainingBound = [];
for (const row of this.boundElements[name]) {
if (row[0] === el) {
row[0].removeEventListener(row[1], row[2]);
} else {
remainingBound.push(row);
}
}
this.boundElements[name] = remainingBound;
}
stateChangedCallback(name, value, el) {
this.modulo.util.set(this.data, name, value, this.conf.Dot);
if (!this.conf.Only || this.conf.Only.includes(name)) {
this.element.rerender();
}
}
eventCallback() {
this._oldData = Object.assign({}, this.data);
}
propagate(name, val, originalEl = null, arr = null) {
arr = arr ? arr : this.subscribers.concat(
(this.boundElements[name] || []).map(row => row[0]));
const typeConv = this.types[ originalEl ? originalEl.type : null ];
val = typeConv ? typeConv(val, originalEl) : val; 
for (const el of arr) {
if (originalEl && el === originalEl) { 
} else if (el.stateChangedCallback) {
el.stateChangedCallback(name, val, originalEl, arr);
} else if (el.type === 'checkbox') {
el.checked = !!val;
} else { 
el.value = val;
}
}
}
eventCleanupCallback() {
for (const name of Object.keys(this.data)) {
this.modulo.assert(!this.conf.AllowNew && name in this._oldData,
`State variable "${ name }" is undeclared (no "-allow-new")`);
if (this.data[name] !== this._oldData[name]) {
this.propagate(name, this.data[name], this);
}
}
this._oldData = null;
}
}
class Template { 

static CompileTemplate (modulo, def, value) {
const compiled = modulo.util.instance(def, { }).compile(value);
def.Code = `return function (CTX, G) { ${ compiled } };`;
}
constructedCallback() { 
this.stack = []; 
const { filters, tags, modes } = this.conf;
const { templateFilter, templateTag, templateMode } = this.modulo;
Object.assign(this, this.modulo.config.template, this.conf);

this.filters = Object.assign({ }, templateFilter, filters);
this.tags = Object.assign({ }, templateTag, tags);
this.modes = Object.assign({ }, templateMode, modes);
}
initializedCallback() {
return { render: this.render.bind(this) }; 
}
constructor(text, options = null) { 
if (typeof text === 'string') { 
window.modulo.util.instance(options || { }, null, this); 
this.conf.DefinitionName = '_template_template' + this.id; 
const code = `return function (CTX, G) { ${ this.compile(text) } };`;
this.modulo.processor.code(this.modulo, this.conf, code);
}
}
renderCallback(renderObj) {
if (this.conf.Name === 'template' || this.conf.active) { 
renderObj.component.innerHTML = this.render(renderObj); 
}
}
parseExpr(text) {

const filters = text.split('|');
let results = this.parseVal(filters.shift()); 
for (const [ fName, arg ] of filters.map(s => s.trim().split(':'))) {
const argList = arg ? ',' + this.parseVal(arg) : '';
results = `G.filters["${fName}"](${results}${argList})`;
}
return results;
}
parseCondExpr(string) {

const regExpText = ` (${this.opTokens.split(',').join('|')}) `;
return string.split(RegExp(regExpText));
}
toCamel(string) { 
return string.replace(/-([a-z])/g, g => g[1].toUpperCase());
}
parseVal(string) {

const s = string.trim();
if (s.match(/^('.*'|".*")$/)) { 
return JSON.stringify(s.substr(1, s.length - 2));
}
return s.match(/^\d+$/) ? s : `CTX.${ this.toCamel(s) }`
}
tokenizeText(text) { 
const re = '(' + this.modeTokens.map(modulo.templateFilter.escapere)
.join('|(').replace(/ +/g, ')(.+?)');
return text.split(RegExp(re)).filter(token => token !== undefined);
}
compile(text) {
const { normalize } = this.modulo.util;
let code = 'var OUT=[];\n'; 
let mode = 'text'; 
const tokens = this.tokenizeText(text);
for (const token of tokens) {
if (mode) { 
const result = this.modes[mode](token, this, this.stack);
code += result ? (result + '\n') : '';
} 
mode = (mode === 'text') ? null : (mode ? 'text' : token);
}
code += '\nreturn OUT.join("");'
const unclosed = this.stack.map(({ close }) => close).join(', ');
this.modulo.assert(!unclosed, `Unclosed tags: ${ unclosed }`);
return code;
}
render(local) {
if (!this.renderFunc) {
const mod = this.modulo.registry.modules[this.conf.DefinitionName];
this.renderFunc = mod.call(window, this.modulo);
}
return this.renderFunc(Object.assign({ local, global: this.modulo }, local), this);
}
} 
const cparts = { State, Props, Script, Style, Template, StaticData, Include };
return modulo.util.insObject(cparts);
} 
Modulo.TemplateFilters = modulo => {




const { get } = modulo.util;
const safe = s => Object.assign(new String(s),{ safe: true });
const escapere = s => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
const syntax = (s, arg = 'text') => {
for (const [ find, sub, sArg ] of modulo.config.syntax[arg]) {
s = find ? s.replace(find, sub) : Filters[sub](s, sArg);
}
return s;
};
const tagswap = (s, arg) => {
arg = typeof arg === 'string' ? arg.split(/\s+/) : Object.entries(arg);
for (const row of arg) {
const [ tag, val ] = typeof row === 'string' ? row.split('=') : row;
const swap = (a, prefix, suffix) => prefix + val + suffix;
s = s.replace(RegExp('(</?)' + tag + '(\\s|>)', 'gi'),  swap);
}
return safe(s);
};
const modeRE = /(mode: *| type=)([a-z]+)(>| *;)/; 
const Filters = {
add: (s, arg) => s + arg,
allow: (s, arg) => arg.split(',').includes(s) ? s : '',
apply: (s, arg) => Filters[arg](s),
camelcase: s => s.replace(/-([a-z])/g, g => g[1].toUpperCase()),
capfirst: s => s.charAt(0).toUpperCase() + s.slice(1),
combine: (s, arg) => s.concat ? s.concat(arg) : Object.assign({}, s, arg),
default: (s, arg) => s || arg,
divide: (s, arg) => (s * 1) / (arg * 1),
divisibleby: (s, arg) => ((s * 1) % (arg * 1)) === 0,
dividedinto: (s, arg) => Math.ceil((s * 1) / (arg * 1)),
escapejs: s => JSON.stringify(String(s)).replace(/(^"|"$)/g, ''),
escape: (s, arg) => s && s.safe ? s : syntax(s + '', arg || 'text'),
first: s => Array.from(s)[0],
join: (s, arg) => (s || []).join(typeof arg === "undefined" ? ", " : arg),
json: (s, arg) => JSON.stringify(s, null, arg || undefined),
guessmode: s => modeRE.test(s.split('\n')[0]) ? modeRE.exec(s)[2] : '',
last: s => s[s.length - 1],
length: s => s ? (s.length !== undefined ? s.length : Object.keys(s).length) : 0,
lines: s => s.split('\n'),
lower: s => s.toLowerCase(),
multiply: (s, arg) => (s * 1) * (arg * 1),
number: (s) => Number(s),
pluralize: (s, arg) => (arg.split(',')[(s === 1) * 1]) || '',
skipfirst: (s, arg) => Array.from(s).slice(arg || 1),
subtract: (s, arg) => s - arg,
sorted: (s, arg) => Array.from(s).sort(arg && ((a, b) => a[arg] > b[arg] ? 1 : -1)),
trim: (s, arg) => s.replace(new RegExp(`^\\s*${ arg = arg ?
escapere(arg).replace(',', '|') : '|' }\\s*$`, 'g'), ''),
trimfile: s => s.replace(/^([^\n]+?script[^\n]+?[ \n]type=[^\n>]+?>)/is, ''),
truncate: (s, arg) => ((s && s.length > arg*1) ? (s.substr(0, arg-1) + '…') : s),
type: s => s === null ? 'null' : (Array.isArray(s) ? 'array' : typeof s),
renderas: (rCtx, template) => safe(template.render(rCtx)),
reversed: s => Array.from(s).reverse(),
upper: s => s.toUpperCase(),
urlencode: (s, arg) => window[`encodeURI${ arg ? 'Component' : ''}`](s)
.replace(/#/g, '%23'), 
yesno: (s, arg) => `${ arg || 'yes,no' },,`.split(',')[s ? 0 : s === null ? 2 : 1],
};
const { values, keys, entries } = Object;
return Object.assign(Filters, Modulo.ContentTypes(modulo),
{ values, keys, entries, tagswap, get, safe, escapere, syntax });
} 

Modulo.Configs = function DefaultConfiguration() {
const CONFIG = {  }
CONFIG.syntax = { 
jsReserved: { 
'break': 1, 'case': 1, 'catch': 1, 'class': 1, 'const': 1, 'continue': 1,
'debugger': 1, 'default': 1, 'delete': 1, 'do': 1, 'else': 1,
'enum': 1, 'export': 1, 'extends': 1, 'finally': 1, 'for': 1,
'function': 1, 'if': 1, 'implements': 1, 'import': 1, 'in': 1,
'instanceof': 1, 'interface': 1, 'new': 1, 'null': 1, 'package': 1,
'private': 1, 'protected': 1, 'public': 1, 'return': 1, 'static': 1,
'super': 1, 'switch': 1, 'throw': 1, 'try': 1, 'typeof': 1, 'var': 1,
'let': 1, 'void': 1, 'while': 1, 'with': 1, 'await': 1, 'async': 1,
'true': 1, 'false': 1,
},
html: [ 
[ null, 'syntax', 'txt' ],
[ /(\{%[^<>]+?%}|\{\{[^<>]+?\}\})/gm,
'<tt style=background:#82d4a444>$1</tt>'],
[ /(&lt;\/?)([a-z]+\-[A-Za-z]+)/g,
'<tt style=color:#999>$1</tt><tt style=color:indigo>$2</tt>'],
[ /(&lt;\/?)(script |def |template |)([A-Z][a-z][a-zA-Z]*)/g,
'<tt style=color:#999>$1$2</tt><tt style=color:#B90183>$3</tt>'],
[ /(&lt;\/?[a-z1-6]+|&gt;)/g, '<tt style=color:#777>$1</tt>'],
],
'md': [ 
[ null, 'syntax', 'text' ],
[ /(&lt;)-(script)(&gt;)/ig, '$1/$2$3' ], 
[ /```([a-z]*)([a-z=]*)\n?(.+?)\n?```/igs,
'<modulo-Editor mode="$1" demo$2 value="$3"></modulo-Editor>' ],
[ /^(#+)\s*(.+)$/gm, '<h2 h="$1">$2</h2>' ],
[ /!\[([^\]]+)\]\(([^\)]+)\)/g, '<img="$2" alt="$1" />' ],
[ /\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>' ],
[ /_([^_`]+)_/g, '<em>$1</em>'  ],
[ /`([^`]+)`/g, '<code>$1</code>' ],
[ /\*\*([^\*]+)\*\*/g, '<strong>$1</strong>' ],
[ /\*([^\*]+)\*/g, '<em>$1</em>', ],
[ /\n+\r?\n---+/g, '</p><hr />' ],
[ /(\n|>)\r?\n[\n\r]*/g, '$1<p>' ],
],
mdocs: [ 
[ /^((?!.*md\:).*)$/gm, '\n' ], [ /^.*?md\:\s*/gm, '' ],
[ null, 'syntax', 'md' ], 
],
text: [ 
[ /&/g, '&amp;' ], [ /</g, '&lt;' ], [ />/g, '&gt;' ], 
[/'/g, '&#x27;'], [ /"/g, '&quot;' ], 
],
trimcode: [ [ /^[\n \t]+/gm, '' ], 
[ /\/\*\#UNLESS\#[\s\S]+?\#ENDUNLESS\#(\*\/)/gm, '' ],
[ /\/\*[^\*\!][\s\S]*?\*\/|\/\/.*$/gm, '' ],
],
txt: [ 
[ null, 'syntax', 'text' ],
[ /\n/g, '<br /><modulo-line></modulo-line>' ],
[ /  /g, '&nbsp;&nbsp;' ],
],
};
CONFIG.syntax.js = Array.from(CONFIG.syntax.html)
CONFIG.syntax.js.push([ new RegExp(`(\\b${ Object.keys(
CONFIG.syntax.jsReserved).join('\\b|\\b') }\\b)`, 'g'),
`<strong style=color:firebrick>$1</strong>` ]);
return CONFIG
};
Modulo.ContentTypes = modulo => ({ 
CSV: s => (s || '').trim().split('\n').map(r => r.trim().split(',')),
JS: s => Function('return (' + s + ');')(), 
JSON: s => JSON.parse(s || '{ }'), 
MD: (s, arg) => { 
const headerRE = /^([^\n]*---+\n.+?\n---\n)/s;
const obj = { body: s.replace(headerRE, '') };
if (obj.body !== s) { 
let key = null; 
const lines = s.match(headerRE)[0].split(/[\n\r]/g);
for (const line of lines.slice(1, lines.length - 2)) { 
if (key && (new RegExp('^[ \\t]')).test(line)) { 
obj[key] += '\n' + line; 
} else if (line.trim() && (key = line.split(':')[0])) { 
obj[key.trim()] = line.substr(key.length + 1).trim();
}
}
}
obj.body = arg ? modulo.templateFilter.syntax(obj.body, arg) : obj.body;
return obj;
},
TXT: s => s, 
BIN: (s, arg = 'application/octet-stream') => 
`data:${ arg };charset=utf-8,${ window.encodeURIComponent(s) }`,
});

Modulo.Utils = function UtilityFunctions (modulo) {
const Utilities = {
escapeRegExp: s => 
s.replace(/[.*+?^${}()|[\]\\]/g, "\\" + "\x24" + "&"),
insObject: obj => Object.assign(obj || {}, Utilities.lowObject(obj)),
get: (obj, key, sep='.') => (key in obj) ? 
obj[key] : (key + '').split(sep).reduce((o, name) => o[name], obj),
lowObject: obj => Object.fromEntries(Object.keys(obj || {}).map(
key => [ key.toLowerCase(), obj[key] ])),
normalize: s => 
s.replace(/\s+/g, ' ').replace(/(^|>)\s*(<|$)/g, '$1$2').trim(),
set: (obj, keyPath, val, sep = null) => 
new modulo.engine.ValueResolver(modulo, sep).set(obj, keyPath, val),
trimFileLoader: s => 
s.replace(/^([^\n]+script[^\n]+[ \n]file[^\n>]+>(\*\/\n|---\n|\n))/is, '$2'),
};
function instance(def, extra, inst = null) {
const registry = (def.Type in modulo.core) ? modulo.core : modulo.part;
inst = inst || new registry[def.Type](modulo, def, extra.element || null);
const id = ++window.Modulo.instanceID; 

const conf = Object.assign({}, def); 
const attrs = modulo.util.keyFilter(conf);
Object.assign(inst, { id, attrs, conf }, extra, { modulo: modulo });
if (inst.constructedCallback) {
inst.constructedCallback();
}
return inst;
}
function instanceParts(def, extra, parts = {}) {

const allNames = [ def.DefinitionName ].concat(def.ChildrenNames);
for (const def of allNames.map(name => modulo.definitions[name])) {
parts[def.RenderObj || def.Name] = modulo.util.instance(def, extra);
}
return parts;
}
function initComponentClass (modulo, def, cls) {

const initRenderObj = { elementClass: cls }; 
for (const defName of def.ChildrenNames) {
const cpartDef = modulo.definitions[defName];
const cpartCls = modulo.part[cpartDef.Type];
modulo.assert(cpartCls, 'Unknown Part:' + cpartDef.Type);
if (cpartCls.factoryCallback) {
const result = cpartCls.factoryCallback(initRenderObj, cpartDef, modulo);
initRenderObj[cpartDef.RenderObj || cpartDef.Name] = result;
}
}
cls.prototype.init = function init () {
this.modulo = modulo;
this.isMounted = false;
this.isModulo = true;
this.originalHTML = null;
this.originalChildren = [];
this.cparts = modulo.util.instanceParts(def, { element: this });
};
cls.prototype.connectedCallback = function connectedCallback () {
modulo._connectedQueue.push(this);
window.setTimeout(modulo._drainQueue, 0);
};
cls.prototype.moduloMount = function moduloMount(force = false) {
if ((!this.isMounted && !modulo.paused) || force) {
this.cparts.component._lifecycle([ 'initialized', 'mount' ]);
}
};
cls.prototype.attributeChangedCallback = function (attrName) {
if (this.isMounted) { 
this.cparts.component._lifecycle([ 'attr' ], { attrName });
}
};
cls.prototype.initRenderObj = initRenderObj;
cls.prototype.rerender = function (original = null) {
if (!this.isMounted) { 
return this.moduloMount();
}
this.cparts.component.rerender(original); 
};
cls.prototype.getCurrentRenderObj = function () {
return this.cparts.component.getCurrentRenderObj();
};
modulo.registry.elements[cls.name] = cls; 
}
function newNode(innerHTML, tag, extra) {
const obj = Object.assign({ innerHTML }, extra);
return Object.assign(window.document.createElement(tag || 'div'), obj);
}
function makeStore (modulo, def) {
const data = JSON.parse(JSON.stringify(modulo.util.keyFilter(def)));
return { data, boundElements: {}, subscribers: [] };
}
function keyFilter (obj, func = null) {
func = func || (key => /^[a-z]/.test(key)); 
const keys = func.call ? Object.keys(obj).filter(func) : func;
return Object.fromEntries(keys.map(key => [ key, obj[key] ]));
}
function urlReplace(str, origin, field = 'href') { 
const ifURL = (all, pre, url, suf) => /^[a-z]+:\/\/./i.test(url) ? all :
`${ pre }"${ (new window.URL(origin + '/../' + url))[field] }"${ suf }`;
return str.replace(/(href=|src=|url\()['"]?(.+?)['"]?([\>\s\)])/gi, ifURL);
}
Object.assign(Utilities, { initComponentClass, instance, instanceParts,
newNode, makeStore, keyFilter, urlReplace })

return Utilities;
}; 
Modulo.Processors = function DefProcessors (modulo) { 
} 
Modulo.Engines = function Engines (modulo) {
class DOMLoader {
}
class ValueResolver {
constructor(contextObj = null, sep = null) {
this.ctxObj = contextObj;
this.sep = sep || '.';
this.isJSON = /^(true$|false$|null$|[^a-zA-Z])/; 
}
get(key, ctxObj = null) {
const { get } = window.modulo.util; 
const obj = ctxObj || this.ctxObj; 
return this.isJSON.test(key) ? JSON.parse(key) : get(obj, key, this.sep);
}
set(obj, keyPath, val, autoBind = false) {
const index = keyPath.lastIndexOf(this.sep) + 1; 
const key = keyPath.slice(index).replace(/:$/, ''); 
const prefix = keyPath.slice(0, index - 1); 
const target = index ? this.get(prefix, obj) : obj; 
if (keyPath.endsWith(':')) { 
const parentKey = val.substr(0, val.lastIndexOf(this.sep));
val = this.get(val); 

}
target[key] = val; 
}
}
class FetchQueue {
constructor() {
this.queue = {}
this.data = {}
this.frames = {}
this.protos = { 'file:': 1, 'about:': 1 }
if (location.protocol in this.protos) { 
try { this.fs = (window._moduloFS || parent._moduloFS).fs } catch { }
const load = ({ data }) => this.receiveData(...JSON.parse(data)._FL);
window.addEventListener('message', load, false);
}
}
fetch(src) {  
src = src === '?' ? modulo.config.pathName : src; 
src = src.endsWith('/') ? `${ src }index.html` : src; 
return { then: callback => this.request(src, callback, console.error) };
}
request(src, resolve, reject) { 
if (src in this.data) { 
resolve(this.data[src], src); 
} else if (this.fs && src in Object.assign({ }, ...this.fs)) {
resolve(Object.assign({ }, ...this.fs)[src], src); 
} else if (!(src in this.queue)) { 
this.queue[src] = [ resolve ]; 
if (location.protocol in this.protos) { 
this.frames[src] = window.document.createElement('IFRAME');
this.frames[src].style = 'display: none';
this.frames[src].src = `${ src }?argv=_load&argv=${ src }`;
document.head.append(this.frames[src])
} else {
window.fetch(src, { cache: 'no-store' })
.then(response => response.text())
.then(text => this.receiveData(text, src))
.catch(reject);
}
} else { 
this.queue[src].push(resolve);
}
}
receiveData(text, src) {
if (src in this.frames) {
this.frames[src].remove();
delete this.frames[src];
}
this.data[src] = text;
const resolveCallbacks = this.queue[src]; 
delete this.queue[src];
for (const dataCallback of resolveCallbacks) {
dataCallback(text, src);
}
}
enqueue(callback, waitForAll = false) { 
const allQueues = Array.from(Object.values(this.queue)); 
const { length } = allQueues;
if (length === 0) {
return callback(); 
} else if (waitForAll) { 
return this.enqueue(() => Object.keys(this.queue).length === 0 ?
callback() : this.enqueue(callback, true));
}
let count = 0; 
const check = () => ((++count >= length) ? callback() : 0);
allQueues.forEach(queue => queue.push(check)); 
}
}
class DOMCursor {
constructor(parentNode, parentRival, slots) {
this.slots = slots || {}; 
this.instanceStack = []; 
this._rivalQuerySelector = parentRival.querySelector.bind(parentRival);
this._querySelector = parentNode.querySelector.bind(parentNode);
this.initialize(parentNode, parentRival);
}
initialize(parentNode, parentRival) {
this.parentNode = parentNode;
this.nextChild = parentNode.firstChild;
this.nextRival = parentRival.firstChild;
this.activeExcess = null;
this.activeSlot = null;
if (parentRival.tagName === 'SLOT') { 
const slotName = parentRival.getAttribute('name') || '';
this.activeSlot = this.slots[slotName] || null; 
if (this.activeSlot) { 
delete this.slots[slotName]; 
this._setNextRival(null); 
}
}
}
saveToStack() { 
this.instanceStack.push(Object.assign({ }, this)); 
}
loadFromStack() { 
const stack = this.instanceStack;
return stack.length > 0 && Object.assign(this, stack.pop());
}
loadFromSlots() { 
const name = Object.keys(this.slots).pop(); 
if (name === '' || name) { 
const sel = name ? `slot[name="${ name }"]` : 'slot:not([name])';
const rivalSlot = this._rivalQuerySelector(sel);
if (!rivalSlot) { 
delete this.slots[name]; 
return this.loadFromSlots(); 
}
this.initialize(this._querySelector(sel) || rivalSlot, rivalSlot);
return true; 
}
}
hasNext() {
if (this.nextChild || this.nextRival) {
return true; 
} else if (this.loadFromStack() || this.loadFromSlots()) { 
return this.hasNext(); 
}
return false; 
}
_setNextRival(rival) { 
if (this.activeSlot !== null) { 
if (this.activeSlot.length > 0) {
this.nextRival = this.activeSlot.shift(); 
this.nextRival._moduloIgnoreOnce = true; 
} else {
this.nextRival = null;
}
} else {
this.nextRival = rival ? rival.nextSibling : null; 
}
}
next() {
let child = this.nextChild;
let rival = this.nextRival;
if (!rival && this.activeExcess && this.activeExcess.length > 0) {
return this.activeExcess.shift(); 
}
this.nextChild = child ? child.nextSibling : null;
this._setNextRival(rival); 
return [ child, rival ];
}
}
class DOMReconciler {
constructor() {
this.directives = {};
this.patches = [];
this.patch = this.pushPatch;
}
applyPatches(patches) {
for (const patch of patches) {
this.applyPatch(patch[0], patch[1], patch[2], patch[3]);
}
}
registerDirectives(thisObj, def) {
const prefix = 'DirectivePrefix' in def ? def.DirectivePrefix
: (def.RenderObj || def.Name) + '.';
for (const method of def.Directives || []) {
this.directives[prefix + method] = thisObj;
}
}
reconcileChildren(childParent, rivalParent, slots) {
const cursor = new modulo.engine.DOMCursor(childParent, rivalParent, slots);
while (cursor.hasNext()) { 
const [ child, rival ] = cursor.next();
const needReplace = child && rival && ( 
child.nodeType !== rival.nodeType || 
child.nodeName !== rival.nodeName); 
if ((child && !rival) || needReplace) { 
this.patchAndDescendants(child, 'Unmount');
this.patch(cursor.parentNode, 'removeChild', child);
}
if (needReplace) { 
this.patch(cursor.parentNode, 'insertBefore', rival, child.nextSibling);
this.patchAndDescendants(rival, 'Mount');
}
if (!child && rival) { 
this.patch(cursor.parentNode, 'appendChild', rival);
this.patchAndDescendants(rival, 'Mount');
}
if (child && rival && !needReplace) { 
if (child.nodeType !== 1) { 
if (child.nodeValue !== rival.nodeValue) { 
this.patch(child, 'node-value', rival.nodeValue);
}
} else if (!child.isEqualNode(rival)) { 
this.reconcileAttributes(child, rival);
if (rival.hasAttribute('modulo-ignore')) { 

} else if (child.isModulo) { 
this.patch(child, 'rerender', rival); 
} else { 
cursor.saveToStack();
cursor.initialize(child, rival);
}
}
}
}
}
pushPatch(node, method, arg, arg2 = null) {
this.patches.push([ node, method, arg, arg2 ]);
}
applyPatch(node, method, arg, arg2) { 
if (method === 'node-value') {
node.nodeValue = arg;
} else if (method === 'insertBefore') {
node.insertBefore(arg, arg2); 
} else {
node[method].call(node, arg); 
}
}
patchDirective(el, rawName, suffix, copyFromEl = null) {
const split = rawName.split(/\./g);
if (split.length < 2) { 
return; 
}
const value = (copyFromEl || el).getAttribute(rawName); 
let dName = split.shift() 
while (split.length > 0 && !((dName + suffix) in this.directives)) {
dName += '.' + split.shift() 
}
const nameSuffix = split.join('.'); 
const fullName = dName + suffix; 
const patchName = (fullName.split('.')[1] || fullName);
const directive = { el, value, nameSuffix, rawName }; 
this.patch(this.directives[fullName], patchName, directive);
}
reconcileAttributes(node, rival) {
const myAttrs = new Set(node ? node.getAttributeNames() : []);
const rivalAttributes = new Set(rival.getAttributeNames());

for (const rawName of rivalAttributes) {
const attr = rival.getAttributeNode(rawName);
if (myAttrs.has(rawName) && node.getAttribute(rawName) === attr.value) {
continue; 
}
if (myAttrs.has(rawName)) { 
this.patchDirective(node, rawName, 'Unmount');
}

this.patch(node, 'setAttributeNode', attr.cloneNode(true));
this.patchDirective(node, rawName, 'Mount', rival);
}

for (const rawName of myAttrs) {
if (!rivalAttributes.has(rawName) && !rawName.startsWith('modulo-')) {
this.patchDirective(node, rawName, 'Unmount');
this.patch(node, 'removeAttribute', rawName);
}
}
}
patchAndDescendants(parentNode, actionSuffix) {
if (parentNode.nodeType !== 1) {
return; 
}
if (parentNode._moduloIgnoreOnce) { 
delete parentNode._moduloIgnoreOnce;
return;
}
const searchNodes = Array.from(parentNode.querySelectorAll('*'));
for (const node of [ parentNode ].concat(searchNodes)) {
for (const rawName of node.getAttributeNames()) {
this.patchDirective(node, rawName, actionSuffix);
}
}
}
}
return { FetchQueue, DOMLoader, ValueResolver, DOMReconciler, DOMCursor }
} 
Modulo.FetchQueues = function FetchQueues (modulo) {
Object.assign(modulo, {
_connectedQueue: [],
_drainQueue: () => {
while (modulo._connectedQueue.length > 0) {
modulo._connectedQueue.shift().moduloMount();
}
},
cmdCallback: (cmdStatus = 0, edit = null, html = null) => {
modulo.cmdStatus = cmdStatus;
if (edit || edit === null) { 
const { log } = modulo.stores.BUILD.data; 
edit = edit || log.length ? log[log.length - 1][0] : '';
const att = ` full=full view="${ edit }" edit="${ edit }"`;
window.document.body.innerHTML = html || `<modulo-Editor${ att }>`;
}
},
preprocessAndDefine(cb, prefix = 'Def') {
cb = cb || (() => {});
modulo.fetchQueue.enqueue(() => {
modulo.util.repeatProcessors(null, prefix + 'Builders', () => {
modulo.util.repeatProcessors(null, prefix + 'Finalizers', cb)
});
}, true); 
},
assert: (value, ...info) => {
if (!value) {  
console.error('%cᵐ°dᵘ⁄o', 'background:red', modulo.id, ...info);
throw new Error(`Assert : "${ Array.from(info).join(' ') }"`);
}
},
bundles: { script: [], style: [], link: [], meta: [],
modscript: [], modstyle: [] },
registry: { bundle: { }, elements: { }, modules: { } },
consts: { WAIT: 900, WAITALL: 901 },
});
modulo.argv = new window.URLSearchParams(window.location.search).getAll('argv');
Object.assign(modulo.registry, { utils: modulo.util, cparts: modulo.part,
coreDefs: modulo.core, processors: modulo.processor }) 
return new modulo.engine.FetchQueue();
}
Modulo.Cores = function CoreDefinitions (modulo) { 
const core = { };
core.Component = class Component { 
static CustomElement (modulo, def, value) {
if (!def.ChildrenNames || def.ChildrenNames.length === 0) {
console.warn('MODULO: Empty ChildrenNames:', def.DefinitionName);
return;
} else if (def.namespace === null || def.alias) { 
def.namespace = def.namespace || def.DefinitionName;
} else if (!def.namespace) { 
def.namespace = modulo.config.namespace || 'x'; 
}
def.name = def.name || def.DefName || def.Name;
def.TagName = `${ def.namespace }-${ def.name }`.toLowerCase();
def.MainRequire = def.DefinitionName;
def.className =  def.className || `${ def.namespace }_${ def.name }`;
def.Code = `const def = modulo.definitions['${ def.DefinitionName }'];
class ${ def.className } extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, ${ def.className });
window.customElements.define(def.TagName, ${ def.className });
return ${ def.className };`.replace(/\n\s+/g, '\n');
}
static BuildLifecycle (modulo, def, value) {
for (const elem of document.querySelectorAll(def.TagName)) {
elem.cparts.component._lifecycle([ value ]); 
}
return true;
}
static AliasNamespace (modulo, def, value) {
const fullAlias = `${ value }-${ def.name }`; 
modulo.config.component.tagAliases[fullAlias] = def.TagName;
}
rerender(original = null) {
if (original) {
if (this.element.originalHTML === null) {
this.element.originalHTML = original.innerHTML;
}
this.element.originalChildren = Array.from(
original.hasChildNodes() ? original.childNodes : []);
}
this._lifecycle([ 'prepare', 'render', 'dom', 'reconcile', 'update' ]);
}
getCurrentRenderObj() {
return (this.element.eventRenderObj || this.element.renderObj ||
this.element.initRenderObj);
}
_lifecycle(lifecycleNames, rObj={ }) {
const renderObj = Object.assign({}, rObj, this.getCurrentRenderObj());
this.element.renderObj = renderObj;
this.runLifecycle(this.element.cparts, renderObj, lifecycleNames);

}
runLifecycle(parts, renderObj, lifecycleNames) {
for (const lifecycleName of lifecycleNames) {
const methodName = lifecycleName + 'Callback';
for (const [ name, obj ] of Object.entries(parts)) {
if (!(methodName in obj)) {
continue;
}
const result = obj[methodName].call(obj, renderObj);
if (result !== undefined) {
renderObj[obj.conf.RenderObj || obj.conf.Name] = result;
}
}
}
}
buildCallback() {
this.element.setAttribute('modulo-mount-html', this.element.originalHTML)
for (const elem of this.element.querySelectorAll('*')) {
for (const name of elem.getAttributeNames()) {
if (!(new RegExp('^[a-z0-9-]+$', 'i').exec(name))) {
elem.removeAttribute(name); 
}
}
}
}
initializedCallback() {
this.modulo.paused = true;
const { newNode } = this.modulo.util;
const html = this.element.getAttribute('modulo-mount-html'); 
this._mountRival = html === null ? this.element : newNode(html);
this.element.originalHTML = html === null ? this.element.innerHTML : html;
this.resolver = new this.modulo.engine.ValueResolver(this.modulo);
this.reconciler = new this.modulo.engine.DOMReconciler(this.modulo);
for (const part of Object.values(this.element.cparts)) { 
this.reconciler.registerDirectives(part, part.conf);
}
}
mountCallback() { 
this.rerender(this._mountRival); 
delete this._mountRival; 
this.element.isMounted = true; 
}
prepareCallback() {
return { 
originalHTML: this.element.originalHTML, 
id: this.id, 
innerHTML: null, 
innerDOM: null, 
patches: null, 
slots: { }, 
};
}
domCallback({ component }) {
let { slots, root, innerHTML, innerDOM } = component;
if (this.attrs.mode === 'regular' || this.attrs.mode === 'vanish') {
root = this.element; 
} else if (this.attrs.mode === 'shadow') {
if (!this.element.shadowRoot) {
this.element.attachShadow({ mode: 'open' });
}
root = this.element.shadowRoot; 
} else if (!root) {
this.modulo.assert(this.attrs.mode === 'custom-root', 'Bad mode')
}
if (innerHTML !== null && !innerDOM) { 
innerDOM = this.modulo.util.newNode(innerHTML);
}
if (innerDOM && this.attrs.mode !== 'shadow') {
for (const elem of this.element.originalChildren) {
const name = (elem.getAttribute && elem.getAttribute('slot')) || '';
elem.remove(); 
if (!(name in slots)) {
slots[name] = [ elem ]; 
} else {
slots[name].push(elem); 
}
}
}
return { root, innerHTML, innerDOM, slots };
}
reconcileCallback({ component }) {
let { innerHTML, innerDOM, patches, root, slots } = component;
if (innerDOM) {
this.reconciler.patches = []; 
this.reconciler.reconcileChildren(root, innerDOM, slots);
patches = this.reconciler.patches;
}
return { patches, innerHTML }; 
}
updateCallback({ component }) {
this.modulo.paused = false; 
if (component.patches) {
this.reconciler.applyPatches(component.patches);
}
if (this.attrs.mode === 'vanish') {
this.element.replaceWith(...this.element.childNodes);
}
}
handleEvent(func, payload, ev) {
this._lifecycle([ 'event' ]);
func(typeof payload === "undefined" ? ev : payload);
this._lifecycle([ 'eventCleanup' ]);
if (this.attrs.rerender !== 'manual') {
ev.preventDefault(); 
this.element.rerender(); 
}
}
onMount({ el, value, nameSuffix, rawName, listen }) { 
this.modulo.assert(this.resolve(value), `Not found: ${ rawName }=${ value }`);
const getOr = (key, key2) => key2 && el.hasAttribute(key2) ?
getOr(key2) : this.resolve(el.getAttribute(key));
listen = listen ? listen : (ev) => { 
const payload = getOr(nameSuffix + '.payload:', 'payload:')
|| el.getAttribute('payload');
this.handleEvent(this.resolve(value, null, true), payload, ev);
}
el.moduloEvents = el.moduloEvents || {}; 
el.moduloEvents[nameSuffix] = listen;
el.addEventListener(nameSuffix, listen);
}
onUnmount({ el, nameSuffix }) {
el.removeEventListener(nameSuffix, el.moduloEvents[nameSuffix]);
delete el.moduloEvents[nameSuffix];
}
resolve(key, defaultVal, autoBind = false) {
const { ValueResolver } = this.modulo.engine;
const resolver = new ValueResolver(this.getCurrentRenderObj());
let val = resolver.get(key, defaultVal);
if (autoBind && typeof val === 'function' && key.includes(resolver.sep)) {
const parentKey = key.substr(0, key.lastIndexOf(resolver.sep));
val = val.bind(this.resolve(parentKey)); 
}
return val
}
}
 return modulo.util.insObject(core);
} 
var modulo = new Modulo(); 

/* <script src=../Modulo.html></script><script type=f> */

// Example globally executed JavaScript code

console.log('JavaScript Ready! See: static/js/main.js.htm')

modulo.registry.modules.configuration = function configuration (modulo) { 
    // Modify Markdown syntax
    const { md } = modulo.config.syntax;
    modulo.config.syntax.md = [
        md[0],
        // Add in two new example modes, with equals and without
        [ /```([a-z]+)=([a-z]+)\n?(.+?)\n?```/igs,
             '<x-Demo show=ui ui=demo mode="$1" demo="$2" value="$3"></x-Demo>' ],
        [ /```([a-z]*)\n?(.+?)\n?```/igs,
             '<x-Demo ui=code mode="$1" value="$2"></x-Demo>' ],
        ...md.slice(1, md.length),
    ]

    // Configuration script to register showdown and configure markdown 
    if (modulo.DEV) {
        const content = modulo.stores.CACHE.getItem(modulo.filePath)
        if (content) { // Viewing a content file, mount Page, save as "global.page"
            modulo.page = modulo.contentType.MD(content)
            modulo.fetchQueue.enqueue(() => { // loads default viewer
                document.body.innerHTML = '<x-Page>'
            })
        }
    }
}
modulo.registry.modules.x_WordArt3D = function x_WordArt3D (modulo) { const def = modulo.definitions['x_WordArt3D'];
class x_WordArt3D extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_WordArt3D);
window.customElements.define(def.TagName, x_WordArt3D);
return x_WordArt3D;}
modulo.registry.modules.x_Downloads = function x_Downloads (modulo) { const def = modulo.definitions['x_Downloads'];
class x_Downloads extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_Downloads);
window.customElements.define(def.TagName, x_Downloads);
return x_Downloads;}
modulo.registry.modules.x_AbstractArt3D = function x_AbstractArt3D (modulo) { const def = modulo.definitions['x_AbstractArt3D'];
class x_AbstractArt3D extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_AbstractArt3D);
window.customElements.define(def.TagName, x_AbstractArt3D);
return x_AbstractArt3D;}
modulo.registry.modules.x_Demo = function x_Demo (modulo) { const def = modulo.definitions['x_Demo'];
class x_Demo extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_Demo);
window.customElements.define(def.TagName, x_Demo);
return x_Demo;}
modulo.registry.modules.x_PageControls = function x_PageControls (modulo) { const def = modulo.definitions['x_PageControls'];
class x_PageControls extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_PageControls);
window.customElements.define(def.TagName, x_PageControls);
return x_PageControls;}
modulo.registry.modules.x_Page = function x_Page (modulo) { const def = modulo.definitions['x_Page'];
class x_Page extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_Page);
window.customElements.define(def.TagName, x_Page);
return x_Page;}
modulo.registry.modules.x_WordArt3D_template = function x_WordArt3D_template (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<h2 style=\"");
OUT.push(G.filters.escape(CTX.props.hstyle));
OUT.push("\n    text-shadow:\n        2px 2px 2px black\n    ");
var ARR0=CTX.script.shadows;for (var KEY in ARR0) {CTX.index=KEY;CTX.shadow=ARR0[KEY];
OUT.push("\n      ,");
OUT.push(G.filters.escape(G.filters["multiply"](CTX.index,CTX.state.angle1)));
OUT.push("px ");
OUT.push(G.filters.escape(G.filters["multiply"](CTX.index,CTX.state.angle1)));
OUT.push("px 0 ");
OUT.push(G.filters.escape(CTX.shadow));
OUT.push("\n      ,");
OUT.push(G.filters.escape(G.filters["multiply"](CTX.index,CTX.state.angle2)));
OUT.push("px ");
OUT.push(G.filters.escape(G.filters["multiply"](CTX.index,CTX.state.angle2)));
OUT.push("px 5px #00000022\n    ");
}
OUT.push(";\n  \">");
if (CTX.props.pagectl) {
OUT.push(G.filters.escape(G.filters["get"](CTX.pagectls,CTX.props.pagectl)));
} else {
OUT.push(G.filters.escape(G.filters["safe"](G.filters["syntax"](CTX.props.text,"md"))));
}
OUT.push("</h2>");

return OUT.join(""); };}
modulo.registry.modules.x_WordArt3D_script = function x_WordArt3D_script (modulo) { 
    function prepareCallback() {
        const color = pagectls.themecolor || "#b90183"
        const black = "black"
        const shadowSet = [ black, black, color, color, black, color, color, color, black ]
        let shadows = [ ]
        let count = pagectls.themeshadows || 0
        while (count-- > 0) {
            shadows = shadows.concat(shadowSet)
        }
        return { shadows }
    }
var pagectls;return{_setLocal:function(o){pagectls=o.pagectls}, "prepareCallback":typeof prepareCallback !=="undefined"?prepareCallback:undefined}}
modulo.registry.modules.x_Downloads_template = function x_Downloads_template (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<p style=\"text-align:center\"><strong>NPM:</strong> <tt style=\"background:var(--bg);color:var(--fg)\">npx create-modulo</tt></p>\n\n<div style=\"display:flex\">\n    ");
var ARR0=CTX.staticdata;for (var KEY in ARR0) {CTX. obj=ARR0[KEY];
OUT.push("\n    <p style=\"margin-top:30px;font-size:20px;text-align:center;width:300px\"><a href=\"");
if (CTX.obj.path) {
OUT.push("https://unpkg.com/create-modulo@");
OUT.push(G.filters.escape(CTX.state.createModuloModuloVersion));
OUT.push("/");
OUT.push(G.filters.escape(CTX.obj.path));
} else {
OUT.push(G.filters.escape(CTX.obj.url));
}
OUT.push("\" download=\"");
OUT.push(G.filters.escape(CTX.obj.file));
OUT.push("\">\n        <span style=\"font-size: 400%; background: #aaa\" alt=\"");
OUT.push(G.filters.escape(CTX.obj.alt));
OUT.push("\">");
OUT.push(G.filters.escape(CTX.obj.icon));
OUT.push("</span><br>\n        <span style=\"font-size: 15px; color: var(--fg)\"><tt>");
OUT.push(G.filters.escape(CTX.obj.file));
OUT.push("<br>(");
OUT.push(G.filters.escape(CTX.obj.size));
OUT.push(")</tt></span></a></p>\n    ");
}
OUT.push("\n</div>\n\n<p style=\"text-align:center\"><strong>Hint:</strong> Download an above file to\nstart a new Modulo project.</p>");

return OUT.join(""); };}
modulo.registry.modules.x_AbstractArt3D_template = function x_AbstractArt3D_template (modulo) { return function (CTX, G) { var OUT=[];
if(1){CTX.fill1 =G.filters["default"](CTX.state.themecolor,CTX.props.fill1);

OUT.push("\n<svg style=\"");
OUT.push(G.filters.escape(CTX.props.style));
OUT.push("\" width=\"");
OUT.push(G.filters.escape(CTX.props.width));
OUT.push("\" height=\"");
OUT.push(G.filters.escape(CTX.props.height));
OUT.push("\" viewBox=\"");
OUT.push(G.filters.escape(CTX.props.viewbox));
OUT.push("\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">\n<svg xmlns=\"http://www.w3.org/2000/svg\">\n <g transform=\"translate(.2601 -55.68)\" stroke=\"");
OUT.push(G.filters.escape(CTX.props.stroke));
OUT.push("\" stroke-dashoffset=\"39.68\">\n  <g stroke-linecap=\"square\">\n   <path d=\"m44.65 98.63a8.035 8.035 0 0 1-10.98 2.941 8.035 8.035 0 0 1-2.941-10.98 8.035 8.035 0 0 1 10.98-2.941 8.035 8.035 0 0 1 2.941 10.98z\" fill=\"");
OUT.push(G.filters.escape(CTX.fill1));
OUT.push("\" stroke-linejoin=\"bevel\" stroke-width=\".8035\" style=\"paint-order:stroke fill markers\"></path>\n   <g transform=\"matrix(.4922 .2842 -.2842 .4922 29.72 24.73)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linejoin=\"round\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m87.07 88.66 10.35-7.293v13.22l-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16v12.88l10.98 4.438v-11.82z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748 11.37 6.95-10.35 7.293z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 96.04 9.958-7.066 11.37 5.614-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m86.05 74.42v14.56l11.37 5.614v-13.22z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748v14.56l-9.958 7.066z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n   <path d=\"m62.66 96.22a8.405 8.405 45 0 1-11.48 3.077 8.405 8.405 45 0 1-3.077-11.48 8.405 8.405 45 0 1 11.48-3.077 8.405 8.405 45 0 1 3.077 11.48z\" fill=\"");
OUT.push(G.filters.escape(CTX.fill1));
OUT.push("\" stroke-linejoin=\"bevel\" stroke-width=\".7389\" style=\"paint-order:stroke fill markers\"></path>\n  </g>\n  <g transform=\"matrix(.4922 .2842 -.2842 .4922 29.72 24.73)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linecap=\"round\" stroke-linejoin=\"bevel\" stroke-width=\"1.5\" style=\"paint-order:stroke fill markers\">\n   <path d=\"m112.5 71.22 15.7-10.69v19.38l-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n   <path d=\"m95.83 63.17v18.87l16.66 6.505v-17.32z\" style=\"paint-order:stroke fill markers\"></path>\n   <path d=\"m95.83 63.17 15.11-12.82 17.25 10.19-15.7 10.69z\" style=\"paint-order:stroke fill markers\"></path>\n   <path d=\"m95.83 82.04 15.11-10.36 17.25 8.227-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n   <path d=\"m110.9 50.34v21.34l17.25 8.227v-19.38z\" style=\"paint-order:stroke fill markers\"></path>\n   <path d=\"m95.83 63.17 15.11-12.82v21.34l-15.11 10.36z\" style=\"paint-order:stroke fill markers\"></path>\n  </g>\n  <g stroke-linecap=\"square\">\n   <path d=\"m84.18 96.05a10.66 10.65 30 0 1-14.56 3.897 10.66 10.65 30 0 1-3.905-14.56 10.66 10.65 30 0 1 14.56-3.897 10.66 10.65 30 0 1 3.905 14.56z\" fill=\"");
OUT.push(G.filters.escape(CTX.fill1));
OUT.push("\" stroke-linejoin=\"bevel\" stroke-width=\"1.066\" style=\"paint-order:stroke fill markers\"></path>\n   <g transform=\"matrix(.9415 .5436 -.5433 .941 52.9 -41.09)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linejoin=\"round\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m87.07 88.66 10.35-7.293v13.22l-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16v12.88l10.98 4.438v-11.82z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748 11.37 6.95-10.35 7.293z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 96.04 9.958-7.066 11.37 5.614-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m86.05 74.42v14.56l11.37 5.614v-13.22z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748v14.56l-9.958 7.066z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n   <path d=\"m115.9 95.61a16.08 16.07 30 0 1-21.96 5.877 16.08 16.07 30 0 1-5.89-21.96 16.08 16.07 30 0 1 21.96-5.877 16.08 16.07 30 0 1 5.89 21.96z\" fill=\"");
OUT.push(G.filters.escape(CTX.fill1));
OUT.push("\" stroke-linejoin=\"bevel\" stroke-width=\"1.413\" style=\"paint-order:stroke fill markers\"></path>\n  </g>\n  <g stroke-linejoin=\"bevel\">\n   <g transform=\"matrix(.9415 .5436 -.5433 .941 52.9 -41.09)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linecap=\"round\" stroke-width=\"1.5\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m112.5 71.22 15.7-10.69v19.38l-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17v18.87l16.66 6.505v-17.32z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82 17.25 10.19-15.7 10.69z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 82.04 15.11-10.36 17.25 8.227-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m110.9 50.34v21.34l17.25 8.227v-19.38z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82v21.34l-15.11 10.36z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n   <path d=\"m155.2 96.5a22.01 21.99 30 0 1-30.05 8.044 22.01 21.99 30 0 1-8.061-30.05 22.01 21.99 30 0 1 30.05-8.044 22.01 21.99 30 0 1 8.061 30.05z\" fill=\"");
OUT.push(G.filters.escape(CTX.fill1));
OUT.push("\" stroke-linecap=\"square\" stroke-width=\"1.934\" style=\"paint-order:stroke fill markers\"></path>\n   <g transform=\"matrix(1.289 .744 -.7436 1.288 68.92 -90.6)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linecap=\"round\" stroke-width=\"1.5\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m112.5 71.22 15.7-10.69v19.38l-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17v18.87l16.66 6.505v-17.32z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82 17.25 10.19-15.7 10.69z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 82.04 15.11-10.36 17.25 8.227-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m110.9 50.34v21.34l17.25 8.227v-19.38z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82v21.34l-15.11 10.36z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n  </g>\n  <g transform=\"matrix(.4922 .2842 .2842 -.4922 -62.37 183.6)\">\n   <g transform=\"matrix(.9341 0 0 .9341 6.477 126.3)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linecap=\"square\" stroke-linejoin=\"round\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m87.07 88.66 10.35-7.293v13.22l-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16v12.88l10.98 4.438v-11.82z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748 11.37 6.95-10.35 7.293z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 96.04 9.958-7.066 11.37 5.614-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m86.05 74.42v14.56l11.37 5.614v-13.22z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748v14.56l-9.958 7.066z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n   <path d=\"m112.1 201a13.81 13.81 0 0 1-13.81 13.81 13.81 13.81 0 0 1-13.81-13.81 13.81 13.81 0 0 1 13.81-13.81 13.81 13.81 0 0 1 13.81 13.81z\" fill=\"");
OUT.push(G.filters.escape(CTX.fill1));
OUT.push("\" stroke-linecap=\"square\" stroke-linejoin=\"bevel\" stroke-width=\"1.214\" style=\"paint-order:stroke fill markers\"></path>\n   <g transform=\"matrix(.9341 0 0 .9341 6.477 126.3)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linecap=\"round\" stroke-linejoin=\"bevel\" stroke-width=\"1.5\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m112.5 71.22 15.7-10.69v19.38l-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17v18.87l16.66 6.505v-17.32z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82 17.25 10.19-15.7 10.69z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 82.04 15.11-10.36 17.25 8.227-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m110.9 50.34v21.34l17.25 8.227v-19.38z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82v21.34l-15.11 10.36z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n   <g transform=\"matrix(-.9341 0 0 -.9341 139.4 321)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linecap=\"square\" stroke-linejoin=\"round\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m87.07 88.66 10.35-7.293v13.22l-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16v12.88l10.98 4.438v-11.82z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748 11.37 6.95-10.35 7.293z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 96.04 9.958-7.066 11.37 5.614-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m86.05 74.42v14.56l11.37 5.614v-13.22z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748v14.56l-9.958 7.066z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n   <path d=\"m33.76 246.3a13.81 13.81 0 0 1 13.81-13.81 13.81 13.81 0 0 1 13.81 13.81 13.81 13.81 0 0 1-13.81 13.81 13.81 13.81 0 0 1-13.81-13.81z\" fill=\"");
OUT.push(G.filters.escape(CTX.fill1));
OUT.push("\" stroke-linecap=\"square\" stroke-linejoin=\"bevel\" stroke-width=\"1.214\" style=\"paint-order:stroke fill markers\"></path>\n   <g transform=\"matrix(-.9341 0 0 -.9341 139.4 321)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linecap=\"round\" stroke-linejoin=\"bevel\" stroke-width=\"1.5\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m112.5 71.22 15.7-10.69v19.38l-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17v18.87l16.66 6.505v-17.32z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82 17.25 10.19-15.7 10.69z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 82.04 15.11-10.36 17.25 8.227-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m110.9 50.34v21.34l17.25 8.227v-19.38z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82v21.34l-15.11 10.36z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n   <g transform=\"matrix(-.9341 0 0 .9341 138.5 130.7)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linecap=\"square\" stroke-linejoin=\"round\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m87.07 88.66 10.35-7.293v13.22l-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16v12.88l10.98 4.438v-11.82z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748 11.37 6.95-10.35 7.293z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 96.04 9.958-7.066 11.37 5.614-10.35 5.891z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m86.05 74.42v14.56l11.37 5.614v-13.22z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m76.09 83.16 9.958-8.748v14.56l-9.958 7.066z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n   <path d=\"m32.89 205.4a13.81 13.81 0 0 0 13.81 13.81 13.81 13.81 0 0 0 13.81-13.81 13.81 13.81 0 0 0-13.81-13.81 13.81 13.81 0 0 0-13.81 13.81z\" fill=\"");
OUT.push(G.filters.escape(CTX.fill1));
OUT.push("\" stroke-linecap=\"square\" stroke-linejoin=\"bevel\" stroke-width=\"1.214\" style=\"paint-order:stroke fill markers\"></path>\n   <g transform=\"matrix(-.9341 0 0 .9341 138.5 130.7)\" fill=\"");
OUT.push(G.filters.escape(CTX.props.fill2));
OUT.push("\" fill-rule=\"evenodd\" stroke-linecap=\"round\" stroke-linejoin=\"bevel\" stroke-width=\"1.5\" style=\"paint-order:stroke fill markers\">\n    <path d=\"m112.5 71.22 15.7-10.69v19.38l-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17v18.87l16.66 6.505v-17.32z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82 17.25 10.19-15.7 10.69z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 82.04 15.11-10.36 17.25 8.227-15.7 8.633z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m110.9 50.34v21.34l17.25 8.227v-19.38z\" style=\"paint-order:stroke fill markers\"></path>\n    <path d=\"m95.83 63.17 15.11-12.82v21.34l-15.11 10.36z\" style=\"paint-order:stroke fill markers\"></path>\n   </g>\n  </g>\n </g>\n</svg>\n");
}
OUT.push("\n</svg>");

return OUT.join(""); };}
modulo.registry.modules.x_Demo_template = function x_Demo_template (modulo) { return function (CTX, G) { var OUT=[];
if (CTX.props.show === "ui") {
OUT.push("\n<select style=\"\" state.bind=\"\" name=\"ui\">\n    ");
var ARR1=CTX.state.tools;for (var KEY in ARR1) {CTX. tool=ARR1[KEY];
OUT.push("\n        <option value=\"");
OUT.push(G.filters.escape(CTX.tool));
OUT.push("\">🗎 ");
OUT.push(G.filters.escape(G.filters["upper"](CTX.tool)));
OUT.push("</option>\n    ");
}
OUT.push("\n</select>\n");
}
OUT.push("\n");
if(1){CTX.v =G.filters["default"](CTX.state.value,"");

OUT.push("\n");
if(1){CTX.hg =G.filters["multiply"](G.filters["multiply"](G.filters["length"](G.filters["lines"](CTX.v)),CTX.props.font),"1.5");

OUT.push("\n");
OUT.push("\n");
if (("code,edit").includes ? ("code,edit").includes(CTX.state.ui) : (CTX.state.ui in "code,edit")) {
OUT.push("\n<x-demo-grid>\n<x-demo-editwrap>\n<pre style=\"\n    background:var(--bg);\n    height:");
OUT.push(G.filters.escape(CTX.hg));
OUT.push("px;\n    font-size:");
OUT.push(G.filters.escape(CTX.props.font));
OUT.push("px;\n    padding: 0 0 0 ");
OUT.push(G.filters.escape(G.filters["add"](CTX.state.numWidth,3)));
OUT.push("px\"><modulo-line></modulo-line>");
OUT.push(G.filters.escape(G.filters["safe"](G.filters["syntax"](CTX.v,CTX.props.mode))));
OUT.push("</pre><textarea state.bind=\"\" name=\"value\" style=\"\n        top:-2px;\n        position:absolute;\n        left:");
OUT.push(G.filters.escape(CTX.state.numWidth));
OUT.push("px;\n        height:");
OUT.push(G.filters.escape(CTX.hg));
OUT.push("px;\n        font-size:");
OUT.push(G.filters.escape(CTX.props.font));
OUT.push("px;\n    \" ");
OUT.push(G.filters.escape(G.filters["yesno"](G.filters["allow"](CTX.state.ui,"code"),"readonly,")));
OUT.push("=\"\" spellcheck=\"false\"></textarea>\n</x-demo-editwrap>\n");
}
OUT.push("\n");
if (("demo,edit").includes ? ("demo,edit").includes(CTX.state.ui) : (CTX.state.ui in "demo,edit")) {
OUT.push("\n    ");
if(1){CTX.dname =G.filters["add"]("demo_",CTX.props.demo);

OUT.push("\n    ");
if(1){CTX.tmplt =G.filters["get"](CTX.local,CTX.dname);

OUT.push("\n        ");
if (CTX.tmplt) {
if (CTX.global.COMMAND) {
OUT.push("<iframe srcdoc=\" \"></iframe>");
} else {
OUT.push("\n        <iframe style=\"height:");
OUT.push(G.filters.escape(CTX.hg));
OUT.push("px;\" srcdoc=\"");
OUT.push(G.filters.escape(G.filters["add"](G.filters["renderas"](CTX.state,CTX.tmplt),"")));
OUT.push("\" loading=\"lazy\"></iframe>\n        ");
}
} else {
OUT.push("\n        <strong style=\"color:red\">Error: ");
OUT.push(G.filters.escape(CTX.dname));
OUT.push(" not found</strong>\n        ");
}
OUT.push("\n    ");
}
OUT.push("\n    ");
}
OUT.push("\n");
}
OUT.push("\n</x-demo-grid>\n");
}
OUT.push("\n");
}

return OUT.join(""); };}
modulo.registry.modules.x_Demo_demo_embed = function x_Demo_demo_embed (modulo) { return function (CTX, G) { var OUT=[];
OUT.push(G.filters.escape(G.filters["safe"](G.filters["trim"](CTX.value))));

return OUT.join(""); };}
modulo.registry.modules.x_Demo_demo_markdown = function x_Demo_demo_markdown (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<script src=https://modu.lol></script><script type=md>---\ntitle:Example Markdown\n---\n");
OUT.push(G.filters.escape(G.filters["safe"](G.filters["trim"](CTX.value))));

return OUT.join(""); };}
modulo.registry.modules.x_Demo_demo_component = function x_Demo_demo_component (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<script src=https://modu.lol></script>\n<template Modulo>\n    <Component name=App>\n        ");
OUT.push(G.filters.escape(G.filters["safe"](G.filters["trim"](CTX.value))));
OUT.push("\n    </Component>\n</template>\n<x-App></x-App>\n<script>window.onerror = function(msg, url, ln) {\ndocument.body.innerHTML += `<p style=color:red>${ msg }</p>`\nwindow.onerror = null // only do once\n}</script>");

return OUT.join(""); };}
modulo.registry.modules.x_Demo_demo_greetex = function x_Demo_demo_greetex (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<script src=https://modu.lol></script>\n<template Modulo>\n    <Component name=HtmlIs mode=vanish>\n        ");
OUT.push(G.filters.escape(G.filters["safe"](G.filters["trim"](CTX.value))));
OUT.push("\n    </Component>\n</template>\n<x-HtmlIs><strong>powerful</strong></x-HtmlIs>\n<x-HtmlIs><em>easy-to-learn</em></x-HtmlIs>");

return OUT.join(""); };}
modulo.registry.modules.x_PageControls_template = function x_PageControls_template (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<div style=\"text-align: right; margin-top: 15px\">\n        <input id=\"theme_id_slider\" style=\"width: 80px\" type=\"range\" min=\"1\" max=\"3\" step=\"1\" value=\"1\" name=\"themenum\" state.bind.input=\"\">\n    </div>\n    <div class=\"page-toolbar\" style=\"display: flex\">\n        ");
if (CTX.state.themenum === 3) {
OUT.push("\n        ");
var ARR1=CTX.state.widgets;for (var KEY in ARR1) {CTX. widg=ARR1[KEY];
OUT.push("\n            <input type=\"color\" name=\"");
OUT.push(G.filters.escape(CTX.widg));
OUT.push("\" title=\"");
OUT.push(G.filters.escape(G.filters["upper"](G.filters["trim"](CTX.widg,"theme,"))));
OUT.push("\" state.bind=\"\">\n        ");
}
OUT.push("\n        <input type=\"range\" min=\"0\" max=\"4\" step=\"1\" value=\"1\" name=\"themeshadows\" title=\"Word art effect\" state.bind.input=\"\">\n        <button on.click=\"script.reset\"><span alt=\"Reset Arrow\" title=\"Reset\"> ↶ </span></button>\n        ");
}
OUT.push("\n        <label for=\"theme_id_slider\"><span style=\"font-size:20px;font-family:monospace\"><span title=\"Default\" on.click=\"script.set1\">◐&nbsp;</span><span title=\"Invert\" on.click=\"script.set2\">&nbsp;◑&nbsp;</span><span title=\"Custom\" on.click=\"script.set3\">&nbsp;✱</span></span></label>\n    </div>");

return OUT.join(""); };}
modulo.registry.modules.x_PageControls_script = function x_PageControls_script (modulo) { 
    const KEY = 'modulo-website-theme-preferences';
    let defaults = null;
    function set1() {
        state.themenum = 1
    }
    function set2() {
        state.themenum = 2
    }
    function set3() {
        state.themenum = 3
    }
    
    function reset() { // save defaults back into
        Object.assign(state, JSON.parse(defaults))
        localStorage.setItem(KEY, defaults)
    }


    function prepareCallback() {
        if (!state.loaded) {
            // stash defaults, and restore from localStorage if applicable
            defaults = JSON.stringify(state)
            Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}'))
        }
        state.loaded = true
        if (state.themenum < 3) { // reset
            state.themecolor = "#b90183"
            state.themeshadows = 1
        }
    }

    function updateCallback() {
        // Copy settings to body
        let s = ''
        if (state.themenum === 2) { // swap
            s = `
                --fg: var(--fg-inv);
                --fg-shading: var(--fg-inv-shading);
                --bg: var(--bg-inv);
                --bg-semi: var(--bg-inv-semi);
            `;
        } else if (state.themenum === 3) { // use color
            s = `
                --color: ${ state.themecolor };
                --fg: ${ state.themefg };
                --bg: ${ state.themebg };
                --bg-semi: ${ state.themebgsemi };
                --fg-shading: ${ state.themefgsemi };
            `;
        }
        // save to localStorage
        localStorage.setItem(KEY, JSON.stringify(state))
        document.body.setAttribute('style', s)
    }
var state,style,ref;return{_setLocal:function(o){state=o.state;style=o.style;ref=o.ref}, "set1":typeof set1 !=="undefined"?set1:undefined,"set2":typeof set2 !=="undefined"?set2:undefined,"set3":typeof set3 !=="undefined"?set3:undefined,"reset":typeof reset !=="undefined"?reset:undefined,"prepareCallback":typeof prepareCallback !=="undefined"?prepareCallback:undefined,"updateCallback":typeof updateCallback !=="undefined"?updateCallback:undefined}}
modulo.registry.modules.x_Page_template = function x_Page_template (modulo) { return function (CTX, G) { var OUT=[];
if (CTX.global.page) {
OUT.push("\n        <meta charset=\"utf8\">\n        <title>");
OUT.push(G.filters.escape(CTX.global.page.page_title));
OUT.push("</title>\n        ");
if (CTX.global.page.extra_style) {
OUT.push("\n            <style>");
OUT.push(G.filters.escape(CTX.global.page.extra_style));
OUT.push("</style>\n        ");
}
OUT.push("\n    ");
}
OUT.push("\n    <nav class=\"page-nav\">\n        <ul>\n            ");
var ARR0=CTX.global.definitions.contentlist.data;for (var KEY in ARR0) {CTX. row=ARR0[KEY];
OUT.push("\n                ");
if (G.filters["get"](CTX.row,2)) {
OUT.push("\n                <li><a class=\"nav-link--");
OUT.push(G.filters.escape(G.filters["lower"](G.filters["trim"](G.filters["get"](CTX.row,1)))));
OUT.push("\" href=\"");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,0)));
OUT.push("\" title=\"");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,1)));
OUT.push("\">");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,2)));
OUT.push("</a></li>\n                ");
} else {
OUT.push("\n                <li><a href=\"");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,0)));
OUT.push("\">");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,1)));
OUT.push("</a></li>\n                ");
}
OUT.push("\n            ");
}
OUT.push("\n            ");
var ARR0=CTX.global.definitions.navlinks.data;for (var KEY in ARR0) {CTX. row=ARR0[KEY];
OUT.push("\n                <li><a style=\"border:none\" href=\"");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,0)));
OUT.push("\">");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,1)));
OUT.push("</a></li>\n            ");
}
OUT.push("\n            \n            <li style=\"margin-left: auto\">\n                <a style=\"padding:3px;\" href=\"https://modu.lol/Modulo.html\" download=\"Modulo.html\">↓ Modulo.html</a>\n                <textarea title=\"Run this command in a terminal to start a new Modulo project\" style=\"background:var(--bg);color:var(--fg);border:none;width:200px;resize:none;font-size:18px;height: 25px\" readonly=\"\">npm init modulo</textarea>\n            </li>\n\n            <li>\n                <x-pagecontrols></x-pagecontrols>\n            </li>\n        </ul>\n    </nav>\n\n    <a class=\"a-hamburger\" href=\"#\">☰</a>\n\n    ");
if (CTX.global.page) {
OUT.push(" ");
if (CTX.global.page.show_splash) {
OUT.push("\n        <div class=\"page-splash\">");
OUT.push(G.filters.escape(G.filters["safe"](G.filters["trimfile"](CTX.page_splash))));
OUT.push("</div>\n    ");
}
OUT.push(" ");
}
OUT.push("\n\n    ");
if (!(CTX.global.page)) {
OUT.push("\n        ");
OUT.push("\n        <slot class=\"");
OUT.push(G.filters.escape(CTX.props.slotclass));
OUT.push("\"></slot>\n    ");
} else {
OUT.push("\n    <div class=\"page-container page--");
if (CTX.global.page) {
OUT.push(G.filters.escape(G.filters["default"](CTX.global.page.theme,"normal")));
}
OUT.push("\">\n        ");
OUT.push("\n        <h1>");
OUT.push(G.filters.escape(G.filters["default"](CTX.global.page.page_title,"")));
OUT.push("</h1>\n        <h4>");
OUT.push(G.filters.escape(G.filters["default"](CTX.global.page.page_author,"")));
OUT.push("</h4>\n\n        ");
OUT.push("\n        ");
if (G.filters["trim"](CTX.global.page.body)) {
OUT.push("\n        <div class=\"markdown-page\">\n            ");
OUT.push(G.filters.escape(G.filters["safe"](G.filters["syntax"](CTX.global.page.body,"md"))));
OUT.push("\n        </div>\n        ");
}
OUT.push("\n\n        ");
OUT.push("\n        ");
if (CTX.global.page.bottomlist === "articles") {
OUT.push("\n        ");
var ARR2=CTX.global.definitions.articlelist.files;for (var KEY in ARR2) {CTX. article=ARR2[KEY];
OUT.push("\n        <article class=\"page-article\">\n            <a class=\"page-article-title u--blocklink\" href=\"");
OUT.push(G.filters.escape(CTX.article.Source));
OUT.push("\">\n                ");
OUT.push(G.filters.escape(CTX.article.page_title));
OUT.push("</a>\n            <p>");
OUT.push(G.filters.escape(CTX.article.desc));
OUT.push("</p>\n        </article>\n        ");
}
OUT.push("\n        ");
}
OUT.push("\n    </div>\n    ");
}
OUT.push("\n    \n    <footer class=\"page-container\" style=\"display: flex;\">\n        <div>\n            <h2>ᵐ°dᵘ⁄o</h2>\n        </div>\n        <ul style=\"display:grid; grid-template-columns: 1fr 1fr; font-size: 1.1rem\">\n            ");
var ARR0=G.filters["combine"](CTX.global.definitions.contentlist.data,CTX.global.definitions.navlinks.data);for (var KEY in ARR0) {CTX. row=ARR0[KEY];
OUT.push("\n                <li><a href=\"");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,0)));
OUT.push("\">");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,1)));
OUT.push("</a></li>\n            ");
}
OUT.push("\n        </ul>\n        <div style=\"margin: auto 10px 10px auto; text-align: right; opacity:0.5\">\n            <p>");
OUT.push(G.filters.escape(CTX.global.config.date));
OUT.push("</p>\n            <p>ᵐ°dᵘ⁄o <em>The Modulo Framework</em> © <tt title=\"Michael Bethencourt\">michaelb</tt></p>\n<pre title=\"It is acceptable to link ('bundle') and distribute the Modulo Framework with other code as long as the LICENSE and NOTICE remains intact.\">NO WARRANTEE OR IMPLIED UTILITY;\nANY MODIFICATIONS OR DERIVATIVES OF\nTHE MODULO FRAMEWORK MUST BE LGPLv3+</pre>\n</div>\n    </footer>");

return OUT.join(""); };}

modulo.definitions = { 




































































modulo: {"Type":"modulo","Parent":null,"DefName":null,"build":{"mainModules":["configuration","_component_Frame","_component_TextEdit","_component_Editor","_component_Page","x_WordArt3D","x_Downloads","x_AbstractArt3D","x_Demo","x_PageControls","x_Page"]},"defaultContent":"<meta charset=utf8><modulo-Page>","fileSelector":"script[type='mdocs'],template[type='mdocs'],style[type='mdocs'],script[type='md'],template[type='md'],script[type='f'],template[type='f'],style[type='f']","scriptSelector":"script[src$='mdu.js'],script[src$='Modulo.js'],script[src='?'],script[src$='Modulo.html']","version":"0.1.0","timeout":5000,"ChildPrefix":"","Contains":"core","DefLoaders":["DefTarget","DefinedAs","Src","Content"],"defaultDef":{"DefTarget":null,"DefinedAs":null,"DefName":null},"defaultDefLoaders":["DefTarget","DefinedAs","DataType","Src"],"defaultDefBuilders":["FilterContent","ContentType","Load"],"Name":"modulo","DefinitionName":"modulo","Source":"file:///home/michaelb/projects/modulo-site/static/","ChildrenNames":["contentlist","buildlist","navlinks","nestedpaths","include","include1","x","configuration"]},

contentlist: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"contentlist","DefinitionName":"contentlist","data":[["index.html"," Modulo"," ᵐ°dᵘ⁄o"],["docs/index.html"," Docs"],["playground.html"," Playground"],["about.html"," About"]],"commands":[" "]},

buildlist: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"buildlist","DefinitionName":"buildlist","data":[["index.html"],["playground.html"],["about.html"]],"commands":["buildall"]},

navlinks: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"navlinks","DefinitionName":"navlinks","data":[["https://codeberg.org/modulo/modulo/","Source (Git)"],["https://www.npmjs.com/package/create-modulo","create-modulo (npmjs)"]],"commands":[" "]},

nestedpaths: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"nestedpaths","DefinitionName":"nestedpaths","data":[["docs"],["news"]],"commands":[" "]},

include: {"Type":"include","Parent":"modulo","Content":"\n    <meta name=\"charset\" charset=\"utf8\">\n    <meta name=\"content-type\" http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <meta name=\"robots\" content=\"index, follow\">\n    <meta name=\"revisit-after\" content=\"30 days\">\n    <script src=\"js/main.js.htm\"></script>\n","DefName":null,"ServerTemplate":"{% for p, v in entries %}<script src=\"https://{{ server }}/{{ v }}\"></script>{% endfor %}","DefLoaders":["DefTarget","DefinedAs","Src","Server","LoadMode"],"Name":"include","DefinitionName":"include"},

include1: {"Type":"include","Parent":"modulo","Content":"\n<style>\n    :root {\n        /* Set site-wide CSS variables here */\n        --color: #B90183;\n        --color-alt: #82d4a444;\n        --fg: #000;\n        --fg-shading: #05051020;\n        --bg: #fff;\n        --bg-semi: #ffffff99;\n        --fg-inv: #fff;\n        --fg-inv-shading: #ffffff20;\n        --bg-inv: #000;\n        --bg-inv-semi: #00000099;\n\n        --page-width: 1000px;\n    }\n\n    @media (prefers-color-scheme: dark) {\n        :root {\n            --color: #B90183;\n            --color-alt: #82d4a444;\n            --fg: #eee;\n            --fg-shading: #ffffff33;\n            --bg: #000;\n            --bg-semi: #00000099;\n            --fg-inv: #000;\n            --fg-inv-shading: #00000020;\n            --bg-inv: #fff;\n            --bg-inv-semi: #ffffff99;\n        }\n    }\n\n    /* Configure misc site-wide base settings */\n    body {\n        background: var(--bg);\n        color: var(--fg);\n        margin: 0;\n        line-height: 1.5;\n    }\n\n    /* To get syntax editors looking better on both themes */\n    modulo-Editor {\n        background: WhiteSmoke;\n        display: block;\n    }\n</style>\n","DefName":null,"ServerTemplate":"{% for p, v in entries %}<script src=\"https://{{ server }}/{{ v }}\"></script>{% endfor %}","DefLoaders":["DefTarget","DefinedAs","Src","Server","LoadMode"],"Name":"include1","DefinitionName":"include1"},

x: {"Type":"library","Parent":"modulo","DefName":null,"Contains":"core","DefLoaders":["DefTarget","DefinedAs","Src","Content"],"namespace":"x","Name":"x","DefinitionName":"x","Source":"file:///home/michaelb/projects/modulo-site/static/components/","ChildrenNames":["x_WordArt3D","x_Downloads","x_AbstractArt3D","x_Demo","x_PageControls","x_Page"]},

configuration: {"Type":"configuration","Parent":"modulo","DefName":null,"DefLoaders":["DefTarget","DefinedAs","Src|SrcSync","Content|Code","DefinitionName|MainRequire"],"Name":"configuration"},

x_WordArt3D: {"Type":"component","Parent":"x","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"WordArt3D","Name":"WordArt3D","DefinitionName":"x_WordArt3D","Source":"file:///home/michaelb/projects/modulo-site/static/components/WordArt3D.html","ChildrenNames":["x_WordArt3D_props","x_WordArt3D_template","x_WordArt3D_state","x_WordArt3D_pagectls","x_WordArt3D_script","x_WordArt3D_style"],"namespace":"x","TagName":"x-wordart3d","className":"x_WordArt3D"},

x_Downloads: {"Type":"component","Parent":"x","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"Downloads","Name":"Downloads","DefinitionName":"x_Downloads","Source":"file:///home/michaelb/projects/modulo-site/static/components/Downloads.html","ChildrenNames":["x_Downloads_props","x_Downloads_template","x_Downloads_state","x_Downloads_staticdata"],"namespace":"x","TagName":"x-downloads","className":"x_Downloads"},

x_AbstractArt3D: {"Type":"component","Parent":"x","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"AbstractArt3D","Name":"AbstractArt3D","DefinitionName":"x_AbstractArt3D","Source":"file:///home/michaelb/projects/modulo-site/static/components/AbstractArt3D.html","ChildrenNames":["x_AbstractArt3D_props","x_AbstractArt3D_state","x_AbstractArt3D_template"],"namespace":"x","TagName":"x-abstractart3d","className":"x_AbstractArt3D"},

x_Demo: {"Type":"component","Parent":"x","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"Demo","Name":"Demo","DefinitionName":"x_Demo","Source":"file:///home/michaelb/projects/modulo-site/static/components/Demo.html","ChildrenNames":["x_Demo_props","x_Demo_state","x_Demo_template","x_Demo_demo_embed","x_Demo_demo_markdown","x_Demo_demo_component","x_Demo_demo_greetex","x_Demo_style"],"namespace":"x","TagName":"x-demo","className":"x_Demo"},

x_PageControls: {"Type":"component","Parent":"x","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"PageControls","Name":"PageControls","DefinitionName":"x_PageControls","Source":"file:///home/michaelb/projects/modulo-site/static/components/PageControls.html","ChildrenNames":["x_PageControls_props","x_PageControls_template","x_PageControls_state","x_PageControls_script","x_PageControls_style"],"namespace":"x","TagName":"x-pagecontrols","className":"x_PageControls"},

x_Page: {"Type":"component","Parent":"x","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"vanish","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"Page","Name":"Page","DefinitionName":"x_Page","Source":"file:///home/michaelb/projects/modulo-site/static/components/Page.html","ChildrenNames":["x_Page_props","x_Page_template","x_Page_style","x_Page_page_splash","x_Page_style1","x_Page_style2"],"namespace":"x","TagName":"x-page","className":"x_Page"},

x_WordArt3D_props: {"Type":"props","Parent":"x_WordArt3D","Content":"","DefName":null,"text":"","pagectl":"","hstyle":"","Name":"props","DefinitionName":"x_WordArt3D_props"},

x_WordArt3D_template: {"Type":"template","Parent":"x_WordArt3D","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"x_WordArt3D_template"},

x_WordArt3D_state: {"Type":"state","Parent":"x_WordArt3D","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":null,"angle1":-1.5,"angle2":1,"shadows":["black","black","#b90183","#b90183","black","#b90183","#b90183","#b90183","black"],"shadows2":["#b90183","#b90183","white","white","white","white","white","white"],"shadows3":["#b90183","#b90183","#ffe45a","#ffe45a","#ffe45a","#b90183","#890153"],"Name":"state","DefinitionName":"x_WordArt3D_state"},

x_WordArt3D_pagectls: {"Type":"state","Parent":"x_WordArt3D","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":"pagectls","Name":"pagectls","DefinitionName":"x_WordArt3D_pagectls"},

x_WordArt3D_script: {"Type":"script","Parent":"x_WordArt3D","DefName":null,"Directives":["refMount","refUnmount"],"DefFinalizers":["AutoExport","Content|Code"],"Name":"script","DefinitionName":"x_WordArt3D_script"},

x_WordArt3D_style: {"Type":"style","Parent":"x_WordArt3D","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-WordArt3D","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"x_WordArt3D_style"},

x_Downloads_props: {"Type":"props","Parent":"x_Downloads","Content":"","DefName":null,"showonly":"","Name":"props","DefinitionName":"x_Downloads_props"},

x_Downloads_template: {"Type":"template","Parent":"x_Downloads","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"x_Downloads_template"},

x_Downloads_state: {"Type":"state","Parent":"x_Downloads","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":null,"createModuloVersion":"1.0.9","Name":"state","DefinitionName":"x_Downloads_state"},

x_Downloads_staticdata: {"Type":"staticdata","Parent":"x_Downloads","DefName":null,"Name":"staticdata","DefinitionName":"x_Downloads_staticdata","data":[{"file":"modulo-starter.zip","size":"~60kb","path":"build/modulo-starter.zip","icon":"📦","alt":"archive icon"},{"file":"modulo-docs.zip","size":"~300kb","url":"https://codeberg.org/modulo/docs/archive/main.zip","icon":"📦","alt":"archive icon"},{"file":"Modulo.html","size":"~99kb","path":"build/starter/static/Modulo.html","icon":"📄","alt":"file icon"}]},

x_AbstractArt3D_props: {"Type":"props","Parent":"x_AbstractArt3D","Content":"","DefName":null,"width":"190.3mm","height":"74.26mm","version":"1.1","viewbox":"0 0 190.3 74.26","fill1":"red","fill2":"#fff","stroke":"#000","Name":"props","DefinitionName":"x_AbstractArt3D_props"},

x_AbstractArt3D_state: {"Type":"state","Parent":"x_AbstractArt3D","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":"pagectls","Name":"state","DefinitionName":"x_AbstractArt3D_state"},

x_AbstractArt3D_template: {"Type":"template","Parent":"x_AbstractArt3D","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"x_AbstractArt3D_template"},

x_Demo_props: {"Type":"props","Parent":"x_Demo","Content":"","DefName":null,"store":"build","mode":"html","font":"17","file":"","ui":"code","demo":"embed","show":"","readonly":"","value":"","Name":"props","DefinitionName":"x_Demo_props"},

x_Demo_state: {"Type":"state","Parent":"x_Demo","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":null,"Init":"props","numWidth":24,"tools":["demo","code","edit"],"Name":"state","DefinitionName":"x_Demo_state"},

x_Demo_template: {"Type":"template","Parent":"x_Demo","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"x_Demo_template"},

x_Demo_demo_embed: {"Type":"template","Parent":"x_Demo","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"demo_embed","DefinitionName":"x_Demo_demo_embed"},

x_Demo_demo_markdown: {"Type":"template","Parent":"x_Demo","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"demo_markdown","DefinitionName":"x_Demo_demo_markdown"},

x_Demo_demo_component: {"Type":"template","Parent":"x_Demo","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"demo_component","DefinitionName":"x_Demo_demo_component"},

x_Demo_demo_greetex: {"Type":"template","Parent":"x_Demo","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"demo_greetex","DefinitionName":"x_Demo_demo_greetex"},

x_Demo_style: {"Type":"style","Parent":"x_Demo","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-Demo","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"x_Demo_style"},

x_PageControls_props: {"Type":"props","Parent":"x_PageControls","Content":"","DefName":null,"showonly":"","Name":"props","DefinitionName":"x_PageControls_props"},

x_PageControls_template: {"Type":"template","Parent":"x_PageControls","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"x_PageControls_template"},

x_PageControls_state: {"Type":"state","Parent":"x_PageControls","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":"pagectls","themecolor":"#b90183","themefg":"#000000","themebg":"#ffffff","themebgsemi":"#ffffff99","themefgsemi":"#05051020","loaded":false,"themenum":1,"themeshadows":1,"widgets":["themecolor","themefg","themebg","themefgsemi","themebgsemi"],"Name":"state","DefinitionName":"x_PageControls_state"},

x_PageControls_script: {"Type":"script","Parent":"x_PageControls","DefName":null,"Directives":["refMount","refUnmount"],"DefFinalizers":["AutoExport","Content|Code"],"Name":"script","DefinitionName":"x_PageControls_script"},

x_PageControls_style: {"Type":"style","Parent":"x_PageControls","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-PageControls","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"x_PageControls_style"},

x_Page_props: {"Type":"props","Parent":"x_Page","Content":"","DefName":null,"slotclass":"","Name":"props","DefinitionName":"x_Page_props"},

x_Page_template: {"Type":"template","Parent":"x_Page","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"x_Page_template"},

x_Page_style: {"Type":"style","Parent":"x_Page","DefName":null,"isolateSelector":[".page-container",".page-content",".page-article",".page-nav a",".page-nav",".page-nav a",".page-article",".page-article-title",".page-article:hover",".u--blocklink",".u--blocklink",".u--container",".u--container > *",".u--flex1",".u--absolute1",".page-nav a:hover",".page-nav a.nav-link--modulo",".page-nav a:active",".page-nav a.nav--selected",".page-nav ul",".page-nav li","a.modulo-logo--alt","a.modulo-logo","a.modulo-logo:hover",".a-hamburger",".page-splash",".page-splash h4",".page-container",".page-nav",".u--flex1",".u--absolute1",".page-nav ul",".page-nav",".a-hamburger"],"isolateClass":"x_Page","prefix":null,"corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"x_Page_style","Source":"file:///home/michaelb/projects/modulo-site/static/components/Page-style.css.htm"},

x_Page_page_splash: {"Type":"staticdata","Parent":"x_Page","DefName":null,"Name":"page_splash","DefinitionName":"x_Page_page_splash","Source":"file:///home/michaelb/projects/modulo-site/static/components/Page-splash.html","data":"<meta charset=utf8><script src=../Modulo.html></script><template type=f>\n\n<div style=\"font-family: sans-serif;\n    box-shadow: 10px 50px 30px 0 inset var(--bg-semi);\n    background: \n        repeating-linear-gradient(\n        to bottom,\n        var(--bg-semi) 0px,\n        var(--bg-semi) 1.5px,\n        #ffffff00 1.5px,\n        #ffffff00 9.3px\n    ),\n    linear-gradient(var(--bg), var(--color-alt)); margin:20px\">\n\n\n<!--<x-WordArt3D text=\"Create with\"></x-WordArt3D>-->\n<div style=\"margin-top:-60px\"></div>\n\n<!-- Main Logo -->\n<x-wordart3d hstyle=\"font-size: 220px; font-family: sans-serif; font-weight: 200;\" text=\"ᵐ°dᵘ⁄o\"></x-wordart3d>\n\n<!-- top part -->\n<div style=\"margin-top:-130px\"></div>\n    <x-abstractart3d style=\"margin: -60px -110px 0 -80px\"></x-abstractart3d>\n\n<div class=\"u--absolute1\">\n    <p style=\"font-family: serif; font-weight: 500; font-size: 25px;\npadding:50px\"><strong><em>An inviting web framework...</em></strong><br>\n<a href=\"https://modulo.codeberg.page/modulo-starter/static/Modulo.html\" download=\"Modulo.html\">Modulo.html</a> is a light and fast web framework. Zero\nset-up or installs means <em>everybody</em> can ramp-up like a pro.</p>\n</div>\n\n    <div style=\"margin: 30px; margin-top:-100px; padding:30px;\n    padding-top:70px;background:var(--bg)\">\n    <div class=\"u--flex1\">\n    <!--<x-AbstractArt3D style=\"margin: -60px -100px 0 -80px\"></x-AbstractArt3D>-->\n\n        <div style=\"margin-right:100px\">\n            <div style=\"margin-top:-50px\"></div>\n            <x-wordart3d text=\"**Markdown**\"></x-wordart3d>\n            <div style=\"margin-top:-10px\"></div>\n            <x-demo mode=\"html\" demo=\"markdown\" ui=\"edit\" value=\"\n#### Show\n\n[Tickets](#buy)\n\nThe *band* is on an\nexciting tour...\"></x-demo>\n\n        </div>\n\n        <div style=\"margin-right:100px\">\n        <div style=\"margin-top:-95px\"></div>\n            <x-wordart3d text=\"HTML/CSS\"></x-wordart3d>\n            <x-demo mode=\"html\" demo=\"greetex\" ui=\"edit\" value=\"&lt;Template&gt;\n  &lt;p&gt;\n    HTML is\n    &lt;slot&gt;&lt;/slot&gt;\n  &lt;/p&gt;\n&lt;/Template&gt;\n\n&lt;Style&gt;\n  p { color: #b08 }\n&lt;/Style&gt;\"></x-demo>\n        </div>\n        <div style=\"margin-right:100px\">\n<div style=\"margin-top:-150px\"></div>\n            <x-wordart3d text=\"**JavaScript**\"></x-wordart3d>\n\n<x-demo mode=\"js\" demo=\"component\" ui=\"edit\" value=\"&lt;Script&gt;\n  function add() {\n    state.count++\n  }\n&lt;/Script&gt;\n\n&lt;State\n  count:=0\n&gt;&lt;/State&gt;\n\n&lt;Template&gt;\n  &lt;button on.click=script.add&gt;\n    Hello {{ state.count }}\n  &lt;/button&gt;\n&lt;/Template&gt;\"></x-demo>\n\n\n        </div>\n\n        <div>\n            <p style=\"font-family:cursive;font-size:30px;opacity:0.5;padding:0;margin:0;\nmargin-right: -200px;width:250px; margin-top:90px; text-align: center\">←<br>Live editors: Try making\nchanges!</p>\n        </div>\n    </div>\n\n</div>\n\n<x-downloads style=\"float:right; max-width:65%; position:relative;z-index:2;\"></x-downloads>\n\n<p style=\"font-family:serif;font-size:25px;\">Modulo (or ᵐ°dᵘ⁄o) is\na single-file frontend framework, squeezing in numerous tools for modern HTML,\nCSS, and JavaScript develpment.  Modulo includes many familiar and handy tools\nfor modern web development, including Web Components, CSS Scoping, Shadow DOM,\nJamstack / SSG / SSR, Markdown-powered CMS, Bundling, Store and State\nManagement, and Templating.</p>\n\n<x-wordart3d text=\"React 🔥_fast_\"></x-wordart3d>\n\n       </div> <!-- close of green -->\n\n\n<x-demo style=\"float:right\" mode=\"html\" demo=\"component\" ui=\"demo\" show=\"ui\" value=\"&lt;Template&gt;\n  &lt;p&gt;&lt;input state.bind name=&quot;text&quot; title=&quot;Message&quot; /&gt;&lt;/p&gt;\n  {% for index, point in state.points %}\n     &lt;label style=&quot;display: inline-block; width: 5%&quot; title=&quot;Point #{{ index }}&quot;&gt;\n        &lt;input state.bind.input name=&quot;points.{{ index }}.1&quot; type=&quot;range&quot; max=&quot;100&quot; min=&quot;0&quot; \n            style=&quot;position: relative; transform: rotate(90deg); left: -60px; top: 60px&quot;&gt;\n      &lt;/label&gt;\n  {% endfor %}\n  &lt;div style=&quot;height: 150px; width:150px; border: 2px solid black; margin-top: 200px&quot;&gt;\n      &lt;svg viewBox=&quot;0 0 100 100&quot; style=&quot;width: 350px; margin-left: -55px; height: 250px;&quot;&gt;\n          &lt;path id=&quot;curve&quot; fill=&quot;transparent&quot; d=&quot;M 10,50 C {{ state.points|join:' ' }}&quot; /&gt;\n          &lt;text&gt;&lt;textPath href=&quot;#curve&quot;&gt;{{ state.text }}&lt;/textPath&gt;&lt;/text&gt;\n      &lt;/svg&gt;\n  &lt;/div&gt;\n&lt;/Template&gt;\n&lt;State\n    text=&quot;Outside the box!&quot;\n    points:=&quot;[ [ 20,40 ], [40,10], [60,40], [80,70], [100,65], [120,90] ]&quot;\n&gt;&lt;/State&gt;\"></x-demo>\n\n\n<div style=\"margin: 30px; padding:30px;background:var(--bg)\">\n    <ul>\n        <li><h4>Reactive Forms with State and Store</h4> Modulo's state\n        subscription and publishing system allows any part of your site to\n        instantly react to changing data.</li>\n\n        <li><h4>Fast Web Components</h4> Modulo's web components use a DOM reconciler to\n        compute minimum number of DOM changes for fast operations.</li>\n\n        <li><h4>Compiled Templates</h4> Modulo's Template Language pre-compiles\n        into JavaScript functions for maximum speed, discarding the source so\n        it requires no further parsing or \"eval\" in production.</li>\n\n        <li><h4>Deep UI Optimization</h4> Modulo is\n        no a keeper of secrets.  Instead, every DOM patch gets exposed before\n        being applied, enabling levels of per-component DOM control\n        unparalleled in other frameworks.</li>\n    </ul>\n     <p><strong>Hint: Try using the \"dark mode\" and \"theme customizer\" switch at the\n      top right of the page for a demonstration of page-wide reactions!</strong></p>\n</div>\n\n\n<x-wordart3d text=\"{% include **everybody** %}\"></x-wordart3d>\n\n<div style=\"margin: 30px; padding:30px;background:var(--bg)\">\n\n\n    <p><strong>No dependencies to include means <em>everybody</em> gets\n        included!</strong></p>\n\n    <ul>\n        <li><h4>Clients will love you</h4>\n        During crucial moments when gathering feedback on in-progress work and\ncreative projects from others --- clients, team-members, bosses, friends,\nfamily, whomever --- it's as easy as zipping up your in-progress folder and\nsending it over. All they need is a web browser and the ability to unzip and\nopen files, and they'll be seeing the same in-progress work as you, no\nmatter their OS, browser, or set-up.</li>\n\n        <li><h4>0-Day onboarding</h4> 0 dependencies means 0 installs means\n        0 setup... which means you and your team will be developing as soon as\n          the fingers hit the keyboard! With  Modulo's <em>actually serverless</em>\n            approach, there's no need for Babel, NPM, Node.js, node_modules,\n        local dev servers, command-line installs, or other \"set-up\"\n        steps to get to work. <strong>Download, unzip, and away we\n        click!</strong></li>\n\n\n        <li><h4>Go off-line; keep your creature comforts</h4> Modulo is one of the only UI and static-site\n        generating framework for developing file-protocol friendly (meaning:\n        \"fully offline\"), dependency-free websites that build into fast,\n        performant sites, with all the modern capabilities we expect in app\n        development.</li>\n\n    </ul>\n\n</div>\n\n<x-wordart3d text=\"One file to  **build** 🏗️  them all\"></x-wordart3d>\n<!--\n<x-Demo style=\"float:right; min-width: 580px;\" mode=html demo=embed ui=demo show=ui\nvalue='<script src=static/Modulo.html></script><script type=md>---\ntitle: Lorem Ipsum\nauthor: Example Author\nextra_style:\n    strong {\n        background: pink;\n    }\ndate: January 1st 2026\n---\n\n\n\n#### A brand new page of content is just one line away\n\n\nAll you need to do is include `Modulo.html` with one line on the top of a file,\nand your project&apos;s components will automatically with styles included.\n\n\n**Hint:** Select **CODE** from the drop-down at the upper-right\ncorner of this box, and examine **Line #1**\n\n\n\n\n\n\n'></x-Demo>\n-->\n\n<div style=\"margin: 30px; padding:30px;background:var(--bg)\">\n    <ul>\n        <li><h4>Building and Bundling</h4> Modulo comes with a built-in\n        build-tool that bundles, trims, and optimizes your JavaScript, CSS, and HTML\n        for near-instant load times without sacrificing capability or\n        interactivity.</li>\n\n        <li><h4>Static Sites with Vanishing Components</h4> Modulo's \"vanish\" component mode\n        enables entirely JavaScript-free static sites. By combining that with\n        inline JavaScript, you can create paradoxically interactive static-sites where your\n        script tags <em>vanish</em> during build!</li>\n\n        <li><h4>Jamstack with Server-Side Rendering</h4> Modulo\n        can be run server-side as well, and it's build command will automatically\n        pre-render or \"dehydrate\" web components, preparing them to be\n        \"re-hydrated\" on page load with JavaScript functionality and fresh API\n        data</li>\n\n        <li><h4>Single File Framework</h4> <a href=\"https://app.unpkg.com/create-modulo@1.0.7/files/build/starter/static/Modulo.html\" download=\"Modulo.html\">Modulo.html</a> is a single file under 2000\n        lines that acts like both an HTML file and JS file rolled into one,\n        tightly-optimized for maximum code re-use and to trim away build-time\n        overhead.</li>\n\n        <li><h4>Literate Code</h4> Modulo.html <em>literally</em> documents\nitself! When viewed in the browser, it provides it's own help menu and\n3 project scaffolding presets. For a demonstration, try opening up <a href=\"https://modu.lol/Modulo.html\">Modulo.html</a> (should work either locally or online).\nTry adding <a href=\"https://modu.lol/Modulo.html?argv=edit\">?argv=edit</a> to\nsee the code displayed side-by-side with the documentation.<p></p>\n    </li></ul>\n</div>\n\n\n\n\n\n"},

x_Page_style1: {"Type":"style","Parent":"x_Page","DefName":null,"isolateSelector":[".page--normal",".page--grid .markdown-page",".page--grid .markdown-page > p",".page--grid .markdown-page > h2"],"isolateClass":"x_Page","prefix":null,"corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style1","DefinitionName":"x_Page_style1"},

x_Page_style2: {"Type":"style","Parent":"x_Page","DefName":null,"isolateSelector":["p","h2[h]","h2[h='#']","h2[h='##']","h2[h='###']","h2[h='#']","h2[h='##']","code","tt","hr"],"isolateClass":"x_Page","prefix":".markdown-page","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style2","DefinitionName":"x_Page_style2"},
 };

modulo.registry.modules.configuration.call(window, modulo);

modulo.registry.modules.x_WordArt3D.call(window, modulo);

modulo.registry.modules.x_Downloads.call(window, modulo);

modulo.registry.modules.x_AbstractArt3D.call(window, modulo);

modulo.registry.modules.x_Demo.call(window, modulo);

modulo.registry.modules.x_PageControls.call(window, modulo);

modulo.registry.modules.x_Page.call(window, modulo);
