import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, {
      get: all[name2],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name2] = () => newValue
    });
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// scripts/node-oludom.mjs
import { readFileSync, writeFileSync } from "node:fs";

// src/parser.mjs
var exports_parser = {};
__export(exports_parser, {
  parse: () => parse,
  LexHelper: () => LexHelper
});
function parse(parentElem, text, queueScripts = null) {
  const { HTMLElement: HTMLElement2 } = parentElem._virtual.window;
  const lex = new LexHelper(text, [parentElem], HTMLElement2);
  while (lex.text) {
    lex.peekOpen();
    lex.pushUntil("<");
    lex.untilRegExp(/\s*/);
    if (lex.text.length < 1) {
      break;
    }
    const c = lex.text.charCodeAt(0);
    if (c >= 65 && c <= 122) {
      const tag = lex.untilRegExp(/[\s>]/).toUpperCase().trim();
      const elem = parentElem.ownerDocument.createElement(tag);
      if (elem._isAutoClosing) {
        lex.sliceStack(null, elem._autoClosingValue);
        lex.sliceStack(tag);
      }
      while (lex.text.trim() && lex.match !== ">") {
        const name2 = lex.untilRegExp(/[\s =>]/).trim();
        let value = "";
        if (lex.match === "=" && lex.text[0] !== ">") {
          value = lex.untilRegExp(/['"\s>]/);
          if ((lex.match === '"' || lex.match === "'") && !value.trim()) {
            value = lex.until(lex.match);
          }
        }
        if (name2) {
          elem.setAttribute(name2, value);
        }
      }
      lex.topOfStack.append(elem);
      if (elem.tagName === "SCRIPT" || elem.tagName === "STYLE") {
        const close = new RegExp("</" + elem.tagName + "s*>", "i");
        elem.nodeValue = lex.untilRegExp(close);
      } else if (!elem._isSelfClosing) {
        lex.stack.push(elem);
      }
    } else if (c === 47) {
      const tag = lex.until(">").toUpperCase().replace(/[^A-Z0-9_:-]/g, "");
      const elem = lex.sliceStack(tag);
      if (elem && elem._isDocumentStructure) {
        lex.mergeStructuralElement(elem);
      }
    } else if (c === 33 && lex.text.substr(0, 3) === "!--") {
      lex.pushUntil("-->", 8, true);
    }
  }
  if (queueScripts === null) {
    parentElem._virtual.resumeDOM();
  } else if (queueScripts === false) {
    parentElem._virtual.domQueue = [];
  }
}

class LexHelper {
  constructor(text, tagStack = [], elemCls = null) {
    this.text = text;
    this.stack = tagStack;
    this.elemCls = elemCls;
    this.match = "";
    this.peekOpen();
  }
  untilRegExp(regexp) {
    const match = this.text.match(regexp) || { 0: "", index: this.text.length };
    this.match = match[0];
    const leadingText = this.text.substr(0, match.index);
    this.text = this.text.substr(match.index + match[0].length);
    return leadingText;
  }
  until(str) {
    const index = this.text.indexOf(str);
    const leadingText = index === -1 ? this.text : this.text.substr(0, index);
    this.text = index === -1 ? "" : this.text.substr(index + str.length);
    return leadingText;
  }
  sliceStack(tagUC, autoClose = 0) {
    let searchIndex = this.stack.length;
    while (searchIndex > 0) {
      searchIndex = searchIndex - 1;
      const elem = this.stack[searchIndex];
      if (autoClose === 0 ? tagUC === elem.tagName : autoClose <= elem._autoClosingValue) {
        this.stack.splice(searchIndex);
        this.peekOpen();
        return elem;
      }
    }
    return null;
  }
  peekOpen() {
    this.topOfStack = this.stack.length < 1 ? null : this.stack[this.stack.length - 1];
  }
  pushUntil(str, nodeType = 3, removeMatch = false) {
    const elem = new this.elemCls;
    let nodeValue = this.until(str);
    nodeValue = removeMatch ? nodeValue.substr(str.length) : nodeValue;
    elem._setupNode({ nodeType, nodeValue });
    this.topOfStack.append(elem);
  }
  mergeStructuralElement(node) {
    let elem = node.ownerDocument;
    if (node.tagName !== "HTML") {
      elem = elem[node.tagName === "BODY" ? "body" : "head"];
    }
    if (elem && elem !== node) {
      for (const name2 of node.getAttributeNames()) {
        elem.setAttribute(name2, node.getAttribute(name2) || "");
      }
      elem.append(...node.childNodes);
      node.remove();
    }
  }
}

// src/dom.mjs
var exports_dom = {};
__export(exports_dom, {
  HTMLElement: () => HTMLElement2,
  Event: () => Event,
  Attr: () => Attr
});
var ELEMENTS = {
  docStructure: { HTML: 1, HEAD: 1, BODY: 1 },
  head: { TITLE: 1, LINK: 1, META: 1, TEMPLATE: 1 },
  selfClosing: {
    AREA: 1,
    BASE: 1,
    BR: 1,
    COL: 1,
    COMMAND: 1,
    EMBED: 1,
    HR: 1,
    IMG: 1,
    INPUT: 1,
    KEYGEN: 1,
    LINK: 1,
    META: 1,
    PARAM: 1,
    SOURCE: 1,
    TRACK: 1,
    WBR: 1
  },
  autoClosing: {
    P: 8,
    DT: 7,
    DD: 7,
    LI: 6,
    OPTION: 9,
    THEAD: 3,
    TH: 5,
    TBODY: 3,
    TR: 4,
    TD: 5,
    TFOOT: 3,
    COLGROUP: 4
  },
  literalValue: { SCRIPT: 1, STYLE: 1 }
};
var HTML_CHARS = { quot: '"', gt: ">", lt: "<", apos: "'" };
var DOM_QUEUE_RE = /^(script|iframe|.+-.+)$/i;
var SELF_CLOSING = " />";

class Attr {
  constructor(opts) {
    if ("value" in opts) {
      Object.assign(this, opts);
    }
  }
  cloneNode() {
    return new Attr(this);
  }
}

class Event {
  constructor(type) {
    this.type = type;
  }
}

class HTMLElement2 {
  constructor() {
    this._setupNode({
      nodeType: 3,
      nodeValue: "",
      childNodes: [],
      isConnected: false,
      parentNode: null,
      style: {},
      _parentIndex: -1,
      _attributeNames: [],
      _attributeValues: {},
      _eventListeners: {}
    });
  }
  _setupNode(opts) {
    Object.assign(this, opts);
    if (this.tagName) {
      this.tagName = this.tagName.toUpperCase();
      this._isDocumentStructure = this.tagName in ELEMENTS.docStructure;
      this._isHeadPreferred = this.tagName in ELEMENTS.head;
      this._isSelfClosing = this.tagName in ELEMENTS.selfClosing;
      this._isAutoClosing = this.tagName in ELEMENTS.autoClosing;
      this._isLiteralValue = this.tagName in ELEMENTS.literalValue;
      this._autoClosingValue = ELEMENTS.autoClosing[this.tagName] || 0;
    }
  }
  _extractContent() {
    const { nodeValue, childNodes } = this;
    this.nodeValue = undefined;
    this.childNodes = [];
    return { nodeValue, childNodes };
  }
  _decodeEntities(text) {
    text = text || "";
    return text.replace(/&(quot|gt|lt);/ig, (m, eng) => HTML_CHARS[eng]).replace(/&#x([a-f0-9]+);/ig, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  remove() {
    if (this.parentNode) {
      this.parentNode.childNodes.splice(this._parentIndex, 1);
      this._parentIndex = -1;
      this.parentNode._rebuildNodeIndices();
      this.parentNode = null;
    }
  }
  removeChild(searchElem) {
    for (const child of this.childNodes) {
      if (child === searchElem) {
        child.remove();
        break;
      }
    }
  }
  replaceWith(...items) {
    if (this.parentNode) {
      for (const item of items) {
        this.parentNode.insertBefore(item, this);
      }
    }
    this.remove();
  }
  append(...items) {
    for (const node of items) {
      if (node.remove) {
        node.remove();
      }
      this._appendNode(node);
    }
  }
  _appendNode(node) {
    if (this.tagName === "BODY" && node._isHeadPreferred) {
      return this.ownerDocument.head._appendNode(node);
    }
    node.parentNode = this;
    this.childNodes.push(node);
    this._rebuildNodeIndices();
    this._checkForConnection(node);
  }
  _checkForConnection(node) {
    if (node.nodeType === 1 && !node.isConnected && this.isConnected && this.tagName !== "TEMPLATE") {
      node.isConnected = true;
      if (DOM_QUEUE_RE.test(node.tagName)) {
        node._virtual.enqueueDOM(node);
        if (node._virtual.window.document.readyState === "complete") {
          node._virtual.resumeDOM();
        }
      }
      for (const child of node.children) {
        node._checkForConnection(child);
      }
    }
  }
  _insertNode(node, index) {
    const nextNodes = this.childNodes.slice(index);
    this.childNodes = this.childNodes.slice(0, index);
    this.childNodes.push(node);
    this.childNodes.push(...nextNodes);
    this._rebuildNodeIndices();
    this._checkForConnection(node);
  }
  appendChild(...items) {
    this.append(...items);
  }
  insertBefore(node, nextSibling) {
    if (nextSibling.parentNode !== this || !("_parentIndex" in nextSibling)) {
      throw new Error("Invalid insertBefore");
    }
    this._insertNode(node, nextSibling._parentIndex);
  }
  _rebuildNodeIndices() {
    let i = 0;
    for (const node of this.childNodes) {
      node._parentIndex = i++;
    }
  }
  isEqualNode(other) {
    return this.outerHTML === other.outerHTML;
  }
  addEventListener(type, listener) {
    if (!(type in this._eventListeners)) {
      this._eventListeners[type] = [];
    }
    this._eventListeners[type].push(listener);
  }
  dispatchEvent(ev) {
    for (const listener of this._eventListeners[ev.type] || []) {
      listener(ev);
    }
  }
  removeEventListener(evType, listener) {
    if (evType in this._eventListeners) {
      this._eventListeners[evType] = this._eventListeners[evType].filter((func) => func !== listener);
    }
  }
  get firstChild() {
    return this.childNodes.length > 0 ? this.childNodes[0] : null;
  }
  get firstElementChild() {
    return this.children.length > 0 ? this.children[0] : null;
  }
  get lastChild() {
    return this.childNodes.length > 0 ? this.childNodes[this.childNodes.length - 1] : null;
  }
  get lastElementChild() {
    return this.children.length > 0 ? this.children[this.children.length - 1] : null;
  }
  get nextSibling() {
    if (!this.parentNode || this._parentIndex + 1 >= this.parentNode.childNodes.length) {
      return null;
    }
    return this.parentNode.childNodes[this._parentIndex + 1];
  }
  get previousSibling() {
    if (!this.parentNode || this._parentIndex <= 0) {
      return null;
    }
    return this.parentNode.childNodes[this._parentIndex - 1];
  }
  get textContent() {
    if (this.nodeType === 3) {
      return this._decodeEntities(this.nodeValue);
    } else if (this._isLiteralValue) {
      return this.nodeValue;
    } else {
      return this.childNodes.map((c) => c.textContent).join("");
    }
  }
  set textContent(nodeValue) {
    if (this.nodeType === 1 && !this._isLiteralValue) {
      this.childNodes = [new HTMLElement2];
      this.childNodes[0]._setupNode({ nodeType: 3, nodeValue });
    } else {
      this.nodeValue = nodeValue;
      if (this.tagName === "SCRIPT" && nodeValue) {
        this._virtual.enqueueDOM(this);
        this._virtual.resumeDOM();
      }
    }
  }
  get children() {
    return this.childNodes.filter(({ nodeType }) => nodeType === 1);
  }
  get attributes() {
    const make = (name2) => new Attr({ name: name2, value: this.getAttribute(name2) });
    return this._attributeNames.map(make);
  }
  getAttributeNames() {
    return this._attributeNames;
  }
  getAttribute(name2) {
    return this._attributeValues[name2.toLowerCase()];
  }
  setAttribute(name2, value) {
    value = value || "";
    if (name2 === "/") {
      return;
    } else if (name2 === "style") {
      this.style = {};
      for (const decl of (value || "").split(";")) {
        const [name3, val] = decl.trim().split(/\s*:\s*/);
        this.style[name3] = val;
      }
      value = this._getStyleAttr();
    }
    this._updateAttribute(name2, value);
  }
  _updateAttribute(name2, value) {
    if (!this.hasAttribute(name2)) {
      this._attributeNames.push(name2);
    }
    const nameLower = name2.toLowerCase();
    value = "" + value;
    this._attributeValues[nameLower] = value;
    if (this.tagName === "IFRAME" && nameLower in { src: 1, srcdoc: 1 }) {
      this.contentWindow = this._virtual.newChild();
      this._virtual.enqueueDOM(this);
    } else if (this.tagName === "SCRIPT" && nameLower === "src") {
      this._virtual.enqueueDOM(this);
    }
  }
  hasAttribute(name2) {
    return name2.toLowerCase() in this._attributeValues;
  }
  _getStyleAttr() {
    const kebab = (str) => str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    const formatProp = (prop) => kebab(prop.trim()) + ": " + this.style[prop];
    return Object.keys(this.style).map(formatProp).join("; ");
  }
  _makeAttributeString() {
    if (!("style" in this._attributeValues) && Object.keys(this.style).length > 0) {
      this._updateAttribute("style", this._getStyleAttr());
    }
    let s = "";
    function attrValue(value) {
      if (/^[a-z0-9_\.]+$/.test(value)) {
        return value;
      } else if (!value.includes('"')) {
        return `"${value}"`;
      }
      value = value.replace(/'/g, "&apos;");
      return `'${value}'`;
    }
    for (const attrName of this._attributeNames) {
      const value = this._attributeValues[attrName.toLowerCase()];
      s += " " + attrName + (value ? "=" + attrValue(value) : "");
    }
    return s;
  }
  setAttributeNode(node) {
    this.setAttribute(node.name, node.value);
  }
  getAttributeNode(name2) {
    return new Attr({ name: name2, value: this._attributeValues[name2.toLowerCase()] });
  }
  attachShadow(mode) {
    this.shadowRoot = this.ownerDocument.createElement("shadow:root");
  }
  hasChildNodes() {
    return this.childNodes.length > 0;
  }
  set innerHTML(text) {
    if (this._isLiteralValue) {
      this.textContent = text;
    } else {
      this.childNodes = [];
      this._virtual.parse(this, text);
    }
  }
  get nodeName() {
    return this.tagName;
  }
  get src() {
    return this.getAttribute("src");
  }
  get href() {
    return this.getAttribute("href");
  }
  get id() {
    return this.getAttribute("id");
  }
  get type() {
    return this.getAttribute("type");
  }
  set src(val) {
    return this.setAttribute("src", val);
  }
  set href(val) {
    return this.setAttribute("href", val);
  }
  set id(val) {
    return this.setAttribute("id", val);
  }
  set type(val) {
    return this.setAttribute("type", val);
  }
  get _moduloTagName() {
    if (this.isModulo && this.cparts && this.cparts.component && this.cparts.component.conf) {
      const { namespace, name: name2 } = this.cparts.component.conf;
      return `${namespace}-${name2}`;
    }
    return (this.tagName || "").toLowerCase();
  }
  get innerHTML() {
    if (this.tagName === "SCRIPT" || this.nodeType === 8) {
      return this.nodeValue;
    }
    let s = "";
    for (const child of this.childNodes) {
      if (child.nodeType === 3) {
        s += child.textContent;
      } else if (child.nodeType === 1) {
        s += child.outerHTML;
      } else if (child.nodeType === 8) {
        s += "<!--" + (child.nodeValue || " ") + "-->";
      }
    }
    return s;
  }
  get outerHTML() {
    const tagName = (this.tagName || "").toLowerCase();
    if (!tagName) {
      return "";
    }
    let suffix = SELF_CLOSING;
    if (this._isLiteralValue) {
      suffix = ">" + this.nodeValue + "</" + tagName + ">";
    } else if (!this._isSelfClosing) {
      suffix = ">" + this.innerHTML + "</" + tagName + ">";
    }
    return "<" + tagName + this._makeAttributeString() + suffix;
  }
  querySelector(cssSelector) {
    const results = this.querySelectorAll(cssSelector);
    if (results.length) {
      return results[0];
    } else {
      return null;
    }
  }
  closest(cssSelector) {
    let node = this.parentNode;
    while (node) {
      if (node._selectorMatches(cssSelector)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }
  contains(elem) {
    let nodes = this.childNodes;
    while (nodes.length) {
      const child = nodes.shift();
      if (child === elem) {
        return true;
      } else if (child.childNodes && child.childNodes.length) {
        nodes.push(...child.childNodes);
      }
    }
    return false;
  }
  _selectorMatches(cssSelector) {
    const selectors = (cssSelector || "").trim().split(",");
    for (const sel of selectors) {
      const s = sel.trim();
      if (s === "*") {
        return true;
      }
      if (s.toLowerCase() === this.tagName.toLowerCase()) {
        return true;
      }
      if (s.includes("#")) {
        const idSplit = s.split("#");
        if (this.getAttribute("id") === idSplit[1]) {
          return true;
        }
      }
      if (s.includes(".")) {
        const classes = s.split(".");
        if (classes[0]) {
          if (classes[0].toLowerCase() !== this.tagName.toLowerCase()) {
            continue;
          }
        }
        if (this.getAttribute("class").split(" ").includes(classes[1])) {
          return true;
        }
      }
      if (s.includes("[")) {
        const attrs = s.split("[");
        if (attrs[0]) {
          if (attrs[0].toLowerCase() !== this.tagName.toLowerCase()) {
            continue;
          }
        }
        if (attrs[1]) {
          let [key, value] = attrs[1].split("=");
          if (key.endsWith("$")) {
            value = value.replace(/['"]/g, "");
            const myVal = this.getAttribute(key.replace(/\$$/, ""));
            if (myVal !== null && myVal.endsWith(value)) {
              return true;
            }
          } else {
            const myVal = this.getAttribute(key);
            if (!value && myVal !== null || value === myVal) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  querySelectorAll(cssSelector, breakAfterOne = false) {
    const results = [];
    for (const node of this.children) {
      if (node._selectorMatches(cssSelector)) {
        results.push(node);
      }
      results.push(...node.querySelectorAll(cssSelector));
    }
    return results;
  }
  toString() {
    return "[object HTMLElement]";
  }
}

// src/http.mjs
var exports_http = {};
__export(exports_http, {
  encodeURIComponent: () => encodeURIComponent,
  encodeURI: () => encodeURI,
  decodeURIComponent: () => decodeURIComponent,
  URLSearchParams: () => URLSearchParams,
  URL: () => URL,
  Response: () => Response,
  Headers: () => Headers
});

class URL {
  constructor(url, baseURL) {
    let m = String(url).replace(/^\s+|\s+$/g, "").match(/^([^:\/?#]+:)?(?:\/\/(?:([^:@\/?#]*)(?::([^:@\/?#]*))?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
    if (!m) {
      throw new RangeError;
    }
    let protocol = m[1] || "";
    let username = m[2] || "";
    let password = m[3] || "";
    let host = m[4] || "";
    let hostname = m[5] || "";
    let port = m[6] || "";
    let pathname = m[7] || "";
    let search = m[8] || "";
    let hash = m[9] || "";
    if (baseURL !== undefined) {
      let base = new this.constructor(baseURL);
      let flag = protocol === "" && host === "" && username === "";
      if (flag && pathname === "" && search === "") {
        search = base.search;
      }
      if (flag && pathname.charAt(0) !== "/") {
        pathname = pathname !== "" ? ((base.host !== "" || base.username !== "") && base.pathname === "" ? "/" : "") + base.pathname.slice(0, base.pathname.lastIndexOf("/") + 1) + pathname : base.pathname;
      }
      let output = [];
      pathname.replace(/^(\.\.?(\/|$))+/, "").replace(/\/(\.(\/|$))+/g, "/").replace(/\/\.\.$/, "/../").replace(/\/?[^\/]*/g, function(p) {
        if (p === "/..") {
          output.pop();
        } else {
          output.push(p);
        }
      });
      pathname = output.join("").replace(/^\//, pathname.charAt(0) === "/" ? "/" : "");
      if (flag) {
        port = base.port;
        hostname = base.hostname;
        host = base.host;
        password = base.password;
        username = base.username;
      }
      if (protocol === "") {
        protocol = base.protocol;
      }
    }
    this.origin = protocol + (protocol !== "" || host !== "" ? "//" : "") + host;
    this.href = protocol + (protocol !== "" || host !== "" ? "//" : "") + (username !== "" ? username + (password !== "" ? ":" + password : "") + "@" : "") + host + pathname + search + hash;
    this.protocol = protocol;
    this.username = username;
    this.password = password;
    this.host = host;
    this.hostname = hostname;
    this.port = port;
    this.pathname = pathname;
    this.search = search;
    this.hash = hash;
  }
  toString() {
    return this.href;
  }
}

class URLSearchParams {
  constructor(text) {
    if (text && text.startsWith("?")) {
      text = text.substring(1);
    }
    const dec = (s) => decodeURIComponent(s);
    this.data = text.split("&").map((s) => s.split("=").map(dec));
  }
  get(key) {
    return (this.getAll(key) || [null])[0];
  }
  getAll(key) {
    return this.data.filter(([k, value]) => k === key).map((p) => p[1]);
  }
}

class Response {
  constructor(data, url = null) {
    this._url = url;
    this._data = data;
  }
  json() {
    return new Promise((resolve, reject) => {
      try {
        resolve(JSON.parse((this._data || "").toString()));
      } catch (e) {
        reject(e);
      }
    });
  }
  text() {
    return new Promise((resolve, reject) => {
      resolve((this._data || "").toString());
    });
  }
  bytes() {
    return new Promise((resolve, reject) => resolve(this._data));
  }
}

class Headers {
}
var encodeURIComponent = (text) => {
  const re = new RegExp("([^A-Za-z0-9\\-_\\.!~\\*'\\(\\)])", "g");
  return text.replace(re, (m, str, ind) => "%" + text.charCodeAt(ind));
};
var decodeURIComponent = (text) => {
  return text.replace(/%([a-f0-9][a-f0-9])/ig, (m, num) => String.fromCharCode(num));
};
var encodeURI = encodeURIComponent;

// src/extensions.mjs
var exports_extensions = {};
__export(exports_extensions, {
  utils: () => exports_utils,
  internal: () => internal,
  cli: () => cli
});

// src/utils.mjs
var exports_utils = {};
__export(exports_utils, {
  template: () => template,
  saveNamedCache: () => saveNamedCache,
  runScript: () => runScript,
  runFrame: () => runFrame,
  rewriteModuleScript: () => rewriteModuleScript,
  resolvePath: () => resolvePath,
  renderText: () => renderText,
  htmShlex: () => htmShlex,
  hash: () => hash,
  getCachePath: () => getCachePath,
  formatConsole: () => formatConsole,
  defaultConsole: () => defaultConsole,
  Bundler: () => Bundler
});
var SEP = "/";
var SEP_RE = new RegExp(SEP, "g");
var IMPORT_RE = /import\s*(\w+|\{[^\*\}]+\}|\*\s*as\s*\S+)\s*from *("[^"]+"|'[^']+');?/ig;
var EXPORT_RE1 = /\n\s*export\s+(const|let|var)\s+(\w+)/gm;
var EXPORT_RE2 = /\n\s*export\s+(async\s+function\*?|function\*?|class)\s+(\w+)/gm;
var EXPORT_RE3 = /(?:^|\n)\s*export\s+(?:default)?([^]+)$/gm;
var EXPORTFROM_RE = /export\s+(\w+|\{[^\*\}]+\})\s*from/g;
var REMOTES_PATH = "./_cache/remotes/";
var LOCAL_CACHE_NAME_HINT = "local-cache-name-hint";
var _SYM = "_OLUDOM_SYM" + Math.random();
function rewriteAutoExps(content, autoExports) {
  const push = (m, m1, m2) => {
    autoExports.push(m2);
    return `
` + m1 + " " + m2;
  };
  const pushFrom = (m, m1) => {
    autoExports.push(m1);
    return `
import ` + m1;
  };
  return content.replace(EXPORT_RE1, push).replace(EXPORT_RE2, push).replace(EXPORTFROM_RE, pushFrom);
}
function rewriteModuleScript(path, content, paths = [], globalVar = null) {
  const glob2 = globalVar || "window.navigator.extensions.internal.modules";
  const autoExports = [];
  let code = rewriteAutoExps(content, autoExports);
  if (autoExports.length) {
    code += `export default {${autoExports.join(", ")}}`;
  } else if (/=\s*require\(['"].+["']\)/.test(code)) {}
  code = code.replace(EXPORT_RE3, `
return $1;`);
  const pushImport = (m, m1, m2) => {
    const pathCleaned = m2.replace(/(^'|^"|'$|"$)/g, "");
    const rpath = resolvePath(path, "..", pathCleaned);
    const mpath = JSON.stringify(rpath);
    paths.push(rpath);
    const name2 = m1.replace(/^\*\s*as\s*/, "");
    const mod = `(typeof ${glob2}[${mpath}] === "function" ? ` + `(${glob2}[${mpath}] = ${glob2}[${mpath}]())` + ` : ${glob2}[${mpath}])
`;
    return `;const ${name2} = ` + mod;
  };
  code = code.replace(IMPORT_RE, pushImport);
  return `${glob2}[${JSON.stringify(path)}]=function (){${code}}`;
}
function resolvePath(...args) {
  let dirParts = [];
  for (const path of args) {
    if (path.startsWith(SEP)) {
      dirParts = path.split(SEP_RE);
      continue;
    }
    for (const part of path.split(SEP_RE)) {
      if (part.startsWith(".")) {
        if (part === "..") {
          dirParts.pop();
        }
      } else if (part) {
        dirParts.push(part);
      }
    }
  }
  return dirParts.join(SEP);
}
function formatConsole(args) {
  const newArgs = [];
  let ignoreNext = false;
  for (let str of args) {
    if (ignoreNext) {
      ignoreNext = false;
      continue;
    } else if (typeof str === "object") {
      try {
        if ("outerHTML" in str) {
          str = str.outerHTML;
        } else {
          str = JSON.stringify(str, null, 2);
        }
      } catch (e) {}
    } else if (str && str.startsWith && str.startsWith("%c")) {
      str = str.substr(2);
      ignoreNext = true;
    }
    newArgs.push(str);
  }
  return newArgs;
}
var defaultCSyms = {
  log: "|     ",
  group: "|----+",
  groupEnd: "|----+---",
  error: "|!ERR|",
  info: "|(i) |",
  warn: "|WARN|"
};
var cCount = 0;
function defaultConsole(method, args) {
  const sym = method === "count" ? `|${++cCount}|` : defaultCSyms[method];
  console.log(sym, ...args);
}
function hash(str) {
  let h = 0;
  for (let i = 0;i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  const hash8 = ("---------" + (h || 0).toString(32)).slice(-8);
  return hash8.replace(/-/g, "0");
}
async function runScriptClassic(elem) {
  if (elem.__run) {
    return;
  }
  elem.__run = true;
  const EXE_TYPES = { javascript: 1, "application/javascript": 1, module: 1 };
  const type = elem.getAttribute("type");
  if (type && !(type in EXE_TYPES)) {
    return;
  }
  if (elem.closest("template")) {
    return;
  }
  let code = elem.nodeValue;
  let src = elem.hasAttribute("src") ? elem.getAttribute("src") : "";
  if (src) {
    code = await (await elem._virtual.window.fetch(src)).text();
  }
  if (type !== "module") {
    elem._virtual.window.Function(code)();
    return;
  }
  const { internal } = elem._virtual.window.navigator.extensions;
  code = rewriteModuleScript(src, code, internal.moduleQueue);
  elem._virtual.window.Function(code)();
  while (internal.moduleQueue.length > 0) {
    const pathWithQuotes = internal.moduleQueue.shift();
    const src2 = pathWithQuotes.replace(/(^'|^"|'$|"$)/g, "");
    if (!(src2 in internal.modules)) {
      const script2 = elem._virtual.document.createElement("script");
      script2.setAttribute("type", "module");
      script2.setAttribute("src", src2);
      await runScriptClassic(script2);
    }
  }
  if (elem.isConnected) {
    const script2 = elem._virtual.document.createElement("script");
    const glob2 = "window.navigator.extensions.internal.modules";
    script2.nodeValue = `${glob2}[${JSON.stringify(src)}]();`;
    elem._virtual.enqueueDOM(script2);
  }
}
function htmShlex(elem, line) {
  const win = elem._virtual.window;
  let e = elem.firstElementChild;
  const isOpening = /^<([a-z0-9\._:-]+)/i;
  const isCommand = /^[^<#\u001b]/;
  const isClosing = RegExp("(</" + (e ? e.tagName : "") + "|/) *>\\s*$", "i");
  const proc = {};
  if (isCommand.test(line)) {
    line = "<" + line + " />";
  }
  if (e || isOpening.test(line)) {
    elem._shellBuffer = (elem._shellBuffer || "") + line;
    elem.innerHTML = elem._shellBuffer;
    if (elem._shellBuffer.endsWith("/>")) {
      e = elem.firstElementChild;
      proc.Sync = true;
      proc.stdin = "-";
    }
  }
  if (e && isClosing.test(line)) {
    proc.Params = `?argv=${e.tagName.toLowerCase()}`;
    for (let name2 of e.getAttributeNames()) {
      let value = e.getAttribute(name2);
      if (!value || /^(a|argv)[0-9]+/i.test(name2)) {
        value = value ? value : name2;
        name2 = "argv";
      } else {
        proc[name2] = value;
      }
      proc.Params += `&${name2}=${win.encodeURIComponent(value)}`;
    }
    proc.Params += "stdin" in proc ? "" : "&stdin=PROC";
    proc.Content = (proc.content || "") + (e.innerHTML || "");
    proc.File = (proc.href || win.location.href) + proc.Params;
    elem.innerHTML = "";
    elem._shellBuffer = "";
  }
  return proc;
}
function renderText(elem, settings = null) {
  const win = elem._virtual.window;
  settings = settings || {
    wordWrap: 80,
    tagsToSkip: { SCRIPT: 1, TEMPLATE: 1, TITLE: 1 },
    preTags: { PRE: 1, CODE: 1, TT: 1 }
  };
  const wwRegExp = new RegExp(`(?![^\\n]{1,${settings.wordWrap}}$)` + `([^\\n]{1,${settings.wordWrap}})\\s`, "g");
  const wordWrap = (s) => s.replace(wwRegExp, `$1
`);
  const clean = (s) => s.replace(/[\n\s]+/g, " ").trim();
  for (const child of elem.childNodes) {
    if (child.tagName && child.tagName in settings.tagsToSkip) {
      continue;
    }
    let text = child.textContent || "";
    if (!(child.tagName in settings.preTags)) {
      text = wordWrap(clean(text)).trim();
    }
    if (text) {
      win.console.log(text);
    }
  }
}
async function saveNamedCache(win, url, path) {
  const headers = {};
  headers[LOCAL_CACHE_NAME_HINT] = path;
  await win.fetch(url, { method: "OPTIONS", headers });
}
function template(string, context, regexp = /\{\{(.*?)\}\}/g) {
  return string.replace(regexp, (m, c) => context[c.trim().toLowerCase()]);
}
function getCachePath(win, urlStr) {
  const url = new win.URL(urlStr, win.location.toString());
  const hashCode = hash(url.toString());
  const filename = url.pathname.split("/").pop() || hashCode;
  const filePath = `${url.protocol}${url.host}/${hashCode}/${filename}`;
  return REMOTES_PATH + filePath;
}

class Bundler {
  constructor(loaders, config) {
    this.files = {};
    this.copyFiles = {};
    this.queue = [];
    this.prefix = [config.jsPrefix || `var ${config.globalVar}={};`];
    this.suffix = [config.jsSuffix || ""];
    Object.assign(this, { loaders, config });
  }
  rewriteModule(path, code) {
    return rewriteModuleScript(path, code, this.queue, this.config.globalVar);
  }
  async add(path, isMain = false) {
    const ext = (path.split(/[:\.]/g).pop() || "").toLowerCase();
    const finder = ({ types, match }) => match ? match(path) : (ext in types);
    const modPath = path.replace(/\.([a-z0-9]+):[a-z0-9]+$/i, ".$1");
    if (modPath in this.files) {
      return;
    }
    if (isMain && modPath === path) {
      this.suffix.push(`${this.config.globalVar}["${modPath}"]();`);
    }
    const loader = this.loaders.find(finder);
    this.files[modPath] = await loader.load(modPath, this);
    if (loader.copy) {
      this.copyFiles[modPath] = loader.copy;
    }
  }
  async addQueue(path) {
    while (this.queue.length > 0) {
      const pathWithQuotes = this.queue.shift();
      const src = pathWithQuotes.replace(/(^'|^"|'$|"$)/g, "");
      await this.add(src);
    }
  }
  generate(filenamePrefix, ext = "js") {
    this.prefix.sort();
    this.suffix.sort();
    const order = Object.keys(this.files);
    order.sort();
    const results = this.prefix.concat(order.map((k) => this.files[k]));
    results.push(...this.suffix);
    const content = results.join(`
`);
    this.filename = `${filenamePrefix}.${hash(content)}.${ext}`;
    return content;
  }
}
async function runFrame(elem, force = false) {
  const src = elem.src || "about:blank";
  if (!elem.hasAttribute("srcdoc") && src === "about:blank") {
    return;
  }
  if (elem.__run && (html || elem.src) === elem.__run && !force) {
    return;
  }
  if (elem.closest("template")) {
    return;
  }
  let html = null;
  if (elem.hasAttribute("srcdoc")) {
    html = elem.getAttribute("srcdoc");
    elem.__run = html;
  } else {
    elem.__run = src;
    html = await (await elem._virtual.window.fetch(src)).text();
  }
  elem.contentWindow._readyFrame();
  elem.contentWindow.window.parent = elem._virtual.window;
  elem.contentWindow.window.location = new elem.contentWindow.window.URL(src);
  elem.contentWindow.document._loadPage(html);
}
var runScript = runScriptClassic;

// src/extensions.mjs
class FileStore {
  constructor(name2) {
    this.name = name2;
    this.data = { fdata: {}, log: [] };
    this.subscribers = [];
  }
  getItem(path) {
    return path in this.data.fdata ? this.data.fdata[path] : null;
  }
  removeItem(key, val) {
    this.setItem(key, null);
  }
  propagate(name2, val, origin = null, filename = null) {
    for (const sub of this.subscribers) {
      if (sub === origin) {
        continue;
      }
      if (filename && "fileCallback" in sub) {
        sub.fileCallback(filename, val);
      } else if ("stateChangedCallback" in sub) {
        sub.stateChangedCallback(name2, val, origin);
      } else {
        throw new Error("Invalid subscriber: ", sub);
      }
    }
  }
  setItem(key, val) {
    this.data.fdata[key] = val;
    this.propagate("fdata", this.data.fdata, this, key);
    this.data.log.push([key, new Date().getTime() / 1000]);
    this.propagate("log", this.data.log, this);
  }
}
var internal = {
  cache: new FileStore("CACHE"),
  modules: {},
  moduleQueue: []
};
var cli = { FileStore };

// src/window.mjs
function newWindow(consoleFunction = null) {
  const vwindow = Object.assign({ Document }, exports_parser, exports_dom, exports_http);
  const win = Object.assign({ _queue: [] }, vwindow);
  win.window = win;
  win.customElements = newCustomElements(win);
  win.Function = newInjectedFunction(win);
  win.eval = (code) => new Function("return " + code)();
  win.history = { pushState: () => {} };
  win.setTimeout = (func) => win._queue.push(func);
  win.__yield = () => {
    let count = 0;
    while (win._queue.length) {
      win._queue.shift()();
      count++;
    }
    return count;
  };
  win.navigator = {
    extensions: Object.assign({ modules: {} }, exports_extensions),
    userAgent: "oludom"
  };
  const { defaultConsole: defaultConsole2, formatConsole: formatConsole2 } = exports_utils;
  consoleFunction = consoleFunction || defaultConsole2;
  const log = (method, args) => consoleFunction(method, formatConsole2(args), args);
  win.console = Object.assign({
    log: (...args) => log("log", args),
    group: (...args) => log("group", args),
    groupEnd: (...args) => log("groupEnd", args),
    error: (...args) => log("error", args),
    info: (...args) => log("info", args),
    warn: (...args) => log("warn", args),
    count: (...args) => log("count", args)
  });
  win.sessionStorage = new cli.FileStore("sessionStorage");
  win.localStorage = new cli.FileStore("localStorage");
  win.document = new Document;
  win.document._setupParentWindowFrame(null);
  win.frames = [];
  win.addEventListener = (...args) => win.document.addEventListener(...args);
  win.dispatchEvent = (...args) => win.document.dispatchEvent(...args);
  return win;
}
function newCustomElements(win) {
  return {
    unknown: {},
    _upgrade: (name2) => {
      name2 = name2.toUpperCase();
      for (const elemRef of win.customElements.unknown[name2] || []) {
        const elem = "deref" in elemRef ? elemRef.deref() : elemRef;
        if (elem && elem.tagName && elem.tagName === name2) {
          const newElem = elem.ownerDocument.createElement(elem.tagName);
          newElem._attributeNames = elem._attributeNames;
          newElem._attributeValues = elem._attributeValues;
          newElem.append(...elem.childNodes);
          elem.replaceWith(newElem);
          newElem.connectedCallback();
        }
      }
      delete win.customElements.unknown[name2];
    },
    elemClasses: {},
    define: (name2, elemClass) => {
      name2 = name2.toUpperCase();
      win.customElements.elemClasses[name2] = elemClass;
      win.customElements._upgrade(name2);
    }
  };
}
function newInjectedFunction(win) {
  return function InjectedFunction(...params) {
    const code = params.pop();
    const globalParams = Object.keys(win).filter((key) => code.includes(key));
    const newGlobals = globalParams.filter((key) => !params.includes(key));
    const func = Function(...newGlobals.concat(params), code);
    return (...args) => func(...newGlobals.map((key) => win[key]), ...args);
  };
}

class Document extends HTMLElement2 {
  _setupParentWindowFrame(parentWindow) {
    this._setupNode({ nodeType: 1, tagName: "HTML" });
    this._virtual = parentWindow;
    this.isConnected = true;
  }
  toString() {
    return (this._doctype ? this._doctype + `
` : "") + this.outerHTML;
  }
  _loadPage(pageContent) {
    this.head = this.createElement("head");
    this.body = this.createElement("body");
    this.append(this.head, this.body);
    this._setupOwnerDocument(this);
    if (pageContent !== null) {
      if (/^\s*<[!\?][^-]/.test(pageContent)) {
        this._doctype = pageContent.split(">")[0] + ">";
        pageContent = pageContent.substr(this._doctype.length);
      }
      this.addEventListener("DOMContentLoaded", () => {
        this.readyState = "complete";
      });
      this.write(pageContent);
    }
  }
  _setupOwnerDocument(elem, opts) {
    elem.documentElement = this;
    elem.ownerDocument = this;
    elem._virtual = this._virtual;
  }
  write(pageContent) {
    if (this.readyState === "complete") {
      throw new Error("Attempt to write to closed document.");
    }
    this._virtual.parse(this.body, pageContent, true);
  }
  getElementById(id) {
    return this.querySelector("#" + id);
  }
  createElement(tagName) {
    const win = this._virtual.window;
    const classes = win.customElements.elemClasses;
    const key = tagName.toUpperCase();
    const HTMLElement3 = key in classes ? classes[key] : win.HTMLElement;
    const elem = new HTMLElement3;
    this._setupOwnerDocument(elem);
    elem._setupNode({ nodeType: 1, tagName });
    return elem;
  }
  createElementNS(namespace, tagName) {
    return this.createElement(name);
  }
  createTextNode(text) {
    const tn = new HTMLElement;
    tn.nodeValue = text;
    return tn;
  }
}

class WindowFrame {
  constructor(options) {
    this.interceptor = options.interceptor;
    this.options = options;
    this.logger = this.options.logger;
    this.prompter = this.options.prompter;
    this.cliSettings = this.options.cliSettings;
    this.vwindow = Object.assign({ Document }, exports_parser, exports_dom, exports_http);
    this.domQueue = [];
    this._readyFrame();
  }
  newChild() {
    const frame = new WindowFrame(this.options);
    frame.window.parent = this.window;
    frame.window.location = new frame.window.URL("about:blank");
    this.window.frames.push(frame);
    this.window.setTimeout(this.resumeDOM.bind(this), 0);
    return frame;
  }
  _readyFrame() {
    this.parse = this.vwindow.parse;
    const win = newWindow(this.options.consoleFunction);
    this.window = win;
    this.document = win.document;
    win.fetch = this.fetch.bind(this);
    win.prompt = this.prompter;
    win.confirm = this.confirmer;
    win.__isPromptInteractive = this.options.isInteractive;
    win.document._setupParentWindowFrame(this);
  }
  fetch(...args) {
    let url = args[0] || "";
    const opts = args[1] || { method: "GET", headers: {} };
    return new Promise((resolve, reject) => {
      this.fetchInterceptedSync(resolve, reject, opts.method, url, opts.headers);
    });
  }
  fetchInterceptedSync(resolve, reject, method, url, headers) {
    const opts = {
      request: { method, url, headers },
      window: this.window
    };
    const response = this.interceptor.beforeSyncRequest(opts);
    if (!response || !("body" in response) || response.body === null) {
      reject(new Error(`File access error: ${url} not found (local 404)`));
    } else {
      resolve(new this.window.Response(response.body));
    }
  }
  fetchSync(url) {
    const opts = {
      request: { method: "GET", url },
      window: this.window
    };
    const response = this.interceptor.beforeSyncRequest(opts);
    if (!response) {
      return null;
    }
    return response.body;
  }
  navigate(url) {
    this._readyFrame();
    this.window.location = new this.window.URL(url);
    return this.fetch(url).then((response) => response.text()).then((pageContent) => this.document._loadPage(pageContent));
  }
  tryDispatch(evName) {
    let err = null;
    const ev = new this.window.Event(evName);
    try {
      this.window.__yield();
      this.window.document.dispatchEvent(ev);
      this.window.__yield();
    } catch (e) {
      err = e;
    }
    return err;
  }
  enqueueDOM(elem) {
    const { elemClasses, unknown } = this.window.customElements;
    if (elem.tagName === "IFRAME") {
      this.domQueue.push(elem);
    } else if (elem.tagName === "SCRIPT" || elem.tagName in elemClasses) {
      this.domQueue.push(elem);
    } else {
      unknown[elem.tagName] = unknown[elem.tagName] || [];
      unknown[elem.tagName].push(new WeakRef(elem));
    }
  }
  async resumeDOM() {
    const { elemClasses, unknown } = this.window.customElements;
    const nodes = [];
    while (this.domQueue.length > 0) {
      const elem = this.domQueue.shift();
      if (elem.tagName === "SCRIPT") {
        await exports_utils.runScript(elem);
      } else if (elem.tagName === "IFRAME") {
        await exports_utils.runFrame(elem);
      } else {
        const content = elem._extractContent();
        nodes.push([elem, content]);
      }
    }
    for (const [elem, content] of nodes) {
      if ("connectedCallback" in elem) {
        elem.connectedCallback();
      } else if (!(elem.tagName in elemClasses)) {
        unknown[elem.tagName] = unknown[elem.tagName] || [];
        unknown[elem.tagName].push(new WeakRef(elem));
      }
      Object.assign(elem, content);
    }
    for (const frame of this.window.frames) {
      await frame.resumeDOM();
    }
  }
  async domContentYield() {
    let errs = [];
    try {
      await this.resumeDOM();
      this.window.__yield();
    } catch (e) {
      errs.push(e);
    }
    const ev = new this.window.Event("DOMContentLoaded");
    const all = this.window.document._eventListeners[ev.type];
    for (const listener of all || [() => {}]) {
      try {
        await this.resumeDOM();
        this.window.__yield();
        await listener(ev);
        await this.resumeDOM();
        this.window.__yield();
      } catch (e) {
        errs.push(e);
      }
    }
    return errs.length ? errs : null;
  }
}

// src/browser.mjs
var silentPrefix = '[JavaScript Warning: "';
function newInterceptor(options) {
  const { files, urlPrefix } = options;
  const pathPrefix = new URL(urlPrefix).pathname;
  function _url2path(url, baseURL = "") {
    const base = new URL(baseURL, urlPrefix) + "";
    const p = new URL(url, base).pathname;
    return p.startsWith(pathPrefix) ? p.replace(pathPrefix, "") : p;
  }
  function _log404(options2, url) {
    console.log("|OLUDOM| ER404 |", url);
    console.log("|------+-------+ (Hint:)");
    console.log(...options2.argv, url);
    console.log("|------+-------+");
  }
  async function handleConsole(cons, msg) {
    const getValue = async (arg) => await arg.jsonValue();
    let result = [];
    try {
      result = await Promise.all(msg.args().map(getValue));
    } catch (e) {
      cons.error("BROWSER Error occured during log attempt:", e);
    }
    result = result.filter((s) => s.startsWith && !s.startsWith(silentPrefix));
    if (result.length) {
      cons.log(...result);
    }
  }
  async function handleRoute(route, baseURL) {
    const path = _url2path(route.request().url(), baseURL);
    if (path in files) {
      await route.fulfill({ path });
    } else if (path) {
      _log404(options, path);
      const body = "404 (OluDOM)";
      await route.fulfill({ status: 404, contentType: "text/plain", body });
    }
  }
  function beforeSyncRequest(opts) {
    const baseURL = opts.window.location + "";
    const path = _url2path(opts.request.url, baseURL);
    if (path in files) {
      return { body: files[path] };
    } else if (path) {
      _log404(options, path);
      return { body: null };
    }
  }
  return { beforeSyncRequest, handleRoute, handleConsole };
}

class BrowserDownload {
  constructor(writeCallback = null) {
    this.writeCallback = writeCallback;
  }
  async fromAnchor(asyncElem = null) {
    this.name = await asyncElem.getAttribute("download") || "missing.name";
    const href = await asyncElem.getAttribute("href");
    this.data = decodeURIComponent(href);
  }
  suggestedFilename() {
    return this.name;
  }
  async saveAs(path) {
    return this.writeCallback(path, this.data);
  }
}

class BrowserPage {
  constructor(options) {
    this.urlPrefix = options.urlPrefix;
    this.delay = options.delay;
    this.interceptor = options.interceptor || newInterceptor(options);
    options.interceptor = this.interceptor;
    this.mainFrame = new WindowFrame(options);
    this.frames = [this.mainFrame];
  }
  async saveAnchorAs(aTag, writeCallback) {
    if (this.driver && this.driver.waitForEvent) {
      const downloadPromise = this.driver.waitForEvent("download");
      await aTag.click();
      return await downloadPromise;
    } else {
      const download = new BrowserDownload(writeCallback);
      await download.fromAnchor(aTag);
      return download;
    }
  }
  async setupPageDriver(page) {
    this.driver = page;
    const { handleRoute, handleConsole } = this.interceptor;
    if (page.on) {
      const { console: console2 } = this.mainFrame.window;
      page.on("console", async (msg) => await handleConsole(console2, msg));
    }
    if (page.route) {
      await page.route("**/*", (route) => handleRoute(route, this.url));
    }
  }
  async goto(url) {
    this.url = this.urlPrefix + url;
    if (this.driver) {
      delete this.mainFrame;
      await this.driver.goto(this.url);
    } else {
      await this.mainFrame.navigate(this.url);
      this.exceptionList = await this.mainFrame.domContentYield();
    }
  }
  locator(sel) {
    if (this.driver) {
      return this.driver.locator(sel);
    } else {
      return {
        all: async () => this.mainFrame.window.document.querySelectorAll(sel)
      };
    }
  }
  async waitUntilComplete() {
    if (this.driver && this.driver.waitUntilComplete) {
      await this.driver.waitUntilComplete();
    } else if (this.driver && this.driver.waitForLoadState) {
      await this.driver.waitForLoadState("networkidle");
    } else if (this.mainFrame) {
      await this.mainFrame.resumeDOM();
      this.mainFrame.window.__yield();
    }
    if (this.delay && this.driver && this.driver.waitForTimeout) {
      await this.driver.waitForTimeout(this.delay);
    }
  }
}

class Browser {
  constructor(options) {
    this.configureDefaults(options);
    this.options = options;
    this.pages = [];
    this.driver = null;
  }
  async readyDriver() {
    if (!this.options.driver) {
      return null;
    }
    this.driver = await this.options.driver.launch(this.options);
  }
  configureDefaults(options) {
    options.server = Object.assign({
      proto: "http",
      host: "local.oludom",
      port: 80,
      path: ""
    }, options.server);
    const s = options.server;
    let prefix = `${s.proto}://`;
    if (!(s.proto in { file: 1, about: 1 })) {
      const port = `:${s.port}`;
      prefix += s.host + (port === ":80" ? "" : port);
    }
    options.urlPrefix = prefix + (s.path || "") + "/";
  }
  async newPage() {
    await this.readyDriver();
    const page = new BrowserPage(this.options);
    if (this.driver) {
      const pageDriver = await this.driver.newPage();
      await page.setupPageDriver(pageDriver);
    }
    this.pages.push(page);
    return page;
  }
  async close() {
    if (this.driver && this.driver.close) {
      await this.driver.close();
    } else {
      for (const page of this.pages) {
        await page.waitUntilComplete();
      }
    }
  }
}

// src/cli.mjs
async function runSync(argv, readFileSync, writeFileSync) {
  const readable = {};
  const writable = {};
  let saveAsPath = null;
  const exeFrames = [];
  let count = 0;
  const options = { argv, download: "a[download]", delay: 9000 };
  for (let url of argv) {
    if (url.endsWith("node") && url === argv[0] || url.endsWith("-oludom.mjs") && url === argv[1]) {
      continue;
    }
    if (url.startsWith("--")) {
      await configure(url.slice(2, url.length), options);
      continue;
    }
    if (url.includes("?")) {
      exeFrames.push(url);
      url = url.replace(/\?.*$/, "");
    } else if (url.startsWith("_")) {
      saveAsPath = saveAsPath || url;
      writable[url] = true;
      continue;
    } else if (options.skipRead) {
      readable[url] = 1;
    }
    try {
      readable[url] = readFileSync(url, "utf8");
    } catch (e) {
      console.error("Oludom Cannot Read ERROR:", url);
      console.error(e);
      console.log("To run again, allowing access:");
      console.log(`---
`);
      console.log(...argv, url);
    }
  }
  options.files = readable;
  const browser = new Browser(options);
  if (!exeFrames.length) {
    console.log('ERROR, no file to execute: At least one argument must have a "?"');
    console.log("Example 1: oludom file.html?");
    console.log("Example 2: oludom index.html? _build _cache *.* **/*.*");
    console.log(`---
`);
    console.log(...argv, "index.html?");
  } else {
    for (const file of exeFrames) {
      await runFileInFrame(file);
    }
    await browser.close();
  }
  async function runFileInFrame(file) {
    const page = await browser.newPage();
    await page.goto(file);
    await page.waitUntilComplete();
    if (page.exceptionList && page.exceptionList.length > 0) {
      for (const error of page.exceptionList.slice(1)) {
        console.error(error);
      }
      throw page.exceptionList[0];
    }
    for (const aTag of await page.locator(options.download).all()) {
      const download = await page.saveAnchorAs(aTag, writeFileSync);
      const fn = download.suggestedFilename().replace(/_/g, "/").replace(/\.+/g, ".");
      await download.saveAs(saveAsPath + "/" + fn);
    }
  }
}
async function configure(flagStr, options) {
  const [flag, value] = flagStr.split("=");
  if (flag === "happydom") {
    const { Browser: Browser2 } = await import("happy-dom");
    const launch = (options2) => new Browser2(options2);
    options.driverName = flag;
    options.driver = { launch };
  } else if (flag === "oludom") {} else if (flag in { firefox: 1, chromium: 1 }) {
    options.driverName = flag;
    options.headless = value !== "gui";
    options.skipRead = true;
    if (flag === "firefox") {
      const { firefox } = await import("playwright");
      options.driver = firefox;
    } else if (flag === "chromium") {
      const { chromium } = await import("playwright");
      options.driver = chromium;
    }
  } else if (flag in { proto: 1, host: 1, port: 1, path: 1 }) {
    options.server = options.server || {};
    options.server[flag] = value;
  } else {
    throw new Error("Unknown flag: --" + flag);
  }
}

// scripts/node-oludom.mjs
await runSync(process.argv, readFileSync, writeFileSync);
