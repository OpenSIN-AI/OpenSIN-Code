(()=>{var g=chrome;var x="https://api.nopecha.com";var n="https://www.nopecha.com",m="https://developers.nopecha.com",y="https://nopecha.com/api-reference/",$={doc:{url:m,automation:{url:`${m}/guides/extension_advanced/#automation-build`}},ref:{url:y},api:{base:x,recognition:"/v1/recognition",status:"/v1/status"},www:{url:n,annoucement:{url:`${n}/json/announcement.json`},demo:{url:`${n}/captcha`,hcaptcha:{url:`${n}/captcha/hcaptcha`},recaptcha:{url:`${n}/captcha/recaptcha`},funcaptcha:{url:`${n}/captcha/funcaptcha`},awscaptcha:{url:`${n}/captcha/awscaptcha`},textcaptcha:{url:`${n}/captcha/textcaptcha`},turnstile:{url:`${n}/captcha/turnstile`},perimeterx:{url:`${n}/captcha/perimeterx`},geetest:{url:`${n}/captcha/geetest`},lemincaptcha:{url:`${n}/captcha/lemincaptcha`}},manage:{url:`${n}/manage`},pricing:{url:`${n}/pricing`},setup:{url:`${n}/setup`}},discord:{url:`${n}/discord`},github:{url:`${n}/github`,release:{url:`${n}/github/release`}}};function b(e){let t=("4bba7932fc09d4cce09e1aba0037cb66b9c0d39d70f4cb482262ba1f523717a7"+e).split("").map(o=>o.charCodeAt(0));return f(t)}var h=new Uint32Array(256);for(let e=256;e--;){let t=e;for(let o=8;o--;)t=t&1?3988292384^t>>>1:t>>>1;h[e]=t}function f(e){let t=-1;for(let o of e)t=t>>>8^h[t&255^o];return(t^-1)>>>0}async function T(e,t){let o=""+[+new Date,performance.now(),Math.random()],[i,r]=await new Promise(c=>{g.runtime.sendMessage([o,e,...t],l=>{c(l)})});if(i===b(o))return r}function p(e){if(document.readyState!=="loading")setTimeout(e,0);else{let t;t=()=>{removeEventListener("DOMContentLoaded",t),e()},addEventListener("DOMContentLoaded",t)}}[...document.body.children].forEach(e=>e.remove());function s(e,t,o={}){let i=document.createElement(e);return o&&Object.entries(o).forEach(([r,c])=>i[r]=c),t.appendChild(i),i}function w(){s("style",document.head,{innerText:`
                * {
                    box-sizing: border-box;
                    word-wrap: break-word;
                }
                html, body {
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: monospace, monospace;
                    font-size: 14px;
                    margin: 16px;
                    line-height: 1;
                }

                p {
                    margin-top: 8px;
                    margin-bottom: 8px;
                }
                table {
                    border-collapse: collapse;
                    margin-top: 8px;
                    margin-bottom: 16px;
                }
                th, td {
                    font-size: 14px;
                    border: 1px solid #dddddd;
                    text-align: left;
                    padding: 8px;
                }
                th {
                    background-color: #f2f2f2;
                }

                .bold {
                    font-weight: bold;
                }
                .small {
                    font-size: 0.825em;
                }
                .red {
                    color: #d9534f;
                }
                .muted {
                    color: #6c757d;
                }
            `})}function E(){s("p",document.body,{innerText:"Invalid URL",className:"bold red"}),s("p",document.body,{innerText:"Please set the URL hash and reload the page."}),s("p",document.body,{innerText:"Example: https://nopecha.com/setup#YOUR_API_KEY",className:"small muted"})}function _(e){return/^(true|false)$/.test(e)?e==="true":/^\d+$/.test(e)?+e:e}function L(){let e="NopeCHA Settings Import",t=document.querySelector("title");document.title!==e&&t&&(t.innerText=e),w();let o=document.location.hash.substring(1);if(!o)return E();let i=o.split("|"),r=Object.fromEntries(i.map(a=>a.includes("=")?a.split("="):["key",a]).map(([a,d])=>[a,_(d)]));if("disabled_hosts"in r){let a=""+r.disabled_hosts;a===""?r.disabled_hosts=[]:decodeURIComponent(a).startsWith("[")?r.disabled_hosts=JSON.parse(decodeURIComponent(a)):r.disabled_hosts=a.split(",")}"key"in r&&r.key.includes(",")&&(r.keys=r.key.split(","),delete r.key),s("p",document.body,{innerText:"Imported settings:",className:"bold"});let c=s("table",document.body),l=s("tr",c);s("th",l,{innerText:"Name"}),s("th",l,{innerText:"Value"}),Object.entries(r).forEach(([a,d])=>{let u=s("tr",c);s("td",u,{innerText:a}),s("td",u,{innerText:JSON.stringify(d)})}),T("settings::update",[r])}p(L);})();
