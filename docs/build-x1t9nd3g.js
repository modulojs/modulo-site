 
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

/* <script src=../Modulo.html></script><style type=f> */
/*!
  Highlight.js v11.8.0 (git: 65687a907b)
  (c) 2006-2023 undefined and other contributors
  License: BSD-3-Clause
 */
var hljs=function(){"use strict";function e(t){
return t instanceof Map?t.clear=t.delete=t.set=()=>{
throw Error("map is read-only")}:t instanceof Set&&(t.add=t.clear=t.delete=()=>{
throw Error("set is read-only")
}),Object.freeze(t),Object.getOwnPropertyNames(t).forEach((n=>{
const i=t[n],s=typeof i;"object"!==s&&"function"!==s||Object.isFrozen(i)||e(i)
})),t}class t{constructor(e){
void 0===e.data&&(e.data={}),this.data=e.data,this.isMatchIgnored=!1}
ignoreMatch(){this.isMatchIgnored=!0}}function n(e){
return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")
}function i(e,...t){const n=Object.create(null);for(const t in e)n[t]=e[t]
;return t.forEach((e=>{for(const t in e)n[t]=e[t]})),n}const s=e=>!!e.scope
;class o{constructor(e,t){
this.buffer="",this.classPrefix=t.classPrefix,e.walk(this)}addText(e){
this.buffer+=n(e)}openNode(e){if(!s(e))return;const t=((e,{prefix:t})=>{
if(e.startsWith("language:"))return e.replace("language:","language-")
;if(e.includes(".")){const n=e.split(".")
;return[`${t}${n.shift()}`,...n.map(((e,t)=>`${e}${"_".repeat(t+1)}`))].join(" ")
}return`${t}${e}`})(e.scope,{prefix:this.classPrefix});this.span(t)}
closeNode(e){s(e)&&(this.buffer+="</span>")}value(){return this.buffer}span(e){
this.buffer+=`<span class="${e}">`}}const r=(e={})=>{const t={children:[]}
;return Object.assign(t,e),t};class a{constructor(){
this.rootNode=r(),this.stack=[this.rootNode]}get top(){
return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(e){
this.top.children.push(e)}openNode(e){const t=r({scope:e})
;this.add(t),this.stack.push(t)}closeNode(){
if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){
for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}
walk(e){return this.constructor._walk(e,this.rootNode)}static _walk(e,t){
return"string"==typeof t?e.addText(t):t.children&&(e.openNode(t),
t.children.forEach((t=>this._walk(e,t))),e.closeNode(t)),e}static _collapse(e){
"string"!=typeof e&&e.children&&(e.children.every((e=>"string"==typeof e))?e.children=[e.children.join("")]:e.children.forEach((e=>{
a._collapse(e)})))}}class c extends a{constructor(e){super(),this.options=e}
addText(e){""!==e&&this.add(e)}startScope(e){this.openNode(e)}endScope(){
this.closeNode()}__addSublanguage(e,t){const n=e.root
;t&&(n.scope="language:"+t),this.add(n)}toHTML(){
return new o(this,this.options).value()}finalize(){
return this.closeAllNodes(),!0}}function l(e){
return e?"string"==typeof e?e:e.source:null}function g(e){return h("(?=",e,")")}
function u(e){return h("(?:",e,")*")}function d(e){return h("(?:",e,")?")}
function h(...e){return e.map((e=>l(e))).join("")}function f(...e){const t=(e=>{
const t=e[e.length-1]
;return"object"==typeof t&&t.constructor===Object?(e.splice(e.length-1,1),t):{}
})(e);return"("+(t.capture?"":"?:")+e.map((e=>l(e))).join("|")+")"}
function p(e){return RegExp(e.toString()+"|").exec("").length-1}
const b=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./
;function m(e,{joinWith:t}){let n=0;return e.map((e=>{n+=1;const t=n
;let i=l(e),s="";for(;i.length>0;){const e=b.exec(i);if(!e){s+=i;break}
s+=i.substring(0,e.index),
i=i.substring(e.index+e[0].length),"\\"===e[0][0]&&e[1]?s+="\\"+(Number(e[1])+t):(s+=e[0],
"("===e[0]&&n++)}return s})).map((e=>`(${e})`)).join(t)}
const E="[a-zA-Z]\\w*",x="[a-zA-Z_]\\w*",w="\\b\\d+(\\.\\d+)?",y="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",_="\\b(0b[01]+)",O={
begin:"\\\\[\\s\\S]",relevance:0},k={scope:"string",begin:"'",end:"'",
illegal:"\\n",contains:[O]},N={scope:"string",begin:'"',end:'"',illegal:"\\n",
contains:[O]},S=(e,t,n={})=>{const s=i({scope:"comment",begin:e,end:t,
contains:[]},n);s.contains.push({scope:"doctag",
begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0})
;const o=f("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/)
;return s.contains.push({begin:h(/[ ]+/,"(",o,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),s
},v=S("//","$"),M=S("/\\*","\\*/"),R=S("#","$");var j=Object.freeze({
__proto__:null,MATCH_NOTHING_RE:/\b\B/,IDENT_RE:E,UNDERSCORE_IDENT_RE:x,
NUMBER_RE:w,C_NUMBER_RE:y,BINARY_NUMBER_RE:_,
RE_STARTERS_RE:"!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",
SHEBANG:(e={})=>{const t=/^#![ ]*\//
;return e.binary&&(e.begin=h(t,/.*\b/,e.binary,/\b.*/)),i({scope:"meta",begin:t,
end:/$/,relevance:0,"on:begin":(e,t)=>{0!==e.index&&t.ignoreMatch()}},e)},
BACKSLASH_ESCAPE:O,APOS_STRING_MODE:k,QUOTE_STRING_MODE:N,PHRASAL_WORDS_MODE:{
begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
},COMMENT:S,C_LINE_COMMENT_MODE:v,C_BLOCK_COMMENT_MODE:M,HASH_COMMENT_MODE:R,
NUMBER_MODE:{scope:"number",begin:w,relevance:0},C_NUMBER_MODE:{scope:"number",
begin:y,relevance:0},BINARY_NUMBER_MODE:{scope:"number",begin:_,relevance:0},
REGEXP_MODE:{begin:/(?=\/[^/\n]*\/)/,contains:[{scope:"regexp",begin:/\//,
end:/\/[gimuy]*/,illegal:/\n/,contains:[O,{begin:/\[/,end:/\]/,relevance:0,
contains:[O]}]}]},TITLE_MODE:{scope:"title",begin:E,relevance:0},
UNDERSCORE_TITLE_MODE:{scope:"title",begin:x,relevance:0},METHOD_GUARD:{
begin:"\\.\\s*"+x,relevance:0},END_SAME_AS_BEGIN:e=>Object.assign(e,{
"on:begin":(e,t)=>{t.data._beginMatch=e[1]},"on:end":(e,t)=>{
t.data._beginMatch!==e[1]&&t.ignoreMatch()}})});function A(e,t){
"."===e.input[e.index-1]&&t.ignoreMatch()}function I(e,t){
void 0!==e.className&&(e.scope=e.className,delete e.className)}function T(e,t){
t&&e.beginKeywords&&(e.begin="\\b("+e.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",
e.__beforeBegin=A,e.keywords=e.keywords||e.beginKeywords,delete e.beginKeywords,
void 0===e.relevance&&(e.relevance=0))}function L(e,t){
Array.isArray(e.illegal)&&(e.illegal=f(...e.illegal))}function B(e,t){
if(e.match){
if(e.begin||e.end)throw Error("begin & end are not supported with match")
;e.begin=e.match,delete e.match}}function P(e,t){
void 0===e.relevance&&(e.relevance=1)}const D=(e,t)=>{if(!e.beforeMatch)return
;if(e.starts)throw Error("beforeMatch cannot be used with starts")
;const n=Object.assign({},e);Object.keys(e).forEach((t=>{delete e[t]
})),e.keywords=n.keywords,e.begin=h(n.beforeMatch,g(n.begin)),e.starts={
relevance:0,contains:[Object.assign(n,{endsParent:!0})]
},e.relevance=0,delete n.beforeMatch
},H=["of","and","for","in","not","or","if","then","parent","list","value"],C="keyword"
;function $(e,t,n=C){const i=Object.create(null)
;return"string"==typeof e?s(n,e.split(" ")):Array.isArray(e)?s(n,e):Object.keys(e).forEach((n=>{
Object.assign(i,$(e[n],t,n))})),i;function s(e,n){
t&&(n=n.map((e=>e.toLowerCase()))),n.forEach((t=>{const n=t.split("|")
;i[n[0]]=[e,U(n[0],n[1])]}))}}function U(e,t){
return t?Number(t):(e=>H.includes(e.toLowerCase()))(e)?0:1}const z={},W=e=>{
console.error(e)},X=(e,...t)=>{console.log("WARN: "+e,...t)},G=(e,t)=>{
z[`${e}/${t}`]||(console.log(`Deprecated as of ${e}. ${t}`),z[`${e}/${t}`]=!0)
},K=Error();function F(e,t,{key:n}){let i=0;const s=e[n],o={},r={}
;for(let e=1;e<=t.length;e++)r[e+i]=s[e],o[e+i]=!0,i+=p(t[e-1])
;e[n]=r,e[n]._emit=o,e[n]._multi=!0}function Z(e){(e=>{
e.scope&&"object"==typeof e.scope&&null!==e.scope&&(e.beginScope=e.scope,
delete e.scope)})(e),"string"==typeof e.beginScope&&(e.beginScope={
_wrap:e.beginScope}),"string"==typeof e.endScope&&(e.endScope={_wrap:e.endScope
}),(e=>{if(Array.isArray(e.begin)){
if(e.skip||e.excludeBegin||e.returnBegin)throw W("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),
K
;if("object"!=typeof e.beginScope||null===e.beginScope)throw W("beginScope must be object"),
K;F(e,e.begin,{key:"beginScope"}),e.begin=m(e.begin,{joinWith:""})}})(e),(e=>{
if(Array.isArray(e.end)){
if(e.skip||e.excludeEnd||e.returnEnd)throw W("skip, excludeEnd, returnEnd not compatible with endScope: {}"),
K
;if("object"!=typeof e.endScope||null===e.endScope)throw W("endScope must be object"),
K;F(e,e.end,{key:"endScope"}),e.end=m(e.end,{joinWith:""})}})(e)}function V(e){
function t(t,n){
return RegExp(l(t),"m"+(e.case_insensitive?"i":"")+(e.unicodeRegex?"u":"")+(n?"g":""))
}class n{constructor(){
this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}
addRule(e,t){
t.position=this.position++,this.matchIndexes[this.matchAt]=t,this.regexes.push([t,e]),
this.matchAt+=p(e)+1}compile(){0===this.regexes.length&&(this.exec=()=>null)
;const e=this.regexes.map((e=>e[1]));this.matcherRe=t(m(e,{joinWith:"|"
}),!0),this.lastIndex=0}exec(e){this.matcherRe.lastIndex=this.lastIndex
;const t=this.matcherRe.exec(e);if(!t)return null
;const n=t.findIndex(((e,t)=>t>0&&void 0!==e)),i=this.matchIndexes[n]
;return t.splice(0,n),Object.assign(t,i)}}class s{constructor(){
this.rules=[],this.multiRegexes=[],
this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(e){
if(this.multiRegexes[e])return this.multiRegexes[e];const t=new n
;return this.rules.slice(e).forEach((([e,n])=>t.addRule(e,n))),
t.compile(),this.multiRegexes[e]=t,t}resumingScanAtSamePosition(){
return 0!==this.regexIndex}considerAll(){this.regexIndex=0}addRule(e,t){
this.rules.push([e,t]),"begin"===t.type&&this.count++}exec(e){
const t=this.getMatcher(this.regexIndex);t.lastIndex=this.lastIndex
;let n=t.exec(e)
;if(this.resumingScanAtSamePosition())if(n&&n.index===this.lastIndex);else{
const t=this.getMatcher(0);t.lastIndex=this.lastIndex+1,n=t.exec(e)}
return n&&(this.regexIndex+=n.position+1,
this.regexIndex===this.count&&this.considerAll()),n}}
if(e.compilerExtensions||(e.compilerExtensions=[]),
e.contains&&e.contains.includes("self"))throw Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.")
;return e.classNameAliases=i(e.classNameAliases||{}),function n(o,r){const a=o
;if(o.isCompiled)return a
;[I,B,Z,D].forEach((e=>e(o,r))),e.compilerExtensions.forEach((e=>e(o,r))),
o.__beforeBegin=null,[T,L,P].forEach((e=>e(o,r))),o.isCompiled=!0;let c=null
;return"object"==typeof o.keywords&&o.keywords.$pattern&&(o.keywords=Object.assign({},o.keywords),
c=o.keywords.$pattern,
delete o.keywords.$pattern),c=c||/\w+/,o.keywords&&(o.keywords=$(o.keywords,e.case_insensitive)),
a.keywordPatternRe=t(c,!0),
r&&(o.begin||(o.begin=/\B|\b/),a.beginRe=t(a.begin),o.end||o.endsWithParent||(o.end=/\B|\b/),
o.end&&(a.endRe=t(a.end)),
a.terminatorEnd=l(a.end)||"",o.endsWithParent&&r.terminatorEnd&&(a.terminatorEnd+=(o.end?"|":"")+r.terminatorEnd)),
o.illegal&&(a.illegalRe=t(o.illegal)),
o.contains||(o.contains=[]),o.contains=[].concat(...o.contains.map((e=>(e=>(e.variants&&!e.cachedVariants&&(e.cachedVariants=e.variants.map((t=>i(e,{
variants:null},t)))),e.cachedVariants?e.cachedVariants:q(e)?i(e,{
starts:e.starts?i(e.starts):null
}):Object.isFrozen(e)?i(e):e))("self"===e?o:e)))),o.contains.forEach((e=>{n(e,a)
})),o.starts&&n(o.starts,r),a.matcher=(e=>{const t=new s
;return e.contains.forEach((e=>t.addRule(e.begin,{rule:e,type:"begin"
}))),e.terminatorEnd&&t.addRule(e.terminatorEnd,{type:"end"
}),e.illegal&&t.addRule(e.illegal,{type:"illegal"}),t})(a),a}(e)}function q(e){
return!!e&&(e.endsWithParent||q(e.starts))}class J extends Error{
constructor(e,t){super(e),this.name="HTMLInjectionError",this.html=t}}
const Y=n,Q=i,ee=Symbol("nomatch"),te=n=>{
const i=Object.create(null),s=Object.create(null),o=[];let r=!0
;const a="Could not find the language '{}', did you forget to load/include a language module?",l={
disableAutodetect:!0,name:"Plain text",contains:[]};let p={
ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,
languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",
cssSelector:"pre code",languages:null,__emitter:c};function b(e){
return p.noHighlightRe.test(e)}function m(e,t,n){let i="",s=""
;"object"==typeof t?(i=e,
n=t.ignoreIllegals,s=t.language):(G("10.7.0","highlight(lang, code, ...args) has been deprecated."),
G("10.7.0","Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277"),
s=e,i=t),void 0===n&&(n=!0);const o={code:i,language:s};S("before:highlight",o)
;const r=o.result?o.result:E(o.language,o.code,n)
;return r.code=o.code,S("after:highlight",r),r}function E(e,n,s,o){
const c=Object.create(null);function l(){if(!S.keywords)return void M.addText(R)
;let e=0;S.keywordPatternRe.lastIndex=0;let t=S.keywordPatternRe.exec(R),n=""
;for(;t;){n+=R.substring(e,t.index)
;const s=_.case_insensitive?t[0].toLowerCase():t[0],o=(i=s,S.keywords[i]);if(o){
const[e,i]=o
;if(M.addText(n),n="",c[s]=(c[s]||0)+1,c[s]<=7&&(j+=i),e.startsWith("_"))n+=t[0];else{
const n=_.classNameAliases[e]||e;u(t[0],n)}}else n+=t[0]
;e=S.keywordPatternRe.lastIndex,t=S.keywordPatternRe.exec(R)}var i
;n+=R.substring(e),M.addText(n)}function g(){null!=S.subLanguage?(()=>{
if(""===R)return;let e=null;if("string"==typeof S.subLanguage){
if(!i[S.subLanguage])return void M.addText(R)
;e=E(S.subLanguage,R,!0,v[S.subLanguage]),v[S.subLanguage]=e._top
}else e=x(R,S.subLanguage.length?S.subLanguage:null)
;S.relevance>0&&(j+=e.relevance),M.__addSublanguage(e._emitter,e.language)
})():l(),R=""}function u(e,t){
""!==e&&(M.startScope(t),M.addText(e),M.endScope())}function d(e,t){let n=1
;const i=t.length-1;for(;n<=i;){if(!e._emit[n]){n++;continue}
const i=_.classNameAliases[e[n]]||e[n],s=t[n];i?u(s,i):(R=s,l(),R=""),n++}}
function h(e,t){
return e.scope&&"string"==typeof e.scope&&M.openNode(_.classNameAliases[e.scope]||e.scope),
e.beginScope&&(e.beginScope._wrap?(u(R,_.classNameAliases[e.beginScope._wrap]||e.beginScope._wrap),
R=""):e.beginScope._multi&&(d(e.beginScope,t),R="")),S=Object.create(e,{parent:{
value:S}}),S}function f(e,n,i){let s=((e,t)=>{const n=e&&e.exec(t)
;return n&&0===n.index})(e.endRe,i);if(s){if(e["on:end"]){const i=new t(e)
;e["on:end"](n,i),i.isMatchIgnored&&(s=!1)}if(s){
for(;e.endsParent&&e.parent;)e=e.parent;return e}}
if(e.endsWithParent)return f(e.parent,n,i)}function b(e){
return 0===S.matcher.regexIndex?(R+=e[0],1):(T=!0,0)}function m(e){
const t=e[0],i=n.substring(e.index),s=f(S,e,i);if(!s)return ee;const o=S
;S.endScope&&S.endScope._wrap?(g(),
u(t,S.endScope._wrap)):S.endScope&&S.endScope._multi?(g(),
d(S.endScope,e)):o.skip?R+=t:(o.returnEnd||o.excludeEnd||(R+=t),
g(),o.excludeEnd&&(R=t));do{
S.scope&&M.closeNode(),S.skip||S.subLanguage||(j+=S.relevance),S=S.parent
}while(S!==s.parent);return s.starts&&h(s.starts,e),o.returnEnd?0:t.length}
let w={};function y(i,o){const a=o&&o[0];if(R+=i,null==a)return g(),0
;if("begin"===w.type&&"end"===o.type&&w.index===o.index&&""===a){
if(R+=n.slice(o.index,o.index+1),!r){const t=Error(`0 width match regex (${e})`)
;throw t.languageName=e,t.badRule=w.rule,t}return 1}
if(w=o,"begin"===o.type)return(e=>{
const n=e[0],i=e.rule,s=new t(i),o=[i.__beforeBegin,i["on:begin"]]
;for(const t of o)if(t&&(t(e,s),s.isMatchIgnored))return b(n)
;return i.skip?R+=n:(i.excludeBegin&&(R+=n),
g(),i.returnBegin||i.excludeBegin||(R=n)),h(i,e),i.returnBegin?0:n.length})(o)
;if("illegal"===o.type&&!s){
const e=Error('Illegal lexeme "'+a+'" for mode "'+(S.scope||"<unnamed>")+'"')
;throw e.mode=S,e}if("end"===o.type){const e=m(o);if(e!==ee)return e}
if("illegal"===o.type&&""===a)return 1
;if(I>1e5&&I>3*o.index)throw Error("potential infinite loop, way more iterations than matches")
;return R+=a,a.length}const _=O(e)
;if(!_)throw W(a.replace("{}",e)),Error('Unknown language: "'+e+'"')
;const k=V(_);let N="",S=o||k;const v={},M=new p.__emitter(p);(()=>{const e=[]
;for(let t=S;t!==_;t=t.parent)t.scope&&e.unshift(t.scope)
;e.forEach((e=>M.openNode(e)))})();let R="",j=0,A=0,I=0,T=!1;try{
if(_.__emitTokens)_.__emitTokens(n,M);else{for(S.matcher.considerAll();;){
I++,T?T=!1:S.matcher.considerAll(),S.matcher.lastIndex=A
;const e=S.matcher.exec(n);if(!e)break;const t=y(n.substring(A,e.index),e)
;A=e.index+t}y(n.substring(A))}return M.finalize(),N=M.toHTML(),{language:e,
value:N,relevance:j,illegal:!1,_emitter:M,_top:S}}catch(t){
if(t.message&&t.message.includes("Illegal"))return{language:e,value:Y(n),
illegal:!0,relevance:0,_illegalBy:{message:t.message,index:A,
context:n.slice(A-100,A+100),mode:t.mode,resultSoFar:N},_emitter:M};if(r)return{
language:e,value:Y(n),illegal:!1,relevance:0,errorRaised:t,_emitter:M,_top:S}
;throw t}}function x(e,t){t=t||p.languages||Object.keys(i);const n=(e=>{
const t={value:Y(e),illegal:!1,relevance:0,_top:l,_emitter:new p.__emitter(p)}
;return t._emitter.addText(e),t})(e),s=t.filter(O).filter(N).map((t=>E(t,e,!1)))
;s.unshift(n);const o=s.sort(((e,t)=>{
if(e.relevance!==t.relevance)return t.relevance-e.relevance
;if(e.language&&t.language){if(O(e.language).supersetOf===t.language)return 1
;if(O(t.language).supersetOf===e.language)return-1}return 0})),[r,a]=o,c=r
;return c.secondBest=a,c}function w(e){let t=null;const n=(e=>{
let t=e.className+" ";t+=e.parentNode?e.parentNode.className:""
;const n=p.languageDetectRe.exec(t);if(n){const t=O(n[1])
;return t||(X(a.replace("{}",n[1])),
X("Falling back to no-highlight mode for this block.",e)),t?n[1]:"no-highlight"}
return t.split(/\s+/).find((e=>b(e)||O(e)))})(e);if(b(n))return
;if(S("before:highlightElement",{el:e,language:n
}),e.children.length>0&&(p.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),
console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),
console.warn("The element with unescaped HTML:"),
console.warn(e)),p.throwUnescapedHTML))throw new J("One of your code blocks includes unescaped HTML.",e.innerHTML)
;t=e;const i=t.textContent,o=n?m(i,{language:n,ignoreIllegals:!0}):x(i)
;e.innerHTML=o.value,((e,t,n)=>{const i=t&&s[t]||n
;e.classList.add("hljs"),e.classList.add("language-"+i)
})(e,n,o.language),e.result={language:o.language,re:o.relevance,
relevance:o.relevance},o.secondBest&&(e.secondBest={
language:o.secondBest.language,relevance:o.secondBest.relevance
}),S("after:highlightElement",{el:e,result:o,text:i})}let y=!1;function _(){
"loading"!==document.readyState?document.querySelectorAll(p.cssSelector).forEach(w):y=!0
}function O(e){return e=(e||"").toLowerCase(),i[e]||i[s[e]]}
function k(e,{languageName:t}){"string"==typeof e&&(e=[e]),e.forEach((e=>{
s[e.toLowerCase()]=t}))}function N(e){const t=O(e)
;return t&&!t.disableAutodetect}function S(e,t){const n=e;o.forEach((e=>{
e[n]&&e[n](t)}))}
"undefined"!=typeof window&&window.addEventListener&&window.addEventListener("DOMContentLoaded",(()=>{
y&&_()}),!1),Object.assign(n,{highlight:m,highlightAuto:x,highlightAll:_,
highlightElement:w,
highlightBlock:e=>(G("10.7.0","highlightBlock will be removed entirely in v12.0"),
G("10.7.0","Please use highlightElement now."),w(e)),configure:e=>{p=Q(p,e)},
initHighlighting:()=>{
_(),G("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")},
initHighlightingOnLoad:()=>{
_(),G("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")
},registerLanguage:(e,t)=>{let s=null;try{s=t(n)}catch(t){
if(W("Language definition for '{}' could not be registered.".replace("{}",e)),
!r)throw t;W(t),s=l}
s.name||(s.name=e),i[e]=s,s.rawDefinition=t.bind(null,n),s.aliases&&k(s.aliases,{
languageName:e})},unregisterLanguage:e=>{delete i[e]
;for(const t of Object.keys(s))s[t]===e&&delete s[t]},
listLanguages:()=>Object.keys(i),getLanguage:O,registerAliases:k,
autoDetection:N,inherit:Q,addPlugin:e=>{(e=>{
e["before:highlightBlock"]&&!e["before:highlightElement"]&&(e["before:highlightElement"]=t=>{
e["before:highlightBlock"](Object.assign({block:t.el},t))
}),e["after:highlightBlock"]&&!e["after:highlightElement"]&&(e["after:highlightElement"]=t=>{
e["after:highlightBlock"](Object.assign({block:t.el},t))})})(e),o.push(e)},
removePlugin:e=>{const t=o.indexOf(e);-1!==t&&o.splice(t,1)}}),n.debugMode=()=>{
r=!1},n.safeMode=()=>{r=!0},n.versionString="11.8.0",n.regex={concat:h,
lookahead:g,either:f,optional:d,anyNumberOfTimes:u}
;for(const t in j)"object"==typeof j[t]&&e(j[t]);return Object.assign(n,j),n
},ne=te({});return ne.newInstance=()=>te({}),ne}()
;"object"==typeof exports&&"undefined"!=typeof module&&(module.exports=hljs);/*! `css` grammar compiled for Highlight.js 11.8.0 */
(()=>{var e=(()=>{"use strict"
;const e=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","p","q","quote","samp","section","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],i=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"],r=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"],t=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"],o=["align-content","align-items","align-self","all","animation","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-decoration-break","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","content","content-visibility","counter-increment","counter-reset","cue","cue-after","cue-before","cursor","direction","display","empty-cells","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-size","font-size-adjust","font-smoothing","font-stretch","font-style","font-synthesis","font-variant","font-variant-caps","font-variant-east-asian","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","gap","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","inline-size","isolation","justify-content","left","letter-spacing","line-break","line-height","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-wrap","overflow-x","overflow-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page-break-after","page-break-before","page-break-inside","pause","pause-after","pause-before","perspective","perspective-origin","pointer-events","position","quotes","resize","rest","rest-after","rest-before","right","row-gap","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","speak","speak-as","src","tab-size","table-layout","text-align","text-align-all","text-align-last","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-style","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-transform","text-underline-position","top","transform","transform-box","transform-origin","transform-style","transition","transition-delay","transition-duration","transition-property","transition-timing-function","unicode-bidi","vertical-align","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","z-index"].reverse()
;return n=>{const a=n.regex,l=(e=>({IMPORTANT:{scope:"meta",begin:"!important"},
BLOCK_COMMENT:e.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",
begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{
className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{
scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",
contains:[e.APOS_STRING_MODE,e.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{
scope:"number",
begin:e.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z][A-Za-z0-9_-]*/}
}))(n),s=[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE];return{name:"CSS",
case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},
classNameAliases:{keyframePosition:"selector-tag"},contains:[l.BLOCK_COMMENT,{
begin:/-(webkit|moz|ms|o)-(?=[a-z])/},l.CSS_NUMBER_MODE,{
className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0},{
className:"selector-class",begin:"\\.[a-zA-Z-][a-zA-Z0-9_-]*",relevance:0
},l.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{
begin:":("+r.join("|")+")"},{begin:":(:)?("+t.join("|")+")"}]},l.CSS_VARIABLE,{
className:"attribute",begin:"\\b("+o.join("|")+")\\b"},{begin:/:/,end:/[;}{]/,
contains:[l.BLOCK_COMMENT,l.HEXCOLOR,l.IMPORTANT,l.CSS_NUMBER_MODE,...s,{
begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"
},contains:[...s,{className:"string",begin:/[^)]/,endsWithParent:!0,
excludeEnd:!0}]},l.FUNCTION_DISPATCH]},{begin:a.lookahead(/@/),end:"[{;]",
relevance:0,illegal:/:/,contains:[{className:"keyword",begin:/@-?\w[\w]*(-\w+)*/
},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{
$pattern:/[a-z-]+/,keyword:"and or not only",attribute:i.join(" ")},contains:[{
begin:/[a-z-]+(?=:)/,className:"attribute"},...s,l.CSS_NUMBER_MODE]}]},{
className:"selector-tag",begin:"\\b("+e.join("|")+")\\b"}]}}})()
;hljs.registerLanguage("css",e)})();/*! `django` grammar compiled for Highlight.js 11.8.0 */
(()=>{var e=(()=>{"use strict";return e=>{const t={begin:/\|[A-Za-z]+:?/,
keywords:{
name:"truncatewords removetags linebreaksbr yesno get_digit timesince random striptags filesizeformat escape linebreaks length_is ljust rjust cut urlize fix_ampersands title floatformat capfirst pprint divisibleby add make_list unordered_list urlencode timeuntil urlizetrunc wordcount stringformat linenumbers slice date dictsort dictsortreversed default_if_none pluralize lower join center default truncatewords_html upper length phone2numeric wordwrap time addslashes slugify first escapejs force_escape iriencode last safe safeseq truncatechars localize unlocalize localtime utc timezone"
},contains:[e.QUOTE_STRING_MODE,e.APOS_STRING_MODE]};return{name:"Django",
aliases:["jinja"],case_insensitive:!0,subLanguage:"xml",
contains:[e.COMMENT(/\{%\s*comment\s*%\}/,/\{%\s*endcomment\s*%\}/),e.COMMENT(/\{#/,/#\}/),{
className:"template-tag",begin:/\{%/,end:/%\}/,contains:[{className:"name",
begin:/\w+/,keywords:{
name:"comment endcomment load templatetag ifchanged endifchanged if endif firstof for endfor ifnotequal endifnotequal widthratio extends include spaceless endspaceless regroup ifequal endifequal ssi now with cycle url filter endfilter debug block endblock else autoescape endautoescape csrf_token empty elif endwith static trans blocktrans endblocktrans get_static_prefix get_media_prefix plural get_current_language language get_available_languages get_current_language_bidi get_language_info get_language_info_list localize endlocalize localtime endlocaltime timezone endtimezone get_current_timezone verbatim"
},starts:{endsWithParent:!0,keywords:"in by as",contains:[t],relevance:0}}]},{
className:"template-variable",begin:/\{\{/,end:/\}\}/,contains:[t]}]}}})()
;hljs.registerLanguage("django",e)})();/*! `javascript` grammar compiled for Highlight.js 11.8.0 */
(()=>{var e=(()=>{"use strict"
;const e="[A-Za-z$_][0-9A-Za-z$_]*",n=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends"],a=["true","false","null","undefined","NaN","Infinity"],t=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],s=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],r=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],c=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],i=[].concat(r,t,s)
;return o=>{const l=o.regex,b=e,d={begin:/<[A-Za-z0-9\\._:-]+/,
end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(e,n)=>{
const a=e[0].length+e.index,t=e.input[a]
;if("<"===t||","===t)return void n.ignoreMatch();let s
;">"===t&&(((e,{after:n})=>{const a="</"+e[0].slice(1)
;return-1!==e.input.indexOf(a,n)})(e,{after:a})||n.ignoreMatch())
;const r=e.input.substring(a)
;((s=r.match(/^\s*=/))||(s=r.match(/^\s+extends\s+/))&&0===s.index)&&n.ignoreMatch()
}},g={$pattern:e,keyword:n,literal:a,built_in:i,"variable.language":c
},u="[0-9](_?[0-9])*",m=`\\.(${u})`,E="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",A={
className:"number",variants:[{
begin:`(\\b(${E})((${m})|\\.)?|(${m}))[eE][+-]?(${u})\\b`},{
begin:`\\b(${E})\\b((${m})\\b|\\.)?|(${m})\\b`},{
begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{
begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{
begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{
begin:"\\b0[0-7]+n?\\b"}],relevance:0},y={className:"subst",begin:"\\$\\{",
end:"\\}",keywords:g,contains:[]},h={begin:"html`",end:"",starts:{end:"`",
returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,y],subLanguage:"xml"}},N={
begin:"css`",end:"",starts:{end:"`",returnEnd:!1,
contains:[o.BACKSLASH_ESCAPE,y],subLanguage:"css"}},_={begin:"gql`",end:"",
starts:{end:"`",returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,y],
subLanguage:"graphql"}},f={className:"string",begin:"`",end:"`",
contains:[o.BACKSLASH_ESCAPE,y]},v={className:"comment",
variants:[o.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{
begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",
begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,
excludeBegin:!0,relevance:0},{className:"variable",begin:b+"(?=\\s*(-)|$)",
endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]
}),o.C_BLOCK_COMMENT_MODE,o.C_LINE_COMMENT_MODE]
},p=[o.APOS_STRING_MODE,o.QUOTE_STRING_MODE,h,N,_,f,{match:/\$\d+/},A]
;y.contains=p.concat({begin:/\{/,end:/\}/,keywords:g,contains:["self"].concat(p)
});const S=[].concat(v,y.contains),w=S.concat([{begin:/\(/,end:/\)/,keywords:g,
contains:["self"].concat(S)}]),R={className:"params",begin:/\(/,end:/\)/,
excludeBegin:!0,excludeEnd:!0,keywords:g,contains:w},O={variants:[{
match:[/class/,/\s+/,b,/\s+/,/extends/,/\s+/,l.concat(b,"(",l.concat(/\./,b),")*")],
scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{
match:[/class/,/\s+/,b],scope:{1:"keyword",3:"title.class"}}]},k={relevance:0,
match:l.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),
className:"title.class",keywords:{_:[...t,...s]}},I={variants:[{
match:[/function/,/\s+/,b,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],
className:{1:"keyword",3:"title.function"},label:"func.def",contains:[R],
illegal:/%/},x={
match:l.concat(/\b/,(T=[...r,"super","import"],l.concat("(?!",T.join("|"),")")),b,l.lookahead(/\(/)),
className:"title.function",relevance:0};var T;const C={
begin:l.concat(/\./,l.lookahead(l.concat(b,/(?![0-9A-Za-z$_(])/))),end:b,
excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},M={
match:[/get|set/,/\s+/,b,/(?=\()/],className:{1:"keyword",3:"title.function"},
contains:[{begin:/\(\)/},R]
},B="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+o.UNDERSCORE_IDENT_RE+")\\s*=>",$={
match:[/const|var|let/,/\s+/,b,/\s*/,/=\s*/,/(async\s*)?/,l.lookahead(B)],
keywords:"async",className:{1:"keyword",3:"title.function"},contains:[R]}
;return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:g,exports:{
PARAMS_CONTAINS:w,CLASS_REFERENCE:k},illegal:/#(?![$_A-z])/,
contains:[o.SHEBANG({label:"shebang",binary:"node",relevance:5}),{
label:"use_strict",className:"meta",relevance:10,
begin:/^\s*['"]use (strict|asm)['"]/
},o.APOS_STRING_MODE,o.QUOTE_STRING_MODE,h,N,_,f,v,{match:/\$\d+/},A,k,{
className:"attr",begin:b+l.lookahead(":"),relevance:0},$,{
begin:"("+o.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",
keywords:"return throw case",relevance:0,contains:[v,o.REGEXP_MODE,{
className:"function",begin:B,returnBegin:!0,end:"\\s*=>",contains:[{
className:"params",variants:[{begin:o.UNDERSCORE_IDENT_RE,relevance:0},{
className:null,begin:/\(\s*\)/,skip:!0},{begin:/\(/,end:/\)/,excludeBegin:!0,
excludeEnd:!0,keywords:g,contains:w}]}]},{begin:/,/,relevance:0},{match:/\s+/,
relevance:0},{variants:[{begin:"<>",end:"</>"},{
match:/<[A-Za-z0-9\\._:-]+\s*\/>/},{begin:d.begin,
"on:begin":d.isTrulyOpeningTag,end:d.end}],subLanguage:"xml",contains:[{
begin:d.begin,end:d.end,skip:!0,contains:["self"]}]}]},I,{
beginKeywords:"while if switch catch for"},{
begin:"\\b(?!function)"+o.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
returnBegin:!0,label:"func.def",contains:[R,o.inherit(o.TITLE_MODE,{begin:b,
className:"title.function"})]},{match:/\.\.\./,relevance:0},C,{match:"\\$"+b,
relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},
contains:[R]},x,{relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,
className:"variable.constant"},O,M,{match:/\$[(.]/}]}}})()
;hljs.registerLanguage("javascript",e)})();/*! `json` grammar compiled for Highlight.js 11.8.0 */
(()=>{var e=(()=>{"use strict";return e=>{const a=["true","false","null"],n={
scope:"literal",beginKeywords:a.join(" ")};return{name:"JSON",keywords:{
literal:a},contains:[{className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,
relevance:1.01},{match:/[{}[\],:]/,className:"punctuation",relevance:0
},e.QUOTE_STRING_MODE,n,e.C_NUMBER_MODE,e.C_LINE_COMMENT_MODE,e.C_BLOCK_COMMENT_MODE],
illegal:"\\S"}}})();hljs.registerLanguage("json",e)})();/*! `markdown` grammar compiled for Highlight.js 11.8.0 */
(()=>{var e=(()=>{"use strict";return e=>{const n={begin:/<\/?[A-Za-z_]/,
end:">",subLanguage:"xml",relevance:0},a={variants:[{begin:/\[.+?\]\[.*?\]/,
relevance:0},{
begin:/\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
relevance:2},{
begin:e.regex.concat(/\[.+?\]\(/,/[A-Za-z][A-Za-z0-9+.-]*/,/:\/\/.*?\)/),
relevance:2},{begin:/\[.+?\]\([./?&#].*?\)/,relevance:1},{
begin:/\[.*?\]\(.*?\)/,relevance:0}],returnBegin:!0,contains:[{match:/\[(?=\])/
},{className:"string",relevance:0,begin:"\\[",end:"\\]",excludeBegin:!0,
returnEnd:!0},{className:"link",relevance:0,begin:"\\]\\(",end:"\\)",
excludeBegin:!0,excludeEnd:!0},{className:"symbol",relevance:0,begin:"\\]\\[",
end:"\\]",excludeBegin:!0,excludeEnd:!0}]},i={className:"strong",contains:[],
variants:[{begin:/_{2}(?!\s)/,end:/_{2}/},{begin:/\*{2}(?!\s)/,end:/\*{2}/}]
},s={className:"emphasis",contains:[],variants:[{begin:/\*(?![*\s])/,end:/\*/},{
begin:/_(?![_\s])/,end:/_/,relevance:0}]},c=e.inherit(i,{contains:[]
}),t=e.inherit(s,{contains:[]});i.contains.push(t),s.contains.push(c)
;let g=[n,a];return[i,s,c,t].forEach((e=>{e.contains=e.contains.concat(g)
})),g=g.concat(i,s),{name:"Markdown",aliases:["md","mkdown","mkd"],contains:[{
className:"section",variants:[{begin:"^#{1,6}",end:"$",contains:g},{
begin:"(?=^.+?\\n[=-]{2,}$)",contains:[{begin:"^[=-]*$"},{begin:"^",end:"\\n",
contains:g}]}]},n,{className:"bullet",begin:"^[ \t]*([*+-]|(\\d+\\.))(?=\\s+)",
end:"\\s+",excludeEnd:!0},i,s,{className:"quote",begin:"^>\\s+",contains:g,
end:"$"},{className:"code",variants:[{begin:"(`{3,})[^`](.|\\n)*?\\1`*[ ]*"},{
begin:"(~{3,})[^~](.|\\n)*?\\1~*[ ]*"},{begin:"```",end:"```+[ ]*$"},{
begin:"~~~",end:"~~~+[ ]*$"},{begin:"`.+?`"},{begin:"(?=^( {4}|\\t))",
contains:[{begin:"^( {4}|\\t)",end:"(\\n)$"}],relevance:0}]},{
begin:"^[-\\*]{3,}",end:"$"},a,{begin:/^\[[^\n]+\]:/,returnBegin:!0,contains:[{
className:"symbol",begin:/\[/,end:/\]/,excludeBegin:!0,excludeEnd:!0},{
className:"link",begin:/:\s*/,end:/$/,excludeBegin:!0}]}]}}})()
;hljs.registerLanguage("markdown",e)})();/*! `xml` grammar compiled for Highlight.js 11.8.0 */
(()=>{var e=(()=>{"use strict";return e=>{
const a=e.regex,n=a.concat(/[\p{L}_]/u,a.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),s={
className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},t={begin:/\s/,
contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]
},i=e.inherit(t,{begin:/\(/,end:/\)/}),c=e.inherit(e.APOS_STRING_MODE,{
className:"string"}),l=e.inherit(e.QUOTE_STRING_MODE,{className:"string"}),r={
endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",
begin:/[\p{L}0-9._:-]+/u,relevance:0},{begin:/=\s*/,relevance:0,contains:[{
className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[s]},{
begin:/'/,end:/'/,contains:[s]},{begin:/[^\s"'=<>`]+/}]}]}]};return{
name:"HTML, XML",
aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],
case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,
end:/>/,relevance:10,contains:[t,l,c,i,{begin:/\[/,end:/\]/,contains:[{
className:"meta",begin:/<![a-z]/,end:/>/,contains:[t,i,l,c]}]}]
},e.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,
relevance:10},s,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,
relevance:10,contains:[l]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",
begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[r],starts:{
end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",
begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[r],starts:{
end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{
className:"tag",begin:/<>|<\/>/},{className:"tag",
begin:a.concat(/</,a.lookahead(a.concat(n,a.either(/\/>/,/>/,/\s/)))),
end:/\/?>/,contains:[{className:"name",begin:n,relevance:0,starts:r}]},{
className:"tag",begin:a.concat(/<\//,a.lookahead(a.concat(n,/>/))),contains:[{
className:"name",begin:n,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}}
})();hljs.registerLanguage("xml",e)})();

/* <script src=../Modulo.html></script><style type=f> */
/*! showdown v 2.1.0 - 21-04-2022 */
!function(){function a(e){"use strict";var r={omitExtraWLInCodeBlocks:{defaultValue:!1,describe:"Omit the default extra whiteline added to code blocks",type:"boolean"},noHeaderId:{defaultValue:!1,describe:"Turn on/off generated header id",type:"boolean"},prefixHeaderId:{defaultValue:!1,describe:"Add a prefix to the generated header ids. Passing a string will prefix that string to the header id. Setting to true will add a generic 'section-' prefix",type:"string"},rawPrefixHeaderId:{defaultValue:!1,describe:'Setting this option to true will prevent showdown from modifying the prefix. This might result in malformed IDs (if, for instance, the " char is used in the prefix)',type:"boolean"},ghCompatibleHeaderId:{defaultValue:!1,describe:"Generate header ids compatible with github style (spaces are replaced with dashes, a bunch of non alphanumeric chars are removed)",type:"boolean"},rawHeaderId:{defaultValue:!1,describe:"Remove only spaces, ' and \" from generated header ids (including prefixes), replacing them with dashes (-). WARNING: This might result in malformed ids",type:"boolean"},headerLevelStart:{defaultValue:!1,describe:"The header blocks level start",type:"integer"},parseImgDimensions:{defaultValue:!1,describe:"Turn on/off image dimension parsing",type:"boolean"},simplifiedAutoLink:{defaultValue:!1,describe:"Turn on/off GFM autolink style",type:"boolean"},excludeTrailingPunctuationFromURLs:{defaultValue:!1,describe:"Excludes trailing punctuation from links generated with autoLinking",type:"boolean"},literalMidWordUnderscores:{defaultValue:!1,describe:"Parse midword underscores as literal underscores",type:"boolean"},literalMidWordAsterisks:{defaultValue:!1,describe:"Parse midword asterisks as literal asterisks",type:"boolean"},strikethrough:{defaultValue:!1,describe:"Turn on/off strikethrough support",type:"boolean"},tables:{defaultValue:!1,describe:"Turn on/off tables support",type:"boolean"},tablesHeaderId:{defaultValue:!1,describe:"Add an id to table headers",type:"boolean"},ghCodeBlocks:{defaultValue:!0,describe:"Turn on/off GFM fenced code blocks support",type:"boolean"},tasklists:{defaultValue:!1,describe:"Turn on/off GFM tasklist support",type:"boolean"},smoothLivePreview:{defaultValue:!1,describe:"Prevents weird effects in live previews due to incomplete input",type:"boolean"},smartIndentationFix:{defaultValue:!1,describe:"Tries to smartly fix indentation in es6 strings",type:"boolean"},disableForced4SpacesIndentedSublists:{defaultValue:!1,describe:"Disables the requirement of indenting nested sublists by 4 spaces",type:"boolean"},simpleLineBreaks:{defaultValue:!1,describe:"Parses simple line breaks as <br> (GFM Style)",type:"boolean"},requireSpaceBeforeHeadingText:{defaultValue:!1,describe:"Makes adding a space between `#` and the header text mandatory (GFM Style)",type:"boolean"},ghMentions:{defaultValue:!1,describe:"Enables github @mentions",type:"boolean"},ghMentionsLink:{defaultValue:"https://github.com/{u}",describe:"Changes the link generated by @mentions. Only applies if ghMentions option is enabled.",type:"string"},encodeEmails:{defaultValue:!0,describe:"Encode e-mail addresses through the use of Character Entities, transforming ASCII e-mail addresses into its equivalent decimal entities",type:"boolean"},openLinksInNewWindow:{defaultValue:!1,describe:"Open all links in new windows",type:"boolean"},backslashEscapesHTMLTags:{defaultValue:!1,describe:"Support for HTML Tag escaping. ex: <div>foo</div>",type:"boolean"},emoji:{defaultValue:!1,describe:"Enable emoji support. Ex: `this is a :smile: emoji`",type:"boolean"},underline:{defaultValue:!1,describe:"Enable support for underline. Syntax is double or triple underscores: `__underline word__`. With this option enabled, underscores no longer parses into `<em>` and `<strong>`",type:"boolean"},ellipsis:{defaultValue:!0,describe:"Replaces three dots with the ellipsis unicode character",type:"boolean"},completeHTMLDocument:{defaultValue:!1,describe:"Outputs a complete html document, including `<html>`, `<head>` and `<body>` tags",type:"boolean"},metadata:{defaultValue:!1,describe:"Enable support for document metadata (defined at the top of the document between `«««` and `»»»` or between `---` and `---`).",type:"boolean"},splitAdjacentBlockquotes:{defaultValue:!1,describe:"Split adjacent blockquote blocks",type:"boolean"}};if(!1===e)return JSON.parse(JSON.stringify(r));var t,a={};for(t in r)r.hasOwnProperty(t)&&(a[t]=r[t].defaultValue);return a}var x={},t={},d={},p=a(!0),h="vanilla",_={github:{omitExtraWLInCodeBlocks:!0,simplifiedAutoLink:!0,excludeTrailingPunctuationFromURLs:!0,literalMidWordUnderscores:!0,strikethrough:!0,tables:!0,tablesHeaderId:!0,ghCodeBlocks:!0,tasklists:!0,disableForced4SpacesIndentedSublists:!0,simpleLineBreaks:!0,requireSpaceBeforeHeadingText:!0,ghCompatibleHeaderId:!0,ghMentions:!0,backslashEscapesHTMLTags:!0,emoji:!0,splitAdjacentBlockquotes:!0},original:{noHeaderId:!0,ghCodeBlocks:!1},ghost:{omitExtraWLInCodeBlocks:!0,parseImgDimensions:!0,simplifiedAutoLink:!0,excludeTrailingPunctuationFromURLs:!0,literalMidWordUnderscores:!0,strikethrough:!0,tables:!0,tablesHeaderId:!0,ghCodeBlocks:!0,tasklists:!0,smoothLivePreview:!0,simpleLineBreaks:!0,requireSpaceBeforeHeadingText:!0,ghMentions:!1,encodeEmails:!0},vanilla:a(!0),allOn:function(){"use strict";var e,r=a(!0),t={};for(e in r)r.hasOwnProperty(e)&&(t[e]=!0);return t}()};function g(e,r){"use strict";var t=r?"Error in "+r+" extension->":"Error in unnamed extension",a={valid:!0,error:""};x.helper.isArray(e)||(e=[e]);for(var n=0;n<e.length;++n){var s=t+" sub-extension "+n+": ",o=e[n];if("object"!=typeof o)return a.valid=!1,a.error=s+"must be an object, but "+typeof o+" given",a;if(!x.helper.isString(o.type))return a.valid=!1,a.error=s+'property "type" must be a string, but '+typeof o.type+" given",a;var i=o.type=o.type.toLowerCase();if("lang"!==(i="html"===(i="language"===i?o.type="lang":i)?o.type="output":i)&&"output"!==i&&"listener"!==i)return a.valid=!1,a.error=s+"type "+i+' is not recognized. Valid values: "lang/language", "output/html" or "listener"',a;if("listener"===i){if(x.helper.isUndefined(o.listeners))return a.valid=!1,a.error=s+'. Extensions of type "listener" must have a property called "listeners"',a}else if(x.helper.isUndefined(o.filter)&&x.helper.isUndefined(o.regex))return a.valid=!1,a.error=s+i+' extensions must define either a "regex" property or a "filter" method',a;if(o.listeners){if("object"!=typeof o.listeners)return a.valid=!1,a.error=s+'"listeners" property must be an object but '+typeof o.listeners+" given",a;for(var l in o.listeners)if(o.listeners.hasOwnProperty(l)&&"function"!=typeof o.listeners[l])return a.valid=!1,a.error=s+'"listeners" property must be an hash of [event name]: [callback]. listeners.'+l+" must be a function but "+typeof o.listeners[l]+" given",a}if(o.filter){if("function"!=typeof o.filter)return a.valid=!1,a.error=s+'"filter" must be a function, but '+typeof o.filter+" given",a}else if(o.regex){if(x.helper.isString(o.regex)&&(o.regex=new RegExp(o.regex,"g")),!(o.regex instanceof RegExp))return a.valid=!1,a.error=s+'"regex" property must either be a string or a RegExp object, but '+typeof o.regex+" given",a;if(x.helper.isUndefined(o.replace))return a.valid=!1,a.error=s+'"regex" extensions must implement a replace string or function',a}}return a}function n(e,r){"use strict";return"¨E"+r.charCodeAt(0)+"E"}x.helper={},x.extensions={},x.setOption=function(e,r){"use strict";return p[e]=r,this},x.getOption=function(e){"use strict";return p[e]},x.getOptions=function(){"use strict";return p},x.resetOptions=function(){"use strict";p=a(!0)},x.setFlavor=function(e){"use strict";if(!_.hasOwnProperty(e))throw Error(e+" flavor was not found");x.resetOptions();var r,t=_[e];for(r in h=e,t)t.hasOwnProperty(r)&&(p[r]=t[r])},x.getFlavor=function(){"use strict";return h},x.getFlavorOptions=function(e){"use strict";if(_.hasOwnProperty(e))return _[e]},x.getDefaultOptions=a,x.subParser=function(e,r){"use strict";if(x.helper.isString(e)){if(void 0===r){if(t.hasOwnProperty(e))return t[e];throw Error("SubParser named "+e+" not registered!")}t[e]=r}},x.extension=function(e,r){"use strict";if(!x.helper.isString(e))throw Error("Extension 'name' must be a string");if(e=x.helper.stdExtName(e),x.helper.isUndefined(r)){if(d.hasOwnProperty(e))return d[e];throw Error("Extension named "+e+" is not registered!")}"function"==typeof r&&(r=r());var t=g(r=x.helper.isArray(r)?r:[r],e);if(!t.valid)throw Error(t.error);d[e]=r},x.getAllExtensions=function(){"use strict";return d},x.removeExtension=function(e){"use strict";delete d[e]},x.resetExtensions=function(){"use strict";d={}},x.validateExtension=function(e){"use strict";e=g(e,null);return!!e.valid||(console.warn(e.error),!1)},x.hasOwnProperty("helper")||(x.helper={}),x.helper.isString=function(e){"use strict";return"string"==typeof e||e instanceof String},x.helper.isFunction=function(e){"use strict";return e&&"[object Function]"==={}.toString.call(e)},x.helper.isArray=function(e){"use strict";return Array.isArray(e)},x.helper.isUndefined=function(e){"use strict";return void 0===e},x.helper.forEach=function(e,r){"use strict";if(x.helper.isUndefined(e))throw new Error("obj param is required");if(x.helper.isUndefined(r))throw new Error("callback param is required");if(!x.helper.isFunction(r))throw new Error("callback param must be a function/closure");if("function"==typeof e.forEach)e.forEach(r);else if(x.helper.isArray(e))for(var t=0;t<e.length;t++)r(e[t],t,e);else{if("object"!=typeof e)throw new Error("obj does not seem to be an array or an iterable object");for(var a in e)e.hasOwnProperty(a)&&r(e[a],a,e)}},x.helper.stdExtName=function(e){"use strict";return e.replace(/[_?*+\/\\.^-]/g,"").replace(/\s/g,"").toLowerCase()},x.helper.escapeCharactersCallback=n,x.helper.escapeCharacters=function(e,r,t){"use strict";r="(["+r.replace(/([\[\]\\])/g,"\\$1")+"])",t&&(r="\\\\"+r),t=new RegExp(r,"g");return e=e.replace(t,n)},x.helper.unescapeHTMLEntities=function(e){"use strict";return e.replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")};function u(e,r,t,a){"use strict";var n,s,o,i=-1<(a=a||"").indexOf("g"),l=new RegExp(r+"|"+t,"g"+a.replace(/g/g,"")),c=new RegExp(r,a.replace(/g/g,"")),u=[];do{for(n=0;p=l.exec(e);)if(c.test(p[0]))n++||(o=(s=l.lastIndex)-p[0].length);else if(n&&!--n){var d=p.index+p[0].length,p={left:{start:o,end:s},match:{start:s,end:p.index},right:{start:p.index,end:d},wholeMatch:{start:o,end:d}};if(u.push(p),!i)return u}}while(n&&(l.lastIndex=s));return u}function s(u){"use strict";return function(e,r,t,a,n,s,o){var i=t=t.replace(x.helper.regexes.asteriskDashAndColon,x.helper.escapeCharactersCallback),l="",c="",r=r||"",o=o||"";return/^www\./i.test(t)&&(t=t.replace(/^www\./i,"http://www.")),u.excludeTrailingPunctuationFromURLs&&s&&(l=s),r+'<a href="'+t+'"'+(c=u.openLinksInNewWindow?' rel="noopener noreferrer" target="¨E95Eblank"':c)+">"+i+"</a>"+l+o}}function o(n,s){"use strict";return function(e,r,t){var a="mailto:";return r=r||"",t=x.subParser("unescapeSpecialChars")(t,n,s),n.encodeEmails?(a=x.helper.encodeEmailAddress(a+t),t=x.helper.encodeEmailAddress(t)):a+=t,r+'<a href="'+a+'">'+t+"</a>"}}x.helper.matchRecursiveRegExp=function(e,r,t,a){"use strict";for(var n=u(e,r,t,a),s=[],o=0;o<n.length;++o)s.push([e.slice(n[o].wholeMatch.start,n[o].wholeMatch.end),e.slice(n[o].match.start,n[o].match.end),e.slice(n[o].left.start,n[o].left.end),e.slice(n[o].right.start,n[o].right.end)]);return s},x.helper.replaceRecursiveRegExp=function(e,r,t,a,n){"use strict";x.helper.isFunction(r)||(s=r,r=function(){return s});var s,o=u(e,t,a,n),t=e,i=o.length;if(0<i){var l=[];0!==o[0].wholeMatch.start&&l.push(e.slice(0,o[0].wholeMatch.start));for(var c=0;c<i;++c)l.push(r(e.slice(o[c].wholeMatch.start,o[c].wholeMatch.end),e.slice(o[c].match.start,o[c].match.end),e.slice(o[c].left.start,o[c].left.end),e.slice(o[c].right.start,o[c].right.end))),c<i-1&&l.push(e.slice(o[c].wholeMatch.end,o[c+1].wholeMatch.start));o[i-1].wholeMatch.end<e.length&&l.push(e.slice(o[i-1].wholeMatch.end)),t=l.join("")}return t},x.helper.regexIndexOf=function(e,r,t){"use strict";if(!x.helper.isString(e))throw"InvalidArgumentError: first parameter of showdown.helper.regexIndexOf function must be a string";if(r instanceof RegExp==!1)throw"InvalidArgumentError: second parameter of showdown.helper.regexIndexOf function must be an instance of RegExp";e=e.substring(t||0).search(r);return 0<=e?e+(t||0):e},x.helper.splitAtIndex=function(e,r){"use strict";if(x.helper.isString(e))return[e.substring(0,r),e.substring(r)];throw"InvalidArgumentError: first parameter of showdown.helper.regexIndexOf function must be a string"},x.helper.encodeEmailAddress=function(e){"use strict";var t=[function(e){return"&#"+e.charCodeAt(0)+";"},function(e){return"&#x"+e.charCodeAt(0).toString(16)+";"},function(e){return e}];return e=e.replace(/./g,function(e){var r;return e="@"===e?t[Math.floor(2*Math.random())](e):.9<(r=Math.random())?t[2](e):.45<r?t[1](e):t[0](e)})},x.helper.padEnd=function(e,r,t){"use strict";return r>>=0,t=String(t||" "),e.length>r?String(e):((r-=e.length)>t.length&&(t+=t.repeat(r/t.length)),String(e)+t.slice(0,r))},"undefined"==typeof console&&(console={warn:function(e){"use strict";alert(e)},log:function(e){"use strict";alert(e)},error:function(e){"use strict";throw e}}),x.helper.regexes={asteriskDashAndColon:/([*_:~])/g},x.helper.emojis={"+1":"👍","-1":"👎",100:"💯",1234:"🔢","1st_place_medal":"🥇","2nd_place_medal":"🥈","3rd_place_medal":"🥉","8ball":"🎱",a:"🅰️",ab:"🆎",abc:"🔤",abcd:"🔡",accept:"🉑",aerial_tramway:"🚡",airplane:"✈️",alarm_clock:"⏰",alembic:"⚗️",alien:"👽",ambulance:"🚑",amphora:"🏺",anchor:"⚓️",angel:"👼",anger:"💢",angry:"😠",anguished:"😧",ant:"🐜",apple:"🍎",aquarius:"♒️",aries:"♈️",arrow_backward:"◀️",arrow_double_down:"⏬",arrow_double_up:"⏫",arrow_down:"⬇️",arrow_down_small:"🔽",arrow_forward:"▶️",arrow_heading_down:"⤵️",arrow_heading_up:"⤴️",arrow_left:"⬅️",arrow_lower_left:"↙️",arrow_lower_right:"↘️",arrow_right:"➡️",arrow_right_hook:"↪️",arrow_up:"⬆️",arrow_up_down:"↕️",arrow_up_small:"🔼",arrow_upper_left:"↖️",arrow_upper_right:"↗️",arrows_clockwise:"🔃",arrows_counterclockwise:"🔄",art:"🎨",articulated_lorry:"🚛",artificial_satellite:"🛰",astonished:"😲",athletic_shoe:"👟",atm:"🏧",atom_symbol:"⚛️",avocado:"🥑",b:"🅱️",baby:"👶",baby_bottle:"🍼",baby_chick:"🐤",baby_symbol:"🚼",back:"🔙",bacon:"🥓",badminton:"🏸",baggage_claim:"🛄",baguette_bread:"🥖",balance_scale:"⚖️",balloon:"🎈",ballot_box:"🗳",ballot_box_with_check:"☑️",bamboo:"🎍",banana:"🍌",bangbang:"‼️",bank:"🏦",bar_chart:"📊",barber:"💈",baseball:"⚾️",basketball:"🏀",basketball_man:"⛹️",basketball_woman:"⛹️&zwj;♀️",bat:"🦇",bath:"🛀",bathtub:"🛁",battery:"🔋",beach_umbrella:"🏖",bear:"🐻",bed:"🛏",bee:"🐝",beer:"🍺",beers:"🍻",beetle:"🐞",beginner:"🔰",bell:"🔔",bellhop_bell:"🛎",bento:"🍱",biking_man:"🚴",bike:"🚲",biking_woman:"🚴&zwj;♀️",bikini:"👙",biohazard:"☣️",bird:"🐦",birthday:"🎂",black_circle:"⚫️",black_flag:"🏴",black_heart:"🖤",black_joker:"🃏",black_large_square:"⬛️",black_medium_small_square:"◾️",black_medium_square:"◼️",black_nib:"✒️",black_small_square:"▪️",black_square_button:"🔲",blonde_man:"👱",blonde_woman:"👱&zwj;♀️",blossom:"🌼",blowfish:"🐡",blue_book:"📘",blue_car:"🚙",blue_heart:"💙",blush:"😊",boar:"🐗",boat:"⛵️",bomb:"💣",book:"📖",bookmark:"🔖",bookmark_tabs:"📑",books:"📚",boom:"💥",boot:"👢",bouquet:"💐",bowing_man:"🙇",bow_and_arrow:"🏹",bowing_woman:"🙇&zwj;♀️",bowling:"🎳",boxing_glove:"🥊",boy:"👦",bread:"🍞",bride_with_veil:"👰",bridge_at_night:"🌉",briefcase:"💼",broken_heart:"💔",bug:"🐛",building_construction:"🏗",bulb:"💡",bullettrain_front:"🚅",bullettrain_side:"🚄",burrito:"🌯",bus:"🚌",business_suit_levitating:"🕴",busstop:"🚏",bust_in_silhouette:"👤",busts_in_silhouette:"👥",butterfly:"🦋",cactus:"🌵",cake:"🍰",calendar:"📆",call_me_hand:"🤙",calling:"📲",camel:"🐫",camera:"📷",camera_flash:"📸",camping:"🏕",cancer:"♋️",candle:"🕯",candy:"🍬",canoe:"🛶",capital_abcd:"🔠",capricorn:"♑️",car:"🚗",card_file_box:"🗃",card_index:"📇",card_index_dividers:"🗂",carousel_horse:"🎠",carrot:"🥕",cat:"🐱",cat2:"🐈",cd:"💿",chains:"⛓",champagne:"🍾",chart:"💹",chart_with_downwards_trend:"📉",chart_with_upwards_trend:"📈",checkered_flag:"🏁",cheese:"🧀",cherries:"🍒",cherry_blossom:"🌸",chestnut:"🌰",chicken:"🐔",children_crossing:"🚸",chipmunk:"🐿",chocolate_bar:"🍫",christmas_tree:"🎄",church:"⛪️",cinema:"🎦",circus_tent:"🎪",city_sunrise:"🌇",city_sunset:"🌆",cityscape:"🏙",cl:"🆑",clamp:"🗜",clap:"👏",clapper:"🎬",classical_building:"🏛",clinking_glasses:"🥂",clipboard:"📋",clock1:"🕐",clock10:"🕙",clock1030:"🕥",clock11:"🕚",clock1130:"🕦",clock12:"🕛",clock1230:"🕧",clock130:"🕜",clock2:"🕑",clock230:"🕝",clock3:"🕒",clock330:"🕞",clock4:"🕓",clock430:"🕟",clock5:"🕔",clock530:"🕠",clock6:"🕕",clock630:"🕡",clock7:"🕖",clock730:"🕢",clock8:"🕗",clock830:"🕣",clock9:"🕘",clock930:"🕤",closed_book:"📕",closed_lock_with_key:"🔐",closed_umbrella:"🌂",cloud:"☁️",cloud_with_lightning:"🌩",cloud_with_lightning_and_rain:"⛈",cloud_with_rain:"🌧",cloud_with_snow:"🌨",clown_face:"🤡",clubs:"♣️",cocktail:"🍸",coffee:"☕️",coffin:"⚰️",cold_sweat:"😰",comet:"☄️",computer:"💻",computer_mouse:"🖱",confetti_ball:"🎊",confounded:"😖",confused:"😕",congratulations:"㊗️",construction:"🚧",construction_worker_man:"👷",construction_worker_woman:"👷&zwj;♀️",control_knobs:"🎛",convenience_store:"🏪",cookie:"🍪",cool:"🆒",policeman:"👮",copyright:"©️",corn:"🌽",couch_and_lamp:"🛋",couple:"👫",couple_with_heart_woman_man:"💑",couple_with_heart_man_man:"👨&zwj;❤️&zwj;👨",couple_with_heart_woman_woman:"👩&zwj;❤️&zwj;👩",couplekiss_man_man:"👨&zwj;❤️&zwj;💋&zwj;👨",couplekiss_man_woman:"💏",couplekiss_woman_woman:"👩&zwj;❤️&zwj;💋&zwj;👩",cow:"🐮",cow2:"🐄",cowboy_hat_face:"🤠",crab:"🦀",crayon:"🖍",credit_card:"💳",crescent_moon:"🌙",cricket:"🏏",crocodile:"🐊",croissant:"🥐",crossed_fingers:"🤞",crossed_flags:"🎌",crossed_swords:"⚔️",crown:"👑",cry:"😢",crying_cat_face:"😿",crystal_ball:"🔮",cucumber:"🥒",cupid:"💘",curly_loop:"➰",currency_exchange:"💱",curry:"🍛",custard:"🍮",customs:"🛃",cyclone:"🌀",dagger:"🗡",dancer:"💃",dancing_women:"👯",dancing_men:"👯&zwj;♂️",dango:"🍡",dark_sunglasses:"🕶",dart:"🎯",dash:"💨",date:"📅",deciduous_tree:"🌳",deer:"🦌",department_store:"🏬",derelict_house:"🏚",desert:"🏜",desert_island:"🏝",desktop_computer:"🖥",male_detective:"🕵️",diamond_shape_with_a_dot_inside:"💠",diamonds:"♦️",disappointed:"😞",disappointed_relieved:"😥",dizzy:"💫",dizzy_face:"😵",do_not_litter:"🚯",dog:"🐶",dog2:"🐕",dollar:"💵",dolls:"🎎",dolphin:"🐬",door:"🚪",doughnut:"🍩",dove:"🕊",dragon:"🐉",dragon_face:"🐲",dress:"👗",dromedary_camel:"🐪",drooling_face:"🤤",droplet:"💧",drum:"🥁",duck:"🦆",dvd:"📀","e-mail":"📧",eagle:"🦅",ear:"👂",ear_of_rice:"🌾",earth_africa:"🌍",earth_americas:"🌎",earth_asia:"🌏",egg:"🥚",eggplant:"🍆",eight_pointed_black_star:"✴️",eight_spoked_asterisk:"✳️",electric_plug:"🔌",elephant:"🐘",email:"✉️",end:"🔚",envelope_with_arrow:"📩",euro:"💶",european_castle:"🏰",european_post_office:"🏤",evergreen_tree:"🌲",exclamation:"❗️",expressionless:"😑",eye:"👁",eye_speech_bubble:"👁&zwj;🗨",eyeglasses:"👓",eyes:"👀",face_with_head_bandage:"🤕",face_with_thermometer:"🤒",fist_oncoming:"👊",factory:"🏭",fallen_leaf:"🍂",family_man_woman_boy:"👪",family_man_boy:"👨&zwj;👦",family_man_boy_boy:"👨&zwj;👦&zwj;👦",family_man_girl:"👨&zwj;👧",family_man_girl_boy:"👨&zwj;👧&zwj;👦",family_man_girl_girl:"👨&zwj;👧&zwj;👧",family_man_man_boy:"👨&zwj;👨&zwj;👦",family_man_man_boy_boy:"👨&zwj;👨&zwj;👦&zwj;👦",family_man_man_girl:"👨&zwj;👨&zwj;👧",family_man_man_girl_boy:"👨&zwj;👨&zwj;👧&zwj;👦",family_man_man_girl_girl:"👨&zwj;👨&zwj;👧&zwj;👧",family_man_woman_boy_boy:"👨&zwj;👩&zwj;👦&zwj;👦",family_man_woman_girl:"👨&zwj;👩&zwj;👧",family_man_woman_girl_boy:"👨&zwj;👩&zwj;👧&zwj;👦",family_man_woman_girl_girl:"👨&zwj;👩&zwj;👧&zwj;👧",family_woman_boy:"👩&zwj;👦",family_woman_boy_boy:"👩&zwj;👦&zwj;👦",family_woman_girl:"👩&zwj;👧",family_woman_girl_boy:"👩&zwj;👧&zwj;👦",family_woman_girl_girl:"👩&zwj;👧&zwj;👧",family_woman_woman_boy:"👩&zwj;👩&zwj;👦",family_woman_woman_boy_boy:"👩&zwj;👩&zwj;👦&zwj;👦",family_woman_woman_girl:"👩&zwj;👩&zwj;👧",family_woman_woman_girl_boy:"👩&zwj;👩&zwj;👧&zwj;👦",family_woman_woman_girl_girl:"👩&zwj;👩&zwj;👧&zwj;👧",fast_forward:"⏩",fax:"📠",fearful:"😨",feet:"🐾",female_detective:"🕵️&zwj;♀️",ferris_wheel:"🎡",ferry:"⛴",field_hockey:"🏑",file_cabinet:"🗄",file_folder:"📁",film_projector:"📽",film_strip:"🎞",fire:"🔥",fire_engine:"🚒",fireworks:"🎆",first_quarter_moon:"🌓",first_quarter_moon_with_face:"🌛",fish:"🐟",fish_cake:"🍥",fishing_pole_and_fish:"🎣",fist_raised:"✊",fist_left:"🤛",fist_right:"🤜",flags:"🎏",flashlight:"🔦",fleur_de_lis:"⚜️",flight_arrival:"🛬",flight_departure:"🛫",floppy_disk:"💾",flower_playing_cards:"🎴",flushed:"😳",fog:"🌫",foggy:"🌁",football:"🏈",footprints:"👣",fork_and_knife:"🍴",fountain:"⛲️",fountain_pen:"🖋",four_leaf_clover:"🍀",fox_face:"🦊",framed_picture:"🖼",free:"🆓",fried_egg:"🍳",fried_shrimp:"🍤",fries:"🍟",frog:"🐸",frowning:"😦",frowning_face:"☹️",frowning_man:"🙍&zwj;♂️",frowning_woman:"🙍",middle_finger:"🖕",fuelpump:"⛽️",full_moon:"🌕",full_moon_with_face:"🌝",funeral_urn:"⚱️",game_die:"🎲",gear:"⚙️",gem:"💎",gemini:"♊️",ghost:"👻",gift:"🎁",gift_heart:"💝",girl:"👧",globe_with_meridians:"🌐",goal_net:"🥅",goat:"🐐",golf:"⛳️",golfing_man:"🏌️",golfing_woman:"🏌️&zwj;♀️",gorilla:"🦍",grapes:"🍇",green_apple:"🍏",green_book:"📗",green_heart:"💚",green_salad:"🥗",grey_exclamation:"❕",grey_question:"❔",grimacing:"😬",grin:"😁",grinning:"😀",guardsman:"💂",guardswoman:"💂&zwj;♀️",guitar:"🎸",gun:"🔫",haircut_woman:"💇",haircut_man:"💇&zwj;♂️",hamburger:"🍔",hammer:"🔨",hammer_and_pick:"⚒",hammer_and_wrench:"🛠",hamster:"🐹",hand:"✋",handbag:"👜",handshake:"🤝",hankey:"💩",hatched_chick:"🐥",hatching_chick:"🐣",headphones:"🎧",hear_no_evil:"🙉",heart:"❤️",heart_decoration:"💟",heart_eyes:"😍",heart_eyes_cat:"😻",heartbeat:"💓",heartpulse:"💗",hearts:"♥️",heavy_check_mark:"✔️",heavy_division_sign:"➗",heavy_dollar_sign:"💲",heavy_heart_exclamation:"❣️",heavy_minus_sign:"➖",heavy_multiplication_x:"✖️",heavy_plus_sign:"➕",helicopter:"🚁",herb:"🌿",hibiscus:"🌺",high_brightness:"🔆",high_heel:"👠",hocho:"🔪",hole:"🕳",honey_pot:"🍯",horse:"🐴",horse_racing:"🏇",hospital:"🏥",hot_pepper:"🌶",hotdog:"🌭",hotel:"🏨",hotsprings:"♨️",hourglass:"⌛️",hourglass_flowing_sand:"⏳",house:"🏠",house_with_garden:"🏡",houses:"🏘",hugs:"🤗",hushed:"😯",ice_cream:"🍨",ice_hockey:"🏒",ice_skate:"⛸",icecream:"🍦",id:"🆔",ideograph_advantage:"🉐",imp:"👿",inbox_tray:"📥",incoming_envelope:"📨",tipping_hand_woman:"💁",information_source:"ℹ️",innocent:"😇",interrobang:"⁉️",iphone:"📱",izakaya_lantern:"🏮",jack_o_lantern:"🎃",japan:"🗾",japanese_castle:"🏯",japanese_goblin:"👺",japanese_ogre:"👹",jeans:"👖",joy:"😂",joy_cat:"😹",joystick:"🕹",kaaba:"🕋",key:"🔑",keyboard:"⌨️",keycap_ten:"🔟",kick_scooter:"🛴",kimono:"👘",kiss:"💋",kissing:"😗",kissing_cat:"😽",kissing_closed_eyes:"😚",kissing_heart:"😘",kissing_smiling_eyes:"😙",kiwi_fruit:"🥝",koala:"🐨",koko:"🈁",label:"🏷",large_blue_circle:"🔵",large_blue_diamond:"🔷",large_orange_diamond:"🔶",last_quarter_moon:"🌗",last_quarter_moon_with_face:"🌜",latin_cross:"✝️",laughing:"😆",leaves:"🍃",ledger:"📒",left_luggage:"🛅",left_right_arrow:"↔️",leftwards_arrow_with_hook:"↩️",lemon:"🍋",leo:"♌️",leopard:"🐆",level_slider:"🎚",libra:"♎️",light_rail:"🚈",link:"🔗",lion:"🦁",lips:"👄",lipstick:"💄",lizard:"🦎",lock:"🔒",lock_with_ink_pen:"🔏",lollipop:"🍭",loop:"➿",loud_sound:"🔊",loudspeaker:"📢",love_hotel:"🏩",love_letter:"💌",low_brightness:"🔅",lying_face:"🤥",m:"Ⓜ️",mag:"🔍",mag_right:"🔎",mahjong:"🀄️",mailbox:"📫",mailbox_closed:"📪",mailbox_with_mail:"📬",mailbox_with_no_mail:"📭",man:"👨",man_artist:"👨&zwj;🎨",man_astronaut:"👨&zwj;🚀",man_cartwheeling:"🤸&zwj;♂️",man_cook:"👨&zwj;🍳",man_dancing:"🕺",man_facepalming:"🤦&zwj;♂️",man_factory_worker:"👨&zwj;🏭",man_farmer:"👨&zwj;🌾",man_firefighter:"👨&zwj;🚒",man_health_worker:"👨&zwj;⚕️",man_in_tuxedo:"🤵",man_judge:"👨&zwj;⚖️",man_juggling:"🤹&zwj;♂️",man_mechanic:"👨&zwj;🔧",man_office_worker:"👨&zwj;💼",man_pilot:"👨&zwj;✈️",man_playing_handball:"🤾&zwj;♂️",man_playing_water_polo:"🤽&zwj;♂️",man_scientist:"👨&zwj;🔬",man_shrugging:"🤷&zwj;♂️",man_singer:"👨&zwj;🎤",man_student:"👨&zwj;🎓",man_teacher:"👨&zwj;🏫",man_technologist:"👨&zwj;💻",man_with_gua_pi_mao:"👲",man_with_turban:"👳",tangerine:"🍊",mans_shoe:"👞",mantelpiece_clock:"🕰",maple_leaf:"🍁",martial_arts_uniform:"🥋",mask:"😷",massage_woman:"💆",massage_man:"💆&zwj;♂️",meat_on_bone:"🍖",medal_military:"🎖",medal_sports:"🏅",mega:"📣",melon:"🍈",memo:"📝",men_wrestling:"🤼&zwj;♂️",menorah:"🕎",mens:"🚹",metal:"🤘",metro:"🚇",microphone:"🎤",microscope:"🔬",milk_glass:"🥛",milky_way:"🌌",minibus:"🚐",minidisc:"💽",mobile_phone_off:"📴",money_mouth_face:"🤑",money_with_wings:"💸",moneybag:"💰",monkey:"🐒",monkey_face:"🐵",monorail:"🚝",moon:"🌔",mortar_board:"🎓",mosque:"🕌",motor_boat:"🛥",motor_scooter:"🛵",motorcycle:"🏍",motorway:"🛣",mount_fuji:"🗻",mountain:"⛰",mountain_biking_man:"🚵",mountain_biking_woman:"🚵&zwj;♀️",mountain_cableway:"🚠",mountain_railway:"🚞",mountain_snow:"🏔",mouse:"🐭",mouse2:"🐁",movie_camera:"🎥",moyai:"🗿",mrs_claus:"🤶",muscle:"💪",mushroom:"🍄",musical_keyboard:"🎹",musical_note:"🎵",musical_score:"🎼",mute:"🔇",nail_care:"💅",name_badge:"📛",national_park:"🏞",nauseated_face:"🤢",necktie:"👔",negative_squared_cross_mark:"❎",nerd_face:"🤓",neutral_face:"😐",new:"🆕",new_moon:"🌑",new_moon_with_face:"🌚",newspaper:"📰",newspaper_roll:"🗞",next_track_button:"⏭",ng:"🆖",no_good_man:"🙅&zwj;♂️",no_good_woman:"🙅",night_with_stars:"🌃",no_bell:"🔕",no_bicycles:"🚳",no_entry:"⛔️",no_entry_sign:"🚫",no_mobile_phones:"📵",no_mouth:"😶",no_pedestrians:"🚷",no_smoking:"🚭","non-potable_water":"🚱",nose:"👃",notebook:"📓",notebook_with_decorative_cover:"📔",notes:"🎶",nut_and_bolt:"🔩",o:"⭕️",o2:"🅾️",ocean:"🌊",octopus:"🐙",oden:"🍢",office:"🏢",oil_drum:"🛢",ok:"🆗",ok_hand:"👌",ok_man:"🙆&zwj;♂️",ok_woman:"🙆",old_key:"🗝",older_man:"👴",older_woman:"👵",om:"🕉",on:"🔛",oncoming_automobile:"🚘",oncoming_bus:"🚍",oncoming_police_car:"🚔",oncoming_taxi:"🚖",open_file_folder:"📂",open_hands:"👐",open_mouth:"😮",open_umbrella:"☂️",ophiuchus:"⛎",orange_book:"📙",orthodox_cross:"☦️",outbox_tray:"📤",owl:"🦉",ox:"🐂",package:"📦",page_facing_up:"📄",page_with_curl:"📃",pager:"📟",paintbrush:"🖌",palm_tree:"🌴",pancakes:"🥞",panda_face:"🐼",paperclip:"📎",paperclips:"🖇",parasol_on_ground:"⛱",parking:"🅿️",part_alternation_mark:"〽️",partly_sunny:"⛅️",passenger_ship:"🛳",passport_control:"🛂",pause_button:"⏸",peace_symbol:"☮️",peach:"🍑",peanuts:"🥜",pear:"🍐",pen:"🖊",pencil2:"✏️",penguin:"🐧",pensive:"😔",performing_arts:"🎭",persevere:"😣",person_fencing:"🤺",pouting_woman:"🙎",phone:"☎️",pick:"⛏",pig:"🐷",pig2:"🐖",pig_nose:"🐽",pill:"💊",pineapple:"🍍",ping_pong:"🏓",pisces:"♓️",pizza:"🍕",place_of_worship:"🛐",plate_with_cutlery:"🍽",play_or_pause_button:"⏯",point_down:"👇",point_left:"👈",point_right:"👉",point_up:"☝️",point_up_2:"👆",police_car:"🚓",policewoman:"👮&zwj;♀️",poodle:"🐩",popcorn:"🍿",post_office:"🏣",postal_horn:"📯",postbox:"📮",potable_water:"🚰",potato:"🥔",pouch:"👝",poultry_leg:"🍗",pound:"💷",rage:"😡",pouting_cat:"😾",pouting_man:"🙎&zwj;♂️",pray:"🙏",prayer_beads:"📿",pregnant_woman:"🤰",previous_track_button:"⏮",prince:"🤴",princess:"👸",printer:"🖨",purple_heart:"💜",purse:"👛",pushpin:"📌",put_litter_in_its_place:"🚮",question:"❓",rabbit:"🐰",rabbit2:"🐇",racehorse:"🐎",racing_car:"🏎",radio:"📻",radio_button:"🔘",radioactive:"☢️",railway_car:"🚃",railway_track:"🛤",rainbow:"🌈",rainbow_flag:"🏳️&zwj;🌈",raised_back_of_hand:"🤚",raised_hand_with_fingers_splayed:"🖐",raised_hands:"🙌",raising_hand_woman:"🙋",raising_hand_man:"🙋&zwj;♂️",ram:"🐏",ramen:"🍜",rat:"🐀",record_button:"⏺",recycle:"♻️",red_circle:"🔴",registered:"®️",relaxed:"☺️",relieved:"😌",reminder_ribbon:"🎗",repeat:"🔁",repeat_one:"🔂",rescue_worker_helmet:"⛑",restroom:"🚻",revolving_hearts:"💞",rewind:"⏪",rhinoceros:"🦏",ribbon:"🎀",rice:"🍚",rice_ball:"🍙",rice_cracker:"🍘",rice_scene:"🎑",right_anger_bubble:"🗯",ring:"💍",robot:"🤖",rocket:"🚀",rofl:"🤣",roll_eyes:"🙄",roller_coaster:"🎢",rooster:"🐓",rose:"🌹",rosette:"🏵",rotating_light:"🚨",round_pushpin:"📍",rowing_man:"🚣",rowing_woman:"🚣&zwj;♀️",rugby_football:"🏉",running_man:"🏃",running_shirt_with_sash:"🎽",running_woman:"🏃&zwj;♀️",sa:"🈂️",sagittarius:"♐️",sake:"🍶",sandal:"👡",santa:"🎅",satellite:"📡",saxophone:"🎷",school:"🏫",school_satchel:"🎒",scissors:"✂️",scorpion:"🦂",scorpius:"♏️",scream:"😱",scream_cat:"🙀",scroll:"📜",seat:"💺",secret:"㊙️",see_no_evil:"🙈",seedling:"🌱",selfie:"🤳",shallow_pan_of_food:"🥘",shamrock:"☘️",shark:"🦈",shaved_ice:"🍧",sheep:"🐑",shell:"🐚",shield:"🛡",shinto_shrine:"⛩",ship:"🚢",shirt:"👕",shopping:"🛍",shopping_cart:"🛒",shower:"🚿",shrimp:"🦐",signal_strength:"📶",six_pointed_star:"🔯",ski:"🎿",skier:"⛷",skull:"💀",skull_and_crossbones:"☠️",sleeping:"😴",sleeping_bed:"🛌",sleepy:"😪",slightly_frowning_face:"🙁",slightly_smiling_face:"🙂",slot_machine:"🎰",small_airplane:"🛩",small_blue_diamond:"🔹",small_orange_diamond:"🔸",small_red_triangle:"🔺",small_red_triangle_down:"🔻",smile:"😄",smile_cat:"😸",smiley:"😃",smiley_cat:"😺",smiling_imp:"😈",smirk:"😏",smirk_cat:"😼",smoking:"🚬",snail:"🐌",snake:"🐍",sneezing_face:"🤧",snowboarder:"🏂",snowflake:"❄️",snowman:"⛄️",snowman_with_snow:"☃️",sob:"😭",soccer:"⚽️",soon:"🔜",sos:"🆘",sound:"🔉",space_invader:"👾",spades:"♠️",spaghetti:"🍝",sparkle:"❇️",sparkler:"🎇",sparkles:"✨",sparkling_heart:"💖",speak_no_evil:"🙊",speaker:"🔈",speaking_head:"🗣",speech_balloon:"💬",speedboat:"🚤",spider:"🕷",spider_web:"🕸",spiral_calendar:"🗓",spiral_notepad:"🗒",spoon:"🥄",squid:"🦑",stadium:"🏟",star:"⭐️",star2:"🌟",star_and_crescent:"☪️",star_of_david:"✡️",stars:"🌠",station:"🚉",statue_of_liberty:"🗽",steam_locomotive:"🚂",stew:"🍲",stop_button:"⏹",stop_sign:"🛑",stopwatch:"⏱",straight_ruler:"📏",strawberry:"🍓",stuck_out_tongue:"😛",stuck_out_tongue_closed_eyes:"😝",stuck_out_tongue_winking_eye:"😜",studio_microphone:"🎙",stuffed_flatbread:"🥙",sun_behind_large_cloud:"🌥",sun_behind_rain_cloud:"🌦",sun_behind_small_cloud:"🌤",sun_with_face:"🌞",sunflower:"🌻",sunglasses:"😎",sunny:"☀️",sunrise:"🌅",sunrise_over_mountains:"🌄",surfing_man:"🏄",surfing_woman:"🏄&zwj;♀️",sushi:"🍣",suspension_railway:"🚟",sweat:"😓",sweat_drops:"💦",sweat_smile:"😅",sweet_potato:"🍠",swimming_man:"🏊",swimming_woman:"🏊&zwj;♀️",symbols:"🔣",synagogue:"🕍",syringe:"💉",taco:"🌮",tada:"🎉",tanabata_tree:"🎋",taurus:"♉️",taxi:"🚕",tea:"🍵",telephone_receiver:"📞",telescope:"🔭",tennis:"🎾",tent:"⛺️",thermometer:"🌡",thinking:"🤔",thought_balloon:"💭",ticket:"🎫",tickets:"🎟",tiger:"🐯",tiger2:"🐅",timer_clock:"⏲",tipping_hand_man:"💁&zwj;♂️",tired_face:"😫",tm:"™️",toilet:"🚽",tokyo_tower:"🗼",tomato:"🍅",tongue:"👅",top:"🔝",tophat:"🎩",tornado:"🌪",trackball:"🖲",tractor:"🚜",traffic_light:"🚥",train:"🚋",train2:"🚆",tram:"🚊",triangular_flag_on_post:"🚩",triangular_ruler:"📐",trident:"🔱",triumph:"😤",trolleybus:"🚎",trophy:"🏆",tropical_drink:"🍹",tropical_fish:"🐠",truck:"🚚",trumpet:"🎺",tulip:"🌷",tumbler_glass:"🥃",turkey:"🦃",turtle:"🐢",tv:"📺",twisted_rightwards_arrows:"🔀",two_hearts:"💕",two_men_holding_hands:"👬",two_women_holding_hands:"👭",u5272:"🈹",u5408:"🈴",u55b6:"🈺",u6307:"🈯️",u6708:"🈷️",u6709:"🈶",u6e80:"🈵",u7121:"🈚️",u7533:"🈸",u7981:"🈲",u7a7a:"🈳",umbrella:"☔️",unamused:"😒",underage:"🔞",unicorn:"🦄",unlock:"🔓",up:"🆙",upside_down_face:"🙃",v:"✌️",vertical_traffic_light:"🚦",vhs:"📼",vibration_mode:"📳",video_camera:"📹",video_game:"🎮",violin:"🎻",virgo:"♍️",volcano:"🌋",volleyball:"🏐",vs:"🆚",vulcan_salute:"🖖",walking_man:"🚶",walking_woman:"🚶&zwj;♀️",waning_crescent_moon:"🌘",waning_gibbous_moon:"🌖",warning:"⚠️",wastebasket:"🗑",watch:"⌚️",water_buffalo:"🐃",watermelon:"🍉",wave:"👋",wavy_dash:"〰️",waxing_crescent_moon:"🌒",wc:"🚾",weary:"😩",wedding:"💒",weight_lifting_man:"🏋️",weight_lifting_woman:"🏋️&zwj;♀️",whale:"🐳",whale2:"🐋",wheel_of_dharma:"☸️",wheelchair:"♿️",white_check_mark:"✅",white_circle:"⚪️",white_flag:"🏳️",white_flower:"💮",white_large_square:"⬜️",white_medium_small_square:"◽️",white_medium_square:"◻️",white_small_square:"▫️",white_square_button:"🔳",wilted_flower:"🥀",wind_chime:"🎐",wind_face:"🌬",wine_glass:"🍷",wink:"😉",wolf:"🐺",woman:"👩",woman_artist:"👩&zwj;🎨",woman_astronaut:"👩&zwj;🚀",woman_cartwheeling:"🤸&zwj;♀️",woman_cook:"👩&zwj;🍳",woman_facepalming:"🤦&zwj;♀️",woman_factory_worker:"👩&zwj;🏭",woman_farmer:"👩&zwj;🌾",woman_firefighter:"👩&zwj;🚒",woman_health_worker:"👩&zwj;⚕️",woman_judge:"👩&zwj;⚖️",woman_juggling:"🤹&zwj;♀️",woman_mechanic:"👩&zwj;🔧",woman_office_worker:"👩&zwj;💼",woman_pilot:"👩&zwj;✈️",woman_playing_handball:"🤾&zwj;♀️",woman_playing_water_polo:"🤽&zwj;♀️",woman_scientist:"👩&zwj;🔬",woman_shrugging:"🤷&zwj;♀️",woman_singer:"👩&zwj;🎤",woman_student:"👩&zwj;🎓",woman_teacher:"👩&zwj;🏫",woman_technologist:"👩&zwj;💻",woman_with_turban:"👳&zwj;♀️",womans_clothes:"👚",womans_hat:"👒",women_wrestling:"🤼&zwj;♀️",womens:"🚺",world_map:"🗺",worried:"😟",wrench:"🔧",writing_hand:"✍️",x:"❌",yellow_heart:"💛",yen:"💴",yin_yang:"☯️",yum:"😋",zap:"⚡️",zipper_mouth_face:"🤐",zzz:"💤",octocat:'<img alt=":octocat:" height="20" width="20" align="absmiddle" src="https://assets-cdn.github.com/images/icons/emoji/octocat.png">',showdown:"<span style=\"font-family: 'Anonymous Pro', monospace; text-decoration: underline; text-decoration-style: dashed; text-decoration-color: #3e8b8a;text-underline-position: under;\">S</span>"},x.Converter=function(e){"use strict";var r,t,n={},i=[],l=[],o={},a=h,s={parsed:{},raw:"",format:""};for(r in e=e||{},p)p.hasOwnProperty(r)&&(n[r]=p[r]);if("object"!=typeof e)throw Error("Converter expects the passed parameter to be an object, but "+typeof e+" was passed instead.");for(t in e)e.hasOwnProperty(t)&&(n[t]=e[t]);function c(e,r){if(r=r||null,x.helper.isString(e)){if(r=e=x.helper.stdExtName(e),x.extensions[e]){console.warn("DEPRECATION WARNING: "+e+" is an old extension that uses a deprecated loading method.Please inform the developer that the extension should be updated!");var t=x.extensions[e],a=e;if("function"==typeof t&&(t=t(new x.Converter)),x.helper.isArray(t)||(t=[t]),!(a=g(t,a)).valid)throw Error(a.error);for(var n=0;n<t.length;++n)switch(t[n].type){case"lang":i.push(t[n]);break;case"output":l.push(t[n]);break;default:throw Error("Extension loader error: Type unrecognized!!!")}return}if(x.helper.isUndefined(d[e]))throw Error('Extension "'+e+'" could not be loaded. It was either not found or is not a valid extension.');e=d[e]}"function"==typeof e&&(e=e());a=g(e=x.helper.isArray(e)?e:[e],r);if(!a.valid)throw Error(a.error);for(var s=0;s<e.length;++s){switch(e[s].type){case"lang":i.push(e[s]);break;case"output":l.push(e[s])}if(e[s].hasOwnProperty("listeners"))for(var o in e[s].listeners)e[s].listeners.hasOwnProperty(o)&&u(o,e[s].listeners[o])}}function u(e,r){if(!x.helper.isString(e))throw Error("Invalid argument in converter.listen() method: name must be a string, but "+typeof e+" given");if("function"!=typeof r)throw Error("Invalid argument in converter.listen() method: callback must be a function, but "+typeof r+" given");o.hasOwnProperty(e)||(o[e]=[]),o[e].push(r)}n.extensions&&x.helper.forEach(n.extensions,c),this._dispatch=function(e,r,t,a){if(o.hasOwnProperty(e))for(var n=0;n<o[e].length;++n){var s=o[e][n](e,r,this,t,a);s&&void 0!==s&&(r=s)}return r},this.listen=function(e,r){return u(e,r),this},this.makeHtml=function(r){if(!r)return r;var e,t,a={gHtmlBlocks:[],gHtmlMdBlocks:[],gHtmlSpans:[],gUrls:{},gTitles:{},gDimensions:{},gListLevel:0,hashLinkCounts:{},langExtensions:i,outputModifiers:l,converter:this,ghCodeBlocks:[],metadata:{parsed:{},raw:"",format:""}};return r=(r=(r=(r=(r=r.replace(/¨/g,"¨T")).replace(/\$/g,"¨D")).replace(/\r\n/g,"\n")).replace(/\r/g,"\n")).replace(/\u00A0/g,"&nbsp;"),n.smartIndentationFix&&(t=(e=r).match(/^\s*/)[0].length,t=new RegExp("^\\s{0,"+t+"}","gm"),r=e.replace(t,"")),r="\n\n"+r+"\n\n",r=(r=x.subParser("detab")(r,n,a)).replace(/^[ \t]+$/gm,""),x.helper.forEach(i,function(e){r=x.subParser("runExtension")(e,r,n,a)}),r=x.subParser("metadata")(r,n,a),r=x.subParser("hashPreCodeTags")(r,n,a),r=x.subParser("githubCodeBlocks")(r,n,a),r=x.subParser("hashHTMLBlocks")(r,n,a),r=x.subParser("hashCodeTags")(r,n,a),r=x.subParser("stripLinkDefinitions")(r,n,a),r=x.subParser("blockGamut")(r,n,a),r=x.subParser("unhashHTMLSpans")(r,n,a),r=(r=(r=x.subParser("unescapeSpecialChars")(r,n,a)).replace(/¨D/g,"$$")).replace(/¨T/g,"¨"),r=x.subParser("completeHTMLDocument")(r,n,a),x.helper.forEach(l,function(e){r=x.subParser("runExtension")(e,r,n,a)}),s=a.metadata,r},this.makeMarkdown=this.makeMd=function(e,r){if(e=(e=(e=e.replace(/\r\n/g,"\n")).replace(/\r/g,"\n")).replace(/>[ \t]+</,">¨NBSP;<"),!r){if(!window||!window.document)throw new Error("HTMLParser is undefined. If in a webworker or nodejs environment, you need to provide a WHATWG DOM and HTML such as JSDOM");r=window.document}for(var r=r.createElement("div"),t=(r.innerHTML=e,{preList:function(e){for(var r=e.querySelectorAll("pre"),t=[],a=0;a<r.length;++a)if(1===r[a].childElementCount&&"code"===r[a].firstChild.tagName.toLowerCase()){var n=r[a].firstChild.innerHTML.trim(),s=r[a].firstChild.getAttribute("data-language")||"";if(""===s)for(var o=r[a].firstChild.className.split(" "),i=0;i<o.length;++i){var l=o[i].match(/^language-(.+)$/);if(null!==l){s=l[1];break}}n=x.helper.unescapeHTMLEntities(n),t.push(n),r[a].outerHTML='<precode language="'+s+'" precodenum="'+a.toString()+'"></precode>'}else t.push(r[a].innerHTML),r[a].innerHTML="",r[a].setAttribute("prenum",a.toString());return t}(r)}),a=(!function e(r){for(var t=0;t<r.childNodes.length;++t){var a=r.childNodes[t];3===a.nodeType?/\S/.test(a.nodeValue)||/^[ ]+$/.test(a.nodeValue)?(a.nodeValue=a.nodeValue.split("\n").join(" "),a.nodeValue=a.nodeValue.replace(/(\s)+/g,"$1")):(r.removeChild(a),--t):1===a.nodeType&&e(a)}}(r),r.childNodes),n="",s=0;s<a.length;s++)n+=x.subParser("makeMarkdown.node")(a[s],t);return n},this.setOption=function(e,r){n[e]=r},this.getOption=function(e){return n[e]},this.getOptions=function(){return n},this.addExtension=function(e,r){c(e,r=r||null)},this.useExtension=function(e){c(e)},this.setFlavor=function(e){if(!_.hasOwnProperty(e))throw Error(e+" flavor was not found");var r,t=_[e];for(r in a=e,t)t.hasOwnProperty(r)&&(n[r]=t[r])},this.getFlavor=function(){return a},this.removeExtension=function(e){x.helper.isArray(e)||(e=[e]);for(var r=0;r<e.length;++r){for(var t=e[r],a=0;a<i.length;++a)i[a]===t&&i.splice(a,1);for(var n=0;n<l.length;++n)l[n]===t&&l.splice(n,1)}},this.getAllExtensions=function(){return{language:i,output:l}},this.getMetadata=function(e){return e?s.raw:s.parsed},this.getMetadataFormat=function(){return s.format},this._setMetadataPair=function(e,r){s.parsed[e]=r},this._setMetadataFormat=function(e){s.format=e},this._setMetadataRaw=function(e){s.raw=e}},x.subParser("anchors",function(e,i,l){"use strict";function r(e,r,t,a,n,s,o){if(x.helper.isUndefined(o)&&(o=""),t=t.toLowerCase(),-1<e.search(/\(<?\s*>? ?(['"].*['"])?\)$/m))a="";else if(!a){if(a="#"+(t=t||r.toLowerCase().replace(/ ?\n/g," ")),x.helper.isUndefined(l.gUrls[t]))return e;a=l.gUrls[t],x.helper.isUndefined(l.gTitles[t])||(o=l.gTitles[t])}return e='<a href="'+(a=a.replace(x.helper.regexes.asteriskDashAndColon,x.helper.escapeCharactersCallback))+'"',""!==o&&null!==o&&(e+=' title="'+(o=(o=o.replace(/"/g,"&quot;")).replace(x.helper.regexes.asteriskDashAndColon,x.helper.escapeCharactersCallback))+'"'),i.openLinksInNewWindow&&!/^#/.test(a)&&(e+=' rel="noopener noreferrer" target="¨E95Eblank"'),e+=">"+r+"</a>"}return e=(e=(e=(e=(e=l.converter._dispatch("anchors.before",e,i,l)).replace(/\[((?:\[[^\]]*]|[^\[\]])*)] ?(?:\n *)?\[(.*?)]()()()()/g,r)).replace(/\[((?:\[[^\]]*]|[^\[\]])*)]()[ \t]*\([ \t]?<([^>]*)>(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/g,r)).replace(/\[((?:\[[^\]]*]|[^\[\]])*)]()[ \t]*\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/g,r)).replace(/\[([^\[\]]+)]()()()()()/g,r),i.ghMentions&&(e=e.replace(/(^|\s)(\\)?(@([a-z\d]+(?:[a-z\d.-]+?[a-z\d]+)*))/gim,function(e,r,t,a,n){if("\\"===t)return r+a;if(!x.helper.isString(i.ghMentionsLink))throw new Error("ghMentionsLink option must be a string");t="";return r+'<a href="'+i.ghMentionsLink.replace(/\{u}/g,n)+'"'+(t=i.openLinksInNewWindow?' rel="noopener noreferrer" target="¨E95Eblank"':t)+">"+a+"</a>"})),e=l.converter._dispatch("anchors.after",e,i,l)});var i=/([*~_]+|\b)(((https?|ftp|dict):\/\/|www\.)[^'">\s]+?\.[^'">\s]+?)()(\1)?(?=\s|$)(?!["<>])/gi,l=/([*~_]+|\b)(((https?|ftp|dict):\/\/|www\.)[^'">\s]+\.[^'">\s]+?)([.!?,()\[\]])?(\1)?(?=\s|$)(?!["<>])/gi,c=/()<(((https?|ftp|dict):\/\/|www\.)[^'">\s]+)()>()/gi,m=/(^|\s)(?:mailto:)?([A-Za-z0-9!#$%&'*+-/=?^_`{|}~.]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)(?=$|\s)/gim,f=/<()(?:mailto:)?([-.\w]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi;x.subParser("autoLinks",function(e,r,t){"use strict";return e=(e=(e=t.converter._dispatch("autoLinks.before",e,r,t)).replace(c,s(r))).replace(f,o(r,t)),e=t.converter._dispatch("autoLinks.after",e,r,t)}),x.subParser("simplifiedAutoLinks",function(e,r,t){"use strict";return r.simplifiedAutoLink?(e=t.converter._dispatch("simplifiedAutoLinks.before",e,r,t),e=(e=r.excludeTrailingPunctuationFromURLs?e.replace(l,s(r)):e.replace(i,s(r))).replace(m,o(r,t)),t.converter._dispatch("simplifiedAutoLinks.after",e,r,t)):e}),x.subParser("blockGamut",function(e,r,t){"use strict";return e=t.converter._dispatch("blockGamut.before",e,r,t),e=x.subParser("blockQuotes")(e,r,t),e=x.subParser("headers")(e,r,t),e=x.subParser("horizontalRule")(e,r,t),e=x.subParser("lists")(e,r,t),e=x.subParser("codeBlocks")(e,r,t),e=x.subParser("tables")(e,r,t),e=x.subParser("hashHTMLBlocks")(e,r,t),e=x.subParser("paragraphs")(e,r,t),e=t.converter._dispatch("blockGamut.after",e,r,t)}),x.subParser("blockQuotes",function(e,r,t){"use strict";e=t.converter._dispatch("blockQuotes.before",e,r,t);var a=/(^ {0,3}>[ \t]?.+\n(.+\n)*\n*)+/gm;return r.splitAdjacentBlockquotes&&(a=/^ {0,3}>[\s\S]*?(?:\n\n)/gm),e=(e+="\n\n").replace(a,function(e){return e=(e=(e=e.replace(/^[ \t]*>[ \t]?/gm,"")).replace(/¨0/g,"")).replace(/^[ \t]+$/gm,""),e=x.subParser("githubCodeBlocks")(e,r,t),e=(e=(e=x.subParser("blockGamut")(e,r,t)).replace(/(^|\n)/g,"$1  ")).replace(/(\s*<pre>[^\r]+?<\/pre>)/gm,function(e,r){return r.replace(/^  /gm,"¨0").replace(/¨0/g,"")}),x.subParser("hashBlock")("<blockquote>\n"+e+"\n</blockquote>",r,t)}),e=t.converter._dispatch("blockQuotes.after",e,r,t)}),x.subParser("codeBlocks",function(e,n,s){"use strict";e=s.converter._dispatch("codeBlocks.before",e,n,s);return e=(e=(e+="¨0").replace(/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=¨0))/g,function(e,r,t){var a="\n",r=x.subParser("outdent")(r,n,s);return r=x.subParser("encodeCode")(r,n,s),r="<pre><code>"+(r=(r=(r=x.subParser("detab")(r,n,s)).replace(/^\n+/g,"")).replace(/\n+$/g,""))+(a=n.omitExtraWLInCodeBlocks?"":a)+"</code></pre>",x.subParser("hashBlock")(r,n,s)+t})).replace(/¨0/,""),e=s.converter._dispatch("codeBlocks.after",e,n,s)}),x.subParser("codeSpans",function(e,n,s){"use strict";return e=(e=void 0===(e=s.converter._dispatch("codeSpans.before",e,n,s))?"":e).replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,function(e,r,t,a){return a=(a=a.replace(/^([ \t]*)/g,"")).replace(/[ \t]*$/g,""),a=r+"<code>"+(a=x.subParser("encodeCode")(a,n,s))+"</code>",a=x.subParser("hashHTMLSpans")(a,n,s)}),e=s.converter._dispatch("codeSpans.after",e,n,s)}),x.subParser("completeHTMLDocument",function(e,r,t){"use strict";if(!r.completeHTMLDocument)return e;e=t.converter._dispatch("completeHTMLDocument.before",e,r,t);var a,n="html",s="<!DOCTYPE HTML>\n",o="",i='<meta charset="utf-8">\n',l="",c="";for(a in void 0!==t.metadata.parsed.doctype&&(s="<!DOCTYPE "+t.metadata.parsed.doctype+">\n","html"!==(n=t.metadata.parsed.doctype.toString().toLowerCase())&&"html5"!==n||(i='<meta charset="utf-8">')),t.metadata.parsed)if(t.metadata.parsed.hasOwnProperty(a))switch(a.toLowerCase()){case"doctype":break;case"title":o="<title>"+t.metadata.parsed.title+"</title>\n";break;case"charset":i="html"===n||"html5"===n?'<meta charset="'+t.metadata.parsed.charset+'">\n':'<meta name="charset" content="'+t.metadata.parsed.charset+'">\n';break;case"language":case"lang":l=' lang="'+t.metadata.parsed[a]+'"',c+='<meta name="'+a+'" content="'+t.metadata.parsed[a]+'">\n';break;default:c+='<meta name="'+a+'" content="'+t.metadata.parsed[a]+'">\n'}return e=s+"<html"+l+">\n<head>\n"+o+i+c+"</head>\n<body>\n"+e.trim()+"\n</body>\n</html>",e=t.converter._dispatch("completeHTMLDocument.after",e,r,t)}),x.subParser("detab",function(e,r,t){"use strict";return e=(e=(e=(e=(e=(e=t.converter._dispatch("detab.before",e,r,t)).replace(/\t(?=\t)/g,"    ")).replace(/\t/g,"¨A¨B")).replace(/¨B(.+?)¨A/g,function(e,r){for(var t=r,a=4-t.length%4,n=0;n<a;n++)t+=" ";return t})).replace(/¨A/g,"    ")).replace(/¨B/g,""),e=t.converter._dispatch("detab.after",e,r,t)}),x.subParser("ellipsis",function(e,r,t){"use strict";return r.ellipsis?(e=(e=t.converter._dispatch("ellipsis.before",e,r,t)).replace(/\.\.\./g,"…"),t.converter._dispatch("ellipsis.after",e,r,t)):e}),x.subParser("emoji",function(e,r,t){"use strict";if(!r.emoji)return e;return e=(e=t.converter._dispatch("emoji.before",e,r,t)).replace(/:([\S]+?):/g,function(e,r){return x.helper.emojis.hasOwnProperty(r)?x.helper.emojis[r]:e}),e=t.converter._dispatch("emoji.after",e,r,t)}),x.subParser("encodeAmpsAndAngles",function(e,r,t){"use strict";return e=(e=(e=(e=(e=t.converter._dispatch("encodeAmpsAndAngles.before",e,r,t)).replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g,"&amp;")).replace(/<(?![a-z\/?$!])/gi,"&lt;")).replace(/</g,"&lt;")).replace(/>/g,"&gt;"),e=t.converter._dispatch("encodeAmpsAndAngles.after",e,r,t)}),x.subParser("encodeBackslashEscapes",function(e,r,t){"use strict";return e=(e=(e=t.converter._dispatch("encodeBackslashEscapes.before",e,r,t)).replace(/\\(\\)/g,x.helper.escapeCharactersCallback)).replace(/\\([`*_{}\[\]()>#+.!~=|:-])/g,x.helper.escapeCharactersCallback),e=t.converter._dispatch("encodeBackslashEscapes.after",e,r,t)}),x.subParser("encodeCode",function(e,r,t){"use strict";return e=(e=t.converter._dispatch("encodeCode.before",e,r,t)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/([*_{}\[\]\\=~-])/g,x.helper.escapeCharactersCallback),e=t.converter._dispatch("encodeCode.after",e,r,t)}),x.subParser("escapeSpecialCharsWithinTagAttributes",function(e,r,t){"use strict";return e=(e=(e=t.converter._dispatch("escapeSpecialCharsWithinTagAttributes.before",e,r,t)).replace(/<\/?[a-z\d_:-]+(?:[\s]+[\s\S]+?)?>/gi,function(e){return e.replace(/(.)<\/?code>(?=.)/g,"$1`").replace(/([\\`*_~=|])/g,x.helper.escapeCharactersCallback)})).replace(/<!(--(?:(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>/gi,function(e){return e.replace(/([\\`*_~=|])/g,x.helper.escapeCharactersCallback)}),e=t.converter._dispatch("escapeSpecialCharsWithinTagAttributes.after",e,r,t)}),x.subParser("githubCodeBlocks",function(e,s,o){"use strict";return s.ghCodeBlocks?(e=o.converter._dispatch("githubCodeBlocks.before",e,s,o),e=(e=(e+="¨0").replace(/(?:^|\n)(?: {0,3})(```+|~~~+)(?: *)([^\s`~]*)\n([\s\S]*?)\n(?: {0,3})\1/g,function(e,r,t,a){var n=s.omitExtraWLInCodeBlocks?"":"\n";return a=x.subParser("encodeCode")(a,s,o),a="<pre><code"+(t?' class="'+t+" language-"+t+'"':"")+">"+(a=(a=(a=x.subParser("detab")(a,s,o)).replace(/^\n+/g,"")).replace(/\n+$/g,""))+n+"</code></pre>",a=x.subParser("hashBlock")(a,s,o),"\n\n¨G"+(o.ghCodeBlocks.push({text:e,codeblock:a})-1)+"G\n\n"})).replace(/¨0/,""),o.converter._dispatch("githubCodeBlocks.after",e,s,o)):e}),x.subParser("hashBlock",function(e,r,t){"use strict";return e=(e=t.converter._dispatch("hashBlock.before",e,r,t)).replace(/(^\n+|\n+$)/g,""),e="\n\n¨K"+(t.gHtmlBlocks.push(e)-1)+"K\n\n",e=t.converter._dispatch("hashBlock.after",e,r,t)}),x.subParser("hashCodeTags",function(e,n,s){"use strict";e=s.converter._dispatch("hashCodeTags.before",e,n,s);return e=x.helper.replaceRecursiveRegExp(e,function(e,r,t,a){t=t+x.subParser("encodeCode")(r,n,s)+a;return"¨C"+(s.gHtmlSpans.push(t)-1)+"C"},"<code\\b[^>]*>","</code>","gim"),e=s.converter._dispatch("hashCodeTags.after",e,n,s)}),x.subParser("hashElement",function(e,r,t){"use strict";return function(e,r){return r=(r=(r=r.replace(/\n\n/g,"\n")).replace(/^\n/,"")).replace(/\n+$/g,""),r="\n\n¨K"+(t.gHtmlBlocks.push(r)-1)+"K\n\n"}}),x.subParser("hashHTMLBlocks",function(e,r,n){"use strict";e=n.converter._dispatch("hashHTMLBlocks.before",e,r,n);function t(e,r,t,a){return-1!==t.search(/\bmarkdown\b/)&&(e=t+n.converter.makeHtml(r)+a),"\n\n¨K"+(n.gHtmlBlocks.push(e)-1)+"K\n\n"}var a=["pre","div","h1","h2","h3","h4","h5","h6","blockquote","table","dl","ol","ul","script","noscript","form","fieldset","iframe","math","style","section","header","footer","nav","article","aside","address","audio","canvas","figure","hgroup","output","video","p"];r.backslashEscapesHTMLTags&&(e=e.replace(/\\<(\/?[^>]+?)>/g,function(e,r){return"&lt;"+r+"&gt;"}));for(var s=0;s<a.length;++s)for(var o=new RegExp("^ {0,3}(<"+a[s]+"\\b[^>]*>)","im"),i="<"+a[s]+"\\b[^>]*>",l="</"+a[s]+">";-1!==(c=x.helper.regexIndexOf(e,o));){var c=x.helper.splitAtIndex(e,c),u=x.helper.replaceRecursiveRegExp(c[1],t,i,l,"im");if(u===c[1])break;e=c[0].concat(u)}return e=e.replace(/(\n {0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,x.subParser("hashElement")(e,r,n)),e=(e=x.helper.replaceRecursiveRegExp(e,function(e){return"\n\n¨K"+(n.gHtmlBlocks.push(e)-1)+"K\n\n"},"^ {0,3}\x3c!--","--\x3e","gm")).replace(/(?:\n\n)( {0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g,x.subParser("hashElement")(e,r,n)),e=n.converter._dispatch("hashHTMLBlocks.after",e,r,n)}),x.subParser("hashHTMLSpans",function(e,r,t){"use strict";function a(e){return"¨C"+(t.gHtmlSpans.push(e)-1)+"C"}return e=(e=(e=(e=(e=t.converter._dispatch("hashHTMLSpans.before",e,r,t)).replace(/<[^>]+?\/>/gi,a)).replace(/<([^>]+?)>[\s\S]*?<\/\1>/g,a)).replace(/<([^>]+?)\s[^>]+?>[\s\S]*?<\/\1>/g,a)).replace(/<[^>]+?>/gi,a),e=t.converter._dispatch("hashHTMLSpans.after",e,r,t)}),x.subParser("unhashHTMLSpans",function(e,r,t){"use strict";e=t.converter._dispatch("unhashHTMLSpans.before",e,r,t);for(var a=0;a<t.gHtmlSpans.length;++a){for(var n=t.gHtmlSpans[a],s=0;/¨C(\d+)C/.test(n);){var o=RegExp.$1,n=n.replace("¨C"+o+"C",t.gHtmlSpans[o]);if(10===s){console.error("maximum nesting of 10 spans reached!!!");break}++s}e=e.replace("¨C"+a+"C",n)}return e=t.converter._dispatch("unhashHTMLSpans.after",e,r,t)}),x.subParser("hashPreCodeTags",function(e,n,s){"use strict";e=s.converter._dispatch("hashPreCodeTags.before",e,n,s);return e=x.helper.replaceRecursiveRegExp(e,function(e,r,t,a){t=t+x.subParser("encodeCode")(r,n,s)+a;return"\n\n¨G"+(s.ghCodeBlocks.push({text:e,codeblock:t})-1)+"G\n\n"},"^ {0,3}<pre\\b[^>]*>\\s*<code\\b[^>]*>","^ {0,3}</code>\\s*</pre>","gim"),e=s.converter._dispatch("hashPreCodeTags.after",e,n,s)}),x.subParser("headers",function(e,n,s){"use strict";e=s.converter._dispatch("headers.before",e,n,s);var o=isNaN(parseInt(n.headerLevelStart))?1:parseInt(n.headerLevelStart),r=n.smoothLivePreview?/^(.+)[ \t]*\n={2,}[ \t]*\n+/gm:/^(.+)[ \t]*\n=+[ \t]*\n+/gm,t=n.smoothLivePreview?/^(.+)[ \t]*\n-{2,}[ \t]*\n+/gm:/^(.+)[ \t]*\n-+[ \t]*\n+/gm,r=(e=(e=e.replace(r,function(e,r){var t=x.subParser("spanGamut")(r,n,s),r=n.noHeaderId?"":' id="'+i(r)+'"',r="<h"+o+r+">"+t+"</h"+o+">";return x.subParser("hashBlock")(r,n,s)})).replace(t,function(e,r){var t=x.subParser("spanGamut")(r,n,s),r=n.noHeaderId?"":' id="'+i(r)+'"',a=o+1,r="<h"+a+r+">"+t+"</h"+a+">";return x.subParser("hashBlock")(r,n,s)}),n.requireSpaceBeforeHeadingText?/^(#{1,6})[ \t]+(.+?)[ \t]*#*\n+/gm:/^(#{1,6})[ \t]*(.+?)[ \t]*#*\n+/gm);function i(e){var r=e=n.customizedHeaderId&&(r=e.match(/\{([^{]+?)}\s*$/))&&r[1]?r[1]:e,e=x.helper.isString(n.prefixHeaderId)?n.prefixHeaderId:!0===n.prefixHeaderId?"section-":"";return n.rawPrefixHeaderId||(r=e+r),r=(n.ghCompatibleHeaderId?r.replace(/ /g,"-").replace(/&amp;/g,"").replace(/¨T/g,"").replace(/¨D/g,"").replace(/[&+$,\/:;=?@"#{}|^¨~\[\]`\\*)(%.!'<>]/g,""):n.rawHeaderId?r.replace(/ /g,"-").replace(/&amp;/g,"&").replace(/¨T/g,"¨").replace(/¨D/g,"$").replace(/["']/g,"-"):r.replace(/[^\w]/g,"")).toLowerCase(),n.rawPrefixHeaderId&&(r=e+r),s.hashLinkCounts[r]?r=r+"-"+s.hashLinkCounts[r]++:s.hashLinkCounts[r]=1,r}return e=e.replace(r,function(e,r,t){var a=t,a=(n.customizedHeaderId&&(a=t.replace(/\s?\{([^{]+?)}\s*$/,"")),x.subParser("spanGamut")(a,n,s)),t=n.noHeaderId?"":' id="'+i(t)+'"',r=o-1+r.length,t="<h"+r+t+">"+a+"</h"+r+">";return x.subParser("hashBlock")(t,n,s)}),e=s.converter._dispatch("headers.after",e,n,s)}),x.subParser("horizontalRule",function(e,r,t){"use strict";e=t.converter._dispatch("horizontalRule.before",e,r,t);var a=x.subParser("hashBlock")("<hr />",r,t);return e=(e=(e=e.replace(/^ {0,2}( ?-){3,}[ \t]*$/gm,a)).replace(/^ {0,2}( ?\*){3,}[ \t]*$/gm,a)).replace(/^ {0,2}( ?_){3,}[ \t]*$/gm,a),e=t.converter._dispatch("horizontalRule.after",e,r,t)}),x.subParser("images",function(e,r,d){"use strict";function l(e,r,t,a,n,s,o,i){var l=d.gUrls,c=d.gTitles,u=d.gDimensions;if(t=t.toLowerCase(),i=i||"",-1<e.search(/\(<?\s*>? ?(['"].*['"])?\)$/m))a="";else if(""===a||null===a){if(a="#"+(t=""!==t&&null!==t?t:r.toLowerCase().replace(/ ?\n/g," ")),x.helper.isUndefined(l[t]))return e;a=l[t],x.helper.isUndefined(c[t])||(i=c[t]),x.helper.isUndefined(u[t])||(n=u[t].width,s=u[t].height)}r=r.replace(/"/g,"&quot;").replace(x.helper.regexes.asteriskDashAndColon,x.helper.escapeCharactersCallback);e='<img src="'+(a=a.replace(x.helper.regexes.asteriskDashAndColon,x.helper.escapeCharactersCallback))+'" alt="'+r+'"';return i&&x.helper.isString(i)&&(e+=' title="'+(i=i.replace(/"/g,"&quot;").replace(x.helper.regexes.asteriskDashAndColon,x.helper.escapeCharactersCallback))+'"'),n&&s&&(e=e+(' width="'+(n="*"===n?"auto":n))+'" height="'+(s="*"===s?"auto":s)+'"'),e+=" />"}return e=(e=(e=(e=(e=(e=d.converter._dispatch("images.before",e,r,d)).replace(/!\[([^\]]*?)] ?(?:\n *)?\[([\s\S]*?)]()()()()()/g,l)).replace(/!\[([^\]]*?)][ \t]*()\([ \t]?<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g,function(e,r,t,a,n,s,o,i){return l(e,r,t,a=a.replace(/\s/g,""),n,s,0,i)})).replace(/!\[([^\]]*?)][ \t]*()\([ \t]?<([^>]*)>(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(?:(["'])([^"]*?)\6))?[ \t]?\)/g,l)).replace(/!\[([^\]]*?)][ \t]*()\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g,l)).replace(/!\[([^\[\]]+)]()()()()()/g,l),e=d.converter._dispatch("images.after",e,r,d)}),x.subParser("italicsAndBold",function(e,r,t){"use strict";return e=t.converter._dispatch("italicsAndBold.before",e,r,t),e=r.literalMidWordUnderscores?(e=(e=e.replace(/\b___(\S[\s\S]*?)___\b/g,function(e,r){return"<strong><em>"+r+"</em></strong>"})).replace(/\b__(\S[\s\S]*?)__\b/g,function(e,r){return"<strong>"+r+"</strong>"})).replace(/\b_(\S[\s\S]*?)_\b/g,function(e,r){return"<em>"+r+"</em>"}):(e=(e=e.replace(/___(\S[\s\S]*?)___/g,function(e,r){return/\S$/.test(r)?"<strong><em>"+r+"</em></strong>":e})).replace(/__(\S[\s\S]*?)__/g,function(e,r){return/\S$/.test(r)?"<strong>"+r+"</strong>":e})).replace(/_([^\s_][\s\S]*?)_/g,function(e,r){return/\S$/.test(r)?"<em>"+r+"</em>":e}),e=r.literalMidWordAsterisks?(e=(e=e.replace(/([^*]|^)\B\*\*\*(\S[\s\S]*?)\*\*\*\B(?!\*)/g,function(e,r,t){return r+"<strong><em>"+t+"</em></strong>"})).replace(/([^*]|^)\B\*\*(\S[\s\S]*?)\*\*\B(?!\*)/g,function(e,r,t){return r+"<strong>"+t+"</strong>"})).replace(/([^*]|^)\B\*(\S[\s\S]*?)\*\B(?!\*)/g,function(e,r,t){return r+"<em>"+t+"</em>"}):(e=(e=e.replace(/\*\*\*(\S[\s\S]*?)\*\*\*/g,function(e,r){return/\S$/.test(r)?"<strong><em>"+r+"</em></strong>":e})).replace(/\*\*(\S[\s\S]*?)\*\*/g,function(e,r){return/\S$/.test(r)?"<strong>"+r+"</strong>":e})).replace(/\*([^\s*][\s\S]*?)\*/g,function(e,r){return/\S$/.test(r)?"<em>"+r+"</em>":e}),e=t.converter._dispatch("italicsAndBold.after",e,r,t)}),x.subParser("lists",function(e,d,c){"use strict";function p(e,r){c.gListLevel++,e=e.replace(/\n{2,}$/,"\n");var t=/(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[(x|X| )?])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(¨0| {0,3}([*+-]|\d+[.])[ \t]+))/gm,l=/\n[ \t]*\n(?!¨0)/.test(e+="¨0");return d.disableForced4SpacesIndentedSublists&&(t=/(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[(x|X| )?])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(¨0|\2([*+-]|\d+[.])[ \t]+))/gm),e=(e=e.replace(t,function(e,r,t,a,n,s,o){o=o&&""!==o.trim();var n=x.subParser("outdent")(n,d,c),i="";return s&&d.tasklists&&(i=' class="task-list-item" style="list-style-type: none;"',n=n.replace(/^[ \t]*\[(x|X| )?]/m,function(){var e='<input type="checkbox" disabled style="margin: 0px 0.35em 0.25em -1.6em; vertical-align: middle;"';return o&&(e+=" checked"),e+=">"})),n=n.replace(/^([-*+]|\d\.)[ \t]+[\S\n ]*/g,function(e){return"¨A"+e}),n="<li"+i+">"+(n=(n=r||-1<n.search(/\n{2,}/)?(n=x.subParser("githubCodeBlocks")(n,d,c),x.subParser("blockGamut")(n,d,c)):(n=(n=x.subParser("lists")(n,d,c)).replace(/\n$/,""),n=(n=x.subParser("hashHTMLBlocks")(n,d,c)).replace(/\n\n+/g,"\n\n"),(l?x.subParser("paragraphs"):x.subParser("spanGamut"))(n,d,c))).replace("¨A",""))+"</li>\n"})).replace(/¨0/g,""),c.gListLevel--,e=r?e.replace(/\s+$/,""):e}function h(e,r){if("ol"===r){r=e.match(/^ *(\d+)\./);if(r&&"1"!==r[1])return' start="'+r[1]+'"'}return""}function n(n,s,o){var e,i=d.disableForced4SpacesIndentedSublists?/^ ?\d+\.[ \t]/gm:/^ {0,3}\d+\.[ \t]/gm,l=d.disableForced4SpacesIndentedSublists?/^ ?[*+-][ \t]/gm:/^ {0,3}[*+-][ \t]/gm,c="ul"===s?i:l,u="";return-1!==n.search(c)?function e(r){var t=r.search(c),a=h(n,s);-1!==t?(u+="\n\n<"+s+a+">\n"+p(r.slice(0,t),!!o)+"</"+s+">\n",c="ul"===(s="ul"===s?"ol":"ul")?i:l,e(r.slice(t))):u+="\n\n<"+s+a+">\n"+p(r,!!o)+"</"+s+">\n"}(n):(e=h(n,s),u="\n\n<"+s+e+">\n"+p(n,!!o)+"</"+s+">\n"),u}return e=c.converter._dispatch("lists.before",e,d,c),e+="¨0",e=(e=c.gListLevel?e.replace(/^(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm,function(e,r,t){return n(r,-1<t.search(/[*+-]/g)?"ul":"ol",!0)}):e.replace(/(\n\n|^\n?)(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm,function(e,r,t,a){return n(t,-1<a.search(/[*+-]/g)?"ul":"ol",!1)})).replace(/¨0/,""),e=c.converter._dispatch("lists.after",e,d,c)}),x.subParser("metadata",function(e,r,a){"use strict";return r.metadata?(e=(e=(e=(e=a.converter._dispatch("metadata.before",e,r,a)).replace(/^\s*«««+(\S*?)\n([\s\S]+?)\n»»»+\n/,function(e,r,t){return n(t),"¨M"})).replace(/^\s*---+(\S*?)\n([\s\S]+?)\n---+\n/,function(e,r,t){return r&&(a.metadata.format=r),n(t),"¨M"})).replace(/¨M/g,""),a.converter._dispatch("metadata.after",e,r,a)):e;function n(e){(e=(e=(a.metadata.raw=e).replace(/&/g,"&amp;").replace(/"/g,"&quot;")).replace(/\n {4}/g," ")).replace(/^([\S ]+): +([\s\S]+?)$/gm,function(e,r,t){return a.metadata.parsed[r]=t,""})}}),x.subParser("outdent",function(e,r,t){"use strict";return e=(e=(e=t.converter._dispatch("outdent.before",e,r,t)).replace(/^(\t|[ ]{1,4})/gm,"¨0")).replace(/¨0/g,""),e=t.converter._dispatch("outdent.after",e,r,t)}),x.subParser("paragraphs",function(e,r,t){"use strict";for(var a=(e=(e=(e=t.converter._dispatch("paragraphs.before",e,r,t)).replace(/^\n+/g,"")).replace(/\n+$/g,"")).split(/\n{2,}/g),n=[],s=a.length,o=0;o<s;o++){var i=a[o];0<=i.search(/¨(K|G)(\d+)\1/g)?n.push(i):0<=i.search(/\S/)&&(i=(i=x.subParser("spanGamut")(i,r,t)).replace(/^([ \t]*)/g,"<p>"),i+="</p>",n.push(i))}for(s=n.length,o=0;o<s;o++){for(var l="",c=n[o],u=!1;/¨(K|G)(\d+)\1/.test(c);){var d=RegExp.$1,p=RegExp.$2;l=(l="K"===d?t.gHtmlBlocks[p]:u?x.subParser("encodeCode")(t.ghCodeBlocks[p].text,r,t):t.ghCodeBlocks[p].codeblock).replace(/\$/g,"$$$$"),c=c.replace(/(\n\n)?¨(K|G)\d+\2(\n\n)?/,l),/^<pre\b[^>]*>\s*<code\b[^>]*>/.test(c)&&(u=!0)}n[o]=c}return e=(e=(e=n.join("\n")).replace(/^\n+/g,"")).replace(/\n+$/g,""),t.converter._dispatch("paragraphs.after",e,r,t)}),x.subParser("runExtension",function(e,r,t,a){"use strict";return e.filter?r=e.filter(r,a.converter,t):e.regex&&((a=e.regex)instanceof RegExp||(a=new RegExp(a,"g")),r=r.replace(a,e.replace)),r}),x.subParser("spanGamut",function(e,r,t){"use strict";return e=t.converter._dispatch("spanGamut.before",e,r,t),e=x.subParser("codeSpans")(e,r,t),e=x.subParser("escapeSpecialCharsWithinTagAttributes")(e,r,t),e=x.subParser("encodeBackslashEscapes")(e,r,t),e=x.subParser("images")(e,r,t),e=x.subParser("anchors")(e,r,t),e=x.subParser("autoLinks")(e,r,t),e=x.subParser("simplifiedAutoLinks")(e,r,t),e=x.subParser("emoji")(e,r,t),e=x.subParser("underline")(e,r,t),e=x.subParser("italicsAndBold")(e,r,t),e=x.subParser("strikethrough")(e,r,t),e=x.subParser("ellipsis")(e,r,t),e=x.subParser("hashHTMLSpans")(e,r,t),e=x.subParser("encodeAmpsAndAngles")(e,r,t),r.simpleLineBreaks?/\n\n¨K/.test(e)||(e=e.replace(/\n+/g,"<br />\n")):e=e.replace(/  +\n/g,"<br />\n"),e=t.converter._dispatch("spanGamut.after",e,r,t)}),x.subParser("strikethrough",function(e,t,a){"use strict";return t.strikethrough&&(e=(e=a.converter._dispatch("strikethrough.before",e,t,a)).replace(/(?:~){2}([\s\S]+?)(?:~){2}/g,function(e,r){return r=r,"<del>"+(r=t.simplifiedAutoLink?x.subParser("simplifiedAutoLinks")(r,t,a):r)+"</del>"}),e=a.converter._dispatch("strikethrough.after",e,t,a)),e}),x.subParser("stripLinkDefinitions",function(i,l,c){"use strict";function e(e,r,t,a,n,s,o){return r=r.toLowerCase(),i.toLowerCase().split(r).length-1<2?e:(t.match(/^data:.+?\/.+?;base64,/)?c.gUrls[r]=t.replace(/\s/g,""):c.gUrls[r]=x.subParser("encodeAmpsAndAngles")(t,l,c),s?s+o:(o&&(c.gTitles[r]=o.replace(/"|'/g,"&quot;")),l.parseImgDimensions&&a&&n&&(c.gDimensions[r]={width:a,height:n}),""))}return i=(i=(i=(i+="¨0").replace(/^ {0,3}\[([^\]]+)]:[ \t]*\n?[ \t]*<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n\n|(?=¨0)|(?=\n\[))/gm,e)).replace(/^ {0,3}\[([^\]]+)]:[ \t]*\n?[ \t]*<?([^>\s]+)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n+|(?=¨0))/gm,e)).replace(/¨0/,"")}),x.subParser("tables",function(e,y,P){"use strict";if(!y.tables)return e;function r(e){for(var r=e.split("\n"),t=0;t<r.length;++t)/^ {0,3}\|/.test(r[t])&&(r[t]=r[t].replace(/^ {0,3}\|/,"")),/\|[ \t]*$/.test(r[t])&&(r[t]=r[t].replace(/\|[ \t]*$/,"")),r[t]=x.subParser("codeSpans")(r[t],y,P);var a,n,s,o,i,l=r[0].split("|").map(function(e){return e.trim()}),c=r[1].split("|").map(function(e){return e.trim()}),u=[],d=[],p=[],h=[];for(r.shift(),r.shift(),t=0;t<r.length;++t)""!==r[t].trim()&&u.push(r[t].split("|").map(function(e){return e.trim()}));if(l.length<c.length)return e;for(t=0;t<c.length;++t)p.push((a=c[t],/^:[ \t]*--*$/.test(a)?' style="text-align:left;"':/^--*[ \t]*:[ \t]*$/.test(a)?' style="text-align:right;"':/^:[ \t]*--*[ \t]*:$/.test(a)?' style="text-align:center;"':""));for(t=0;t<l.length;++t)x.helper.isUndefined(p[t])&&(p[t]=""),d.push((n=l[t],s=p[t],void 0,o="",n=n.trim(),"<th"+(o=y.tablesHeaderId||y.tableHeaderId?' id="'+n.replace(/ /g,"_").toLowerCase()+'"':o)+s+">"+(n=x.subParser("spanGamut")(n,y,P))+"</th>\n"));for(t=0;t<u.length;++t){for(var _=[],g=0;g<d.length;++g)x.helper.isUndefined(u[t][g]),_.push((i=u[t][g],"<td"+p[g]+">"+x.subParser("spanGamut")(i,y,P)+"</td>\n"));h.push(_)}for(var m=d,f=h,b="<table>\n<thead>\n<tr>\n",w=m.length,k=0;k<w;++k)b+=m[k];for(b+="</tr>\n</thead>\n<tbody>\n",k=0;k<f.length;++k){b+="<tr>\n";for(var v=0;v<w;++v)b+=f[k][v];b+="</tr>\n"}return b+="</tbody>\n</table>\n"}return e=(e=(e=(e=P.converter._dispatch("tables.before",e,y,P)).replace(/\\(\|)/g,x.helper.escapeCharactersCallback)).replace(/^ {0,3}\|?.+\|.+\n {0,3}\|?[ \t]*:?[ \t]*(?:[-=]){2,}[ \t]*:?[ \t]*\|[ \t]*:?[ \t]*(?:[-=]){2,}[\s\S]+?(?:\n\n|¨0)/gm,r)).replace(/^ {0,3}\|.+\|[ \t]*\n {0,3}\|[ \t]*:?[ \t]*(?:[-=]){2,}[ \t]*:?[ \t]*\|[ \t]*\n( {0,3}\|.+\|[ \t]*\n)*(?:\n|¨0)/gm,r),e=P.converter._dispatch("tables.after",e,y,P)}),x.subParser("underline",function(e,r,t){"use strict";return r.underline?(e=t.converter._dispatch("underline.before",e,r,t),e=(e=r.literalMidWordUnderscores?(e=e.replace(/\b___(\S[\s\S]*?)___\b/g,function(e,r){return"<u>"+r+"</u>"})).replace(/\b__(\S[\s\S]*?)__\b/g,function(e,r){return"<u>"+r+"</u>"}):(e=e.replace(/___(\S[\s\S]*?)___/g,function(e,r){return/\S$/.test(r)?"<u>"+r+"</u>":e})).replace(/__(\S[\s\S]*?)__/g,function(e,r){return/\S$/.test(r)?"<u>"+r+"</u>":e})).replace(/(_)/g,x.helper.escapeCharactersCallback),t.converter._dispatch("underline.after",e,r,t)):e}),x.subParser("unescapeSpecialChars",function(e,r,t){"use strict";return e=(e=t.converter._dispatch("unescapeSpecialChars.before",e,r,t)).replace(/¨E(\d+)E/g,function(e,r){r=parseInt(r);return String.fromCharCode(r)}),e=t.converter._dispatch("unescapeSpecialChars.after",e,r,t)}),x.subParser("makeMarkdown.blockquote",function(e,r){"use strict";var t="";if(e.hasChildNodes())for(var a=e.childNodes,n=a.length,s=0;s<n;++s){var o=x.subParser("makeMarkdown.node")(a[s],r);""!==o&&(t+=o)}return t="> "+(t=t.trim()).split("\n").join("\n> ")}),x.subParser("makeMarkdown.codeBlock",function(e,r){"use strict";var t=e.getAttribute("language"),e=e.getAttribute("precodenum");return"```"+t+"\n"+r.preList[e]+"\n```"}),x.subParser("makeMarkdown.codeSpan",function(e){"use strict";return"`"+e.innerHTML+"`"}),x.subParser("makeMarkdown.emphasis",function(e,r){"use strict";var t="";if(e.hasChildNodes()){t+="*";for(var a=e.childNodes,n=a.length,s=0;s<n;++s)t+=x.subParser("makeMarkdown.node")(a[s],r);t+="*"}return t}),x.subParser("makeMarkdown.header",function(e,r,t){"use strict";var t=new Array(t+1).join("#"),a="";if(e.hasChildNodes())for(var a=t+" ",n=e.childNodes,s=n.length,o=0;o<s;++o)a+=x.subParser("makeMarkdown.node")(n[o],r);return a}),x.subParser("makeMarkdown.hr",function(){"use strict";return"---"}),x.subParser("makeMarkdown.image",function(e){"use strict";var r="";return e.hasAttribute("src")&&(r=(r+="!["+e.getAttribute("alt")+"](")+"<"+e.getAttribute("src")+">",e.hasAttribute("width")&&e.hasAttribute("height")&&(r+=" ="+e.getAttribute("width")+"x"+e.getAttribute("height")),e.hasAttribute("title")&&(r+=' "'+e.getAttribute("title")+'"'),r+=")"),r}),x.subParser("makeMarkdown.links",function(e,r){"use strict";var t="";if(e.hasChildNodes()&&e.hasAttribute("href")){for(var a=e.childNodes,n=a.length,t="[",s=0;s<n;++s)t+=x.subParser("makeMarkdown.node")(a[s],r);t=(t+="](")+("<"+e.getAttribute("href")+">"),e.hasAttribute("title")&&(t+=' "'+e.getAttribute("title")+'"'),t+=")"}return t}),x.subParser("makeMarkdown.list",function(e,r,t){"use strict";var a="";if(!e.hasChildNodes())return"";for(var n=e.childNodes,s=n.length,o=e.getAttribute("start")||1,i=0;i<s;++i)void 0!==n[i].tagName&&"li"===n[i].tagName.toLowerCase()&&(a+=("ol"===t?o.toString()+". ":"- ")+x.subParser("makeMarkdown.listItem")(n[i],r),++o);return(a+="\n\x3c!-- --\x3e\n").trim()}),x.subParser("makeMarkdown.listItem",function(e,r){"use strict";for(var t="",a=e.childNodes,n=a.length,s=0;s<n;++s)t+=x.subParser("makeMarkdown.node")(a[s],r);return/\n$/.test(t)?t=t.split("\n").join("\n    ").replace(/^ {4}$/gm,"").replace(/\n\n+/g,"\n\n"):t+="\n",t}),x.subParser("makeMarkdown.node",function(e,r,t){"use strict";t=t||!1;var a="";if(3===e.nodeType)return x.subParser("makeMarkdown.txt")(e,r);if(8===e.nodeType)return"\x3c!--"+e.data+"--\x3e\n\n";if(1!==e.nodeType)return"";switch(e.tagName.toLowerCase()){case"h1":t||(a=x.subParser("makeMarkdown.header")(e,r,1)+"\n\n");break;case"h2":t||(a=x.subParser("makeMarkdown.header")(e,r,2)+"\n\n");break;case"h3":t||(a=x.subParser("makeMarkdown.header")(e,r,3)+"\n\n");break;case"h4":t||(a=x.subParser("makeMarkdown.header")(e,r,4)+"\n\n");break;case"h5":t||(a=x.subParser("makeMarkdown.header")(e,r,5)+"\n\n");break;case"h6":t||(a=x.subParser("makeMarkdown.header")(e,r,6)+"\n\n");break;case"p":t||(a=x.subParser("makeMarkdown.paragraph")(e,r)+"\n\n");break;case"blockquote":t||(a=x.subParser("makeMarkdown.blockquote")(e,r)+"\n\n");break;case"hr":t||(a=x.subParser("makeMarkdown.hr")(e,r)+"\n\n");break;case"ol":t||(a=x.subParser("makeMarkdown.list")(e,r,"ol")+"\n\n");break;case"ul":t||(a=x.subParser("makeMarkdown.list")(e,r,"ul")+"\n\n");break;case"precode":t||(a=x.subParser("makeMarkdown.codeBlock")(e,r)+"\n\n");break;case"pre":t||(a=x.subParser("makeMarkdown.pre")(e,r)+"\n\n");break;case"table":t||(a=x.subParser("makeMarkdown.table")(e,r)+"\n\n");break;case"code":a=x.subParser("makeMarkdown.codeSpan")(e,r);break;case"em":case"i":a=x.subParser("makeMarkdown.emphasis")(e,r);break;case"strong":case"b":a=x.subParser("makeMarkdown.strong")(e,r);break;case"del":a=x.subParser("makeMarkdown.strikethrough")(e,r);break;case"a":a=x.subParser("makeMarkdown.links")(e,r);break;case"img":a=x.subParser("makeMarkdown.image")(e,r);break;default:a=e.outerHTML+"\n\n"}return a}),x.subParser("makeMarkdown.paragraph",function(e,r){"use strict";var t="";if(e.hasChildNodes())for(var a=e.childNodes,n=a.length,s=0;s<n;++s)t+=x.subParser("makeMarkdown.node")(a[s],r);return t=t.trim()}),x.subParser("makeMarkdown.pre",function(e,r){"use strict";e=e.getAttribute("prenum");return"<pre>"+r.preList[e]+"</pre>"}),x.subParser("makeMarkdown.strikethrough",function(e,r){"use strict";var t="";if(e.hasChildNodes()){t+="~~";for(var a=e.childNodes,n=a.length,s=0;s<n;++s)t+=x.subParser("makeMarkdown.node")(a[s],r);t+="~~"}return t}),x.subParser("makeMarkdown.strong",function(e,r){"use strict";var t="";if(e.hasChildNodes()){t+="**";for(var a=e.childNodes,n=a.length,s=0;s<n;++s)t+=x.subParser("makeMarkdown.node")(a[s],r);t+="**"}return t}),x.subParser("makeMarkdown.table",function(e,r){"use strict";for(var t="",a=[[],[]],n=e.querySelectorAll("thead>tr>th"),s=e.querySelectorAll("tbody>tr"),o=0;o<n.length;++o){var i=x.subParser("makeMarkdown.tableCell")(n[o],r),l="---";if(n[o].hasAttribute("style"))switch(n[o].getAttribute("style").toLowerCase().replace(/\s/g,"")){case"text-align:left;":l=":---";break;case"text-align:right;":l="---:";break;case"text-align:center;":l=":---:"}a[0][o]=i.trim(),a[1][o]=l}for(o=0;o<s.length;++o)for(var c=a.push([])-1,u=s[o].getElementsByTagName("td"),d=0;d<n.length;++d){var p=" ";void 0!==u[d]&&(p=x.subParser("makeMarkdown.tableCell")(u[d],r)),a[c].push(p)}var h=3;for(o=0;o<a.length;++o)for(d=0;d<a[o].length;++d){var _=a[o][d].length;h<_&&(h=_)}for(o=0;o<a.length;++o){for(d=0;d<a[o].length;++d)1===o?":"===a[o][d].slice(-1)?a[o][d]=x.helper.padEnd(a[o][d].slice(-1),h-1,"-")+":":a[o][d]=x.helper.padEnd(a[o][d],h,"-"):a[o][d]=x.helper.padEnd(a[o][d],h);t+="| "+a[o].join(" | ")+" |\n"}return t.trim()}),x.subParser("makeMarkdown.tableCell",function(e,r){"use strict";var t="";if(!e.hasChildNodes())return"";for(var a=e.childNodes,n=a.length,s=0;s<n;++s)t+=x.subParser("makeMarkdown.node")(a[s],r,!0);return t.trim()}),x.subParser("makeMarkdown.txt",function(e){"use strict";e=e.nodeValue;return e=(e=e.replace(/ +/g," ")).replace(/¨NBSP;/g," "),e=(e=(e=(e=(e=(e=(e=(e=(e=x.helper.unescapeHTMLEntities(e)).replace(/([*_~|`])/g,"\\$1")).replace(/^(\s*)>/g,"\\$1>")).replace(/^#/gm,"\\#")).replace(/^(\s*)([-=]{3,})(\s*)$/,"$1\\$2$3")).replace(/^( {0,3}\d+)\./gm,"$1\\.")).replace(/^( {0,3})([+-])/gm,"$1\\$2")).replace(/]([\s]*)\(/g,"\\]$1\\(")).replace(/^ {0,3}\[([\S \t]*?)]:/gm,"\\[$1]:")});"function"==typeof define&&define.amd?define(function(){"use strict";return x}):"undefined"!=typeof module&&module.exports?module.exports=x:this.showdown=x}.call(this);

/* <script src=../Modulo.html></script><style type=f> */

/*
 * Modulo Docs Markdown
 * An improved Markdown parser for Modulo
 * */
modulo.config.markdown = {
    tags: { // Generic, paragraph-like block-level tags (WIP: Switching to block and inline)
        '#': 'h1',
        '##': 'h2',
        '###': 'h3',
        '####': 'h4',
        '#####': 'h5',
        '######': 'h6',
        '>': 'blockquote',
        '* ': 'li',
        '-': 'li',
        '---': 'hr',
        '    ': 'pre',
    },
    typographySyntax: [ // Generic, paragraph-like block-level tags
        [ /^----*/, 'hr' ],
        [ /^    /, 'pre' ],
        [ /^######/, 'h6' ],
        [ /^#####/, 'h5' ],
        [ /^####/, 'h4' ],
        [ /^###/, 'h3' ],
        [ /^##/, 'h2' ],
        [ /^#/, 'h1' ],
        [ /^/, 'p' ], // matches any string, including empty
    ],
    blockTypes: { // Block behavior, and what types of HTML elements to contain
        blockquote: { innerTag: '' },
        ul: { innerTag: '<li>' },
        ol: { innerTag: '<li>' },
        table: {
            innerTag: '<tr><td>',
            splitTag: '<td>',
            splitRE: /\-*\|\-*/g, // cell separators
        },
    },
    blockSyntax: [ // Block element containers, in order of checking
        [ /(^|\n)>\s*/g, 'blockquote' ],
        [ /(^|\n)[\-\*\+](?!\*)/g, 'ul' ],
        [ /(^|\n)[0-9]+[\.\)]/g, 'ol' ],
        [ /(^|\n)\|/g, 'table' ],
    ],
    /*blockTags: [ // Block element containers
        [ /(^|\n)>/g,               [ 'blockquote' ], 'p', ],
        [ /(^|\n)[\*\+-]/g,         [ 'ul', 'li' ], 'li', ],
        [ /(^|\n)[0-9]+[\.\)]/g,    [ 'ol', 'li' ], 'li', ],
        [ /(^|\n)\|/g,              [ 'table', 'tbody', 'td', 'tr' ], 'tr', /(^|\n)\|/g, 'td', ],
    ],*/
    inlineTags: [ // Inline element containers
        [ /\!\[([^\]]+)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" />' ],
        [ /\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>' ],
        [ /_([^_`]+)_/g, '<em>$1</em>' ],
        [ /`([^`]+)`/g, '<code>$1</code>' ],
        [ /\*\*([^\*]+)\*\*/g, '<strong>$1</strong>' ],
        [ /\*([^\*]+)\*/g, '<em>$1</em>' ],
    ],
    literalPrefix: '<', // Use a tag that starts with '<' as the indicator
    openComment: '<!--', // Use HTML syntax for comments
    closeComment: '-->',
    codeFenceSyntax: '```', // Use ``` for fenced blocks
    codeFenceExtraSyntax: null, // Set to use for extra properties
    codeFenceTag: 'pre', // Convert fenced blocks to this
    searchHighlight: null, // Set this to cause a universal "highlight" effect
    searchResults: [ ], // Will get filled (globally) as results come back
    markdownUtil: 'moduloMarkdown',
    searchStyle: 'background: yellow; color: black;',
}


// "QuickDemo" and "Showdown" support: 
modulo.config.markdown.codeFenceTag = "x-QuickDemo" // Convert fenced blocks to this
modulo.config.markdown.codeFenceExtraSyntax = 'edit:'
modulo.config.markdown.markdownUtil = 'showdownConvert'


modulo.util.highlightSearch = (text) => {
    const { searchHighlight, searchStyle, searchResults } = modulo.config.markdown
    const fuzzy = '.?[^A-Z0-9]*'
    const s = searchHighlight.split(/ /g).join(fuzzy)
    const re = new RegExp('(.{0,20})(' + s + ')(.{0,20})', 'gi')
    text = text.replace(re, (m, m1, m2, m3) => {
        searchResults.push([ m1, m2, m3 ])
        return `${ m1 }<span md-search style="${ searchStyle }">${ m2 }</span>${ m3 }`
    })
    return text
}

modulo.util.markdownEscape = (text) => {
    // Utility function to escape HTML special chars & handle closing script
    // tag short-hands expansions. Explanation: Without the "script-tag"
    // shorthands of <-script> for closing tag, it's impossible to mention
    // these in code snippets within a <script type=md> tag without closing it.
    const { searchHighlight } = modulo.config.markdown
    text = (text + '')
        .replace(/<-(script)>/ig, '<' + '/$1>')
        .replace(/([\n\s])\/(script)>/ig, '$1<' + '/$2>')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/'/g, '&#x27;').replace(/"/g, '&quot;')
    if (searchHighlight) { // If specified, assumes utils.highlightSearch
        text = modulo.util.highlightSearch(text)
    }
    return text;
}

modulo.util.parseMarkdownBlocks = (text) => {
    const { blockSyntax, typographySyntax, blockTypes } = modulo.config.markdown
    const blocks = [ ]
    let children = [ ]
    let name = null
    function pushBlock(next) { // TODO: Can I refactor this into the loop?
        if (children.length && (next === false || name !== next)) { // Snip off this block
            if (!name) { // typography
                for (let text of children) {
                    const [ re, name ] = typographySyntax.find(([ re ]) => re.exec(text.trim()))
                    text = (name === 'p') ? text : text.replace(re, '')
                    blocks.push({ name, text })
                }
            } else {
                blocks.push({ name, children, block: blockTypes[name] })
            }
            children = [ ] // create new empty array
        }
    }
    for (const code of text.split(/\n\r?\n\r?/gi)) { // Loop through \n\n
        if (!code.trim()) { // add & skip as empty, since no matchers for empty
            children.push(code)
            pushBlock(null)
        } else { // Otherwise, split by block
            const [ re, next ] = blockSyntax.find(([ re ]) => re.exec(code.trim())) || [ ]
            pushBlock(next)
            const { innerTag } = (blockTypes[next] || { })
            const nextChildren = innerTag ? code.split(re) : [ code.replace(re, '\n') ]
            children.push(...nextChildren) // Split by children if inner-tag
            name = next
        }
    }
    pushBlock(false) // ensure the last tag gets pushed
    return blocks
};

modulo.util.moduloMarkdown = (content, parentOut = null) => {
    const { markdownEscape, moduloMarkdown, parseMarkdownBlocks } = modulo.util
    const { inlineTags } = modulo.config.markdown
    const out = parentOut || []
    for (const { name, text, children, block } of parseMarkdownBlocks(content)) { // Loop through
        out.push(`<${ name }>`)
        if (children) { // Container, recurse
            for (let content of children) {
                if (content.trim() || block.allowEmpty) {
                    out.push(block.innerTag)
                    if (block.splitTag) { // E.g. table
                        content = block.splitTag + content.split(block.splitRE).join(block.splitTag)
                    }
                    moduloMarkdown(content, out) // Recursively parse
                }
            }
        } else { // Has direct inline text -- e.g. typography
            let content = markdownEscape(text)
            for (const [ regexp, replacement ] of inlineTags) {
                content = content.replace(regexp, replacement)
            }
            out.push(content)
        }
        out.push(`</${ name }>`)
    }
    return parentOut ? null : out.join('\n')
}


// Converts Markdown into HTML, using default tags, or optional extra tags
// Usage Example:   {{ myhtml|markdown|safe }}
if (modulo.config.file) {
    modulo.config.file.Filter = 'markdown' // Ensure it's default for File
}
modulo.templateFilter.markdown = (content) => {
    const { markdownEscape } = modulo.util
    let {
        closeComment,
        codeFenceExtraSyntax,
        codeFenceSyntax,
        codeFenceTag,
        literalPrefix,
        openComment,
        markdownUtil,
    } = modulo.config.markdown
    if (modulo.argv[0] === 'search') { // activate static / search display mode
        markdownUtil = 'moduloMarkdown' // Use fast / naive markdown parsing
        codeFenceTag = 'pre' // Fence code with "pre" tags, no demos or syntax
    }

    const endsFenceRE = new RegExp(codeFenceSyntax + '[\n\s]*$')
    const out = []

    function emitMarkdown() {
        const html = modulo.util[markdownUtil](markdownBuffer.join('\n\n'))
        markdownBuffer = null
        out.push(html)
    }

    function bufferMarkdown(code) {
        markdownBuffer = markdownBuffer || []
        markdownBuffer.push(code)
    }

    function emit(code) {
        if (markdownBuffer) {
            emitMarkdown()
        }
        out.push(code)
    }

    const strip3 = s => s.replace(/^\s\s?\s?/, '') // Ignore 0-3 WS chars
    let literal = null
    let codeLiteral = null
    let comment = false
    let markdownBuffer = null
    for (let code of content.split(/\n\r?\n\r?/gi)) { // Loop through \n\n
        if (!(literal || codeLiteral || comment)) {
            if (strip3(code).startsWith(openComment)) { // Comment
                comment = true // ignore entire line
            } else if (strip3(code).startsWith(codeFenceSyntax)) { // Fence
                code = strip3(code)
                const firstLine = code.split('\n')[0] // parse mode
                code = code.substr(firstLine.length + 1) // the +1 is for \n
                codeLiteral = firstLine.split(codeFenceSyntax)[1] || 'modulo'
                // Check for extra properties for the code editor, e.g. demo
                let extra = ''
                const secondLine = code.split('\n')[0] // parse editor settings
                if (codeFenceExtraSyntax && secondLine.includes(codeFenceExtraSyntax)) {
                    extra = secondLine.split(codeFenceExtraSyntax)[1].trim()
                    code = code.substr(secondLine.length + 1)
                }
                emit(`<${ codeFenceTag } mode="${ codeLiteral }" ${ extra } value="`)
            } else if (strip3(code).startsWith(literalPrefix)) { // HTML tag
                code = strip3(code)
                literal = code.split(/[^a-zA-Z0-9_-]/)[1] // Get tag name
            }
        }

        if (comment) { // Comment - ignore
            comment = !code.includes(closeComment) // continue only if no close
        } else if (codeLiteral) { // Fenced code snippet -- handle differently
            if (endsFenceRE.test(code)) { // Reached end of code fence
                code = code.replace(endsFenceRE, '') // remove ending fence
                codeLiteral = null // end the code literal
            }
            emit(markdownEscape(code) + (codeLiteral ? '\n\n' : ''))
            if (codeLiteral === null) {
                emit(`"></${ codeFenceTag }>\n`)
            }
        } else if (literal) { // Literal HTML: Parse until a line ends with closing tag
            emit(code + '\n\n')
            if (code.endsWith(`</${ literal }>`)) {
                literal = null // ends with close - stop literal
            }
        } else {
            bufferMarkdown(code)
        }
    }
    emit('') // Ensure markdown buffer is empty
    return out.join('')
}

/* <script src=../Modulo.html></script><style type=f> */
/*
 * "modulo-toc-helpers" - An example library
 * */


// A little helper to detect when active:
// Usage:   {% if row|ifactive %}
//    or:   class="{{ row|ifactive:'active-cls' }}
Modulo.ModuloTOCHelper = modulo => {
    const HEADER_RE = /<h([1-6])\s*([^>]*)>([^<]+)<.h[1-6]>/gi;

    function html2toc(html) { // convert html to ToC structure
        const toc = [];
        for (const [ match, level, attrs, title ] of html.matchAll(HEADER_RE)) {
            let id = null;
            if (attrs && attrs.includes("id")) {
                id = attrs.split('id="').pop().split('"').shift();
            }
            toc.push({ match, level: Number(level || 0), attrs, title, id });
        }
        return toc
    }

    function ifactive(row, cls = 'active') {
        const path = (window.location.pathname +'')
        return path.endsWith(row[0]) ? cls : '';
    }

    // Checks if it's the "index.html" of a collapsible item in the page list
    function istop(row) {
        const collapsedDirs = modulo.definitions.contentlist.collapse.split(/,/g).map(s => '/' + s + '/')
        const collapsedDirsRE = new RegExp('(' + collapsedDirs.join('|') + ')')
        return row[0].endsWith('/index.html') && collapsedDirsRE.exec('/' + row[0])
    }

    // Checks if ANYTHING has been un-collapsed / selected, of all the rows
    function selectedtop(rows) {
        const collapsedDirs = modulo.definitions.contentlist.collapse.split(/,/g).map(s => '/' + s + '/')
        const collapsedDirsRE = new RegExp('(' + collapsedDirs.join('|') + ')')
        const path = (window.location.pathname +'')
        return collapsedDirs.find(s => path.includes(s))
    }

    // A little helper to detect when a directory is "collapsed" or not
    function isvisible(row) {
        const collapsedDirs = modulo.definitions.contentlist.collapse.split(/,/g).map(s => '/' + s + '/')
        const collapsedDirsRE = new RegExp('(' + collapsedDirs.join('|') + ')')
        const path = (window.location.pathname +'')
        const selected = collapsedDirs.find(s => path.includes(s))
        return selected ? ('/' + row[0]).includes(selected) : !collapsedDirsRE.exec('/' + row[0])
    }

    // A Syntax Highlighter that in turn uses hljs.highlight
    // Usage:   {% if code|highlight:'html'|safe %}
    function highlight(text, lang = 'django') {
        const language = lang.includes('modulo') ? 'django' : lang; // rename modulo -> django
        let html = hljs.highlight(text, { language }).value;
        // Add in colors for Modulo tag names / attributes
        if (lang.includes('modulo')) {
            html = html.replace(/"hljs-name">([A-Z])/g, '"hljs-modulo-deftype">$1');
            html = html.replace(/"hljs-attr">(-[a-z])/g, '"hljs-modulo-defprocessor">$1'); // lowercase, dash prefixed
            html = html.replace(/"hljs-attr">([A-Z])/g, '"hljs-modulo-deftype-attr">$1');
            html = html.replace(/"hljs-name">([a-z]+-[A-Z])/g, '"hljs-modulo-component-tag">$1');
            html = html.replace(/"hljs-string">(true|false|null)/g, '"hljs-modulo-attr-value-lit">$1');
            html = html.replace(/"hljs-string">([A-Za-z])/g, '"hljs-modulo-attr-value">$1');
            html = html.replace(/"hljs-string">([0-9\[\{])/g, '"hljs-modulo-attr-value-lit">$1');
        }
        return html
    }


    return { html2toc, ifactive, highlight, isvisible, selectedtop, istop }
}; /* End of ModuloTOCHelper */


Object.assign(modulo.templateFilter, Modulo.ModuloTOCHelper(modulo))

modulo.registry.modules.configuration = function configuration (modulo) { 
    // Configuration script to register showdown and configure markdown 
    if (modulo.DEV) {
        modulo.util.showdownConvert = function showdownConvert (text) {
            return (new showdown.Converter()).makeHtml(text)
        }
        const content = modulo.stores.CACHE.getItem(modulo.filePath)
        if (content) { // Viewing a content file, mount Page
            delete modulo.stores.CACHE.data.fdata[modulo.filePath]
            modulo.docsContent = modulo.contentType.MD(content)
            document.body.innerHTML = '<x-Page rootat="https://modulohtml.org/"><docs-Page></docs-Page></x-Page>'
        }
    }
}
modulo.registry.modules.Page = function Page (modulo) { const def = modulo.definitions['Page'];
class docs_Page extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, docs_Page);
window.customElements.define(def.TagName, docs_Page);
return docs_Page;}
modulo.registry.modules.Search = function Search (modulo) { const def = modulo.definitions['Search'];
class x_Search extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_Search);
window.customElements.define(def.TagName, x_Search);
return x_Search;}
modulo.registry.modules.SyntaxHighlighter = function SyntaxHighlighter (modulo) { const def = modulo.definitions['SyntaxHighlighter'];
class x_SyntaxHighlighter extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_SyntaxHighlighter);
window.customElements.define(def.TagName, x_SyntaxHighlighter);
return x_SyntaxHighlighter;}
modulo.registry.modules.MirrorEditor = function MirrorEditor (modulo) { const def = modulo.definitions['MirrorEditor'];
class x_MirrorEditor extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_MirrorEditor);
window.customElements.define(def.TagName, x_MirrorEditor);
return x_MirrorEditor;}
modulo.registry.modules.TableOfContents = function TableOfContents (modulo) { const def = modulo.definitions['TableOfContents'];
class x_TableOfContents extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_TableOfContents);
window.customElements.define(def.TagName, x_TableOfContents);
return x_TableOfContents;}
modulo.registry.modules.QuickDemo = function QuickDemo (modulo) { const def = modulo.definitions['QuickDemo'];
class x_QuickDemo extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_QuickDemo);
window.customElements.define(def.TagName, x_QuickDemo);
return x_QuickDemo;}
modulo.registry.modules.Page_template = function Page_template (modulo) { return function (CTX, G) { var OUT=[];
if (CTX.global.docsContent) {
OUT.push("\n        <meta charset=\"utf8\">\n        <title>");
OUT.push(G.filters.escape(CTX.global.docsContent.title));
OUT.push(" - Modulo Documentation</title>\n    ");
}
OUT.push("\n    <div class=\"layout\">\n        <nav class=\"page-nav\">\n            ");
if (!(CTX.global.definitions.contentlist)) {
OUT.push("\n            <a style=\"font-size:60px;text-align:center;display:block;font-weight:200\" href=\"");
OUT.push(G.filters.escape(CTX.global.rootPath));
OUT.push("\">ᵐ°dᵘ⁄o</a>\n            <ul style=\"position: sticky; top: 1px\">\n                <li class=\"toc--outer\">\n                    <p><a style=\"font-size: 70%\" title=\"Download Modulo Docs as a offline-friendly zip\" href=\"https://codeberg.org/modulo/docs/archive/main.zip\">\n                            ⤓ docs-main.zip</a>\n                        <tt>v");
OUT.push(G.filters.escape(CTX.global.config.modulo.version));
OUT.push("</tt>\n                    </p>\n                </li>\n            ");
} else {
OUT.push("\n            <ul style=\"position: sticky; top: 86px\">\n            ");
}
OUT.push("\n                ");
var ARR0=CTX.global.definitions.sidebar.data;for (var KEY in ARR0) {CTX. row=ARR0[KEY];
OUT.push("\n                    ");
if (G.filters["get"](CTX.row,2)) {
OUT.push("<li class=\"toc--outer\"><h3>");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,2)));
OUT.push("</h3></li>");
}
OUT.push("\n                    <li class=\"toc--");
OUT.push(G.filters.escape(G.filters["ifactive"](CTX.row)));
OUT.push("\"><a href=\"");
OUT.push(G.filters.escape(CTX.global.rootPath));
OUT.push(G.filters.escape(G.filters["get"](CTX.row,0)));
OUT.push("\">");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,1)));
OUT.push("</a></li>\n                ");
}
OUT.push("\n            </ul>\n        </ul></nav>\n        <main class=\"page-container\">\n            ");
if (CTX.global.docsContent) {
OUT.push("\n                ");
if(1){CTX.html =G.filters["markdown"](CTX.global.docsContent.body);

OUT.push("\n                    ");
if (!(CTX.global.docsContent.skiptoc)) {
OUT.push("\n                        <x-tableofcontents toc=\"");
OUT.push(G.filters.escape(G.filters["json"](G.filters["html2toc"](CTX.html))));
OUT.push("\"></x-tableofcontents>\n                    ");
}
OUT.push("\n                    <div class=\"markdown-body\">");
OUT.push(G.filters.escape(G.filters["safe"](CTX.html)));
OUT.push("</div>\n                ");
}
OUT.push("\n            ");
} else {
OUT.push("\n                <slot></slot> ");
OUT.push("\n            ");
}
OUT.push("\n        </main>\n    </div>");

return OUT.join(""); };}
modulo.registry.modules.Search_template = function Search_template (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<form>\n        <h2><span>");
OUT.push(G.filters.escape(G.filters["safe"](G.filters["join"](CTX.script.titleArr,"</span><span>"))));
OUT.push("</span></h2>\n        <input name=\"q\" placeholder=\"Search\" style=\"max-width: 100%\" value=\"");
OUT.push(G.filters.escape(G.filters["default"](CTX.state.q,"")));
OUT.push("\">\n        <button>Go 🔍</button>\n    </form>\n    <!--<button>I'm Feeling Lucky... &#x1F3B2;</button>-->\n    <ol class=\"results\">\n        ");
var ARR0=CTX.global.definitions.contentlist.data;for (var KEY in ARR0) {CTX. row=ARR0[KEY];
OUT.push("\n            <li style=\"display: none\">\n                <div>\n                    <a href=\"");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,0)));
OUT.push("\"><tt>");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,0)));
OUT.push("</tt></a>\n                </div>\n                <iframe style=\"display:none\" src=\"../");
OUT.push(G.filters.escape(G.filters["get"](CTX.row,0)));
OUT.push("?argv=search&amp;q=");
OUT.push(G.filters.escape(G.filters["urlencode"](CTX.state.q)));
OUT.push("\"></iframe>\n            </li>\n        ");
}
OUT.push("\n    </ol>");

return OUT.join(""); };}
modulo.registry.modules.Search_script = function Search_script (modulo) { 
    // Ensure markdown gets highlight effect applied
    if (modulo.argv && modulo.argv[0] === 'search') {
        modulo.config.markdown.searchHighlight =
            new window.URLSearchParams(window.location.search).get('q')
        //console.log(modulo.config.markdown.searchHighlight, modulo.argv)
    }

    modulo.command.search = function search(modulo) {
        if (!window.parent) {
            return
        } // If child, send message to alert loaded
        // TODO: Reconfigure modulo markdown etc for search
        window.setTimeout(() => {
            const results = modulo.config.markdown.searchResults
            if (!results.length) {
                return // nothing found, dont report
            }
            const msg = {
                searchLoadSuccess: true,
                pathname: window.location.pathname,
                src: window.location + '',
                results,
            }
            window.parent.postMessage(JSON.stringify(msg), '*')
            //document.body.querySelector('[md-search]').scrollIntoView()
        }, 3000)
    }

    function _getResult(src) { // Gets li element of given src
        const iframes = element.querySelectorAll('iframe')
        for (const iframe of iframes) {
            if (iframe.src === src) {
                return iframe.parentNode
            }
        }
    }

    function _getMessage(msg) {
        const { pathname, src } = msg
        const li = _getResult(src)
        if (li) {
            li.style.display = 'grid'
        }
    }

    function initializedCallback(renderObj) { // Called when first mounted
        state.q = new window.URLSearchParams(window.location.search).get('q')
        window.addEventListener('message', (ev) => _getMessage(JSON.parse(ev.data)), false);
        return {
            titleArr: 'Modulo Search'.split('')
        }
    }
var state,style,element;return{_setLocal:function(o){state=o.state;style=o.style;element=o.element}, "search":typeof search !=="undefined"?search:undefined,"_getResult":typeof _getResult !=="undefined"?_getResult:undefined,"_getMessage":typeof _getMessage !=="undefined"?_getMessage:undefined,"initializedCallback":typeof initializedCallback !=="undefined"?initializedCallback:undefined}}
modulo.registry.modules.SyntaxHighlighter_script = function SyntaxHighlighter_script (modulo) { 
    const { highlight } = modulo.templateFilter
    function renderCallback() {
        component.innerHTML = highlight(props.value, props.mode)
    }

    function buildCallback() {
        element.removeAttribute('value')
    }
var props,component,element;return{_setLocal:function(o){props=o.props;component=o.component;element=o.element}, "renderCallback":typeof renderCallback !=="undefined"?renderCallback:undefined,"buildCallback":typeof buildCallback !=="undefined"?buildCallback:undefined}}
modulo.registry.modules.MirrorEditor_template = function MirrorEditor_template (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<div class=\"editor-wrapper\" on.click=\"script.updateDimensions\">\n      <div class=\"editor-underlay-container\" style=\"\n            width:  ");
if (CTX.state.width) {
OUT.push("  ");
OUT.push(G.filters.escape(CTX.state.width));
OUT.push("px\n                    ");
} else {
OUT.push(" 100% ");
}
OUT.push(";\n            height: ");
if (CTX.state.height) {
OUT.push(" ");
OUT.push(G.filters.escape(CTX.state.height));
OUT.push("px\n                    ");
} else {
OUT.push(" 100% ");
}
OUT.push(";\n          \">\n          <div class=\"editor-underlay-offset-wrapper\" style=\"\n                ");
if (CTX.state.scrollTop) {
OUT.push("  \n                    top: -");
OUT.push(G.filters.escape(CTX.state.scrollTop));
OUT.push("px; ");
}
OUT.push("\n                ");
if (CTX.state.scrollLeft) {
OUT.push(" \n                    left: -");
OUT.push(G.filters.escape(CTX.state.scrollLeft));
OUT.push("px; ");
}
OUT.push("\n                ");
if (CTX.state.width) {
OUT.push("\n                    width: ");
OUT.push(G.filters.escape(CTX.state.width));
OUT.push("px; ");
}
OUT.push("\n              \"><x-syntaxhighlighter value=\"");
OUT.push(G.filters.escape(CTX.state.value));
OUT.push("\" mode=\"");
OUT.push(G.filters.escape(CTX.state.mode));
OUT.push("\" style=\"\n                    font-family: monospace;\n                    text-align: start;\n                    resize: none;\n                    box-sizing: border-box;\n                    font-size: ");
OUT.push(G.filters.escape(CTX.editor_settings.fontSize));
OUT.push("px;\n                    ");
if (CTX.props.wrap) {
OUT.push("\n                        white-space: pre-wrap;\n                        overflow-wrap: break-word;\n                    ");
} else {
OUT.push("\n                        white-space: pre;\n                    ");
}
OUT.push("\"></x-syntaxhighlighter>\n          </div>\n      </div>\n      <textarea script.ref=\"\" on.scroll=\"script.updateDimensions\" data-gramm=\"false\" name=\"");
OUT.push(G.filters.escape(G.filters["default"](CTX.props.name,"editor")));
OUT.push("\" spellcheck=\"");
OUT.push(G.filters.escape(G.filters["default"](CTX.props.spellcheck,"false")));
OUT.push("\" style=\"\n            font-size: ");
OUT.push(G.filters.escape(CTX.editor_settings.fontSize));
OUT.push("px;\n            ");
if (CTX.props.wrap) {
OUT.push("\n                white-space: pre-wrap;\n                overflow-wrap: break-word;\n            ");
} else {
OUT.push("\n                white-space: pre;\n            ");
}
OUT.push("\"></textarea>\n  </div>");

return OUT.join(""); };}
modulo.registry.modules.MirrorEditor_script = function MirrorEditor_script (modulo) { 
    function initializedCallback() {
        if (element.value) { // Set state.value (if early)
            state.value = element.value;
        }
    }

    function prepareCallback() {
        if (state.value === null) {
            const value = (state.value || props.value ||
                           element.textContent || '').trim();
            state.value = value;
        }
    }

    function updateCallback(){
        // Mounting of the actual <textarea>: Set-up and rerender
        if (!ref.textarea) {
            return
        }
        ref.textarea.value = state.value;

        // For low-level control, we 1) manually rerender, and
        // 2) manually attach event listeners
        setStateAndRerender(ref.textarea);
        ref.textarea.addEventListener('keydown', keyDown);
        ref.textarea.addEventListener('keyup', keyUp);

        // The stateChangedCallback is for state.bind compatibility:
        // Parent components can bind this like a normal input
        element.stateChangedCallback = (name, val, originalEl) => {
            ref.textarea.value = val;
            ref.textarea.setSelectionRange(state.selectionStart,
                                       state.selectionStart);
            setStateAndRerender(ref.textarea);
        };

        // Run "updateDimensions" on resize events, to maintain mirror
        try {
            new ResizeObserver(updateDimensions).observe(ref.textarea);
        } catch {
            console.error('Could not listen to resize of ref.textarea');
        }
    }

    let globalDebounce = null;
    function keyUp(ev) {
        if (globalDebounce) { // Clear debounce to stop keyDown
            clearTimeout(globalDebounce);
            globalDebounce = null;
        }
        setStateAndRerender(ev.target); // Ensure text is updated
    }

    function keyDown(ev) { // For held keys
        const textarea = ev.target;
        if (globalDebounce) { // Always clear if it exists
            clearTimeout(globalDebounce);
            globalDebounce = null;
        }
        const qRerender = () => setStateAndRerender(textarea);
        globalDebounce = setTimeout(qRerender, 10);
    }

    function updateDimensions() {
        if (!ref.textarea) {
            return; // Called too early, ignore
        }
        const { scrollLeft, scrollTop } = ref.textarea;
        const { clientWidth, clientHeight } = ref.textarea;
        if (state.scrollLeft !== scrollLeft || 
                state.scrollTop !== scrollTop ||
                state.width !== clientWidth || 
                state.height !== clientHeight) {
            // Updates the state, in turn updating backing div
            state.scrollTop = scrollTop;
            state.scrollLeft = scrollLeft;
            state.width = clientWidth;
            state.height = clientHeight;
            element.rerender();
        }
    }

    function setStateAndRerender(textarea) {
        state.selectionStart = textarea.selectionStart;
        if (state.value !== textarea.value) {
            state.value = textarea.value;
            element.value = state.value;
            element.rerender();
        }
    }
var props,state,component,element,ref;return{_setLocal:function(o){props=o.props;state=o.state;component=o.component;element=o.element;ref=o.ref}, "initializedCallback":typeof initializedCallback !=="undefined"?initializedCallback:undefined,"prepareCallback":typeof prepareCallback !=="undefined"?prepareCallback:undefined,"updateCallback":typeof updateCallback !=="undefined"?updateCallback:undefined,"keyUp":typeof keyUp !=="undefined"?keyUp:undefined,"keyDown":typeof keyDown !=="undefined"?keyDown:undefined,"updateDimensions":typeof updateDimensions !=="undefined"?updateDimensions:undefined,"setStateAndRerender":typeof setStateAndRerender !=="undefined"?setStateAndRerender:undefined}}
modulo.registry.modules.TableOfContents_template = function TableOfContents_template (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<nav class=\"");
OUT.push(G.filters.escape(G.filters["yesno"](CTX.state.sticky," sticky,regular\"=\"")));
OUT.push("\"=\"\">\n        <div> </div>\n        <div>\n            <div>\n                <label>[ <input state.bind=\"\" name=\"show\" type=\"checkbox\"> Table of Contents ]</label>\n                <label title=\"Stick to upper right\">[ <span alt=\"upper right arrow\">↗</span>\n                    <input state.bind=\"\" name=\"sticky\" type=\"checkbox\"> ]</label>\n            </div>\n            ");
if (CTX.state.show) {
OUT.push("\n                <ul>\n                    ");
var ARR1=CTX.state.toc;for (var KEY in ARR1) {CTX. item=ARR1[KEY];
OUT.push("\n                        ");
if (CTX.item.level < 4) {
OUT.push("\n                            <li style=\"--level: ");
OUT.push(G.filters.escape(CTX.item.level));
OUT.push("\">\n                                    <a href=\"#");
OUT.push(G.filters.escape(CTX.item.id));
OUT.push("\">");
OUT.push(G.filters.escape(G.filters["safe"](CTX.item.title)));
OUT.push("</a>\n                            </li>\n                        ");
}
OUT.push("\n                    ");
}
OUT.push("\n                </ul>\n            ");
}
OUT.push("\n        </div>\n    </nav>");

return OUT.join(""); };}
modulo.registry.modules.TableOfContents_script = function TableOfContents_script (modulo) { 
    function prepareCallback() {
        if (!state.toc) { // Load / parse props
            state.toc = JSON.parse(props.toc)
            state.show = !!state.toc.length
            state.orig = element.parentNode.style.paddingRight;
        }
    }
    function updateCallback() { // If sticky, update to fit my content
        element.parentNode.style.paddingRight = state.sticky
                ? '310px' : state.orig;
    }
var props,state,style,element;return{_setLocal:function(o){props=o.props;state=o.state;style=o.style;element=o.element}, "prepareCallback":typeof prepareCallback !=="undefined"?prepareCallback:undefined,"updateCallback":typeof updateCallback !=="undefined"?updateCallback:undefined}}
modulo.registry.modules.QuickDemo_template = function QuickDemo_template (modulo) { return function (CTX, G) { var OUT=[];
OUT.push("<div class=\"editor-layout\" style=\"--demo-width: ");
OUT.push(G.filters.escape(G.filters["yesno"](CTX.state.demo,"250,0")));
OUT.push("px;\">\n        ");
if (CTX.state.menu) {
OUT.push("\n            <div class=\"toolbar\">\n            </div>\n        ");
} else if (!(CTX.state.demo)) {
OUT.push("\n            <x-syntaxhighlighter mode=\"");
OUT.push(G.filters.escape(CTX.props.mode));
OUT.push("\" value=\"");
OUT.push(G.filters.escape(CTX.props.value));
OUT.push("\" style=\"font-size: ");
OUT.push(G.filters.escape(CTX.editor_settings.fontSize));
OUT.push("px\"></x-syntaxhighlighter>\n        ");
} else {
OUT.push("\n            <x-mirroreditor state.bind=\"\" name=\"value\" mode=\"");
OUT.push(G.filters.escape(CTX.props.mode));
OUT.push("\"></x-mirroreditor>\n        ");
}
OUT.push("\n        <div class=\"toolbar toolbar--small ");
if (!(CTX.state.menu)) {
OUT.push("toolbar--autohide");
}
OUT.push("\n             ");
if (!(CTX.state.demo)) {
OUT.push("toolbar--snippet");
}
OUT.push("\">\n            ");
if (CTX.state.demo) {
OUT.push("\n                <button on.click=\"script.copy\"><span alt=\"Clipboard icon\">📋</span> Copy</button>\n                <button on.click=\"script.run\"><span alt=\"Refresh arrow in circle\">⟳</span> Run</button>\n                <button on.click=\"script.save\"><span alt=\"Download arrow downward\">⤓</span> Save</button>\n            ");
} else {
OUT.push("\n                <button on.click=\"script.copy\"><span alt=\"Clipboard icon\">📋</span> Copy</button>\n            ");
}
OUT.push("\n        </div>\n        ");
if (CTX.state.demo) {
OUT.push("<iframe></iframe>");
}
OUT.push("\n    </div>\n    <div class=\"overlay\"></div>");

return OUT.join(""); };}
modulo.registry.modules.QuickDemo_script = function QuickDemo_script (modulo) { 
    //const EXAMPLE_START = '<!--%%%'
    //const EXAMPLE_END = '%%%-->'
    const REMOTE_MODULO_SRC = 'https://modu.lol'

    function prepareCallback(renderObj) {
        //}
        if (state.demo === null) { // First time, self-configure
            // TOOD: fix preview etc
            state.value = props.value // Prepopulate state with demo
            state.demo = false
            if (props.demo) {
                state.demo = 'template_' + props.demo
                run() // ensure demo starts as run
            }
            if (props.name) {
                state.name = props.name
            }
            if (props.usage) {
                state.value = props.value.split(props.usage)[0]
                state.usage = props.value.split(props.usage)[1]
            }
            /*else if (props.value.includes(EXAMPLE_START)) { // TODO RM
                state.value = props.value.split(EXAMPLE_START)[0]
                state.name = props.value.split(EXAMPLE_START)[1]
                                        .split(EXAMPLE_END)[0].trim()
                state.usage = props.value.split(EXAMPLE_END)[1]
            }*/
        }
    }

    function run() { // Mark as run (runs only after update, during callback)
        state.count++
    }

    function buildCallback() {
        element.removeAttribute('value')
        element.removeAttribute('usage')
    }

    function updateCallback() {
        if (state.count > state.lastRun) {
            refreshDemo()
            state.lastRun = state.count // catch up
        }
    }

    function render(extra = { }) {
        const renderObj = parts.component.getCurrentRenderObj()
        if (!(state.demo in renderObj)) { // No preview / demo for this!
            return '<b>ERROR:</b> QuickDemo has no template: ' + state.demo
        }
        const ctx = Object.assign({ }, state, editor_settings, extra)
        return renderObj[state.demo].render(ctx)
    }

    function copy() {
        navigator.clipboard.writeText(state.value || props.value)
    }

    function refreshDemo() {
        editor_settings.demoRunCount++
        const text = render()
        const oldIframe = element.querySelector('iframe') // Delete existing
        const parentNode = oldIframe.parentNode
        oldIframe.remove()
        const iframe = document.createElement('iframe')
        parentNode.append(iframe) // add new one back
        iframe.contentWindow.document.open()
        iframe.contentWindow.document.write(text)
        iframe.contentWindow.document.close()
    }

    function toggle() {
        state.menu = !state.menu
    }

    function save() {
        const filename = state.name + '.html'
        const text = render({ moduloSrc: REMOTE_MODULO_SRC })
        const a = document.createElement('a')
        const href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
        a.setAttribute('href', href)
        a.setAttribute('download', filename)
        element.append(a)
        a.click()
        a.remove(a)
    }
var props,template,editor_settings,state,component,element,parts,ref;return{_setLocal:function(o){props=o.props;template=o.template;editor_settings=o.editor_settings;state=o.state;component=o.component;element=o.element;parts=o.parts;ref=o.ref}, "prepareCallback":typeof prepareCallback !=="undefined"?prepareCallback:undefined,"run":typeof run !=="undefined"?run:undefined,"buildCallback":typeof buildCallback !=="undefined"?buildCallback:undefined,"updateCallback":typeof updateCallback !=="undefined"?updateCallback:undefined,"render":typeof render !=="undefined"?render:undefined,"copy":typeof copy !=="undefined"?copy:undefined,"refreshDemo":typeof refreshDemo !=="undefined"?refreshDemo:undefined,"toggle":typeof toggle !=="undefined"?toggle:undefined,"save":typeof save !=="undefined"?save:undefined}}

modulo.definitions = { 




































































modulo: {"Type":"modulo","Parent":null,"DefName":null,"build":{"mainModules":["configuration","_component_Frame","_component_TextEdit","_component_Editor","_component_Page","Page","Search","SyntaxHighlighter","MirrorEditor","TableOfContents","QuickDemo"]},"defaultContent":"<meta charset=utf8><modulo-Page>","fileSelector":"script[type='mdocs'],template[type='mdocs'],style[type='mdocs'],script[type='md'],template[type='md'],script[type='f'],template[type='f'],style[type='f']","scriptSelector":"script[src$='mdu.js'],script[src$='Modulo.js'],script[src='?'],script[src$='Modulo.html']","version":"0.1.0","timeout":5000,"ChildPrefix":"","Contains":"core","DefLoaders":["DefTarget","DefinedAs","Src","Content"],"defaultDef":{"DefTarget":null,"DefinedAs":null,"DefName":null},"defaultDefLoaders":["DefTarget","DefinedAs","DataType","Src"],"defaultDefBuilders":["FilterContent","ContentType","Load"],"Name":"modulo","DefinitionName":"modulo","Source":"file:///home/michaelb/projects/modulo-site/docs/static/","ChildrenNames":["sidebar","partial","partial1","partial2","partial3","include","modulo1","modulo2","configuration"]},

sidebar: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"sidebar","DefinitionName":"sidebar","data":[["start/index.html","           Introduction","       Modulo"],["start/getting-started.html"," Getting Started"],["defs/overview.html","         Overview","           Definitions"],["defs/importing.html","        Importing"],["defs/definitions.html","      Definition Types"],["defs/processors.html","       Processors"],["defs/custom.html","           Custom Types"],["templating/index.html","      Language Overview","  Templating"],["templating/filters.html","    Template Filters"],["templating/tags.html","       Template Tags"],["parts/props.html","           Props","              Component Parts"],["parts/script.html","          Script"],["parts/state.html","           State"],["parts/staticdata.html","      StaticData"],["parts/style.html","           Style"],["parts/template.html","        Template"],["core/artifact.html","         Artifact","           Core Definitions"],["core/component.html","        Component"],["core/configuration.html","    Configuration"],["core/contentlist.html","      ContentList"],["core/include.html","          Include"],["core/library.html","          Library"],["extension/engine.html","      Upgrading Engines","  Extension"]],"commands":[" "]},

partial: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"partial","DefinitionName":"partial","data":[["index.html"],["start/index.html"],["start/getting-started.html"],["defs/overview.html"],["defs/importing.html"],["defs/definitions.html"],["defs/processors.html"],["defs/custom.html"]],"commands":["build1"]},

partial1: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"partial1","DefinitionName":"partial1","data":[["parts/props.html"],["parts/script.html"],["parts/state.html"],["parts/staticdata.html"],["parts/style.html"],["parts/template.html"]],"commands":["build2"]},

partial2: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"partial2","DefinitionName":"partial2","data":[["core/artifact.html"],["core/component.html"],["core/configuration.html"],["core/contentlist.html"],["core/include.html"],["core/library.html"],["extension/engine.html"]],"commands":["build3"]},

partial3: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"partial3","DefinitionName":"partial3","data":[["templating/index.html"],["templating/filters.html"],["templating/tags.html"]],"commands":["build4"]},

include: {"Type":"include","Parent":"modulo","Content":"\n    <script src=\"js/highlight.min.htm\"></script>\n    <script src=\"js/showdown_2.1.0.min.htm\"></script>\n    <script src=\"js/ModuloDocs-markdown.htm\"></script>\n    <script src=\"js/ModuloDocs-toc-helpers.htm\"></script>\n","DefName":null,"ServerTemplate":"{% for p, v in entries %}<script src=\"https://{{ server }}/{{ v }}\"></script>{% endfor %}","DefLoaders":["DefTarget","DefinedAs","Src","Server","LoadMode"],"Name":"include","DefinitionName":"include"},

modulo1: {"Type":"modulo","Parent":"modulo","DefName":null,"build":{"mainModules":["configuration","_component_Frame","_component_TextEdit","_component_Editor","_component_Page","Page","Search","SyntaxHighlighter","MirrorEditor","TableOfContents","QuickDemo"]},"defaultContent":"<meta charset=utf8><modulo-Page>","fileSelector":"script[type='mdocs'],template[type='mdocs'],style[type='mdocs'],script[type='md'],template[type='md'],script[type='f'],template[type='f'],style[type='f']","scriptSelector":"script[src$='mdu.js'],script[src$='Modulo.js'],script[src='?'],script[src$='Modulo.html']","version":"0.1.0","timeout":5000,"ChildPrefix":"","Contains":"core","DefLoaders":["DefTarget","DefinedAs","Src","Content"],"defaultDef":{"DefTarget":null,"DefinedAs":null,"DefName":null},"defaultDefLoaders":["DefTarget","DefinedAs","DataType","Src"],"defaultDefBuilders":["FilterContent","ContentType","Load"],"Name":"modulo1","DefinitionName":"modulo1","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/","ChildrenNames":["Page","Search","SyntaxHighlighter","MirrorEditor","TableOfContents","QuickDemo"]},

modulo2: {"Type":"modulo","Parent":"modulo","DefName":null,"build":{"mainModules":["configuration","_component_Frame","_component_TextEdit","_component_Editor","_component_Page","Page","Search","SyntaxHighlighter","MirrorEditor","TableOfContents","QuickDemo"]},"defaultContent":"<meta charset=utf8><modulo-Page>","fileSelector":"script[type='mdocs'],template[type='mdocs'],style[type='mdocs'],script[type='md'],template[type='md'],script[type='f'],template[type='f'],style[type='f']","scriptSelector":"script[src$='mdu.js'],script[src$='Modulo.js'],script[src='?'],script[src$='Modulo.html']","version":"0.1.0","timeout":5000,"ChildPrefix":"","Contains":"core","DefLoaders":["DefTarget","DefinedAs","Src","Content"],"defaultDef":{"DefTarget":null,"DefinedAs":null,"DefName":null},"defaultDefLoaders":["DefTarget","DefinedAs","DataType","Src"],"defaultDefBuilders":["FilterContent","ContentType","Load"],"Name":"modulo2","DefinitionName":"modulo2","Source":"file:///home/michaelb/projects/modulo-site/docs/static/config.html","ChildrenNames":["include1","include2"]},

configuration: {"Type":"configuration","Parent":"modulo","DefName":null,"DefLoaders":["DefTarget","DefinedAs","Src|SrcSync","Content|Code","DefinitionName|MainRequire"],"Name":"configuration"},

Page: {"Type":"component","Parent":"modulo1","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"vanish","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"Page","namespace":"docs","Name":"Page","DefinitionName":"Page","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/Page.html","ChildrenNames":["Page_template","Page_style","Page_style1"],"TagName":"docs-page","className":"docs_Page"},

Search: {"Type":"component","Parent":"modulo1","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"Search","Name":"Search","DefinitionName":"Search","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/Search.html","ChildrenNames":["Search_props","Search_template","Search_state","Search_script","Search_style"],"namespace":"x","TagName":"x-search","className":"x_Search"},

SyntaxHighlighter: {"Type":"component","Parent":"modulo1","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"SyntaxHighlighter","Name":"SyntaxHighlighter","DefinitionName":"SyntaxHighlighter","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/SyntaxHighlighter.html","ChildrenNames":["SyntaxHighlighter_props","SyntaxHighlighter_script","SyntaxHighlighter_style","SyntaxHighlighter_style1"],"namespace":"x","TagName":"x-syntaxhighlighter","className":"x_SyntaxHighlighter"},

MirrorEditor: {"Type":"component","Parent":"modulo1","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"manual","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"MirrorEditor","Name":"MirrorEditor","DefinitionName":"MirrorEditor","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/MirrorEditor.html","ChildrenNames":["MirrorEditor_props","MirrorEditor_template","MirrorEditor_editor_settings","MirrorEditor_state","MirrorEditor_script","MirrorEditor_style"],"namespace":"x","TagName":"x-mirroreditor","className":"x_MirrorEditor"},

TableOfContents: {"Type":"component","Parent":"modulo1","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"TableOfContents","Name":"TableOfContents","DefinitionName":"TableOfContents","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/TableOfContents.html","ChildrenNames":["TableOfContents_props","TableOfContents_template","TableOfContents_state","TableOfContents_script","TableOfContents_style"],"namespace":"x","TagName":"x-tableofcontents","className":"x_TableOfContents"},

QuickDemo: {"Type":"component","Parent":"modulo1","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"QuickDemo","Name":"QuickDemo","DefinitionName":"QuickDemo","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/QuickDemo.html","ChildrenNames":["QuickDemo_props","QuickDemo_template","QuickDemo_editor_settings","QuickDemo_state","QuickDemo_script","QuickDemo_style","QuickDemo_style1"],"namespace":"x","TagName":"x-quickdemo","className":"x_QuickDemo"},

Page_template: {"Type":"template","Parent":"Page","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"Page_template"},

Page_style: {"Type":"style","Parent":"Page","DefName":null,"isolateSelector":[".layout",".page-container",".page-nav",".page-nav",".page-nav a",".page-nav .toc--inactive",".page-nav .toc--active",".page-nav .toc--outer",".page-nav h3",".page-nav .toc--active a",".page-nav a:hover",".page-nav ul",".page-container",".page-nav",".layout",".layout",".page-nav a"],"isolateClass":"Page","prefix":null,"corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"Page_style"},

Page_style1: {"Type":"style","Parent":"Page","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":".markdown-body","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style1","DefinitionName":"Page_style1","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/Page-markdown.css.htm"},

Search_props: {"Type":"props","Parent":"Search","Content":"","DefName":null,"results":"","Name":"props","DefinitionName":"Search_props"},

Search_template: {"Type":"template","Parent":"Search","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"Search_template"},

Search_state: {"Type":"state","Parent":"Search","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":null,"q":"","visible":{},"Name":"state","DefinitionName":"Search_state"},

Search_script: {"Type":"script","Parent":"Search","DefName":null,"Directives":["refMount","refUnmount"],"DefFinalizers":["AutoExport","Content|Code"],"Name":"script","DefinitionName":"Search_script"},

Search_style: {"Type":"style","Parent":"Search","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-Search","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"Search_style"},

SyntaxHighlighter_props: {"Type":"props","Parent":"SyntaxHighlighter","Content":"","DefName":null,"value":"","mode":"","fix":"","Name":"props","DefinitionName":"SyntaxHighlighter_props"},

SyntaxHighlighter_script: {"Type":"script","Parent":"SyntaxHighlighter","DefName":null,"Directives":["refMount","refUnmount"],"DefFinalizers":["AutoExport","Content|Code"],"Name":"script","DefinitionName":"SyntaxHighlighter_script"},

SyntaxHighlighter_style: {"Type":"style","Parent":"SyntaxHighlighter","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-SyntaxHighlighter","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"SyntaxHighlighter_style"},

SyntaxHighlighter_style1: {"Type":"style","Parent":"SyntaxHighlighter","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-SyntaxHighlighter","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style1","DefinitionName":"SyntaxHighlighter_style1","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/SyntaxHighlighter-theme.css.htm"},

MirrorEditor_props: {"Type":"props","Parent":"MirrorEditor","Content":"","DefName":null,"value":"","name":"","spellcheck":"","wrap":"","Name":"props","DefinitionName":"MirrorEditor_props"},

MirrorEditor_template: {"Type":"template","Parent":"MirrorEditor","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"MirrorEditor_template"},

MirrorEditor_editor_settings: {"Type":"state","Parent":"MirrorEditor","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":"editor_settings","Name":"editor_settings","fontSize":18,"DefinitionName":"MirrorEditor_editor_settings"},

MirrorEditor_state: {"Type":"state","Parent":"MirrorEditor","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":null,"mode":"modulo","selectionStart":0,"scrollTop":0,"scrollLeft":0,"width":0,"height":0,"value":null,"Name":"state","DefinitionName":"MirrorEditor_state"},

MirrorEditor_script: {"Type":"script","Parent":"MirrorEditor","DefName":null,"Directives":["refMount","refUnmount"],"DefFinalizers":["AutoExport","Content|Code"],"Name":"script","DefinitionName":"MirrorEditor_script"},

MirrorEditor_style: {"Type":"style","Parent":"MirrorEditor","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-MirrorEditor","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"MirrorEditor_style"},

TableOfContents_props: {"Type":"props","Parent":"TableOfContents","Content":"","DefName":null,"toc":"[]","Name":"props","DefinitionName":"TableOfContents_props"},

TableOfContents_template: {"Type":"template","Parent":"TableOfContents","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"TableOfContents_template"},

TableOfContents_state: {"Type":"state","Parent":"TableOfContents","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":null,"sticky":false,"show":false,"Name":"state","DefinitionName":"TableOfContents_state"},

TableOfContents_script: {"Type":"script","Parent":"TableOfContents","DefName":null,"Directives":["refMount","refUnmount"],"DefFinalizers":["AutoExport","Content|Code"],"Name":"script","DefinitionName":"TableOfContents_script"},

TableOfContents_style: {"Type":"style","Parent":"TableOfContents","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-TableOfContents","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"TableOfContents_style"},

QuickDemo_props: {"Type":"props","Parent":"QuickDemo","Content":"","DefName":null,"mode":"","value":"","demo":"","name":"","usage":"","splitusage":"","Name":"props","DefinitionName":"QuickDemo_props"},

QuickDemo_template: {"Type":"template","Parent":"QuickDemo","DefName":null,"DefFinalizers":["Content|CompileTemplate","Code"],"unsafe":"filters.escape","modeTokens":["{% %}","{{ }}","{# #}","{-{ }-}","{-% %-}"],"opTokens":"==,>,<,>=,<=,!=,not in,is not,is,in,not,gt,lt","opAliases":{"==":"X === Y","is":"X === Y","is not":"X !== Y","!=":"X !== Y","not":"!(Y)","gt":"X > Y","gte":"X >= Y","lt":"X < Y","lte":"X <= Y","in":"(Y).includes ? (Y).includes(X) : (X in Y)","not in":"!((Y).includes ? (Y).includes(X) : (X in Y))"},"Name":"template","DefinitionName":"QuickDemo_template"},

QuickDemo_editor_settings: {"Type":"state","Parent":"QuickDemo","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":"editor_settings","Name":"editor_settings","fontSize":18,"demoRunCount":0,"DefinitionName":"QuickDemo_editor_settings"},

QuickDemo_state: {"Type":"state","Parent":"QuickDemo","Content":"","DefName":null,"Directives":["bindMount","bindUnmount"],"Store":null,"moduloSrc":"../static/Modulo.html","doctype":"<!DOCTYPE HTML>","usage":"<x-App></x-App>","name":"App","value":null,"demo":null,"menu":false,"count":0,"lastRun":0,"inputs":["name","usage","doctype"],"Name":"state","DefinitionName":"QuickDemo_state"},

QuickDemo_script: {"Type":"script","Parent":"QuickDemo","DefName":null,"Directives":["refMount","refUnmount"],"DefFinalizers":["AutoExport","Content|Code"],"Name":"script","DefinitionName":"QuickDemo_script"},

QuickDemo_style: {"Type":"style","Parent":"QuickDemo","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-QuickDemo","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style","DefinitionName":"QuickDemo_style"},

QuickDemo_style1: {"Type":"style","Parent":"QuickDemo","DefName":null,"isolateSelector":[],"isolateClass":null,"prefix":"x-QuickDemo","corePseudo":["before","after","first-line","last-line"],"DefBuilders":["FilterContent","AutoIsolate","Content|ProcessCSS"],"Name":"style1","DefinitionName":"QuickDemo_style1","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/QuickDemo-toolbar.css.htm"},

include1: {"Type":"include","Parent":"modulo2","Content":"\n    <meta name=\"charset\" charset=\"utf8\">\n    <meta name=\"content-type\" http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <meta name=\"robots\" content=\"index, follow\">\n    <meta name=\"revisit-after\" content=\"30 days\">\n","DefName":null,"ServerTemplate":"{% for p, v in entries %}<script src=\"https://{{ server }}/{{ v }}\"></script>{% endfor %}","DefLoaders":["DefTarget","DefinedAs","Src","Server","LoadMode"],"Name":"include1","DefinitionName":"include1"},

include2: {"Type":"include","Parent":"modulo2","Content":"\n<style>\n    :root {\n        --btn-shadow-dist: 4px;\n        --btn-shadow-dist-neg: -4px;\n        --color-fg-light: #00000011;\n        --color-fg-semilight: #00000044;\n        --color-fg-semi: #00000088;\n        --color-fg-semidark: #000000DD;\n        --color: #B90183;\n        --color-alt: #a2e4b8;\n\n        --font-serif: serif;\n        --font-sans: sans-serif;\n        --font-mono: monospace;\n\n        --color: #B90183;\n        --color-alt: #82d4a444;\n        --fg: #000;\n        --fg-shading: #05051020;\n        --bg: #fff;\n        --bg-semi: #ffffff99;\n        --fg-inv: #fff;\n        --fg-inv-shading: #ffffff20;\n        --bg-inv: #000;\n        --bg-inv-semi: #00000099;\n\n        --color-fg: var(--fg);\n        --color-bg: var(--bg);\n        --color-content-bg: var(--bg);\n        --color-outline: var(--fg-shading);\n    }\n\n    @media (prefers-color-scheme: dark) {\n        :root {\n            --btn-shadow-dist: 4px;\n            --btn-shadow-dist-neg: -4px;\n            --color-fg-light: #ffffff11;\n            --color-fg-semilight: #ffffff44;\n            --color-fg-semi: #ffffff88;\n            --color-fg-semidark: #ffffffDD;\n            --color-alt: #a2e4b8;\n            --color-outline: #eee;\n            --color-content-bg: black;\n            --color-bg: black;\n\n\n            --color: #B90183;\n            --color-alt: #82d4a444;\n            --fg: #eee;\n            --fg-shading: #ffffff33;\n            --bg: #000;\n            --bg-semi: #00000099;\n            --fg-inv: #000;\n            --fg-inv-shading: #00000020;\n            --bg-inv: #fff;\n            --bg-inv-semi: #ffffff99;\n        }\n    }\n\n    body {\n        color: var(--color-fg);\n        background-color: var(--color-content-bg);\n        margin: 0;\n        font-family: sans-serif;\n    }\n\n    /* Browser Reset */\n    html, body {\n        font-size: 17px;\n        font-weight: 400;\n        line-height: 1.4;\n    }\n</style>\n","DefName":null,"ServerTemplate":"{% for p, v in entries %}<script src=\"https://{{ server }}/{{ v }}\"></script>{% endfor %}","DefLoaders":["DefTarget","DefinedAs","Src","Server","LoadMode"],"Name":"include2","DefinitionName":"include2"},
 };

modulo.registry.modules.configuration.call(window, modulo);

modulo.registry.modules.Page.call(window, modulo);

modulo.registry.modules.Search.call(window, modulo);

modulo.registry.modules.SyntaxHighlighter.call(window, modulo);

modulo.registry.modules.MirrorEditor.call(window, modulo);

modulo.registry.modules.TableOfContents.call(window, modulo);

modulo.registry.modules.QuickDemo.call(window, modulo);
