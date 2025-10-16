
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
},v=S("
__proto__:null,MATCH_NOTHING_RE:/\b\B/,IDENT_RE:E,UNDERSCORE_IDENT_RE:x,
NUMBER_RE:w,C_NUMBER_RE:y,BINARY_NUMBER_RE:_,
RE_STARTERS_RE:"!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",
SHEBANG:(e={})=>{const t=/^#![ ]*\
;return e.binary&&(e.begin=h(t,/.*\b/,e.binary,/\b.*/)),i({scope:"meta",begin:t,
end:/$/,relevance:0,"on:begin":(e,t)=>{0!==e.index&&t.ignoreMatch()}},e)},
BACKSLASH_ESCAPE:O,APOS_STRING_MODE:k,QUOTE_STRING_MODE:N,PHRASAL_WORDS_MODE:{
begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
},COMMENT:S,C_LINE_COMMENT_MODE:v,C_BLOCK_COMMENT_MODE:M,HASH_COMMENT_MODE:R,
NUMBER_MODE:{scope:"number",begin:w,relevance:0},C_NUMBER_MODE:{scope:"number",
begin:y,relevance:0},BINARY_NUMBER_MODE:{scope:"number",begin:_,relevance:0},
REGEXP_MODE:{begin:/(?=\/[^/\n]*\/)/,contains:[{scope:"regexp",begin:/\
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
G("10.7.0","Please use highlight(code, options) instead.\nhttps:
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
console.warn("https:
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
className:"tag",begin:a.concat(/<\
className:"name",begin:n,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}}
})();hljs.registerLanguage("xml",e)})();

/*! showdown v 2.1.0 - 21-04-2022 */
!function(){function a(e){"use strict";var r={omitExtraWLInCodeBlocks:{defaultValue:!1,describe:"Omit the default extra whiteline added to code blocks",type:"boolean"},noHeaderId:{defaultValue:!1,describe:"Turn on/off generated header id",type:"boolean"},prefixHeaderId:{defaultValue:!1,describe:"Add a prefix to the generated header ids. Passing a string will prefix that string to the header id. Setting to true will add a generic 'section-' prefix",type:"string"},rawPrefixHeaderId:{defaultValue:!1,describe:'Setting this option to true will prevent showdown from modifying the prefix. This might result in malformed IDs (if, for instance, the " char is used in the prefix)',type:"boolean"},ghCompatibleHeaderId:{defaultValue:!1,describe:"Generate header ids compatible with github style (spaces are replaced with dashes, a bunch of non alphanumeric chars are removed)",type:"boolean"},rawHeaderId:{defaultValue:!1,describe:"Remove only spaces, ' and \" from generated header ids (including prefixes), replacing them with dashes (-). WARNING: This might result in malformed ids",type:"boolean"},headerLevelStart:{defaultValue:!1,describe:"The header blocks level start",type:"integer"},parseImgDimensions:{defaultValue:!1,describe:"Turn on/off image dimension parsing",type:"boolean"},simplifiedAutoLink:{defaultValue:!1,describe:"Turn on/off GFM autolink style",type:"boolean"},excludeTrailingPunctuationFromURLs:{defaultValue:!1,describe:"Excludes trailing punctuation from links generated with autoLinking",type:"boolean"},literalMidWordUnderscores:{defaultValue:!1,describe:"Parse midword underscores as literal underscores",type:"boolean"},literalMidWordAsterisks:{defaultValue:!1,describe:"Parse midword asterisks as literal asterisks",type:"boolean"},strikethrough:{defaultValue:!1,describe:"Turn on/off strikethrough support",type:"boolean"},tables:{defaultValue:!1,describe:"Turn on/off tables support",type:"boolean"},tablesHeaderId:{defaultValue:!1,describe:"Add an id to table headers",type:"boolean"},ghCodeBlocks:{defaultValue:!0,describe:"Turn on/off GFM fenced code blocks support",type:"boolean"},tasklists:{defaultValue:!1,describe:"Turn on/off GFM tasklist support",type:"boolean"},smoothLivePreview:{defaultValue:!1,describe:"Prevents weird effects in live previews due to incomplete input",type:"boolean"},smartIndentationFix:{defaultValue:!1,describe:"Tries to smartly fix indentation in es6 strings",type:"boolean"},disableForced4SpacesIndentedSublists:{defaultValue:!1,describe:"Disables the requirement of indenting nested sublists by 4 spaces",type:"boolean"},simpleLineBreaks:{defaultValue:!1,describe:"Parses simple line breaks as <br> (GFM Style)",type:"boolean"},requireSpaceBeforeHeadingText:{defaultValue:!1,describe:"Makes adding a space between `#` and the header text mandatory (GFM Style)",type:"boolean"},ghMentions:{defaultValue:!1,describe:"Enables github @mentions",type:"boolean"},ghMentionsLink:{defaultValue:"https:


modulo.config.markdown = {
tags: { 
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
typographySyntax: [ 
[ /^----*/, 'hr' ],
[ /^    /, 'pre' ],
[ /^######/, 'h6' ],
[ /^#####/, 'h5' ],
[ /^####/, 'h4' ],
[ /^###/, 'h3' ],
[ /^##/, 'h2' ],
[ /^#/, 'h1' ],
[ /^/, 'p' ], 
],
blockTypes: { 
blockquote: { innerTag: '' },
ul: { innerTag: '<li>' },
ol: { innerTag: '<li>' },
table: {
innerTag: '<tr><td>',
splitTag: '<td>',
splitRE: /\-*\|\-*/g, 
},
},
blockSyntax: [ 
[ /(^|\n)>\s*/g, 'blockquote' ],
[ /(^|\n)[\-\*\+](?!\*)/g, 'ul' ],
[ /(^|\n)[0-9]+[\.\)]/g, 'ol' ],
[ /(^|\n)\|/g, 'table' ],
],

inlineTags: [ 
[ /\!\[([^\]]+)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" />' ],
[ /\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>' ],
[ /_([^_`]+)_/g, '<em>$1</em>' ],
[ /`([^`]+)`/g, '<code>$1</code>' ],
[ /\*\*([^\*]+)\*\*/g, '<strong>$1</strong>' ],
[ /\*([^\*]+)\*/g, '<em>$1</em>' ],
],
literalPrefix: '<', 
openComment: '<!--', 
closeComment: '-->',
codeFenceSyntax: '```', 
codeFenceExtraSyntax: null, 
codeFenceTag: 'pre', 
searchHighlight: null, 
searchResults: [ ], 
markdownUtil: 'moduloMarkdown',
searchStyle: 'background: yellow; color: black;',
}

modulo.config.markdown.codeFenceTag = "x-QuickDemo" 
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




const { searchHighlight } = modulo.config.markdown
text = (text + '')
.replace(/<-(script)>/ig, '<' + '/$1>')
.replace(/([\n\s])\/(script)>/ig, '$1<' + '/$2>')
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;').replace(/>/g, '&gt;')
.replace(/'/g, '&#x27;').replace(/"/g, '&quot;')
if (searchHighlight) { 
text = modulo.util.highlightSearch(text)
}
return text;
}
modulo.util.parseMarkdownBlocks = (text) => {
const { blockSyntax, typographySyntax, blockTypes } = modulo.config.markdown
const blocks = [ ]
let children = [ ]
let name = null
function pushBlock(next) { 
if (children.length && (next === false || name !== next)) { 
if (!name) { 
for (let text of children) {
const [ re, name ] = typographySyntax.find(([ re ]) => re.exec(text.trim()))
text = (name === 'p') ? text : text.replace(re, '')
blocks.push({ name, text })
}
} else {
blocks.push({ name, children, block: blockTypes[name] })
}
children = [ ] 
}
}
for (const code of text.split(/\n\r?\n\r?/gi)) { 
if (!code.trim()) { 
children.push(code)
pushBlock(null)
} else { 
const [ re, next ] = blockSyntax.find(([ re ]) => re.exec(code.trim())) || [ ]
pushBlock(next)
const { innerTag } = (blockTypes[next] || { })
const nextChildren = innerTag ? code.split(re) : [ code.replace(re, '\n') ]
children.push(...nextChildren) 
name = next
}
}
pushBlock(false) 
return blocks
};
modulo.util.moduloMarkdown = (content, parentOut = null) => {
const { markdownEscape, moduloMarkdown, parseMarkdownBlocks } = modulo.util
const { inlineTags } = modulo.config.markdown
const out = parentOut || []
for (const { name, text, children, block } of parseMarkdownBlocks(content)) { 
out.push(`<${ name }>`)
if (children) { 
for (let content of children) {
if (content.trim() || block.allowEmpty) {
out.push(block.innerTag)
if (block.splitTag) { 
content = block.splitTag + content.split(block.splitRE).join(block.splitTag)
}
moduloMarkdown(content, out) 
}
}
} else { 
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


if (modulo.config.file) {
modulo.config.file.Filter = 'markdown' 
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
if (modulo.argv[0] === 'search') { 
markdownUtil = 'moduloMarkdown' 
codeFenceTag = 'pre' 
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
const strip3 = s => s.replace(/^\s\s?\s?/, '') 
let literal = null
let codeLiteral = null
let comment = false
let markdownBuffer = null
for (let code of content.split(/\n\r?\n\r?/gi)) { 
if (!(literal || codeLiteral || comment)) {
if (strip3(code).startsWith(openComment)) { 
comment = true 
} else if (strip3(code).startsWith(codeFenceSyntax)) { 
code = strip3(code)
const firstLine = code.split('\n')[0] 
code = code.substr(firstLine.length + 1) 
codeLiteral = firstLine.split(codeFenceSyntax)[1] || 'modulo'

let extra = ''
const secondLine = code.split('\n')[0] 
if (codeFenceExtraSyntax && secondLine.includes(codeFenceExtraSyntax)) {
extra = secondLine.split(codeFenceExtraSyntax)[1].trim()
code = code.substr(secondLine.length + 1)
}
emit(`<${ codeFenceTag } mode="${ codeLiteral }" ${ extra } value="`)
} else if (strip3(code).startsWith(literalPrefix)) { 
code = strip3(code)
literal = code.split(/[^a-zA-Z0-9_-]/)[1] 
}
}
if (comment) { 
comment = !code.includes(closeComment) 
} else if (codeLiteral) { 
if (endsFenceRE.test(code)) { 
code = code.replace(endsFenceRE, '') 
codeLiteral = null 
}
emit(markdownEscape(code) + (codeLiteral ? '\n\n' : ''))
if (codeLiteral === null) {
emit(`"></${ codeFenceTag }>\n`)
}
} else if (literal) { 
emit(code + '\n\n')
if (code.endsWith(`</${ literal }>`)) {
literal = null 
}
} else {
bufferMarkdown(code)
}
}
emit('') 
return out.join('')
}





Modulo.ModuloTOCHelper = modulo => {
const HEADER_RE = /<h([1-6])\s*([^>]*)>([^<]+)<.h[1-6]>/gi;
function html2toc(html) { 
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

function istop(row) {
const collapsedDirs = modulo.definitions.contentlist.collapse.split(/,/g).map(s => '/' + s + '/')
const collapsedDirsRE = new RegExp('(' + collapsedDirs.join('|') + ')')
return row[0].endsWith('/index.html') && collapsedDirsRE.exec('/' + row[0])
}

function selectedtop(rows) {
const collapsedDirs = modulo.definitions.contentlist.collapse.split(/,/g).map(s => '/' + s + '/')
const collapsedDirsRE = new RegExp('(' + collapsedDirs.join('|') + ')')
const path = (window.location.pathname +'')
return collapsedDirs.find(s => path.includes(s))
}

function isvisible(row) {
const collapsedDirs = modulo.definitions.contentlist.collapse.split(/,/g).map(s => '/' + s + '/')
const collapsedDirsRE = new RegExp('(' + collapsedDirs.join('|') + ')')
const path = (window.location.pathname +'')
const selected = collapsedDirs.find(s => path.includes(s))
return selected ? ('/' + row[0]).includes(selected) : !collapsedDirsRE.exec('/' + row[0])
}


function highlight(text, lang = 'django') {
const language = lang.includes('modulo') ? 'django' : lang; 
let html = hljs.highlight(text, { language }).value;

if (lang.includes('modulo')) {
html = html.replace(/"hljs-name">([A-Z])/g, '"hljs-modulo-deftype">$1');
html = html.replace(/"hljs-attr">(-[a-z])/g, '"hljs-modulo-defprocessor">$1'); 
html = html.replace(/"hljs-attr">([A-Z])/g, '"hljs-modulo-deftype-attr">$1');
html = html.replace(/"hljs-name">([a-z]+-[A-Z])/g, '"hljs-modulo-component-tag">$1');
html = html.replace(/"hljs-string">(true|false|null)/g, '"hljs-modulo-attr-value-lit">$1');
html = html.replace(/"hljs-string">([A-Za-z])/g, '"hljs-modulo-attr-value">$1');
html = html.replace(/"hljs-string">([0-9\[\{])/g, '"hljs-modulo-attr-value-lit">$1');
}
return html
}
return { html2toc, ifactive, highlight, isvisible, selectedtop, istop }
}; 
Object.assign(modulo.templateFilter, Modulo.ModuloTOCHelper(modulo))
modulo.registry.modules.configuration = function configuration (modulo) { 

if (modulo.DEV) {
if (modulo.argv[0] === 'buildpartial') {
const params = new window.URLSearchParams(window.location.search)
const body = params.get('body') || ''
const footer = params.get('footer') || ''
const head = params.get('head') || ''
modulo.partial = { body, head, footer }
}
modulo.util.showdownConvert = function showdownConvert (text) {
return (new showdown.Converter()).makeHtml(text)
}
const content = modulo.stores.CACHE.getItem(window.location + '')
if (content) { 
modulo.docsContent = modulo.contentType.MD(content)
document.body.innerHTML = '<x-Page>'
}
}
}modulo.registry.modules.Page = function Page (modulo) { const def = modulo.definitions['Page'];
class x_Page extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_Page);
window.customElements.define(def.TagName, x_Page);
return x_Page;}modulo.registry.modules.Search = function Search (modulo) { const def = modulo.definitions['Search'];
class x_Search extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_Search);
window.customElements.define(def.TagName, x_Search);
return x_Search;}modulo.registry.modules.SyntaxHighlighter = function SyntaxHighlighter (modulo) { const def = modulo.definitions['SyntaxHighlighter'];
class x_SyntaxHighlighter extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_SyntaxHighlighter);
window.customElements.define(def.TagName, x_SyntaxHighlighter);
return x_SyntaxHighlighter;}modulo.registry.modules.MirrorEditor = function MirrorEditor (modulo) { const def = modulo.definitions['MirrorEditor'];
class x_MirrorEditor extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_MirrorEditor);
window.customElements.define(def.TagName, x_MirrorEditor);
return x_MirrorEditor;}modulo.registry.modules.TableOfContents = function TableOfContents (modulo) { const def = modulo.definitions['TableOfContents'];
class x_TableOfContents extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_TableOfContents);
window.customElements.define(def.TagName, x_TableOfContents);
return x_TableOfContents;}modulo.registry.modules.QuickDemo = function QuickDemo (modulo) { const def = modulo.definitions['QuickDemo'];
class x_QuickDemo extends window.HTMLElement {
constructor(){ super(); this.init(); }
static observedAttributes = [];
}
modulo.util.initComponentClass(modulo, def, x_QuickDemo);
window.customElements.define(def.TagName, x_QuickDemo);
return x_QuickDemo;}modulo.registry.modules.Page_template = function Page_template (modulo) { return function (CTX, G) { var OUT=[];
if (CTX.global.docsContent) {
OUT.push("\n        <meta charset=\"utf8\">\n        <title>");
OUT.push(G.filters.escape(CTX.global.docsContent.title));
OUT.push(" - Modulo Documentation</title>\n    ");
}
OUT.push("\n    <div class=\"layout\">\n        <nav class=\"page-nav\">\n            <a style=\"font-size:60px;text-align:center;display:block;font-weight:200\" href=\"");
OUT.push(G.filters.escape(CTX.global.rootPath));
OUT.push("\">ᵐ°dᵘ⁄o</a>\n            <ul style=\"position: sticky; top: 1px\">\n                <li class=\"toc--outer\">\n                    <p><a style=\"font-size: 70%\" title=\"Download Modulo Docs as a offline-friendly zip\" href=\"https:
OUT.push(G.filters.escape(CTX.global.config.modulo.version));
OUT.push("</tt>\n                    </p>\n                </li>\n                ");
var ARR0=CTX.global.definitions.contentlist.data;for (var KEY in ARR0) {CTX. row=ARR0[KEY];
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
OUT.push("\n            </ul>\n        </nav>\n        <main class=\"page-container\">\n            ");
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
return OUT.join(""); };}modulo.registry.modules.Search_template = function Search_template (modulo) { return function (CTX, G) { var OUT=[];
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
return OUT.join(""); };}modulo.registry.modules.Search_script = function Search_script (modulo) { 

if (modulo.argv && modulo.argv[0] === 'search') {
modulo.config.markdown.searchHighlight =
new window.URLSearchParams(window.location.search).get('q')

}
modulo.command.search = function search(modulo) {
if (!window.parent) {
return
} 

window.setTimeout(() => {
const results = modulo.config.markdown.searchResults
if (!results.length) {
return 
}
const msg = {
searchLoadSuccess: true,
pathname: window.location.pathname,
src: window.location + '',
results,
}
window.parent.postMessage(JSON.stringify(msg), '*')

}, 3000)
}
function _getResult(src) { 
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
function initializedCallback(renderObj) { 
state.q = new window.URLSearchParams(window.location.search).get('q')
window.addEventListener('message', (ev) => _getMessage(JSON.parse(ev.data)), false);
return {
titleArr: 'Modulo Search'.split('')
}
}
var state,style,element;return{_setLocal:function(o){state=o.state;style=o.style;element=o.element}, "search":typeof search !=="undefined"?search:undefined,"_getResult":typeof _getResult !=="undefined"?_getResult:undefined,"_getMessage":typeof _getMessage !=="undefined"?_getMessage:undefined,"initializedCallback":typeof initializedCallback !=="undefined"?initializedCallback:undefined}}modulo.registry.modules.SyntaxHighlighter_script = function SyntaxHighlighter_script (modulo) { 
const { highlight } = modulo.templateFilter
function renderCallback() {
component.innerHTML = highlight(props.value, props.mode)
}
var props,component;return{_setLocal:function(o){props=o.props;component=o.component}, "renderCallback":typeof renderCallback !=="undefined"?renderCallback:undefined}}modulo.registry.modules.MirrorEditor_template = function MirrorEditor_template (modulo) { return function (CTX, G) { var OUT=[];
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
return OUT.join(""); };}modulo.registry.modules.MirrorEditor_script = function MirrorEditor_script (modulo) { 
function initializedCallback() {
if (element.value) { 
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

if (!ref.textarea) {
return
}
ref.textarea.value = state.value;


setStateAndRerender(ref.textarea);
ref.textarea.addEventListener('keydown', keyDown);
ref.textarea.addEventListener('keyup', keyUp);


element.stateChangedCallback = (name, val, originalEl) => {
ref.textarea.value = val;
ref.textarea.setSelectionRange(state.selectionStart,
state.selectionStart);
setStateAndRerender(ref.textarea);
};

try {
new ResizeObserver(updateDimensions).observe(ref.textarea);
} catch {
console.error('Could not listen to resize of ref.textarea');
}
}
let globalDebounce = null;
function keyUp(ev) {
if (globalDebounce) { 
clearTimeout(globalDebounce);
globalDebounce = null;
}
setStateAndRerender(ev.target); 
}
function keyDown(ev) { 
const textarea = ev.target;
if (globalDebounce) { 
clearTimeout(globalDebounce);
globalDebounce = null;
}
const qRerender = () => setStateAndRerender(textarea);
globalDebounce = setTimeout(qRerender, 10);
}
function updateDimensions() {
if (!ref.textarea) {
return; 
}
const { scrollLeft, scrollTop } = ref.textarea;
const { clientWidth, clientHeight } = ref.textarea;
if (state.scrollLeft !== scrollLeft || 
state.scrollTop !== scrollTop ||
state.width !== clientWidth || 
state.height !== clientHeight) {

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
var props,state,component,element,ref;return{_setLocal:function(o){props=o.props;state=o.state;component=o.component;element=o.element;ref=o.ref}, "initializedCallback":typeof initializedCallback !=="undefined"?initializedCallback:undefined,"prepareCallback":typeof prepareCallback !=="undefined"?prepareCallback:undefined,"updateCallback":typeof updateCallback !=="undefined"?updateCallback:undefined,"keyUp":typeof keyUp !=="undefined"?keyUp:undefined,"keyDown":typeof keyDown !=="undefined"?keyDown:undefined,"updateDimensions":typeof updateDimensions !=="undefined"?updateDimensions:undefined,"setStateAndRerender":typeof setStateAndRerender !=="undefined"?setStateAndRerender:undefined}}modulo.registry.modules.TableOfContents_template = function TableOfContents_template (modulo) { return function (CTX, G) { var OUT=[];
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
return OUT.join(""); };}modulo.registry.modules.TableOfContents_script = function TableOfContents_script (modulo) { 
function prepareCallback() {
if (!state.toc) { 
state.toc = JSON.parse(props.toc)
state.show = !!state.toc.length
state.orig = element.parentNode.style.paddingRight;
}
}
function updateCallback() { 
element.parentNode.style.paddingRight = state.sticky
? '310px' : state.orig;
}
var props,state,style,element;return{_setLocal:function(o){props=o.props;state=o.state;style=o.style;element=o.element}, "prepareCallback":typeof prepareCallback !=="undefined"?prepareCallback:undefined,"updateCallback":typeof updateCallback !=="undefined"?updateCallback:undefined}}modulo.registry.modules.QuickDemo_template = function QuickDemo_template (modulo) { return function (CTX, G) { var OUT=[];
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
return OUT.join(""); };}modulo.registry.modules.QuickDemo_script = function QuickDemo_script (modulo) { 


const REMOTE_MODULO_SRC = 'https:
function prepareCallback(renderObj) {

if (state.demo === null) { 

state.value = props.value 
state.demo = false
if (props.demo) {
state.demo = 'template_' + props.demo
run() 
}
if (props.name) {
state.name = props.name
}
if (props.usage) {
state.value = props.value.split(props.usage)[0]
state.usage = props.value.split(props.usage)[1]
}

}
}
function run() { 
state.count++
}
function updateCallback() {
if (state.count > state.lastRun) {
refreshDemo()
state.lastRun = state.count 
}
}
function render(extra = { }) {
const renderObj = parts.component.getCurrentRenderObj()
if (!(state.demo in renderObj)) { 
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
const oldIframe = element.querySelector('iframe') 
const parentNode = oldIframe.parentNode
oldIframe.remove()
const iframe = document.createElement('iframe')
parentNode.append(iframe) 
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
var props,template,editor_settings,state,component,element,parts,ref;return{_setLocal:function(o){props=o.props;template=o.template;editor_settings=o.editor_settings;state=o.state;component=o.component;element=o.element;parts=o.parts;ref=o.ref}, "prepareCallback":typeof prepareCallback !=="undefined"?prepareCallback:undefined,"run":typeof run !=="undefined"?run:undefined,"updateCallback":typeof updateCallback !=="undefined"?updateCallback:undefined,"render":typeof render !=="undefined"?render:undefined,"copy":typeof copy !=="undefined"?copy:undefined,"refreshDemo":typeof refreshDemo !=="undefined"?refreshDemo:undefined,"toggle":typeof toggle !=="undefined"?toggle:undefined,"save":typeof save !=="undefined"?save:undefined}}
modulo.definitions = { 
    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    

    file: {"Type":"file","Parent":null,"Content":"---\ntitle: State - Component Parts\n---\n\n\n\n# State\n\nThe _State_ is for component instances to store changing data. This could\ninclude anything from text a user entered into a form, data received from an\nAPI, or data that represents UI flow changes, such as the visibility of a\nmodal.\n\nBy default (that is, with no `-store` attribute), state data is unique to every\ncomponent instance, and components can never directly access sibling or parent\ndata. It is possible to indirectly reference it, however, by passing state data\nfrom a \"parent\" component to a \"child\" components within the parent by passing\nit via a _Props_ attribute. In this case, the data should be considered\nread-only to the child component, like any other _Props_ data.\n\n## Example\n\nSee below for a quick example, showing off an example of each of the 6 types of data:\n\n```\n<State\n    color=\"red\"                   (String)\n    count:=1                      (Number)\n    loading:=false                (Boolean)\n    company:=null                 (Null)\n    items:='[ \"abc\", \"def\" ]'     (Array)\n    obj:='{ \"a\": \"b\", \"c\": \"d\" }' (Object)\n></State>\n```\n\n# Definition\n\nState is traditionally included in Component definitions below the _Template_\ntag, but above the _Script_ tag. This makes sense because functions in the\n_Script_ tag typically manipulate state in order to render new HTML in the\n_Template_, making _Script_ a sort of mutable bridge between _Script_ and\n_Template_. State is defined in a similar way to Props: Only defined with\nproperties, but no contents.\n\nSee below for an example of defining a _State_ Component Part:\n\n\n## Example 1\n\nTwo State variables specified, of type String and Number:\n\n```\n<State\n    name=\"Luiz\"\n    favenum:=13\n></State>\n```\n\n## Example 2\n\nBuilding up complicated JSON data with \".\" syntax:\n\n```\n<State\n    user:={}\n    user.name=\"gigasquid\"\n    user.uid:=1313\n    user.address:={}\n    user.address.billable:=null\n    user.address.ready:=true\n></State>\n```\n\n\nNote that all \"state variables\" _must_ have an initial value. It's okay to make\nthe initial value be `null` (as in the \"billable\" example above), or other some\nplaceholder that will later be replaced. Undefined state variables are treated\nas errors.\n\n\n# Stores\n\n\nIf you want to share data between components globally, such that any component\ncan modify the data causing a re-render to all linked components, such as user\nlog-in information or global state data, then you can use the powerful `-store`\nattribute:\n\n```\n<State\n    -store=\"userinfo\"\n    username=\"pombo\"\n    tags:='[\"admin\", \"printing\"]'\n></State>\n```\n\nWith this, any state with the given store _throughout your application_ will\nshare state and subscriptions to updates.\n\n#### Limiting a store with -only\n\nSometimes, you'll only want to subscribe to certain attributes parts of a store:\n\n```\n<State\n    -store=\"userinfo\"\n    -only:='[\"username\"]'\n    username=\"pombo\"\n></State>\n```\n\n\n# Component Part properties\n\nThe actual data in a _State_ Component Part is stored on it's \"data\" property. This\nproperty is a regular JavaScript Object, and thus can store any JavaScript data\ntype. As an example, in a _Script_ Component Part, you can directly reference this\nproperty with the code `cparts.state.data`.\n\nWhen writing the _State_ Component Part definition, you must declare or pre-define each\n\"state variable\" or property of the \"data\" Object that you want to use. It is\nnot permitted to create new state variables later on. In other words, if you\nonly define `cparts.state.data` as having `.count` and `.title` as \"state\nvariables\" (aka properties of the \"data\" Object), then an attempt like\n`cparts.state.data.newstuff = 10;` may result in an error. If you are dealing\nwith a situation where you have an unknown quantity of data, such as from an\nAPI, the correct approach is to store it all within a nested Object _inside_\nthe state data Object, e.g. such as an `data.apiResults` Object or Array.\nUnlike top-level \"state variables\", it's okay to add properties, modify, or\nbuild upon nested Objects.\n\nWhile it's allowed to assign any arbitrary reference as a _State_ variable,\nincluding complex, unserializable types such as function callbacks, it's highly\nrecommended to try to keep it to primitive and serializable types as much as\npossible (e.g. String, Number, Boolean, Array, Object). The reason being that\nthere may be future features or third-party add-ons for _State_ which will only\nsupport primitive types (as an example, that would be required to save state to\nlocalStorage). If you want to store functions, consider using a\n`prepareCallback` to generate the functions within a Script context, and only\nstore the data needed to \"generate\" the function in the state (as opposed to\nstoring a direct reference to the function itself).\n\n### renderObj\n\nState contributes it's current data values to the renderObj. Examples:\n\n* State initialized like: `<State name=\"Luiz\">` will be accessible on the\n  renderObj like `renderObj.state.name`, and in the Script or Template Component Parts\n  like `state.name`.\n* State initialized like: `<State stuff:='[\"a\", \"b\"]'>` will be accessible on\n  the renderObj like `renderObj.state.info` (with individual items accessed\n  with code that ends with \"`.stuff[0]`\"), and in the Script or Template Component Parts\n  like `state.info`.\n\n### Directives\n\nState provides a single directive:\n\n* `state.bind` \\- Two-way binding with State data, with the key determined by\n  the `name=` property of whatever it is attached to. You can attach a\n  `state.bind` directive to any HTML `<input>`, and the _State_ Component Part's\n  two-way binding will cause the input value to be updated if the state\n  variable ever changes, and if a user edits the input triggering a `\"keyup\"`\n  or `\"change\"` event, the state variable will be updated (along with,\n  typically, a re-render of the component).\n\n# Syntax Examples\n\nExamine below for how two different syntaxes can be used to construct data:\nEither the JSON style all in one go, or the somewhat more verbose (but perhapse\neasier to maintain) dataProp style:\n\n\n```modulo\nedit:demo=modulo\n<Template>\n    {% if state_a|json is state_b|json %}\n        <strong style=\"color: green\">MATCH</strong>\n        <pre>{{ state_a|json:2 }}</pre>\n    {% else %}\n        <strong style=\"color: red\">NOT MATCH</strong>\n        <pre>{{ state_a|json }}</pre>\n        <pre style=\"color: red\">{{ state_b|json }}</pre>\n    {% endif %}\n</Template>\n\n<State\n    -name=\"state_a\"\n    count:=42\n    stuff:=null\n    articles:=[]\n    articles.0:={}\n    articles.1:={}\n    articles.2:={}\n    articles.0.headline=\"Modulo released!\"\n    articles.1.headline=\"Can JS be fun again?\"\n    articles.2.headline=\"MTL considered harmful\"\n    articles.0.tease=\"The most exciting news of the century.\"\n    articles.2.tease=\"Why constructing JS is risky business.\"\n></State>\n\n<State\n    -name=\"state_b\"\n    count:=42\n    stuff:=null\n    articles:='[\n      {\"headline\": \"Modulo released!\",\n       \"tease\": \"The most exciting news of the century.\"},\n      {\"headline\": \"Can JS be fun again?\"},\n      {\"headline\": \"MTL considered harmful\",\n       \"tease\": \"Why constructing JS is risky business.\"}\n    ]'\n></State>\n\n```\n\n\n# Binding Examples\n\n\n* *Useful resource:* Read this for a full list of input types. With the\n  exception of some of the ones listed below, they will all be \"String\" in\n  terms of the State Component Part. [MDN input Element\n  documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input)\n\n### Example #1: Binding different input types\n\n```modulo\nedit:demo=modulo\n<Template>\n    <h3>Customize</h3>\n\n    <!-- text (default) -->\n    <input state.bind name=\"subject\" />\n\n    <!-- textarea -->\n    <textarea state.bind name=\"body\"></textarea>\n\n    <!-- checkbox -->\n    <label>Underlined: <input state.bind name=\"underlined\"\n            type=\"checkbox\" min=\"50\" max=\"500\" step=\"10\" /></label>\n\n    <!-- select -->\n    <label>Font\n        <select state.bind name=\"font\">\n            <option value=\"serif\">Serif</option>\n            <option value=\"sans-serif\">Sans-Serif</option>\n            <option value=\"monospace\">Monospace</option>\n        </select>\n    </label>\n\n    <!-- button element -->\n    <!-- (Note that the event has to be specified) -->\n    <label>RESET\n        <button state.bind.click name=\"subject\" value=\"XXXXXXX\">\n            SUBJ (XXXXXXX)\n        </button>\n        <button state.bind.click name=\"body\" value=\"XXXXXXX\">\n            BODY (XXXXXXX)\n        </button>\n    </label>\n\n    <!-- number -->\n    <label>Padding: <input state.bind name=\"paddingSize\"\n            type=\"number\" min=\"1\" max=\"10\" step=\"1\" /></label>\n\n    <!-- range -->\n    <label>Width: <input state.bind name=\"contentWidth\"\n            type=\"range\" min=\"50\" max=\"500\" step=\"10\" /></label>\n\n    <!-- color -->\n    <label>BG: <input state.bind name=\"accentColor\"\n            type=\"color\" /></label>\n\n    <h5 style=\"\n        {% if state.underlined %}\n            text-decoration: underline;\n        {% endif %}\n        font-family: {{ state.font }};\n        background: {{ state.accentColor }};\n        padding: {{ state.padding-size }}px;\n        width: {{ state.content-width }}px;\n        top: 0;\n        right: 0;\n        position: fixed;\n    \">{{ state.subject }} - {{ state.body }}</h5>\n</Template>\n<State\n    subject=\"Testing message...\"\n    body=\"Welcome to my blog\"\n    underlined:=false\n    font=\"monospace\"\n    padding-size:=5\n    content-width:=70\n    accent-color=\"#ffeeee\"\n></State>\n\n<Style>\n    label {\n        display: block;\n        border: 1px solid black;\n        padding: 5px;\n    }\n</Style>\n```\n\n\n### Example #2: Combining with filters\n\n\n```modulo\nedit:demo=modulo\n<Template>\n<div>\n    <label>Username:\n        <input state.bind name=\"username\" /></label>\n    <label>Color (\"green\" or \"blue\"):\n        <input state.bind name=\"color\" /></label>\n    <label>Opacity: <input state.bind\n        name=\"opacity\"\n        type=\"number\" min=\"0\" max=\"10\" step=\"1\" /></label>\n\n    <h5 style=\"\n            opacity: {{ state.opacity|multiply:'0.1' }};\n            color: {{ state.color|allow:'green,blue'|default:'red' }};\n        \">\n        {{ state.username|lower }}\n    </h5>\n</div>\n\n</Template>\n\n<State\n    opacity:=5\n    color=\"blue\"\n    username=\"Testing_Username\"\n></State>\n```\n\n\n### Example #3: Specifying events\n\n```modulo\nedit:demo=modulo\n<Template>\n    <p>Default (.change):</p>\n    <input state.bind\n        name=\"c\" type=\"range\"\n        min=\"1\" max=\"10\" step=\"1\" />\n    <p>Smooth (.input):</p>\n    <input state.bind.input\n        name=\"c\" type=\"range\"\n        min=\"1\" max=\"10\" step=\"1\" />\n    <tt style=\"{% if state.c gt 7 %}color: green{% endif %}\">\n        {{ state.c }}\n    </tt>\n</Template>\n<State\n    c:=5\n></State>\n<Style>\n    :host {\n        display: grid;\n        grid-template-columns: 90px 90px;\n    }\n</Style>\n```\n\n\n# Store Examples\n\n\n### Example #1: Store for simple state sharing\n\n\n```modulo\nedit: demo=modulo_component name=\"SharedState\" usage=\"USAGE:\"\n<Template>\n    <input state.bind name=\"a\" />\n    <input state.bind name=\"b\" />\n    <input state.bind name=\"c\" type=\"range\"\n                        min=\"1\" max=\"10\" step=\"1\" />\n    <tt style=\"{% if state.c gt 7 %}color: green{% endif %}\">\n        {{ state.c }}\n    </tt>\n</Template>\n<State\n    -store=\"my_global_info\"\n    a=\"A b c\"\n    b=\"do re me\"\n    c:=5\n></State>\n<Style>\n    :host {\n        display: grid;\n        grid-template-columns: 60px 60px 60px 20px;\n    }\n</Style>\n\nUSAGE:\n<x-SharedState></x-SharedState>\n<hr />\n<x-SharedState></x-SharedState>\n<hr />\n<x-SharedState></x-SharedState>\n```\n\n\n### Example #2: Multiple States and bound buttons\n\nHere we have an incomplete \"chat\" component with two State Component Parts. This one\nshares state between instances of it. Note that \"msg\" is not shared (neither is\n_Props_), but \"messages\" is shared.\n\n\n```modulo\nedit: demo=modulo_component name=\"StoreChat\" usage=\"USAGE:\"\n<Props\n    username\n></Props>\n<Template>\n    {% for m in chat.messages %}\n        <em>{{ m.name }}</em><strong>{{ m.text }}</strong>\n    {% endfor %}\n    <input state.bind name=\"msg\" />\n    <button\n        on.click=chat.messages.push\n        chat.bind.click=\"messages\"\n        payload:='{\n            \"text\": \"{{ state.msg|escapejs }}\",\n            \"name\": \"{{ props.username|escapejs }}\"\n        }'\n    >SEND</button>\n</Template>\n<State\n    msg=\"\"\n></State>\n<State\n    -name=\"chat\"\n    -store=\"chat\"\n    messages:=[]\n></State>\n<Style>\n    :host {\n        display: grid;\n        grid-template-columns: 100px 100px;\n    }\n</Style>\n\nUSAGE:\n<x-StoreChat username=\"ALICE\"></x-StoreChat>\n<hr />\n<x-StoreChat username=\"BOB\"></x-StoreChat>\n\n```\n\n\n","DefName":null,"type":"md","Name":"file","DefinitionName":"file"},

    modulo: {"Type":"modulo","Parent":null,"DefName":null,"build":{"mainModules":["configuration","_component_Frame","_component_TextEdit","_component_Editor","_component_Page","Page","Search","SyntaxHighlighter","MirrorEditor","TableOfContents","QuickDemo"]},"defaultContent":"<meta charset=utf8><modulo-Page>","fileSelector":"script[type='mdocs'],template[type='mdocs'],style[type='mdocs'],script[type='md'],template[type='md'],script[type='f'],template[type='f'],style[type='f']","scriptSelector":"script[src$='mdu.js'],script[src$='Modulo.js'],script[src='?'],script[src$='Modulo.html']","version":"0.1.0","timeout":5000,"ChildPrefix":"","Contains":"core","DefLoaders":["DefTarget","DefinedAs","Src","Content"],"defaultDef":{"DefTarget":null,"DefinedAs":null,"DefName":null},"defaultDefLoaders":["DefTarget","DefinedAs","DataType","Src"],"defaultDefBuilders":["FilterContent","ContentType","Load"],"Name":"modulo","DefinitionName":"modulo","Source":"file:///home/michaelb/projects/modulo-site/docs/static/","ChildrenNames":["contentlist","contentlist1","contentlist2","contentlist3","contentlist4","include","modulo1","modulo2","js","css","phtml","configuration"]},

    contentlist: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"build","Name":"contentlist","DefinitionName":"contentlist","data":[["start/index.html","           Introduction","       Modulo"],["start/getting-started.html"," Getting Started"],["defs/overview.html","         Overview","           Definitions"],["defs/importing.html","        Importing"],["defs/definitions.html","      Definition Types"],["defs/processors.html","       Processors"],["defs/custom.html","           Custom Types"],["templating/index.html","      Language Overview","  Templating"],["templating/filters.html","    Template Filters"],["templating/tags.html","       Template Tags"],["parts/props.html","           Props","              Component Parts"],["parts/script.html","          Script"],["parts/state.html","           State"],["parts/staticdata.html","      StaticData"],["parts/style.html","           Style"],["parts/template.html","        Template"],["core/artifact.html","         Artifact","           Core Definitions"],["core/component.html","        Component"],["core/configuration.html","    Configuration"],["core/contentlist.html","      ContentList"],["core/include.html","          Include"],["core/library.html","          Library"],["extension/engine.html","      Upgrading Engines","  Extension"]],"commands":[" "]},

    contentlist1: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"buildpartial","Name":"contentlist1","DefinitionName":"contentlist1","data":[["start/index.html"],["start/getting-started.html"],["defs/overview.html"],["defs/importing.html"],["defs/definitions.html"],["defs/processors.html"],["defs/custom.html"]],"commands":["build1"]},

    contentlist2: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"buildpartial","Name":"contentlist2","DefinitionName":"contentlist2","data":[["parts/props.html"],["parts/script.html"],["parts/state.html"],["parts/staticdata.html"],["parts/style.html"],["parts/template.html"]],"commands":["build2"]},

    contentlist3: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"buildpartial","Name":"contentlist3","DefinitionName":"contentlist3","data":[["core/artifact.html"],["core/component.html"],["core/configuration.html"],["core/contentlist.html"],["core/include.html"],["core/library.html"],["extension/engine.html"]],"commands":["build3"]},

    contentlist4: {"Type":"contentlist","Parent":"modulo","DefName":null,"DefFinalizers":["command|Command"],"build":"buildpartial","Name":"contentlist4","DefinitionName":"contentlist4","data":[["templating/index.html"],["templating/filters.html"],["templating/tags.html"]],"commands":["build4"]},

    include: {"Type":"include","Parent":"modulo","Content":"\n    <script src=\"js/highlight.min.htm\"></script>\n    <script src=\"js/showdown_2.1.0.min.htm\"></script>\n    <script src=\"js/ModuloDocs-markdown.htm\"></script>\n    <script src=\"js/ModuloDocs-toc-helpers.htm\"></script>\n","DefName":null,"ServerTemplate":"{% for p, v in entries %}<script src=\"https://{{ server }}/{{ v }}\"></script>{% endfor %}","DefLoaders":["DefTarget","DefinedAs","Src","Server","LoadMode"],"Name":"include","DefinitionName":"include"},

    modulo1: {"Type":"modulo","Parent":"modulo","DefName":null,"build":{"mainModules":["configuration","_component_Frame","_component_TextEdit","_component_Editor","_component_Page","Page","Search","SyntaxHighlighter","MirrorEditor","TableOfContents","QuickDemo"]},"defaultContent":"<meta charset=utf8><modulo-Page>","fileSelector":"script[type='mdocs'],template[type='mdocs'],style[type='mdocs'],script[type='md'],template[type='md'],script[type='f'],template[type='f'],style[type='f']","scriptSelector":"script[src$='mdu.js'],script[src$='Modulo.js'],script[src='?'],script[src$='Modulo.html']","version":"0.1.0","timeout":5000,"ChildPrefix":"","Contains":"core","DefLoaders":["DefTarget","DefinedAs","Src","Content"],"defaultDef":{"DefTarget":null,"DefinedAs":null,"DefName":null},"defaultDefLoaders":["DefTarget","DefinedAs","DataType","Src"],"defaultDefBuilders":["FilterContent","ContentType","Load"],"Name":"modulo1","DefinitionName":"modulo1","Source":"file:///home/michaelb/projects/modulo-site/docs/static/config.html","ChildrenNames":["include1","include2"]},

    modulo2: {"Type":"modulo","Parent":"modulo","DefName":null,"build":{"mainModules":["configuration","_component_Frame","_component_TextEdit","_component_Editor","_component_Page","Page","Search","SyntaxHighlighter","MirrorEditor","TableOfContents","QuickDemo"]},"defaultContent":"<meta charset=utf8><modulo-Page>","fileSelector":"script[type='mdocs'],template[type='mdocs'],style[type='mdocs'],script[type='md'],template[type='md'],script[type='f'],template[type='f'],style[type='f']","scriptSelector":"script[src$='mdu.js'],script[src$='Modulo.js'],script[src='?'],script[src$='Modulo.html']","version":"0.1.0","timeout":5000,"ChildPrefix":"","Contains":"core","DefLoaders":["DefTarget","DefinedAs","Src","Content"],"defaultDef":{"DefTarget":null,"DefinedAs":null,"DefName":null},"defaultDefLoaders":["DefTarget","DefinedAs","DataType","Src"],"defaultDefBuilders":["FilterContent","ContentType","Load"],"Name":"modulo2","DefinitionName":"modulo2","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/","ChildrenNames":["Page","Search","SyntaxHighlighter","MirrorEditor","TableOfContents","QuickDemo"]},

    js: {"Type":"artifact","Parent":"modulo","Content":"{% for id in def.ids %}{{ def.data|get:id|syntax:\"trimcode\"|safe }}{% endfor %}\nmodulo.definitions = { {% for name, value in definitions %}\n    {% if name|first is not \"_\" %}{{ name }}: {{ value|json|safe }},{% endif %}\n{% endfor %} };\n{% for name in config.modulo.build.mainModules %}{% if name|first is not \"_\" %}\n    modulo.registry.modules.{{ name }}.call(window, modulo);\n{% endif %}{% endfor %}","DefName":null,"tagAliases":{"js":"script","ht":"html","he":"head","bo":"body"},"pathTemplate":"{{ tag|default:cmd }}-{{ hash }}.{{ def.name }}","DefLoaders":["DefTarget","DefinedAs","DataType","Src","build|Command"],"CommandBuilders":["FilterContent","Collect","Bundle","LoadElems"],"CommandFinalizers":["Remove","SaveTo"],"Preprocess":true,"name":"js","Name":"js","DefinitionName":"js","commands":["buildpartial"],"data":[],"ids":["include_xxclnmkt","include_xxtk706m","include_xx1m7vna","include_xx7b7nlv","include_xx1c6prm","include_x1rm6iuu","include_xxt7utrr","include_xxvvs3ap","include_x133jbvf","include_xx1efm98","include_xxugalop","include_xxgvmkhj","include_x1uv8j9d","include_xxqtoakc","include_xxxpsvdq","include_xxgn0fkl","include_x1hcp0ni","include_xxdkdovk","include_x12a63i6","include_x13k7t6q","include_x1di8tug"]},

    css: {"Type":"artifact","Parent":"modulo","Content":"{% for id in def.ids %}{{ def.data|get:id|safe }}{% endfor %}","DefName":null,"tagAliases":{"js":"script","ht":"html","he":"head","bo":"body"},"pathTemplate":"{{ tag|default:cmd }}-{{ hash }}.{{ def.name }}","DefLoaders":["DefTarget","DefinedAs","DataType","Src","build|Command"],"CommandBuilders":["FilterContent","Collect","Bundle","LoadElems"],"CommandFinalizers":["Remove","SaveTo"],"Preprocess":true,"SaveTo":"BUILD","name":"css","Name":"css","DefinitionName":"css","commands":["buildpartial"],"data":[],"ids":["include_x1kf37v0","include_xxov48cc","include_xxlr4onj","include_xx48ocir","include_x19gnv3t","include_x1im2tgt","include_xxoel2ff","include_xxggr51o","include_xxnpdlmd","include_x1e0ng7t","include_xxqmcbjt","include_x1f1i97q"]},

    phtml: {"Type":"artifact","Parent":"modulo","Content":"<html>\n        <head>\n            {{ doc.head.innerHTML|safe }}\n            {% if not global.partial.head %}\n                <script src=\"{{ root-path }}static/Modulo.html\"></script>\n            {% endif %}\n            <link rel=\"stylesheet\" href=\"{{ root-path }}{{ definitions.css.path }}\">\n            <script defer=\"\" src=\"{{ root-path }}{{ definitions.js.path }}\"></script>\n        </head>\n        <body>\n            {{ global.partial.body|safe }}\n            {{ doc.body.innerHTML|safe }}\n            {{ global.partial.footer|safe }}\n        </body>\n    </html>","DefName":null,"tagAliases":{"js":"script","ht":"html","he":"head","bo":"body"},"pathTemplate":"{{ file-path|default:'index.html' }}","DefLoaders":["DefTarget","DefinedAs","DataType","Src","build|Command"],"CommandBuilders":["FilterContent","Collect","Bundle","LoadElems"],"CommandFinalizers":["Remove","SaveTo"],"Preprocess":true,"SaveTo":"BUILD","name":"phtml","Remove":"head iframe,modulo,script[modulo],template[modulo]","prefix":"<!DOCTYPE html>","Name":"phtml","DefinitionName":"phtml","commands":["buildpartial"]},

    configuration: {"Type":"configuration","Parent":"modulo","DefName":null,"DefLoaders":["DefTarget","DefinedAs","Src|SrcSync","Content|Code","DefinitionName|MainRequire"],"Name":"configuration"},

    include1: {"Type":"include","Parent":"modulo1","Content":"\n    <meta name=\"charset\" charset=\"utf8\">\n    <meta name=\"content-type\" http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <meta name=\"robots\" content=\"index, follow\">\n    <meta name=\"revisit-after\" content=\"30 days\">\n","DefName":null,"ServerTemplate":"{% for p, v in entries %}<script src=\"https://{{ server }}/{{ v }}\"></script>{% endfor %}","DefLoaders":["DefTarget","DefinedAs","Src","Server","LoadMode"],"Name":"include1","DefinitionName":"include1"},

    include2: {"Type":"include","Parent":"modulo1","Content":"\n<style>\n    :root {\n        --btn-shadow-dist: 4px;\n        --btn-shadow-dist-neg: -4px;\n        --color-fg-light: #00000011;\n        --color-fg-semilight: #00000044;\n        --color-fg-semi: #00000088;\n        --color-fg-semidark: #000000DD;\n        --color: #B90183;\n        --color-alt: #a2e4b8;\n        --color-outline: #111;\n        --color-content-bg: white;\n        --color-bg: white;\n        --color-fg: black;\n\n        --font-serif: serif;\n        --font-sans: sans-serif;\n        --font-mono: monospace;\n\n        --fg: black;\n        --fg-shading: white;\n        --bg: #ffffff;\n    }\n\n    @media (prefers-color-scheme: dark) {\n        :root {\n            --btn-shadow-dist: 4px;\n            --btn-shadow-dist-neg: -4px;\n            --color-fg-light: #ffffff11;\n            --color-fg-semilight: #ffffff44;\n            --color-fg-semi: #ffffff88;\n            --color-fg-semidark: #ffffffDD;\n            --color: #B90183;\n            --color-alt: #a2e4b8;\n            --color-outline: #eee;\n            --color-content-bg: black;\n            --color-bg: black;\n            --color-fg: white;\n\n            --fg: white;\n            --fg-shading: black;\n            --bg: black;\n        }\n    }\n\n    body {\n        color: var(--color-fg);\n        background-color: var(--color-content-bg);\n        margin: 0;\n        font-family: sans-serif;\n    }\n\n    /* Browser Reset */\n    html, body {\n        font-size: 17px;\n        font-weight: 400;\n        line-height: 1.4;\n    }\n</style>\n","DefName":null,"ServerTemplate":"{% for p, v in entries %}<script src=\"https://{{ server }}/{{ v }}\"></script>{% endfor %}","DefLoaders":["DefTarget","DefinedAs","Src","Server","LoadMode"],"Name":"include2","DefinitionName":"include2"},

    Page: {"Type":"component","Parent":"modulo2","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"vanish","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"Page","Name":"Page","DefinitionName":"Page","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/Page.html","ChildrenNames":["Page_template","Page_style","Page_style1"],"namespace":"x","TagName":"x-page","className":"x_Page"},

    Search: {"Type":"component","Parent":"modulo2","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"Search","Name":"Search","DefinitionName":"Search","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/Search.html","ChildrenNames":["Search_props","Search_template","Search_state","Search_script","Search_style"],"namespace":"x","TagName":"x-search","className":"x_Search"},

    SyntaxHighlighter: {"Type":"component","Parent":"modulo2","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"SyntaxHighlighter","Name":"SyntaxHighlighter","DefinitionName":"SyntaxHighlighter","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/SyntaxHighlighter.html","ChildrenNames":["SyntaxHighlighter_props","SyntaxHighlighter_script","SyntaxHighlighter_style","SyntaxHighlighter_style1"],"namespace":"x","TagName":"x-syntaxhighlighter","className":"x_SyntaxHighlighter"},

    MirrorEditor: {"Type":"component","Parent":"modulo2","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"manual","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"MirrorEditor","Name":"MirrorEditor","DefinitionName":"MirrorEditor","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/MirrorEditor.html","ChildrenNames":["MirrorEditor_props","MirrorEditor_template","MirrorEditor_editor_settings","MirrorEditor_state","MirrorEditor_script","MirrorEditor_style"],"namespace":"x","TagName":"x-mirroreditor","className":"x_MirrorEditor"},

    TableOfContents: {"Type":"component","Parent":"modulo2","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"TableOfContents","Name":"TableOfContents","DefinitionName":"TableOfContents","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/TableOfContents.html","ChildrenNames":["TableOfContents_props","TableOfContents_template","TableOfContents_state","TableOfContents_script","TableOfContents_style"],"namespace":"x","TagName":"x-tableofcontents","className":"x_TableOfContents"},

    QuickDemo: {"Type":"component","Parent":"modulo2","DefName":null,"tagAliases":{"html-table":"table","html-script":"script","js":"script"},"mode":"regular","rerender":"event","Contains":"part","RenderObj":"component","DefLoaders":["DefTarget","DefinedAs","Src","FilterContent","Content"],"DefBuilders":["CustomElement","alias|AliasNamespace","Code"],"DefFinalizers":["MainRequire"],"CommandBuilders":["Prebuild|BuildLifecycle","BuildLifecycle"],"Directives":["onMount","onUnmount"],"DirectivePrefix":"","name":"QuickDemo","Name":"QuickDemo","DefinitionName":"QuickDemo","Source":"file:///home/michaelb/projects/modulo-site/docs/static/components/QuickDemo.html","ChildrenNames":["QuickDemo_props","QuickDemo_template","QuickDemo_editor_settings","QuickDemo_state","QuickDemo_script","QuickDemo_style","QuickDemo_style1"],"namespace":"x","TagName":"x-quickdemo","className":"x_QuickDemo"},

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
 };

    modulo.registry.modules.configuration.call(window, modulo);

    modulo.registry.modules.Page.call(window, modulo);

    modulo.registry.modules.Search.call(window, modulo);

    modulo.registry.modules.SyntaxHighlighter.call(window, modulo);

    modulo.registry.modules.MirrorEditor.call(window, modulo);

    modulo.registry.modules.TableOfContents.call(window, modulo);

    modulo.registry.modules.QuickDemo.call(window, modulo);
