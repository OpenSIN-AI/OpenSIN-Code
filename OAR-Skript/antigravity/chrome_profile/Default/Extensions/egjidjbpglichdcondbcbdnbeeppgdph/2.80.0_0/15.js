try{let b=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},E=new b.Error().stack;E&&(b._sentryDebugIds=b._sentryDebugIds||{},b._sentryDebugIds[E]="2b3829ed-ede0-4e54-a0a0-4913a9c5e2fd",b._sentryDebugIdIdentifier="sentry-dbid-2b3829ed-ede0-4e54-a0a0-4913a9c5e2fd")}catch{}{let b=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{};b.SENTRY_RELEASE={id:"2.80.0"}}(self.webpackChunkbrowser_extension_wallet=self.webpackChunkbrowser_extension_wallet||[]).push([[15],{1824:((b,E,r)=>{r.d(E,{p:()=>y});var i=r(20038);const B={collections:[],collectionsLastSync:null,reportedByWallet:{},nfts:{}},y=(0,i.Z0)({name:"nft",initialState:B,reducers:{addCollections(o,n){o.collections.push(...n.payload.collections)},resetCollections(o,n){o.collections=n.payload.collections},removeCollection(o,n){o.collections=o.collections.filter(s=>s.id!==n.payload.id)},reduceCollectionOwnedTokens(o,n){const s=o.collections.find(l=>l.id===n.payload.id);s&&(s.totalOwnedTokens-=1)},reportCollection(o,n){if(n.payload.report)o.reportedByWallet[n.payload.walletId]?o.reportedByWallet[n.payload.walletId].push(n.payload.collectionId):o.reportedByWallet[n.payload.walletId]=[n.payload.collectionId];else{const s=o.reportedByWallet[n.payload.walletId].indexOf(n.payload.collectionId);o.reportedByWallet[n.payload.walletId].splice(s,1)}},resetCollectionItems(o,n){o.nfts[n.payload.collectionId]={lastSync:Date.now(),items:n.payload.items}},appendCollectionItems(o,n){n.payload.collectionId in o.nfts&&(o.nfts[n.payload.collectionId].items.push(...n.payload.items),o.nfts[n.payload.collectionId].lastSync=Date.now())},resetItemsByCollectionKey(o){const n=Object.keys(o.nfts);for(let s=0;s<n.length;s++)o.collections.some(d=>d.id===n[s])||delete o.nfts[n[s]]},touchNFTs(o){o.collectionsLastSync=Date.now()}}})}),2597:((b,E,r)=>{r.d(E,{Dz:()=>y,b4:()=>n,uv:()=>o});var i=r(90658),B=r(81220);class y extends B.X{constructor(l){var d;super(),this.port=(d=i.A.runtime)==null?void 0:d.connect({name:l||"extension-message"}),this.port||location.reload(),this.port.onMessage.addListener(u=>{const w=u.method;!w||!this.listeners[w]||this.listeners[w].forEach(h=>h(u))})}send(l){try{this.port.postMessage(l)}catch(d){if(d?.message==="Attempting to use a disconnected port object")return;throw d}}listen(l){this.port.onMessage.addListener(d=>{l(d)})}disconnect(){this.port.disconnect()}}const o=s=>(i.A.runtime.onMessage.addListener(s),()=>i.A.runtime.onMessage.removeListener(s)),n=s=>i.A.runtime.sendMessage(s)}),3725:((b,E,r)=>{b.exports=r.p+"8f89158e397ee29236ed.ttf"}),4387:((b,E,r)=>{r.d(E,{W:()=>o});var i=r(56120),B=r(20038);const y={settings:{mev:!0,thorchainStreams:!0,solanaTurboSwaps:!1,environment:i.g.PRODUCTION},isP2PBannerClosed:!1,isUSCitizen:null,assets:{fromAsset:null,toAsset:null},spendAmount:"",swap712Data:{isEip712:!1,provider:null}},o=(0,B.Z0)({name:"swap",initialState:y,reducers:{toggleMev(n){n.settings.mev=!n.settings.mev},toggleThorchainStreams(n){n.settings.thorchainStreams=!n.settings.thorchainStreams},toggleSolanaTurboSwaps(n){n.settings.solanaTurboSwaps=!n.settings.solanaTurboSwaps},updateEnvironment(n,s){n.settings.environment=s.payload},closeP2PBanner(n){n.isP2PBannerClosed=!0},setFromAsset(n,s){n.assets.fromAsset=s.payload},setToAsset(n,s){n.assets.toAsset=s.payload},setSpendAmount(n,s){n.spendAmount=s.payload},clearSwapForm(n){n.assets.fromAsset=null,n.assets.toAsset=null,n.spendAmount=""},setSwap712Data(n,s){n.swap712Data=s.payload},setIsUSCitizen(n,s){n.isUSCitizen=s.payload}}})}),4431:((b,E,r)=>{b.exports=r.p+"8e752fd0ad0ea39bc216.ttf"}),6517:((b,E,r)=>{r.d(E,{Dz:()=>o.Dz,M8:()=>y.M,b4:()=>o.b4,uv:()=>o.uv});var i=r(13123),B=r(32887),y=r(35798),o=r(2597)}),11711:((b,E,r)=>{r.d(E,{A:()=>y});var i=r(24439);const y={RESET:(0,i.If)("Reset"),LOCK:(0,i.If)("Lock"),LOCK_CALLBACK:(0,i.If)("Lock_callback"),AUTHENTICATE:(0,i.If)("Authenticate"),REGISTER_DEVICE:(0,i.If)("RegisterDevice"),APP_DISPLAYED:(0,i.If)("AppDisplayed"),WARNING_DISPLAYED:(0,i.If)("WarningDisplayed"),ICON_THEME_CHANGED:(0,i.If)("IconThemeChanged"),OPEN_POPUP:(0,i.If)("OpenPopup"),GET_APP_SETTINGS:(0,i.w3)("GetAppSettings"),GET_APP_NODES:(0,i.w3)("GetAppNodes"),GET_STORE:(0,i.If)("GetStore"),GET_REDUX_STATE:(0,i.If)("GetReduxState"),DISPATCH_REDUX_ACTION:(0,i.If)("DispatchReduxAction"),PING:(0,i.w3)("Ping"),GET_ONE_TAP_SETTINGS:(0,i.w3)("GetOneTapSettings"),ONE_TAP_DISMISS:(0,i.w3)("OneTapDismiss"),ONE_TAP_CONNECT:(0,i.w3)("OneTapConnect"),GET_TOKEN_SCANNER_I18N:(0,i.w3)("GetTokenScannerI18n"),GET_TOKEN_SCANNER_ENABLED:(0,i.w3)("GetTokenScannerEnabled"),GET_TOKEN_BASIC_INFO:(0,i.w3)("GetTokenBasicInfo"),GET_TOKEN_MARKET_DATA:(0,i.w3)("GetTokenMarketData"),GET_SIMILAR_TOKENS_COUNT:(0,i.w3)("GetSimilarTokensCount"),GET_SIMILAR_TOKENS:(0,i.w3)("GetSimilarTokens"),OPEN_SWAP_PAGE:(0,i.w3)("OpenSwapPage"),GET_FEATURE_FLAG:(0,i.w3)("GetFeatureFlag"),SET_TOKEN_SCANNER_ENABLED:(0,i.w3)("SetTokenScannerEnabled"),TRACK_ANALYTICS:(0,i.w3)("TrackAnalytics"),ANNOUNCEMENT_DISPLAYED:(0,i.If)("AnnouncementDisplayed"),FETCH_ANNOUNCEMENTS:(0,i.If)("FetchAnnouncements"),FETCH_USER_VIP_TIER_DATA:(0,i.If)("FetchUserVipTierData"),FETCH_FUNDING_METHODS:(0,i.If)("FetchFundingMethods"),ROUTE_CHANGED:(0,i.If)("RouteChanged")}}),12464:((b,E,r)=>{r.d(E,{L:()=>s});var i=r(20038),B=r(72519),y=r(93155);const o={approvalsPerWallet:{}};function n(l,d){const u={items:[],lastSync:null};l.approvalsPerWallet[d]||(l.approvalsPerWallet[d]=u)}const s=(0,i.Z0)({name:"approvals",initialState:o,reducers:{startWallet(l,d){n(l,d.payload.walletId)},setApprovalsLoading(l,d){n(l,d.payload.walletId),l.approvalsPerWallet[d.payload.walletId].loading=!0},updateApprovals(l,d){n(l,d.payload.walletId);const{approvals:u,walletId:w,nextToken:h,append:g}=d.payload,m=l.approvalsPerWallet[w].items.filter(e=>e.risk_analysis.level===B.b.PENDING),t=6e5,A=Date.now(),a=new Set;if(m.forEach(e=>{e.pendingTimestamp&&A-e.pendingTimestamp>t&&(a.add(`${e.chain}-${e.address}-${e.asset.id}-${e.spender.address}`),y.A.debug("[ApprovalsStore] Pending approval expired",{chain:e.chain,asset:e.asset.id,spender:e.spender.address}))}),y.A.debug("[ApprovalsStore] Updating approvals",{newCount:u.length,existingCount:l.approvalsPerWallet[w].items.length,pendingCount:m.length,expiredCount:a.size,append:g}),g)l.approvalsPerWallet[w].items=[...l.approvalsPerWallet[w].items,...u];else{const e=[...u];m.forEach(c=>{if(!u.some(v=>v.chain===c.chain&&v.address.toLowerCase()===c.address.toLowerCase()&&v.asset.id===c.asset.id&&v.spender.address.toLowerCase()===c.spender.address.toLowerCase()))y.A.debug("[ApprovalsStore] Approval revoked on-chain",{chain:c.chain,asset:c.asset.id,spender:c.spender.address});else{const v=`${c.chain}-${c.address}-${c.asset.id}-${c.spender.address}`;if(a.has(v))y.A.debug("[ApprovalsStore] Using backend data for expired approval");else{const x=e.findIndex(C=>C.chain===c.chain&&C.address.toLowerCase()===c.address.toLowerCase()&&C.asset.id===c.asset.id&&C.spender.address.toLowerCase()===c.spender.address.toLowerCase());x>=0&&(e[x]=c,y.A.debug("[ApprovalsStore] Preserving PENDING status"))}}}),l.approvalsPerWallet[w].items=e}l.approvalsPerWallet[w].lastSync=new Date().getTime(),l.approvalsPerWallet[w].nextToken=h,l.approvalsPerWallet[w].error=!1,l.approvalsPerWallet[w].loading=!1},setApprovalsError(l,d){n(l,d.payload.walletId),l.approvalsPerWallet[d.payload.walletId].error=!0,l.approvalsPerWallet[d.payload.walletId].loading=!1},clearApprovalsError(l,d){n(l,d.payload.walletId),l.approvalsPerWallet[d.payload.walletId].error=!1},clearApprovals(l,d){n(l,d.payload.walletId),l.approvalsPerWallet[d.payload.walletId].items=[],l.approvalsPerWallet[d.payload.walletId].lastSync=null,l.approvalsPerWallet[d.payload.walletId].nextToken=void 0},markApprovalAsPendingRevoke(l,d){n(l,d.payload.walletId);const{chain:u,address:w,assetId:h,spenderAddress:g,walletId:m,txHash:t}=d.payload,A=l.approvalsPerWallet[m].items.findIndex(a=>a.chain===u&&a.address.toLowerCase()===w.toLowerCase()&&a.asset.id===h&&a.spender.address.toLowerCase()===g.toLowerCase());A>=0?(l.approvalsPerWallet[m].items[A].risk_analysis.level=B.b.PENDING,l.approvalsPerWallet[m].items[A].pendingTxHash=t,l.approvalsPerWallet[m].items[A].pendingTimestamp=Date.now(),y.A.debug("[ApprovalsStore] Marked approval as PENDING")):y.A.warn("[ApprovalsStore] Approval not found",{chain:u,assetId:h,spenderAddress:g})},removeApproval(l,d){n(l,d.payload.walletId);const{chain:u,address:w,assetId:h,spenderAddress:g,walletId:m}=d.payload;l.approvalsPerWallet[m].items=l.approvalsPerWallet[m].items.filter(t=>!(t.chain===u&&t.address.toLowerCase()===w.toLowerCase()&&t.asset.id===h&&t.spender.address.toLowerCase()===g.toLowerCase()))}}})}),13123:((b,E,r)=>{var i=r(66644),B=r(81220),y=(n,s,l)=>new Promise((d,u)=>{var w=m=>{try{g(l.next(m))}catch(t){u(t)}},h=m=>{try{g(l.throw(m))}catch(t){u(t)}},g=m=>m.done?d(m.value):Promise.resolve(m.value).then(w,h);g((l=l.apply(n,s)).next())});class o extends B.X{constructor(s){super(),this.port=new i.X2(s),this.port.addEventListener("message",l=>{const d=l.method;!d||!this.listeners[d]||this.listeners[d].forEach(u=>u(l))})}listen(s){const l=d=>{s(d)};return this.port.addEventListener("message",l),()=>this.port.removeEventListener("message",l)}send(s){return y(this,null,function*(){yield this.port.postMessage(s)})}disconnect(){return y(this,null,function*(){yield this.port.close()})}}}),13787:((b,E,r)=>{b.exports=r.p+"850da36ebaa95f783ceb.otf"}),15314:((b,E,r)=>{r.d(E,{W:()=>i});var i=(B=>(B.LIGHT="light",B.DARK="dark",B))(i||{})}),17855:((b,E,r)=>{r.d(E,{y:()=>m});var i=r(20038),B=Object.defineProperty,y=Object.defineProperties,o=Object.getOwnPropertyDescriptors,n=Object.getOwnPropertySymbols,s=Object.prototype.hasOwnProperty,l=Object.prototype.propertyIsEnumerable,d=(t,A,a)=>A in t?B(t,A,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[A]=a,u=(t,A)=>{for(var a in A||(A={}))s.call(A,a)&&d(t,a,A[a]);if(n)for(var a of n(A))l.call(A,a)&&d(t,a,A[a]);return t},w=(t,A)=>y(t,o(A));const h=[],g=600*1e3,m=(0,i.Z0)({name:"notification",initialState:h,reducers:{updateNotification(t,A){const a=w(u({},A.payload),{expiresAt:new Date().getTime()+g}),e=a.id,c=t.findIndex(p=>p.id===e);c<0?t.push(a):t.splice(c,1,a)},removeNotification(t,A){const a=A.payload,e=t.findIndex(c=>c.id===a);e!==-1&&t.splice(e,1)},cleanAll(){return[]}}})}),20015:((b,E,r)=>{r.r(E),r.d(E,{default:()=>K});var i=r(74848),B=r(85072),y=r.n(B),o=r(97825),n=r.n(o),s=r(77659),l=r.n(s),d=r(55056),u=r.n(d),w=r(10540),h=r.n(w),g=r(41113),m=r.n(g),t=r(82293),A={};A.styleTagTransform=m(),A.setAttributes=u(),A.insert=l().bind(null,"head"),A.domAPI=n(),A.insertStyleElement=h();var a=y()(t.A,A);const e=t.A&&t.A.locals?t.A.locals:void 0;var c=r(5338),p=r(71468),v=r(68157),f=r(64145),x=r(96540);const C=()=>(0,i.jsxs)("div",{className:"loading-page-container",style:{display:"flex",flexDirection:"column",width:"100vw",height:"100vh",padding:"16px",boxSizing:"border-box"},children:[(0,i.jsx)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",flex:1},children:(0,i.jsx)("div",{className:"loading-spinner",style:{width:"64px",height:"64px",borderRadius:"50%",animation:"spin 1s linear infinite"}})}),(0,i.jsx)("style",{children:`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading-page-container {
            background-color: #FFFFFF;
          }
          
          .loading-spinner {
            border: 3px solid #2525253D;
            border-top: 3px solid #0500FF;
          }
          
          /* Dark mode styles */
          @media (prefers-color-scheme: dark) {
            .loading-page-container {
              background-color: #1B1B1C;
            }
            
            .loading-spinner {
              border-color: #EAECEF3D;
              border-top-color: #48FF91;
            }
          }
        `})]});var k=r(93155),I=(M,R,D)=>new Promise((L,P)=>{var W=O=>{try{T(D.next(O))}catch(N){P(N)}},U=O=>{try{T(D.throw(O))}catch(N){P(N)}},T=O=>O.done?L(O.value):Promise.resolve(O.value).then(W,U);T((D=D.apply(M,R)).next())});const _=(0,x.lazy)(()=>Promise.all([r.e(7283),r.e(8378)]).then(r.bind(r,32373)));function S(M){return I(this,null,function*(){yield(0,f.k$)(M);const R=yield(0,v.TB)(f.YW),D=document.getElementById("root"),L=(0,c.createRoot)(D);function P(W,U,T,O,N,G){k.A.debug({id:W,phase:U,actualDuration:T,baseDuration:O,startTime:N,commitTime:G})}L.render((0,i.jsx)(p.Kq,{store:R,children:(0,i.jsx)(x.Suspense,{fallback:(0,i.jsx)(x.Profiler,{id:"LoadingPage",onRender:P,children:(0,i.jsx)(C,{})}),children:(0,i.jsx)(x.Profiler,{id:"App",onRender:P,children:(0,i.jsx)(_,{})})})}))})}const K=S}),23230:((b,E,r)=>{b.exports=r.p+"5f36217efbb124e1f06e.otf"}),24439:((b,E,r)=>{r.d(E,{If:()=>o,w3:()=>n});var i=(d=>(d.INTERNAL="INTERNAL",d.PUBLIC="PUBLIC",d))(i||{});function B(d,u){return`${u}_${d}`}function y(d,u){return d.indexOf(u)===0}function o(d){return B(d,"INTERNAL")}function n(d){return B(d,"PUBLIC")}function s(d){return y(d,"INTERNAL")}function l(d){return y(d,"PUBLIC")}}),26113:((b,E,r)=>{r.d(E,{Z:()=>i,sP:()=>B,yy:()=>y});const i=()=>{},B=o=>{const n=window.open(o,"_blank","noopener nofollow noreferrer");n&&(n.opener=null)},y=o=>new Promise(n=>setTimeout(n,o))}),28398:((b,E,r)=>{r.d(E,{A:()=>m,l:()=>w});var i=r(37724),B=r(93155),y=r(20038),o=Object.defineProperty,n=Object.getOwnPropertySymbols,s=Object.prototype.hasOwnProperty,l=Object.prototype.propertyIsEnumerable,d=(t,A,a)=>A in t?o(t,A,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[A]=a,u=(t,A)=>{for(var a in A||(A={}))s.call(A,a)&&d(t,a,A[a]);if(n)for(var a of n(A))l.call(A,a)&&d(t,a,A[a]);return t},w=(t=>(t.MAIN="MAIN",t.CUSTOM="CUSTOM",t))(w||{});const h=u(u(u({items:{},customItems:{},blockchainsLastSync:null,filterByBlockchain:null},i.KW),i.Ed),i.Mh);function g(t,A,a){var e;return!!((e={CUSTOM:t.customItems,MAIN:t.items}[a])!=null&&e[A])}const m=(0,y.Z0)({name:"blockchains",initialState:h,reducers:{updateBlockchains(t,A){A.payload.forEach(a=>{t.items[a.id]=a,delete t.customItems[a.id]})},setSelectedBlockchainIfNone(t,A){const{id:a,selectedBlockchainType:e}=A.payload;if(!t.selectedBlockchain){if(g(t,a,e)){t.selectedBlockchainType=A.payload.selectedBlockchainType,t.selectedBlockchain=A.payload.id;return}B.A.error(`Invalid blockchain for selected type ${a}:${e}`)}},setSelectedBlockchain(t,A){const{id:a,selectedBlockchainType:e}=A.payload;if(g(t,a,e)){t.selectedBlockchainType=A.payload.selectedBlockchainType,t.selectedBlockchain=A.payload.id;return}B.A.error(`Invalid blockchain for selected type ${a}:${e}`)},setFilteringBlockchain(t,A){t.filterByBlockchain=A.payload},addCustomBlockchain(t,A){t.customItems[A.payload.id]=A.payload},removeCustomBlockchain(t,A){delete t.customItems[A.payload]},touchBlockchains(t){t.blockchainsLastSync=new Date().getTime()}}})}),31335:((b,E,r)=>{r.d(E,{i:()=>l});var i=r(88407),B=r(98649),y=r(80577),o=r(26113),n=r(93155),s=r(6517);function l(d){return new Promise(u=>{(0,y.r)(d).then(w=>{w===B.k.READY?(u(d),(0,i.L)(d)):(d.portStream=new s.Dz(d.portName),d.statusProvider.emit(B.V.REPLACED,B.k.LOADING),(0,y.r)(d).then(h=>{h===B.k.READY?(d.statusProvider.emit(B.V.EVENT,B.k.READY),u(d),(0,i.L)(d)):u((0,o.yy)(d.RETRY_THRESHOLD).then(()=>l(d)))}).catch(n.A.error))}).catch(n.A.error)})}}),31357:((b,E,r)=>{r.d(E,{s:()=>e});var i=r(6517),B=r(20038),y=r(93726),o=r(94323),n=r(83397),s=r(65509),l=Object.defineProperty,d=Object.defineProperties,u=Object.getOwnPropertyDescriptors,w=Object.getOwnPropertySymbols,h=Object.prototype.hasOwnProperty,g=Object.prototype.propertyIsEnumerable,m=(c,p,v)=>p in c?l(c,p,{enumerable:!0,configurable:!0,writable:!0,value:v}):c[p]=v,t=(c,p)=>{for(var v in p||(p={}))h.call(p,v)&&m(c,v,p[v]);if(w)for(var v of w(p))g.call(p,v)&&m(c,v,p[v]);return c},A=(c,p)=>d(c,u(p));const a={locale:(0,n.p)(),isDefaultWallet:!0,loadingTranslations:!1,developerSettings:{isCustomNonceEnabled:!1,isAdvancedGasControlsEnabled:!1,isAdvancedTransactionDataEnabled:!1,isEthSignEnabled:!1,isExportPrivateKeyEnabled:!1},pushNotifications:{isPushEnabled:!0,isSendAndReceiveEnabled:!0,topics:{product_announcement:!0}},privacy:{isAnalyticsEnabled:!0,hideBalancesOnDashboard:!1},ui:{colorMode:y.X.SYSTEM},layout:{tokenCellLayout:s.e.LAYOUT_3,hideNFTs:!1,hideLowBalanceAssets:!0},translations:{},translationsLastFetch:{},preferSidePanel:!0,baseCurrency:"USD",passkeyId:null,isPasswordGenerated:!1},e=(0,B.Z0)({name:"settings",initialState:a,reducers:{setLanguage(c,p){c.locale=p.payload},setLoadingTranslations(c,p){c.loadingTranslations=p.payload},setIsCustomNonceEnabled(c,p){c.developerSettings.isCustomNonceEnabled=p.payload},setIsAdvancedGasControlsEnabled(c,p){c.developerSettings.isAdvancedGasControlsEnabled=p.payload},setIsAdvancedTransactionDataEnabled(c,p){c.developerSettings.isAdvancedTransactionDataEnabled=p.payload},setPushNotifications(c,p){c.pushNotifications.isPushEnabled=p.payload,c.pushNotifications.isSendAndReceiveEnabled=p.payload},setNotificationTopics(c,p){c.pushNotifications.topics=p.payload},setTranslations(c,p){c.translations[c.locale]=p.payload.messages},setTranslationsLastFetch(c,p){c.translationsLastFetch[p.payload.language]=p.payload.timestamp},setIsDefaultWallet(c,p){(0,i.M8)({method:o.A.DEFAULT_WALLET_CHANGED,data:{params:p.payload}}),c.isDefaultWallet=p.payload},setIsAnalyticsEnabled(c,p){c.privacy=A(t({},c.privacy),{isAnalyticsEnabled:p.payload})},setHideBalancesOnDashboard(c,p){c.privacy=A(t({},c.privacy),{hideBalancesOnDashboard:p.payload})},setUIColorMode(c,p){c.ui=A(t({},c.ui),{colorMode:p.payload})},toggleSidePanelPreference(c,p){c.preferSidePanel=p.payload},setBaseCurrency(c,p){c.baseCurrency=p.payload},setPasskeyId(c,p){c.passkeyId=p.payload},setIsExportPrivateKeyEnabled(c,p){c.developerSettings.isExportPrivateKeyEnabled=p.payload},setIsPasswordGenerated(c,p){c.isPasswordGenerated=p.payload},setTokenCellLayout(c,p){c.layout.tokenCellLayout=p.payload},setHideNFTs(c,p){c.layout.hideNFTs=p.payload},setHideLowBalanceAssets(c,p){c.layout.hideLowBalanceAssets=p.payload},setLayoutSettings(c,p){c.layout=p.payload}}})}),32887:((b,E,r)=>{var i=r(37007),B=r.n(i)}),35328:((b,E,r)=>{r.d(E,{b:()=>g});var i=r(20038),B=Object.defineProperty,y=Object.defineProperties,o=Object.getOwnPropertyDescriptors,n=Object.getOwnPropertySymbols,s=Object.prototype.hasOwnProperty,l=Object.prototype.propertyIsEnumerable,d=(m,t,A)=>t in m?B(m,t,{enumerable:!0,configurable:!0,writable:!0,value:A}):m[t]=A,u=(m,t)=>{for(var A in t||(t={}))s.call(t,A)&&d(m,A,t[A]);if(n)for(var A of n(t))l.call(t,A)&&d(m,A,t[A]);return m},w=(m,t)=>y(m,o(t));const h={selectedAddress:null,selectedPublicKey:null,connectedSites:[],blacklistedSites:[],dapps:{},connectedDapps:{}},g=(0,i.Z0)({name:"dapps",initialState:h,reducers:{addDapp(m,t){const A=t.payload,{origin:a}=A;return Object.values(m.dapps).find(c=>c.origin===a)||(m.dapps[A.id]=A),m},addConnectedDapp(m,t){const{id:A,chainId:a,networkId:e,accountId:c,address:p,walletId:v}=t.payload;return m.connectedDapps[A]||(m.connectedDapps[A]=[]),m.connectedDapps[A].find(x=>x.accountId===c&&x.address===p)||m.connectedDapps[A].push({id:A,date:new Date().getTime(),chainId:a,networkId:e,address:p,accountId:c,walletId:v}),m},disconnectDapp(m,t){const{id:A,accountId:a}=t.payload,e=m.connectedDapps[A];if(!e)return m;const c=e.filter(p=>p.accountId!==a);return m.connectedDapps[A]=c,c.length===0&&delete m.connectedDapps[A],m},addBlacklistedSite(m,t){const A=w(u({},t.payload),{id:(0,i.Ak)(),date:new Date().getTime()});return m.blacklistedSites=[...m.blacklistedSites,A],m},removeBlacklistedSite(m,t){return m.blacklistedSites=m.blacklistedSites.filter(A=>A.id!==t.payload),m}}})}),35798:((b,E,r)=>{r.d(E,{M:()=>y});var i=r(90658),B=(n,s,l)=>new Promise((d,u)=>{var w=m=>{try{g(l.next(m))}catch(t){u(t)}},h=m=>{try{g(l.throw(m))}catch(t){u(t)}},g=m=>m.done?d(m.value):Promise.resolve(m.value).then(w,h);g((l=l.apply(n,s)).next())});const y=n=>B(null,null,function*(){var s;const l=(s=yield i.A.tabs.query({}))!=null?s:[];yield Promise.all(l.filter(d=>!!d?.id).map(d=>i.A.tabs.sendMessage(d.id,n).catch(u=>{var w;(w=i.A.runtime.lastError)==null||w.message})))});function o(n,s){return B(this,null,function*(){var l;try{return yield browser.tabs.sendMessage(n,s)}catch{(l=browser.runtime.lastError)==null||l.message}})}}),37724:((b,E,r)=>{r.d(E,{Ed:()=>B,KW:()=>o,Mh:()=>y});var i=r(47236);const B={selectedBlockchainOnSolana:"solana",selectedBlockchainTypeOnSolana:i.l.MAIN,validatorsLastSync:0},y={selectedBlockchainOnBinance:"binance",selectedBlockchainTypeOnBinance:i.l.MAIN},o={selectedBlockchain:"",selectedBlockchainType:i.l.MAIN}}),38208:((b,E,r)=>{r.d(E,{w:()=>i});const i=["ar","bg-BG","my-MM","zh-CN","zh-TC","cs-CZ","da-DK","en","fr","de","el-GR","id","it","ja","kk-KZ","ko","lv-LV","lo-LA","pl-PL","pt","pt-BR","ro-RO","ru","si-LK","es-ES","es-LA","sv-SE","tr","uk-UA","vi"]}),39094:((b,E,r)=>{b.exports=r.p+"f0be7d273c3543fe4c4a.ttf"}),42836:((b,E,r)=>{r.d(E,{Z:()=>y});var i=r(20038);const B={rates:{},items:[]},y=(0,i.Z0)({name:"fiat",initialState:B,reducers:{updateFiats(o,n){for(const s of n.payload){const l=o.items.findIndex(d=>d.id===s.id);l<0?o.items.push(s):o.items.splice(l,1,s)}}}})}),44872:((b,E,r)=>{b.exports=r.p+"e87a6b531eb2210f7d44.ttf"}),45668:((b,E,r)=>{r.d(E,{k:()=>i});function i(B,y){return B==="mnemonic"&&(B="Seed Phrase"),`${B.charAt(0).toUpperCase()+B.slice(1)} ${y.reduce((o,n)=>n.type===B?++o:o,1)}`}}),47236:((b,E,r)=>{r.d(E,{l:()=>i});var i=(B=>(B.MAIN="MAIN",B.CUSTOM="CUSTOM",B))(i||{})}),48275:((b,E,r)=>{r.d(E,{P:()=>d});var i=r(98939),B=r(11711),y=r(93155),o=(u,w,h)=>new Promise((g,m)=>{var t=e=>{try{a(h.next(e))}catch(c){m(c)}},A=e=>{try{a(h.throw(e))}catch(c){m(c)}},a=e=>e.done?g(e.value):Promise.resolve(e.value).then(t,A);a((h=h.apply(u,w)).next())});let n=0,s=new Map,l=s;class d{constructor(w){this.dispatch=h=>(y.A.getLogger(d.name).debug(`Dispatching action ${JSON.stringify(h)}`),this.transport.emit(B.A.DISPATCH_REDUX_ACTION,h).catch(y.A.error),h),this.ensureCanMutateNextListeners=()=>{l===s&&(l=new Map,s.forEach((h,g)=>{l.set(g,h)}))},this.getState=()=>this.state,this.subscribe=h=>{this.ensureCanMutateNextListeners();const g=n++;l.set(g,h);let m=!0;return()=>{m&&(m=!1,this.ensureCanMutateNextListeners(),l.delete(g),s=null)}},this.replaceReducer=h=>{throw new Error("Method not implemented.")},this.setTransport(w)}setTransport(w){this.transport=w,this.transport.listen(h=>{h.method===i.TF&&(this.state=h.data,(s=l).forEach(m=>{m()}))})}boot(){return o(this,null,function*(){try{const w=yield this.transport.emit(B.A.GET_REDUX_STATE);this.state=w}catch(w){return y.A.error(w)}})}[Symbol.observable](){throw new Error("Method not implemented.")}}}),48305:((b,E,r)=>{r.d(E,{u:()=>A});var i=r(20038),B=r(98939),y=r(45668),o=r(93155),n=Object.defineProperty,s=Object.defineProperties,l=Object.getOwnPropertyDescriptors,d=Object.getOwnPropertySymbols,u=Object.prototype.hasOwnProperty,w=Object.prototype.propertyIsEnumerable,h=(a,e,c)=>e in a?n(a,e,{enumerable:!0,configurable:!0,writable:!0,value:c}):a[e]=c,g=(a,e)=>{for(var c in e||(e={}))u.call(e,c)&&h(a,c,e[c]);if(d)for(var c of d(e))w.call(e,c)&&h(a,c,e[c]);return a},m=(a,e)=>s(a,l(e));const t={walletId:null,wallets:{},accounts:{},accountsPerWallet:{},balancesPerWallet:{},balancesPerWalletAccount:{},switching:!1,refreshLastRun:null,refreshingBalance:!1,addressBook:{},selectedAccountId:""},A=(0,i.Z0)({name:"wallet",initialState:t,reducers:{setSwitching(a,e){a.switching=e.payload},changeWalletName(a,e){a.wallets[e.payload.id].name=e.payload.name},setWalletId(a,e){a.walletId=e.payload.walletId,a.selectedAccountId=e.payload.accountId},addToBalancesArray(a,e){a.balancesPerWalletAccount[e.payload.id]={},a.balancesPerWalletAccount[e.payload.id][a.selectedAccountId]=a.balancesPerWalletAccount[e.payload.id][a.selectedAccountId]||{}},addWallet(a,e){if(Object.keys(a.wallets).length>=B.Dv){o.A.error("Maximum wallets amount reached");return}a.wallets[e.payload.id]={balance:"0",id:e.payload.id,registered:!1,type:e.payload.type,name:e.payload.name||(0,y.k)(e.payload.type,Object.values(a.wallets)),isImported:e.payload.isImported},a.balancesPerWalletAccount[e.payload.id]={},a.balancesPerWalletAccount[e.payload.id][e.payload.accountId]={},a.accountsPerWallet[e.payload.id]={},a.accountsPerWallet[e.payload.id][e.payload.accountId]={}},removeWallet(a,e){delete a.wallets[e.payload],delete a.accountsPerWallet[e.payload],a.walletId=Object.keys(a.wallets)[0],a.walletId&&(a.selectedAccountId=Object.keys(a.accountsPerWallet[a.walletId])[0]),Object.keys(a.accountsPerWallet).forEach(c=>{c===e.payload&&delete a.accountsPerWallet[c]})},setWalletAsRegistered(a,e){a.accountsPerWallet[e.payload.walletId][e.payload.accountId]=m(g({},a.accountsPerWallet[e.payload.walletId][e.payload.accountId]),{registered:!0})},setWalletCoinsAsRegistered(a,e){a.accountsPerWallet[e.payload.walletId][e.payload.accountId]=m(g({},a.accountsPerWallet[e.payload.walletId][e.payload.accountId]),{coinsRegistered:!0})},setCoinsAsRegistered(a,e){const c=a.accountsPerWallet[e.payload.walletId][e.payload.accountId].coinsRegisteredMap||{};Object.keys(e.payload.records).forEach(p=>{c[p]=e.payload.records[p]}),a.accountsPerWallet[e.payload.walletId][e.payload.accountId].coinsRegisteredMap=c},removeAccount(a,e){const{walletId:c,accountId:p}=e.payload;if(!Object.values(a.accountsPerWallet[c]).find(x=>x.id===p)){o.A.error(`Account with id ${p} not found in wallet ${c}`);return}return a.accountsPerWallet[c]&&delete a.accountsPerWallet[c][p],a.balancesPerWalletAccount[c]&&delete a.balancesPerWalletAccount[c][p],a},addAccounts(a,e){a.accountsPerWallet[e.payload.walletId][e.payload.accountId]=a.accountsPerWallet[e.payload.walletId][e.payload.accountId]||{},a.accountsPerWallet[e.payload.walletId][e.payload.accountId]={id:e.payload.accountId,items:e.payload.accounts,derivationIndex:e.payload.derivationIndex,name:e.payload.name,registered:!1},a.balancesPerWalletAccount[e.payload.walletId]||(a.balancesPerWalletAccount[e.payload.walletId]={}),a.balancesPerWalletAccount[e.payload.walletId][e.payload.accountId]||(a.balancesPerWalletAccount[e.payload.walletId][e.payload.accountId]={})},pushAccounts(a,e){a.accountsPerWallet[e.payload.walletId]||(a.accountsPerWallet[e.payload.walletId]={}),a.accountsPerWallet[e.payload.walletId][e.payload.accountId]||(a.accountsPerWallet[e.payload.walletId][e.payload.accountId]={}),a.accountsPerWallet[e.payload.walletId][e.payload.accountId].items=g(g({},a.accountsPerWallet[e.payload.walletId][e.payload.accountId].items),e.payload.accounts)},setRefreshingBalance(a,e){a.refreshingBalance=e.payload},setSeedPhraseBackupRequired(a,e){a.wallets[e.payload.walletId].seedPhraseBackupRequired=e.payload.backupRequired},setBalances(a,e){e.payload.balances.forEach(c=>{const{balance:p,staked:v,rewards:f,pending:x,frozen:C,locked:k,blocked:I,claimable:_,transferable:S,inscription:K,coinId:M,address:R,dust:D,blockchainId:L,assetId:P,bandwidth:W,energy:U,reserved:T}=c;a.balancesPerWalletAccount[e.payload.walletId]||(a.balancesPerWalletAccount[e.payload.walletId]={}),a.balancesPerWalletAccount[e.payload.walletId][e.payload.accountId]||(a.balancesPerWalletAccount[e.payload.walletId][e.payload.accountId]={}),a.balancesPerWalletAccount[e.payload.walletId][e.payload.accountId][P]={balance:p,staked:v,rewards:f,pending:x,frozen:C,locked:k,blocked:I,claimable:_,transferable:S,inscription:K,dust:D,coinId:M,address:R,blockchainId:L,bandwidth:W,energy:U,reserved:T}})},updateRefreshLastRun(a,e){a.refreshLastRun=e.payload},updateAssetsLastRun(a,e){a.wallets[e.payload.walletId].assetsLastRun=e.payload.timestamp},addAddressBookWallet(a,e){a.addressBook[e.payload.id]=e.payload},setAddressBookWallet(a,e){a.addressBook[e.payload.id]=e.payload},removeAddressBookWallet(a,e){const c=g({},a.addressBook);delete c[e.payload],a.addressBook=c},removeAddressBookWalletAddress(a,e){const c=g({},a.addressBook);delete c[e.payload.walletId].addresses[e.payload.coinId],a.addressBook[e.payload.walletId]=c[e.payload.walletId]},updateAccountName(a,e){a.accountsPerWallet[e.payload.walletId][e.payload.accountId].name=e.payload.name},setMigrationRequired(a,e){a.wallets[e.payload.walletId].migrationRequired=e.payload.migrationRequired}}})}),52598:((b,E,r)=>{b.exports=r.p+"c51b145d8cf66a74cc74.ttf"}),52781:((b,E,r)=>{b.exports=r.p+"8583bd6fce14da34ea43.ttf"}),52856:((b,E,r)=>{r.d(E,{B:()=>t});var i=r(93155),B=r(20038),y=r(15192),o=Object.defineProperty,n=Object.defineProperties,s=Object.getOwnPropertyDescriptors,l=Object.getOwnPropertySymbols,d=Object.prototype.hasOwnProperty,u=Object.prototype.propertyIsEnumerable,w=(A,a,e)=>a in A?o(A,a,{enumerable:!0,configurable:!0,writable:!0,value:e}):A[a]=e,h=(A,a)=>{for(var e in a||(a={}))d.call(a,e)&&w(A,e,a[e]);if(l)for(var e of l(a))u.call(a,e)&&w(A,e,a[e]);return A},g=(A,a)=>n(A,s(a));const m={gasFees:{baseFeeTrend:"",estimatedBaseFee:"",high:{suggestedMaxPriorityFeePerGas:"",suggestedMaxFeePerGas:"",minWaitTimeEstimate:0,maxWaitTimeEstimate:0},historicalBaseFeeRange:[],historicalPriorityFeeRange:[],latestPriorityFeeRange:[],low:{suggestedMaxPriorityFeePerGas:"",suggestedMaxFeePerGas:"",minWaitTimeEstimate:0,maxWaitTimeEstimate:0},medium:{suggestedMaxPriorityFeePerGas:"",suggestedMaxFeePerGas:"",minWaitTimeEstimate:0,maxWaitTimeEstimate:0},networkCongestion:0,priorityFeeTrend:""},itemsPerWallet:{},fetchedAllChainsTransactionPeriods:{},itemsPerWalletAccount:{},fetchedTransactionPeriodsByAccount:{},fetchedAllChainsTransactionPeriodsByAccount:{}},t=(0,B.Z0)({name:"tx",initialState:m,reducers:{startWallet(A,a){A.itemsPerWalletAccount[a.payload.walletId]={},A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]=[]},updateTransactionStatus(A,a){const{id:e,status:c,fee:p,walletId:v,hash:f,accountId:x}=a.payload;A.itemsPerWalletAccount[v]||(A.itemsPerWalletAccount[v]={}),A.itemsPerWalletAccount[v][x]||(A.itemsPerWalletAccount[v][x]=[]);const C=A.itemsPerWalletAccount[v][x],k=C.findIndex(I=>I.hash===e);k>=0?C[k]=g(h({},C[k]),{status:c,fee:(0,y.z)(p[0]).gt(0)?p:C[k].fee,initialFee:C[k].fee,hash:f||C[k].hash,initialHash:C[k].initialHash,solanaFlexGasRequestId:C[k].solanaFlexGasRequestId}):i.A.warn(`Trying to update transaction out of range ${e}`),A.itemsPerWalletAccount[v][x]=C},updateTx(A,a){var e,c,p;const v=a.payload.item;A.itemsPerWalletAccount[a.payload.walletId]||(A.itemsPerWalletAccount[a.payload.walletId]={}),A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]||(A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]=[]);const f=(c=(e=A.itemsPerWalletAccount[a.payload.walletId])==null?void 0:e[a.payload.accountId])!=null?c:[],x=f.findIndex(C=>C.hash===v.hash);if(x<0)f.push(v);else{const C=f[x].events[0],k=C?.type==="swap"&&!!((p=C.metadata)!=null&&p.internal);f[x]=g(h({},v),{nft:f[x].nft,assetId:k?f[x].assetId:v.assetId,events:k?f[x].events:v.events})}A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]=f},removeAccountTransactions(A,a){A.itemsPerWalletAccount[a.payload.walletId]&&delete A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId],A.fetchedTransactionPeriodsByAccount[a.payload.walletId]&&delete A.fetchedTransactionPeriodsByAccount[a.payload.walletId][a.payload.accountId],A.fetchedAllChainsTransactionPeriodsByAccount[a.payload.walletId]&&delete A.fetchedAllChainsTransactionPeriodsByAccount[a.payload.walletId][a.payload.accountId]},updateTxs(A,a){var e,c;A.itemsPerWalletAccount[a.payload.walletId]||(A.itemsPerWalletAccount[a.payload.walletId]={}),A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]||(A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]=[]);const p=(c=(e=A.itemsPerWalletAccount[a.payload.walletId])==null?void 0:e[a.payload.accountId])!=null?c:[];a.payload.items.forEach(v=>{var f;const x=p.findIndex(C=>C.hash===v.hash);if(x<0)p.push(v);else{const C=p[x].events[0],k=C?.type==="swap"&&!!((f=C.metadata)!=null&&f.internal);p[x]=g(h({},v),{nft:p[x].nft,solanaFlexGasRequestId:p[x].solanaFlexGasRequestId,assetId:k?p[x].assetId:v.assetId,events:k?p[x].events:v.events})}}),A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]=p},updateGasFees(A,a){A.gasFees=a.payload},updateCachedTransactionsPeriod(A,a){const{selectedWalletId:e,assetId:c,from:p,to:v,nextToken:f,accountId:x}=a.payload;A.fetchedTransactionPeriodsByAccount[e]||(A.fetchedTransactionPeriodsByAccount[e]={}),A.fetchedTransactionPeriodsByAccount[e][x]||(A.fetchedTransactionPeriodsByAccount[e][x]={}),A.fetchedTransactionPeriodsByAccount[e][x][c]={from:p,to:v,nextToken:f}},updateAllChainsCachedTransactionsPeriod(A,a){const{selectedWalletId:e,blockchains:c,from:p,to:v,nextToken:f,accountId:x}=a.payload;A.fetchedAllChainsTransactionPeriodsByAccount[e]||(A.fetchedAllChainsTransactionPeriodsByAccount[e]={}),A.fetchedAllChainsTransactionPeriodsByAccount[e][x]={from:p,to:v,blockchains:c,nextToken:f}},removeTxsForNetwork(A,a){var e,c;A.itemsPerWalletAccount[a.payload.walletId]||(A.itemsPerWalletAccount[a.payload.walletId]={}),A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]||(A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]=[]);const p=(c=(e=A.itemsPerWalletAccount[a.payload.walletId])==null?void 0:e[a.payload.accountId])!=null?c:[];A.itemsPerWalletAccount[a.payload.walletId][a.payload.accountId]=p.filter(v=>v.blockchain.id!==a.payload.blockchainId)}}})}),54780:((b,E,r)=>{r.d(E,{X:()=>y});var i=r(20038);const B={status:"idle",sourceWalletId:null,sourceAccountId:null,destinationWalletId:null,destinationAddress:null,chainGroups:{},progress:{total:0,completed:0,failed:0,current:void 0},summary:null,error:null,startedAt:null,completedAt:null},y=(0,i.Z0)({name:"migration",initialState:B,reducers:{initMigration(o,n){var s;o.status="scanning",o.sourceWalletId=n.payload.sourceWalletId,o.sourceAccountId=(s=n.payload.sourceAccountId)!=null?s:null,o.destinationWalletId=n.payload.destinationWalletId,o.destinationAddress=n.payload.destinationAddress,o.chainGroups={},o.progress={total:0,completed:0,failed:0},o.summary=null,o.error=null,o.startedAt=Date.now(),o.completedAt=null},setChainGroups(o,n){o.chainGroups=n.payload,o.status="ready";const s=Object.values(n.payload).reduce((l,d)=>l+d.assets.filter(u=>u.selected).length,0);o.progress.total=s},toggleAssetSelection(o,n){const{blockchainId:s,assetId:l}=n.payload,d=o.chainGroups[s];if(d){const u=d.assets.find(w=>w.asset.assetId===l);u&&(u.selected=!u.selected),o.progress.total=Object.values(o.chainGroups).reduce((w,h)=>w+h.assets.filter(g=>g.selected).length,0)}},selectAllInChain(o,n){const{blockchainId:s,selected:l}=n.payload,d=o.chainGroups[s];d&&(d.assets.forEach(u=>{u.selected=l}),o.progress.total=Object.values(o.chainGroups).reduce((u,w)=>u+w.assets.filter(h=>h.selected).length,0))},selectAll(o,n){Object.values(o.chainGroups).forEach(s=>{s.assets.forEach(l=>{l.selected=n.payload})}),o.progress.total=n.payload?Object.values(o.chainGroups).reduce((s,l)=>s+l.assets.length,0):0},setAssetsSelection(o,n){const{assetIds:s,selected:l}=n.payload,d=new Set(s);Object.values(o.chainGroups).forEach(u=>{u.assets.forEach(w=>{d.has(w.asset.assetId)&&(w.selected=l)})}),o.progress.total=Object.values(o.chainGroups).reduce((u,w)=>u+w.assets.filter(h=>h.selected).length,0)},startExecution(o){o.status="executing",o.progress.completed=0,o.progress.failed=0},updateAssetStatus(o,n){const{blockchainId:s,assetId:l,status:d,txHash:u,error:w}=n.payload,h=o.chainGroups[s];if(h){const g=h.assets.find(m=>m.asset.assetId===l);g&&(g.status=d,u&&(g.txHash=u),w&&(g.error=w),d==="confirmed"?o.progress.completed+=1:d==="failed"&&(o.progress.failed+=1),o.progress.current={assetId:l,status:d})}},updateAssetGasEstimate(o,n){const{blockchainId:s,assetId:l,estimatedGas:d,estimatedGasFiat:u}=n.payload,w=o.chainGroups[s];if(w){const h=w.assets.find(g=>g.asset.assetId===l);h&&(h.estimatedGas=d,h.estimatedGasFiat=u),w.totalGas=w.assets.reduce((g,m)=>g+parseFloat(m.estimatedGas||"0"),0).toString(),w.totalGasFiat=w.assets.reduce((g,m)=>g+parseFloat(m.estimatedGasFiat||"0"),0).toFixed(2)}},setChainInsufficientGas(o,n){const{blockchainId:s,hasInsufficientGas:l}=n.payload,d=o.chainGroups[s];d&&(d.hasInsufficientGas=l)},completeMigration(o,n){o.status="completed",o.summary=n.payload,o.completedAt=Date.now(),o.progress.current=void 0},resetMigration(o){return B},setSourceWallet(o,n){o.sourceWalletId=n.payload.walletId,o.sourceAccountId=n.payload.accountId,o.destinationWalletId=null,o.destinationAddress=null,o.chainGroups={},o.status="idle"}}})}),56120:((b,E,r)=>{r.d(E,{g:()=>i});var i=(B=>(B.STAGING="staging",B.PRODUCTION="production",B))(i||{})}),58464:((b,E,r)=>{r.d(E,{H:()=>m});var i=r(20038),B=Object.defineProperty,y=Object.defineProperties,o=Object.getOwnPropertyDescriptors,n=Object.getOwnPropertySymbols,s=Object.prototype.hasOwnProperty,l=Object.prototype.propertyIsEnumerable,d=(t,A,a)=>A in t?B(t,A,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[A]=a,u=(t,A)=>{for(var a in A||(A={}))s.call(A,a)&&d(t,a,A[a]);if(n)for(var a of n(A))l.call(A,a)&&d(t,a,A[a]);return t},w=(t,A)=>y(t,o(A));const h={assetsLastSync:null,assetsPerWallet:{},assetsWithBalanceAlreadyEnabled:{},assetsToBeMigrated:{items:[],lastSync:null},cexFundingAssets:{},marketSentimentSupportedCrypto:[]};function g(t,A){const a={itemsV2:[],testItems:[],assetsLastSync:null};t.assetsPerWallet[A]||(t.assetsPerWallet[A]=a)}const m=(0,i.Z0)({name:"asset",initialState:h,reducers:{startWallet(t,A){g(t,A.payload.walletId)},updateAssetsV2(t,A){g(t,A.payload.walletId);const a=t.assetsPerWallet[A.payload.walletId].itemsV2;for(const e of A.payload.assets){const c=a.findIndex(v=>v.blockchainId===e.blockchainId&&v.address===e.address),p=w(u({},e),{name:e.name==="Binance"?"BNB Chain":e.name});c<0?a.push(p):a.splice(c,1,p)}},updateMigratableAssets(t,A){t.assetsToBeMigrated.items=A.payload,t.assetsToBeMigrated.lastSync=new Date().getTime()},removeAssetsForBlockchain(t,A){g(t,A.payload.walletId);for(const a of Object.keys(t.assetsPerWallet))t.assetsPerWallet[a].itemsV2=t.assetsPerWallet[a].itemsV2.filter(e=>e.blockchainId!==A.payload.blockchainId)},setIsShownInHomeScreen(t,A){g(t,A.payload.walletId);const a=t.assetsPerWallet[A.payload.walletId].itemsV2.findIndex(e=>e.assetId===A.payload.item.assetId);a>=0?t.assetsPerWallet[A.payload.walletId].itemsV2.splice(a,1,w(u({},t.assetsPerWallet[A.payload.walletId].itemsV2[a]),{isShownInHomeScreen:!t.assetsPerWallet[A.payload.walletId].itemsV2[a].isShownInHomeScreen})):t.assetsPerWallet[A.payload.walletId].itemsV2.push(w(u({},A.payload.item),{isShownInHomeScreen:!0}))},setIsShownInHomeScreenBulk(t,A){g(t,A.payload.walletId),A.payload.items.forEach(a=>m.caseReducers.setIsShownInHomeScreen(t,{payload:{item:a,walletId:A.payload.walletId},type:A.type}))},touchAssets(t){t.assetsLastSync=new Date().getTime()},setAssetsWithBalanceAlreadyEnabled(t,A){t.assetsWithBalanceAlreadyEnabled[A.payload.currentWalletId]=A.payload.assetsEnabled},setMarketSentimentSupportedCrypto(t,A){t.marketSentimentSupportedCrypto=A.payload},setIsAssetRegistered(t,A){const a=t.assetsPerWallet[A.payload.walletId].itemsV2.findIndex(e=>e.assetId===A.payload.assetId);a>=0&&(t.assetsPerWallet[A.payload.walletId].itemsV2[a].isRegistered=A.payload.isRegistered)},setCexFundingAssets(t,A){t.cexFundingAssets[A.payload.providerId]=A.payload.assets}}})}),60469:((b,E,r)=>{b.exports=r.p+"86c330c66f7333ff6202.ttf"}),61855:((b,E,r)=>{r.d(E,{A:()=>m});var i=r(15314),B=r(20038),y=Object.defineProperty,o=Object.defineProperties,n=Object.getOwnPropertyDescriptors,s=Object.getOwnPropertySymbols,l=Object.prototype.hasOwnProperty,d=Object.prototype.propertyIsEnumerable,u=(t,A,a)=>A in t?y(t,A,{enumerable:!0,configurable:!0,writable:!0,value:a}):t[A]=a,w=(t,A)=>{for(var a in A||(A={}))l.call(A,a)&&u(t,a,A[a]);if(s)for(var a of s(A))d.call(A,a)&&u(t,a,A[a]);return t},h=(t,A)=>o(t,n(A));const g={deviceId:null,hashKey:null,firstTime:!0,authenticated:!1,walletNewlyImported:!1,showEmptyWalletImportedModal:!1,lockTimeInMinutes:10,storageVersion:"",migrated:!1,newAuthMigrated:!0,warningDisplayed:!1,warningDisplayedSent:!1,iconTheme:i.W.LIGHT,icon:"",authenticating:!1,legacyDeviceId:null,authIdentifier:"",newFlag:{EARN:!1},featureFlags:null,toasts:[],sidePanelOpened:!1,countryCode:"",oneTap:{dismissCount:0,lastTimeClosed:0,isOneTapDisabled:!1},analyticsQueue:[],lastTimeClosedWalletModal:0,preventAutoTriggerBiometrics:!1,navigationOrigin:void 0,homeScreenAssetsExpanded:!0,tokenScannerEnabled:!0,approvalsExpanded:!1,showUpdateModal:!1,updateLater:!1,updateFailed:!1,lastUpdateCheck:0},m=(0,B.Z0)({name:"app",initialState:g,reducers:{setDeviceId(t,A){t.deviceId=A.payload},setHashKey(t,A){t.hashKey=A.payload},setAuthenticated(t,A){t.authenticated=A.payload},setIconTheme(t,A){t.iconTheme=A.payload},setIcon(t,A){t.icon=A.payload},setMigrationStatus(t,A){t.migrated=A.payload},setNewAuthMigrated(t,A){t.newAuthMigrated=A.payload},setFirstTime(t,A){t.firstTime=A.payload},setWarningDisplayed(t,A){t.warningDisplayed=A.payload},setWarningDisplayedSent(t,A){t.warningDisplayedSent=A.payload},setShowEmptyWalletImportedModal(t,A){t.showEmptyWalletImportedModal=A.payload},setStorageVersion(t,A){t.storageVersion=A.payload},setIdentityId(t,A){t.identityId=A.payload},setAuthenticating(t,A){t.authenticating=A.payload},setNewsFlagOff(t,A){t.newFlag=h(w({},t.newFlag),{[A.payload]:!0})},setFeatureFlags(t,A){t.featureFlags=A.payload},setTokenScannerEnabled(t,A){t.tokenScannerEnabled=A.payload},setLegacyDeviceId(t,A){t.legacyDeviceId=A.payload},setAuthIdentifier(t,A){t.authIdentifier=A.payload},setSidePanelOpened(t,A){t.sidePanelOpened=A.payload},setCountryCode(t,A){t.countryCode=A.payload},closeOneTap(t){t.oneTap||(t.oneTap={}),t.oneTap.dismissCount=t.oneTap.dismissCount?t.oneTap.dismissCount+1:1,t.oneTap.lastTimeClosed=new Date().getTime()},useOneTap(t){t.oneTap||(t.oneTap={}),t.oneTap.dismissCount=0,t.oneTap.lastTimeClosed=0},toggleOneTapSetting(t,A){t.oneTap||(t.oneTap={}),t.oneTap.isOneTapDisabled=A.payload,A.payload&&(t.oneTap.dismissCount=0,t.oneTap.lastTimeClosed=0)},addAnalyticsEvent(t,A){t.analyticsQueue||(t.analyticsQueue=[]),t.analyticsQueue.push(h(w({},A.payload.event),{id:A.payload.id}))},clearAnalyticEvent(t,A){t.analyticsQueue=(t.analyticsQueue||[]).filter(a=>!A.payload.includes(a.id))},addToast(t,A){t.toasts.push(A.payload)},removeToast(t,A){t.toasts=t.toasts.filter(a=>a.id!==A.payload.id)},setWalletNewlyImported(t,A){t.walletNewlyImported=A.payload},setLastTimeClosedWalletModal(t,A){t.lastTimeClosedWalletModal=A.payload},setPreventAutoTriggerBiometrics(t,A){t.preventAutoTriggerBiometrics=A.payload},setNavigationOrigin(t,A){t.navigationOrigin=A.payload},clearNavigationOrigin(t){t.navigationOrigin=void 0},setHomeScreenAssetsExpanded(t,A){t.homeScreenAssetsExpanded=A.payload},setApprovalsExpanded(t,A){t.approvalsExpanded=A.payload},setUpdateAvailable(t,A){t.updateAvailable=A.payload},setShowUpdateModal(t,A){t.showUpdateModal=A.payload},setUpdateLater(t,A){t.updateLater=A.payload},setUpdateFailed(t,A){t.updateFailed=A.payload},setLastUpdateCheck(t,A){t.lastUpdateCheck=A.payload},setUpdateAttempt(t,A){t.updateAttempt=A.payload},clearUpdateAttempt(t){t.updateAttempt=void 0},setReviewPopupDismissed(t){t.reviewPopup||(t.reviewPopup={}),t.reviewPopup.lastDismissed=Date.now()},setReviewPopupReviewed(t){t.reviewPopup||(t.reviewPopup={}),t.reviewPopup.reviewed=!0,t.reviewPopup.lastReviewed=Date.now()}}})}),64001:((b,E,r)=>{r.d(E,{m:()=>y});var i=r(20038);const B={validators:{},delegations:{},stakingList:[],validatorsLastSync:{}},y=(0,i.Z0)({name:"staking",initialState:B,reducers:{updateValidators(o,n){o.validators[n.payload.blockchain]=n.payload.validators},updateDelegations(o,n){o.delegations[n.payload.walletId]||(o.delegations[n.payload.walletId]={}),o.delegations[n.payload.walletId][n.payload.blockchain]=n.payload.delegations},updateStakingList(o,n){o.stakingList=n.payload},touchValidators(o,n){o.validatorsLastSync[n.payload]=new Date().getTime()}}})}),64145:((b,E,r)=>{r.d(E,{Qq:()=>s,W0:()=>l,YW:()=>d,b4:()=>i.b4,k$:()=>u});var i=r(6517),B=r(98939),y=r(31335),o=r(98649),n=(w,h,g)=>new Promise((m,t)=>{var A=c=>{try{e(g.next(c))}catch(p){t(p)}},a=c=>{try{e(g.throw(c))}catch(p){t(p)}},e=c=>c.done?m(c.value):Promise.resolve(c.value).then(A,a);e((g=g.apply(w,h)).next())});const s=new o.V,l={portName:B.xo,checking:!1,missCount:0,THRESHOLD:5e3,FIRST_TIME_WAIT:200,RETRY_THRESHOLD:400,MAX_MISS_RECONNECT:15,statusProvider:s},d=new Proxy({},{get(w,h,g){return Reflect.get(l.portStream,h,g)}});function u(w){return n(this,null,function*(){w&&Object.assign(l,w),yield(0,y.i)(l)})}}),65509:((b,E,r)=>{r.d(E,{e:()=>i});var i=(B=>(B[B.LAYOUT_1=1]="LAYOUT_1",B[B.LAYOUT_2=2]="LAYOUT_2",B[B.LAYOUT_3=3]="LAYOUT_3",B))(i||{})}),67982:((b,E,r)=>{b.exports=r.p+"a17b9c1448ef44367a5f.ttf"}),68157:((b,E,r)=>{r.d(E,{GV:()=>g,M_:()=>t,TB:()=>e,jL:()=>h});var i=r(93155),B=r(79448),y=r.n(B),o=r(62311),n=r(48275),s=r(94566),l=r(71468),d=(c,p,v)=>new Promise((f,x)=>{var C=_=>{try{I(v.next(_))}catch(S){x(S)}},k=_=>{try{I(v.throw(_))}catch(S){x(S)}},I=_=>_.done?f(_.value):Promise.resolve(_.value).then(C,k);I((v=v.apply(c,p)).next())});const u="trust:store",w=[],h=l.wA.withTypes(),g=l.d4.withTypes(),m=l.Pj.withTypes();let t={};const A=c=>configureStore({reducer:reducers,middleware:p=>p().concat(w),preloadedState:c}),a=()=>d(null,null,function*(){logger.debug("Init background store for Redux");const c={storageKey:u,isolated:!0};return t=yield setupReduxed(A,c)(),logger.debug("Background store loaded"),t});function e(c){return d(this,null,function*(){const p=new n.P(c);return yield p.boot(),t=p,t})}}),72519:((b,E,r)=>{r.d(E,{b:()=>i});var i=(B=>(B.LOW_RISK="LOW_RISK",B.MEDIUM_RISK="MEDIUM_RISK",B.HIGH_RISK="HIGH_RISK",B.PENDING="PENDING",B))(i||{})}),75576:((b,E,r)=>{b.exports=r.p+"d52a01d17b566af4e096.ttf"}),77318:((b,E,r)=>{b.exports=r.p+"ad33b33b93e135d216bd.otf"}),80577:((b,E,r)=>{r.d(E,{r:()=>o});var i=r(11711),B=r(98649),y=r(26113);function o(n){if(!n.portStream)return Promise.resolve(B.k.IDLE);const s=()=>(0,y.yy)(n.FIRST_TIME_WAIT).then(()=>B.k.IDLE);return Promise.race([n.portStream.emit(i.A.PING),s()])}}),81220:((b,E,r)=>{r.d(E,{X:()=>o});var i=r(44329),B=(n,s,l)=>new Promise((d,u)=>{var w=m=>{try{g(l.next(m))}catch(t){u(t)}},h=m=>{try{g(l.throw(m))}catch(t){u(t)}},g=m=>m.done?d(m.value):Promise.resolve(m.value).then(w,h);g((l=l.apply(n,s)).next())});const y=n=>`${n}_${(0,i.Ak)()}_callback`;class o{constructor(){this.listeners={}}addListener(s,l){const d=this.listeners[s]||[];d.push(l),this.listeners[s]=d}once(s,l){this.addListener(s,d=>(delete this.listeners[s],l(d)))}emit(s,l){return new Promise((d,u)=>{const w=y(s);this.once(w,h=>B(this,null,function*(){var g;if(!((g=h.data)!=null&&g.error)){d(h.data.params);return}u(h.data.error)})),this.send({method:s,data:{cbMethod:w,params:l}})})}disconnect(){}}}),81481:((b,E,r)=>{r.d(E,{K:()=>y});var i=r(20038);const B={version:0,postBootVersion:0},y=(0,i.Z0)({name:"migrations",initialState:B,reducers:{}})}),82293:((b,E,r)=>{r.d(E,{A:()=>T});var i=r(71354),B=r.n(i),y=r(76314),o=r.n(y),n=r(4417),s=r.n(n),l=new URL(r(52781),r.b),d=new URL(r(60469),r.b),u=new URL(r(52598),r.b),w=new URL(r(75576),r.b),h=new URL(r(39094),r.b),g=new URL(r(77318),r.b),m=new URL(r(23230),r.b),t=new URL(r(84989),r.b),A=new URL(r(13787),r.b),a=new URL(r(3725),r.b),e=new URL(r(67982),r.b),c=new URL(r(94023),r.b),p=new URL(r(4431),r.b),v=new URL(r(44872),r.b),f=o()(B()),x=s()(l),C=s()(d),k=s()(u),I=s()(w),_=s()(h),S=s()(g),K=s()(m),M=s()(t),R=s()(A),D=s()(a),L=s()(e),P=s()(c),W=s()(p),U=s()(v);f.push([b.id,`/*
! tailwindcss v3.4.1 | MIT License | https://tailwindcss.com
*//*
1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)
*/

*,
::before,
::after {
  box-sizing: border-box; /* 1 */
  border-width: 0; /* 2 */
  border-style: solid; /* 2 */
  border-color: #e5e7eb; /* 2 */
}

::before,
::after {
  --tw-content: '';
}

/*
1. Use a consistent sensible line-height in all browsers.
2. Prevent adjustments of font size after orientation changes in iOS.
3. Use a more readable tab size.
4. Use the user's configured \`sans\` font-family by default.
5. Use the user's configured \`sans\` font-feature-settings by default.
6. Use the user's configured \`sans\` font-variation-settings by default.
7. Disable tap highlights on iOS
*/

html,
:host {
  line-height: 1.5; /* 1 */
  -webkit-text-size-adjust: 100%; /* 2 */
  -moz-tab-size: 4; /* 3 */
  -o-tab-size: 4;
     tab-size: 4; /* 3 */
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 4 */
  font-feature-settings: normal; /* 5 */
  font-variation-settings: normal; /* 6 */
  -webkit-tap-highlight-color: transparent; /* 7 */
}

/*
1. Remove the margin in all browsers.
2. Inherit line-height from \`html\` so users can set them as a class directly on the \`html\` element.
*/

body {
  margin: 0; /* 1 */
  line-height: inherit; /* 2 */
}

/*
1. Add the correct height in Firefox.
2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
3. Ensure horizontal rules are visible by default.
*/

hr {
  height: 0; /* 1 */
  color: inherit; /* 2 */
  border-top-width: 1px; /* 3 */
}

/*
Add the correct text decoration in Chrome, Edge, and Safari.
*/

abbr:where([title]) {
  text-decoration: underline;
  -webkit-text-decoration: underline dotted;
          text-decoration: underline dotted;
}

/*
Remove the default font size and weight for headings.
*/

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

/*
Reset links to optimize for opt-in styling instead of opt-out.
*/

a {
  color: inherit;
  text-decoration: inherit;
}

/*
Add the correct font weight in Edge and Safari.
*/

b,
strong {
  font-weight: bolder;
}

/*
1. Use the user's configured \`mono\` font-family by default.
2. Use the user's configured \`mono\` font-feature-settings by default.
3. Use the user's configured \`mono\` font-variation-settings by default.
4. Correct the odd \`em\` font sizing in all browsers.
*/

code,
kbd,
samp,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; /* 1 */
  font-feature-settings: normal; /* 2 */
  font-variation-settings: normal; /* 3 */
  font-size: 1em; /* 4 */
}

/*
Add the correct font size in all browsers.
*/

small {
  font-size: 80%;
}

/*
Prevent \`sub\` and \`sup\` elements from affecting the line height in all browsers.
*/

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

/*
1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
3. Remove gaps between table borders by default.
*/

table {
  text-indent: 0; /* 1 */
  border-color: inherit; /* 2 */
  border-collapse: collapse; /* 3 */
}

/*
1. Change the font styles in all browsers.
2. Remove the margin in Firefox and Safari.
3. Remove default padding in all browsers.
*/

button,
input,
optgroup,
select,
textarea {
  font-family: inherit; /* 1 */
  font-feature-settings: inherit; /* 1 */
  font-variation-settings: inherit; /* 1 */
  font-size: 100%; /* 1 */
  font-weight: inherit; /* 1 */
  line-height: inherit; /* 1 */
  color: inherit; /* 1 */
  margin: 0; /* 2 */
  padding: 0; /* 3 */
}

/*
Remove the inheritance of text transform in Edge and Firefox.
*/

button,
select {
  text-transform: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Remove default button styles.
*/

button,
[type='button'],
[type='reset'],
[type='submit'] {
  -webkit-appearance: button; /* 1 */
  background-color: transparent; /* 2 */
  background-image: none; /* 2 */
}

/*
Use the modern Firefox focus style for all focusable elements.
*/

:-moz-focusring {
  outline: auto;
}

/*
Remove the additional \`:invalid\` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

:-moz-ui-invalid {
  box-shadow: none;
}

/*
Add the correct vertical alignment in Chrome and Firefox.
*/

progress {
  vertical-align: baseline;
}

/*
Correct the cursor style of increment and decrement buttons in Safari.
*/

::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

/*
1. Correct the odd appearance in Chrome and Safari.
2. Correct the outline style in Safari.
*/

[type='search'] {
  -webkit-appearance: textfield; /* 1 */
  outline-offset: -2px; /* 2 */
}

/*
Remove the inner padding in Chrome and Safari on macOS.
*/

::-webkit-search-decoration {
  -webkit-appearance: none;
}

/*
1. Correct the inability to style clickable types in iOS and Safari.
2. Change font properties to \`inherit\` in Safari.
*/

::-webkit-file-upload-button {
  -webkit-appearance: button; /* 1 */
  font: inherit; /* 2 */
}

/*
Add the correct display in Chrome and Safari.
*/

summary {
  display: list-item;
}

/*
Removes the default spacing and border for appropriate elements.
*/

blockquote,
dl,
dd,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
figure,
p,
pre {
  margin: 0;
}

fieldset {
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

ol,
ul,
menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

/*
Reset default styling for dialogs.
*/
dialog {
  padding: 0;
}

/*
Prevent resizing textareas horizontally by default.
*/

textarea {
  resize: vertical;
}

/*
1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
2. Set the default placeholder color to the user's configured gray 400 color.
*/

input::-moz-placeholder, textarea::-moz-placeholder {
  opacity: 1; /* 1 */
  color: #9ca3af; /* 2 */
}

input::placeholder,
textarea::placeholder {
  opacity: 1; /* 1 */
  color: #9ca3af; /* 2 */
}

/*
Set the default cursor for buttons.
*/

button,
[role="button"] {
  cursor: pointer;
}

/*
Make sure disabled buttons don't get the pointer cursor.
*/
:disabled {
  cursor: default;
}

/*
1. Make replaced elements \`display: block\` by default. (https://github.com/mozdevs/cssremedy/issues/14)
2. Add \`vertical-align: middle\` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
   This can trigger a poorly considered lint error in some tools but is included by design.
*/

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block; /* 1 */
  vertical-align: middle; /* 2 */
}

/*
Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

img,
video {
  max-width: 100%;
  height: auto;
}

/* Make elements with the HTML hidden attribute stay hidden by default */
[hidden] {
  display: none;
}

* {
  scrollbar-color: initial;
  scrollbar-width: initial;
}
  body::-webkit-scrollbar {
    display: none;
  }
  body {
    -ms-overflow-style: none;
    scrollbar-width: none;
    margin: 0px;
    overflow: hidden;
    --tw-bg-opacity: 1;
    background-color: hsl(var(--twc-backgroundPrimary) / 1);
    background-color: hsl(var(--twc-backgroundPrimary) / var(--twc-backgroundPrimary-opacity, var(--tw-bg-opacity)));
    padding: 0px;
    font-family: Inter, Geeza, "Ping Fang", "Binance Plex", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    --tw-text-opacity: 1;
    color: hsl(var(--twc-textPrimary) / 1);
    color: hsl(var(--twc-textPrimary) / var(--twc-textPrimary-opacity, var(--tw-text-opacity)));
  }

  #root {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  flex: 1 1 0%;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
}

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  @keyframes ripple-effect {
    0% {
      box-shadow: 0 0 0 0px rgba(71, 225, 141, 0.7);
      background: rgba(71, 225, 141, 0.7);
    }
    80% {
      background: rgba(66, 166, 223, 0);
    }
    100% {
      box-shadow: 0 0 0 8px rgba(66, 166, 223, 0);
    }
  }

  @keyframes ripple-effect-gray {
    0% {
      box-shadow: 0 0 0 0px rgba(115, 115, 115, 0.7);
      background: rgba(115, 115, 115, 0.7);
    }
    80% {
      background: rgba(66, 166, 223, 0);
    }
    100% {
      box-shadow: 0 0 0 8px rgba(66, 166, 223, 0);
    }
  }

  @keyframes pulse-effect {
    0% {
      transform: scale(1);
    }
    3.3% {
      transform: scale(1.1);
    }
    16.5% {
      transform: scale(1);
    }
    33% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes swing {
    0%,
    100% {
      transform: rotate(0deg);
    }
    10% {
      transform: rotate(-12deg);
    }
    20% {
      transform: rotate(12deg);
    }
    30% {
      transform: rotate(-10deg);
    }
    40% {
      transform: rotate(10deg);
    }
    50% {
      transform: rotate(-6deg);
    }
    60% {
      transform: rotate(6deg);
    }
    70% {
      transform: rotate(0deg);
    }
  }

  .rippleCircle {
    animation: pulse-effect 2s ease-out infinite;
  }

  .ripple {
    position: absolute;
    top: 0;
    left: 0;
    border: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    animation: ripple-effect 2s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
  }

  .ripple-gray {
    animation: ripple-effect-gray 2s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
  }

  .ripple:nth-child(2) {
    animation-delay: 0.33s;
    animation-duration: 2.2s;
  }

*, ::before, ::after {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgba(59, 130, 246, 0.5);
  --tw-ring-offset-shadow: 0 0 rgba(0,0,0,0);
  --tw-ring-shadow: 0 0 rgba(0,0,0,0);
  --tw-shadow: 0 0 rgba(0,0,0,0);
  --tw-shadow-colored: 0 0 rgba(0,0,0,0);
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
}

::backdrop {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgba(59, 130, 246, 0.5);
  --tw-ring-offset-shadow: 0 0 rgba(0,0,0,0);
  --tw-ring-shadow: 0 0 rgba(0,0,0,0);
  --tw-shadow: 0 0 rgba(0,0,0,0);
  --tw-shadow-colored: 0 0 rgba(0,0,0,0);
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
}
:root {
  --rt-color-white: #fff;
  --rt-color-dark: #222;
  --rt-color-success: #8dc572;
  --rt-color-error: #be6464;
  --rt-color-warning: #f0ad4e;
  --rt-color-info: #337ab7;
  --rt-opacity: 0.9;
  --rt-transition-show-delay: 0.15s;
  --rt-transition-closing-delay: 0.15s;
}
.core-styles-module_tooltip__3vRRp {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  opacity: 0;
  will-change: opacity;
}
.core-styles-module_fixed__pcSol {
  position: fixed;
}
.core-styles-module_arrow__cvMwQ {
  position: absolute;
  background: inherit;
}
.core-styles-module_noArrow__xock6 {
  display: none;
}
.core-styles-module_clickable__ZuTTB {
  pointer-events: auto;
}
.core-styles-module_show__Nt9eE {
  opacity: 0.9;
  opacity: var(--rt-opacity);
  transition: opacity 0.15s ease-out;
  transition: opacity var(--rt-transition-show-delay) ease-out;
}
.core-styles-module_closing__sGnxF {
  opacity: 0;
  transition: opacity 0.15s ease-in;
  transition: opacity var(--rt-transition-closing-delay) ease-in;
}
/** end - core styles **/
.styles-module_tooltip__mnnfp {
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 90%;
  width: -moz-max-content;
  width: max-content;
}
.styles-module_arrow__K0L3T {
  width: 8px;
  height: 8px;
}
[class*='react-tooltip__place-top'] > .styles-module_arrow__K0L3T {
  transform: rotate(45deg);
}
[class*='react-tooltip__place-right'] > .styles-module_arrow__K0L3T {
  transform: rotate(135deg);
}
[class*='react-tooltip__place-bottom'] > .styles-module_arrow__K0L3T {
  transform: rotate(225deg);
}
[class*='react-tooltip__place-left'] > .styles-module_arrow__K0L3T {
  transform: rotate(315deg);
}
/** Types variant **/
.styles-module_dark__xNqje {
  background: #222;
  background: var(--rt-color-dark);
  color: #fff;
  color: var(--rt-color-white);
}
.styles-module_light__Z6W-X {
  background-color: #fff;
  background-color: var(--rt-color-white);
  color: #222;
  color: var(--rt-color-dark);
}
.styles-module_success__A2AKt {
  background-color: #8dc572;
  background-color: var(--rt-color-success);
  color: #fff;
  color: var(--rt-color-white);
}
.styles-module_warning__SCK0X {
  background-color: #f0ad4e;
  background-color: var(--rt-color-warning);
  color: #fff;
  color: var(--rt-color-white);
}
.styles-module_error__JvumD {
  background-color: #be6464;
  background-color: var(--rt-color-error);
  color: #fff;
  color: var(--rt-color-white);
}
.styles-module_info__BWdHW {
  background-color: #337ab7;
  background-color: var(--rt-color-info);
  color: #fff;
  color: var(--rt-color-white);
}
@font-face {
  font-family: 'Inter';
  src: url(${x}) format('truetype');
  font-weight: 300;
  font-style: normal;
}
@font-face {
  font-family: 'Inter';
  src: url(${C}) format('truetype');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Inter';
  src: url(${k}) format('truetype');
  font-weight: 500;
  font-style: normal;
}
@font-face {
  font-family: 'Inter';
  src: url(${I}) format('truetype');
  font-weight: 600;
  font-style: normal;
}
@font-face {
  font-family: 'Inter';
  src: url(${_}) format('truetype');
  font-weight: 700;
  font-style: normal;
}
@font-face {
  font-family: 'Binance Plex';
  src: url(${S}) format('opentype');
  font-weight: 300;
  font-style: normal;
}
@font-face {
  font-family: 'Binance Plex';
  src: url(${K}) format('opentype');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Binance Plex';
  src: url(${M}) format('opentype');
  font-weight: 500;
  font-style: normal;
}
@font-face {
  font-family: 'Binance Plex';
  src: url(${R}) format('opentype');
  font-weight: 600;
  font-style: normal;
}
@font-face {
  font-family: 'Geeza';
  src: url(${D}) format('truetype');
  font-weight: 400;
  font-style: normal;
  unicode-range: U+0600-06FF, U+0750-077F;
}
@font-face {
  font-family: 'Geeza';
  src: url(${L}) format('truetype');
  font-weight: 600;
  font-style: normal;
  unicode-range: U+0600-06FF, U+0750-077F;
}
@font-face {
  font-family: 'Ping Fang';
  src: url(${P}) format('truetype');
  font-weight: 300;
  font-style: normal;
  unicode-range: U+4E00-9FFF, U+20000-2A6DF;
}
@font-face {
  font-family: 'Ping Fang';
  src: url(${W}) format('truetype');
  font-weight: 400;
  font-style: normal;
  unicode-range: U+4E00-9FFF, U+20000-2A6DF;
}
@font-face {
  font-family: 'Ping Fang';
  src: url(${U}) format('truetype');
  font-weight: 600;
  font-style: normal;
  unicode-range: U+4E00-9FFF, U+20000-2A6DF;
}
.\\!container {
  width: 100% !important;
}
.container {
  width: 100%;
}
@media (min-width: 640px) {

  .\\!container {
    max-width: 640px !important;
  }

  .container {
    max-width: 640px;
  }
}
@media (min-width: 768px) {

  .\\!container {
    max-width: 768px !important;
  }

  .container {
    max-width: 768px;
  }
}
@media (min-width: 926px) {

  .\\!container {
    max-width: 926px !important;
  }

  .container {
    max-width: 926px;
  }
}
@media (min-width: 1024px) {

  .\\!container {
    max-width: 1024px !important;
  }

  .container {
    max-width: 1024px;
  }
}
@media (min-width: 1280px) {

  .\\!container {
    max-width: 1280px !important;
  }

  .container {
    max-width: 1280px;
  }
}
@media (min-width: 1536px) {

  .\\!container {
    max-width: 1536px !important;
  }

  .container {
    max-width: 1536px;
  }
}
.button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 20px;
}
.button:disabled {
  pointer-events: none;
  opacity: 0.5;
}
.default-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 20px;
}
.default-button:disabled {
  pointer-events: none;
  opacity: 0.5;
}
.default-button {
  border-radius: 50px;
}
.icon-circle-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 20px;
}
.icon-circle-button:disabled {
  pointer-events: none;
  opacity: 0.5;
}
.icon-circle-button {
  border-radius: 9999px;
}
.icon-square-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 20px;
}
.icon-square-button:disabled {
  pointer-events: none;
  opacity: 0.5;
}
.icon-square-button {
  border-radius: 12px;
}
/* Deprecated. */
.tiny-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 20px;
}
.tiny-button:disabled {
  pointer-events: none;
  opacity: 0.5;
}
.tiny-button {
  border-radius: 4px;
  padding-top: 1px;
  padding-bottom: 1px;
  padding-left: 4px;
  padding-right: 4px;
  font-size: 12px;
}
.badge-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 20px;
}
.badge-button:disabled {
  pointer-events: none;
  opacity: 0.5;
}
.badge-button {
  border-radius: 4px;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 8px;
  padding-right: 8px;
  font-size: 12px;
}
.circle-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 20px;
}
.circle-button:disabled {
  pointer-events: none;
  opacity: 0.5;
}
.circle-button {
  border-radius: 9999px;
  padding: 12px;
  font-size: 16px;
  line-height: 20px;
}
.word-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 20px;
}
.word-button:disabled {
  pointer-events: none;
  opacity: 0.5;
}
.word-button {
  border-radius: 4px;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 12px;
  padding-right: 12px;
  font-size: 16px;
  line-height: 20px;
}
.checkbox {
  position: absolute;
  top: 0px;
  left: 0px;
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
}
.checkbox:checked::before {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary) / 1);
  border-color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-border-opacity)));
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary) / 1);
  background-color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-bg-opacity)));
}
.checkbox:disabled {
  opacity: 0.4;
}
.checkbox::before {
    content: '';
    display: block;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 5px;
    border-width: 2.5px;
    --tw-border-opacity: 1;
    border-color: hsl(var(--twc-utility-1-opacity-3) / 1);
    border-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-border-opacity)));
  }
.checkbox[aria-checked="true"]::before {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary) / 1);
  background-color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-bg-opacity)));
}
/* Legacy typography. */
.massive-text {
  font-size: 32px;
  line-height: 40px;
}
.screamer-text {
  font-size: 28px;
  line-height: 36px;
}
.headline-text {
  font-size: 24px;
  line-height: 32px;
}
.header-text {
  font-size: 20px;
  line-height: 28px;
}
.title-text {
  font-size: 16px;
  line-height: 24px;
}
.body-text {
  font-size: 14px;
  line-height: 22px;
}
.subtitle-text {
  font-size: 14px;
  line-height: 20px;
}
.caption-text {
  font-size: 12px;
  line-height: 16px;
}
.navigation-text {
  font-size: 12px;
  line-height: 16px;
}
/* New typography. */
.typography-header-48 {
  font-size: 48px;
  line-height: 56px;
}
.typography-header-32 {
  font-size: 32px;
  line-height: 40px;
}
.typography-header-24 {
  font-size: 24px;
  line-height: 30px;
}
.typography-header-20 {
  font-size: 20px;
  line-height: 26px;
}
.typography-header-18 {
  font-size: 18px;
  line-height: 24px;
}
.typography-header-16 {
  font-size: 16px;
  line-height: 22px;
}
.typography-subheader-24 {
  font-size: 24px;
  line-height: 28px;
}
.typography-subheader-20 {
  font-size: 20px;
  line-height: 24px;
}
.typography-subheader-18 {
  font-size: 18px;
  line-height: 22px;
}
.typography-subheader-16 {
  font-size: 16px;
  line-height: 20px;
}
.typography-subheader-14 {
  font-size: 14px;
  line-height: 18px;
}
.typography-body-20 {
  font-size: 20px;
  line-height: 24px;
}
.typography-body-16 {
  font-size: 16px;
  line-height: 20px;
}
.typography-body-14 {
  font-size: 14px;
  line-height: 18px;
}
.typography-body-12 {
  font-size: 12px;
  line-height: 16px;
}
.typography-caption-12 {
  font-size: 12px;
  line-height: 16px;
}
/* Other styles. */
.text-unset {
    text-align: inherit;
  }
.break-word {
    word-break: break-word;
  }
.alert {
  display: flex;
  width: 100%;
  border-radius: 8px;
  padding: 12px;
}
.info-alert {
  display: flex;
  width: 100%;
  border-radius: 8px;
  padding: 12px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-line) / 1);
  background-color: hsl(var(--twc-line) / var(--twc-line-opacity, var(--tw-bg-opacity)));
}
.info-alt-alert {
  display: flex;
  width: 100%;
  border-radius: 8px;
  padding: 12px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-depthBuyBg) / 1);
  background-color: hsl(var(--twc-depthBuyBg) / var(--twc-depthBuyBg-opacity, var(--tw-bg-opacity)));
}
.default-alert {
  display: flex;
  width: 100%;
  border-radius: 8px;
  padding: 12px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-4) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-4) / var(--twc-utility-1-opacity-4-opacity, var(--tw-bg-opacity)));
}
.brand-alert {
  display: flex;
  width: 100%;
  border-radius: 8px;
  padding: 12px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary-opacity-1) / 1);
  background-color: hsl(var(--twc-primary-opacity-1) / var(--twc-primary-opacity-1-opacity, var(--tw-bg-opacity)));
}
.success-alert {
  display: flex;
  width: 100%;
  border-radius: 8px;
  padding: 12px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-success-1-opacity-1) / 1);
  background-color: hsl(var(--twc-success-1-opacity-1) / var(--twc-success-1-opacity-1-opacity, var(--tw-bg-opacity)));
}
.error-alert {
  display: flex;
  width: 100%;
  border-radius: 8px;
  padding: 12px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-error-1-opacity-1) / 1);
  background-color: hsl(var(--twc-error-1-opacity-1) / var(--twc-error-1-opacity-1-opacity, var(--tw-bg-opacity)));
}
.warning-alert {
  display: flex;
  width: 100%;
  border-radius: 8px;
  padding: 12px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-warning-1-opacity-1) / 1);
  background-color: hsl(var(--twc-warning-1-opacity-1) / var(--twc-warning-1-opacity-1-opacity, var(--tw-bg-opacity)));
}
.danger-alert {
  display: flex;
  width: 100%;
  border-radius: 8px;
  padding: 12px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-errorBg) / 1);
  background-color: hsl(var(--twc-errorBg) / var(--twc-errorBg-opacity, var(--tw-bg-opacity)));
}
.input {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border-width: 1px;
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  border-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-border-opacity)));
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-transparent) / 1);
  background-color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, var(--tw-bg-opacity)));
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;
}
.input:focus-within {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary-default) / 1);
  border-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-border-opacity)));
}
.input-field {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border-width: 1px;
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  border-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-border-opacity)));
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-transparent) / 1);
  background-color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, var(--tw-bg-opacity)));
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;
}
.input-field:focus-within {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary-default) / 1);
  border-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-border-opacity)));
}
.search-field {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border-width: 1px;
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  border-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-border-opacity)));
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-transparent) / 1);
  background-color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, var(--tw-bg-opacity)));
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;
}
.search-field:focus-within {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary-default) / 1);
  border-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-border-opacity)));
}
.search-field {
  border-radius: 9999px;
  border-style: none;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-input-search-bg) / 1);
  background-color: hsl(var(--twc-input-search-bg) / var(--twc-input-search-bg-opacity, var(--tw-bg-opacity)));
  padding: 0.625rem;
}
.step-field {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border-width: 1px;
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  border-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-border-opacity)));
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-transparent) / 1);
  background-color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, var(--tw-bg-opacity)));
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;
}
.step-field:focus-within {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary-default) / 1);
  border-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-border-opacity)));
}
.step-field-long {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border-width: 1px;
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  border-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-border-opacity)));
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-transparent) / 1);
  background-color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, var(--tw-bg-opacity)));
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;
}
.step-field-long:focus-within {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary-default) / 1);
  border-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-border-opacity)));
}
.radio-group__option {
  margin: 2px;
  display: flex;
  width: 1.25rem;
  height: 1.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border-width: 2.5px;
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  border-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-border-opacity)));
}
.radio-group__option[aria-checked="true"] {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary) / 1);
  border-color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-border-opacity)));
}
.radio-group__option[aria-disabled="true"] {
  opacity: 0.4;
}
.radio-group__option-indicator {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-bg-opacity)));
}
.radio-group__option[aria-checked='true'] .radio-group__option-indicator {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary) / 1);
  background-color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-bg-opacity)));
}
.skeleton {
    --start-color: hsl(
      var(--twc-utility-1-opacity-6) / var(--twc-utility-1-opacity-6-opacity, var(--tw-bg-opacity))
    );
    --end-color: hsl(
      var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-bg-opacity))
    );

    background-image: linear-gradient(
      270deg,
      var(--start-color),
      var(--end-color),
      var(--end-color),
      var(--start-color)
    );
    background-size: 400% 100%;
    animation: bg-position 3s ease-in-out infinite;
    box-shadow: none;
    background-clip: padding-box;
    cursor: default;
    pointer-events: none;
    -webkit-user-select: none;
       -moz-user-select: none;
            user-select: none;
    flex-shrink: 0;
    border-radius: 4px;
  }
@keyframes bg-position {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
.switch {
  position: relative;
  display: inline-flex;
  height: 24px;
  width: 40px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 9999px;
  border-width: 2px;
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-transparent) / 1);
  border-color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, var(--tw-border-opacity)));
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-bg-opacity)));
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.switch:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.switch:focus-visible {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), 0 0 rgba(0,0,0,0);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 rgba(0,0,0,0));
  --tw-ring-color: rgba(255, 255, 255, var(--tw-ring-opacity));
  --tw-ring-opacity: 0.75;
}
.switch[aria-checked='true'] {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary) / 1);
  background-color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-bg-opacity)));
}
.switch[aria-checked='true'] .switch__toggle {
  --tw-translate-x: 16px;
  transform: translate(16px, var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.switch:disabled {
  opacity: 0.4;
}
.switch__toggle {
  pointer-events: none;
  display: inline-block;
  height: 1.25rem;
  width: 1.25rem;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  border-radius: 9999px;
  --tw-bg-opacity: 1;
  background-color: rgba(255, 255, 255, 1);
  background-color: rgba(255, 255, 255, var(--tw-bg-opacity));
  --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
  box-shadow: 0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 rgba(0,0,0,0)), var(--tw-ring-shadow, 0 0 rgba(0,0,0,0)), var(--tw-shadow);
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
@supports (color: rgb(0 0 0 / 0)) {
.switch__toggle {
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
}
.tw-scrollbar {
  overflow: hidden;
  overflow-y: auto;
  padding-right: 8px;
}
.tw-scrollbar::-webkit-scrollbar-track {
  background-color: var(--scrollbar-track);
  border-radius: var(--scrollbar-track-radius);
}
.tw-scrollbar::-webkit-scrollbar-track:hover {
  background-color: var(--scrollbar-track-hover, var(--scrollbar-track));
}
.tw-scrollbar::-webkit-scrollbar-track:active {
  background-color: var(--scrollbar-track-active, var(--scrollbar-track-hover, var(--scrollbar-track)));
}
.tw-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: var(--scrollbar-thumb-radius);
}
.tw-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--scrollbar-thumb-hover, var(--scrollbar-thumb));
}
.tw-scrollbar::-webkit-scrollbar-thumb:active {
  background-color: var(--scrollbar-thumb-active, var(--scrollbar-thumb-hover, var(--scrollbar-thumb)));
}
.tw-scrollbar::-webkit-scrollbar-corner {
  background-color: var(--scrollbar-corner);
  border-radius: var(--scrollbar-corner-radius);
}
.tw-scrollbar::-webkit-scrollbar-corner:hover {
  background-color: var(--scrollbar-corner-hover, var(--scrollbar-corner));
}
.tw-scrollbar::-webkit-scrollbar-corner:active {
  background-color: var(--scrollbar-corner-active, var(--scrollbar-corner-hover, var(--scrollbar-corner)));
}
.tw-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: initial initial;
  scrollbar-color: var(--scrollbar-thumb, initial) var(--scrollbar-track, initial);
}
.tw-scrollbar::-webkit-scrollbar {
  display: block;
  width: 8px;
  height: 8px;
}
.tw-scrollbar {
  --scrollbar-track: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, 1));
  --scrollbar-thumb: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, 1));
  --scrollbar-thumb-radius: 8px;
}
.tw-tooltip {
  line-height: 18px;
  z-index: 50 !important;
  max-width: 20rem !important;
  border-radius: 4px !important;
  --tw-bg-opacity: 1 !important;
  background-color: hsl(var(--twc-tooltip) / 1) !important;
  background-color: hsl(var(--twc-tooltip) / var(--twc-tooltip-opacity, var(--tw-bg-opacity))) !important;
  padding-left: 12px !important;
  padding-right: 12px !important;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  --tw-text-opacity: 1 !important;
  color: hsl(var(--twc-utility-1-default) / 1) !important;
  color: hsl(var(--twc-utility-1-default) / var(--twc-utility-1-default-opacity, var(--tw-text-opacity))) !important;
  opacity: 1 !important;
  --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1) !important;
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color) !important;
  box-shadow: 0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1) !important;
  box-shadow: var(--tw-ring-offset-shadow, 0 0 rgba(0,0,0,0)), var(--tw-ring-shadow, 0 0 rgba(0,0,0,0)), var(--tw-shadow) !important;
  --tw-backdrop-blur: blur(40px) !important;
  backdrop-filter: blur(40px) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia) !important;
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia) !important;
    font-size: 14px !important;
}
.tw-tooltip .react-tooltip-arrow {
  display: none;
}
.tw-overlay {
  position: fixed;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-overlay-50) / 1);
  background-color: hsl(var(--twc-overlay-50) / var(--twc-overlay-50-opacity, var(--tw-bg-opacity)));
  --tw-backdrop-blur: blur(2px);
  backdrop-filter: blur(2px) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
.pointer-events-none {
  pointer-events: none;
}
.visible {
  visibility: visible;
}
.collapse {
  visibility: collapse;
}
.static {
  position: static;
}
.fixed {
  position: fixed;
}
.absolute {
  position: absolute;
}
.relative {
  position: relative;
}
.sticky {
  position: sticky;
}
.inset-0 {
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
}
.inset-y-0 {
  top: 0px;
  bottom: 0px;
}
.-bottom-0 {
  bottom: -0px;
}
.-bottom-0\\.5 {
  bottom: -2px;
}
.-bottom-1 {
  bottom: -4px;
}
.-bottom-px {
  bottom: -1px;
}
.-left-\\[3px\\] {
  left: -3px;
}
.-right-0 {
  right: -0px;
}
.-right-0\\.5 {
  right: -2px;
}
.-right-1 {
  right: -4px;
}
.-top-8 {
  top: -32px;
}
.-top-\\[2px\\] {
  top: -2px;
}
.bottom-0 {
  bottom: 0px;
}
.bottom-4 {
  bottom: 16px;
}
.bottom-\\[9px\\] {
  bottom: 9px;
}
.bottom-full {
  bottom: 100%;
}
.left-0 {
  left: 0px;
}
.left-1\\/2 {
  left: 50%;
}
.left-4 {
  left: 16px;
}
.left-\\[356px\\] {
  left: 356px;
}
.left-\\[50\\%\\] {
  left: 50%;
}
.right-0 {
  right: 0px;
}
.right-1 {
  right: 4px;
}
.right-1\\.25 {
  right: 5px;
}
.right-2 {
  right: 8px;
}
.right-2\\.5 {
  right: 0.625rem;
}
.right-4 {
  right: 16px;
}
.right-5 {
  right: 1.25rem;
}
.right-\\[125px\\] {
  right: 125px;
}
.right-\\[9px\\] {
  right: 9px;
}
.top-0 {
  top: 0px;
}
.top-1 {
  top: 4px;
}
.top-1\\.25 {
  top: 5px;
}
.top-1\\/2 {
  top: 50%;
}
.top-7 {
  top: 1.75rem;
}
.top-\\[110px\\] {
  top: 110px;
}
.top-\\[20px\\] {
  top: 20px;
}
.top-\\[5px\\] {
  top: 5px;
}
.top-full {
  top: 100%;
}
.-z-10 {
  z-index: -10;
}
.z-0 {
  z-index: 0;
}
.z-10 {
  z-index: 10;
}
.z-20 {
  z-index: 20;
}
.z-30 {
  z-index: 30;
}
.z-50 {
  z-index: 50;
}
.z-\\[1\\] {
  z-index: 1;
}
.z-\\[6\\] {
  z-index: 6;
}
.col-span-3 {
  grid-column: span 3 / span 3;
}
.float-right {
  float: right;
}
.m-2 {
  margin: 8px;
}
.m-4 {
  margin: 16px;
}
.m-\\[\\^\\\\s\\] {
  margin: ^\\s;
}
.m-auto {
  margin: auto;
}
.-mx-0 {
  margin-left: -0px;
  margin-right: -0px;
}
.-mx-0\\.5 {
  margin-left: -2px;
  margin-right: -2px;
}
.-mx-2 {
  margin-left: -8px;
  margin-right: -8px;
}
.-mx-4 {
  margin-left: -16px;
  margin-right: -16px;
}
.-my-3 {
  margin-top: -12px;
  margin-bottom: -12px;
}
.mx-0 {
  margin-left: 0px;
  margin-right: 0px;
}
.mx-0\\.5 {
  margin-left: 2px;
  margin-right: 2px;
}
.mx-1 {
  margin-left: 4px;
  margin-right: 4px;
}
.mx-2 {
  margin-left: 8px;
  margin-right: 8px;
}
.mx-3 {
  margin-left: 12px;
  margin-right: 12px;
}
.mx-4 {
  margin-left: 16px;
  margin-right: 16px;
}
.mx-\\[-16px\\] {
  margin-left: -16px;
  margin-right: -16px;
}
.mx-\\[\\^\\\\s\\] {
  margin-left: ^\\s;
  margin-right: ^\\s;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-0 {
  margin-top: 0px;
  margin-bottom: 0px;
}
.my-0\\.5 {
  margin-top: 2px;
  margin-bottom: 2px;
}
.my-1 {
  margin-top: 4px;
  margin-bottom: 4px;
}
.my-10 {
  margin-top: 40px;
  margin-bottom: 40px;
}
.my-11 {
  margin-top: 2.75rem;
  margin-bottom: 2.75rem;
}
.my-14 {
  margin-top: 56px;
  margin-bottom: 56px;
}
.my-2 {
  margin-top: 8px;
  margin-bottom: 8px;
}
.my-2\\.5 {
  margin-top: 0.625rem;
  margin-bottom: 0.625rem;
}
.my-3 {
  margin-top: 12px;
  margin-bottom: 12px;
}
.my-4 {
  margin-top: 16px;
  margin-bottom: 16px;
}
.my-5 {
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
}
.my-6 {
  margin-top: 24px;
  margin-bottom: 24px;
}
.my-\\[\\^\\\\s\\] {
  margin-top: ^\\s;
  margin-bottom: ^\\s;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}
.\\!ml-4 {
  margin-left: 16px !important;
}
.\\!ml-auto {
  margin-left: auto !important;
}
.-mb-2 {
  margin-bottom: -8px;
}
.-mb-4 {
  margin-bottom: -16px;
}
.-ml-2 {
  margin-left: -8px;
}
.-mt-3 {
  margin-top: -12px;
}
.-mt-4 {
  margin-top: -16px;
}
.-mt-6 {
  margin-top: -24px;
}
.-mt-\\[10px\\] {
  margin-top: -10px;
}
.mb-0 {
  margin-bottom: 0px;
}
.mb-0\\.5 {
  margin-bottom: 2px;
}
.mb-1 {
  margin-bottom: 4px;
}
.mb-10 {
  margin-bottom: 40px;
}
.mb-16 {
  margin-bottom: 64px;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-2\\.5 {
  margin-bottom: 0.625rem;
}
.mb-3 {
  margin-bottom: 12px;
}
.mb-4 {
  margin-bottom: 16px;
}
.mb-5 {
  margin-bottom: 1.25rem;
}
.mb-6 {
  margin-bottom: 24px;
}
.mb-7 {
  margin-bottom: 1.75rem;
}
.mb-8 {
  margin-bottom: 32px;
}
.mb-\\[\\^\\\\s\\] {
  margin-bottom: ^\\s;
}
.ml-0 {
  margin-left: 0px;
}
.ml-0\\.5 {
  margin-left: 2px;
}
.ml-1 {
  margin-left: 4px;
}
.ml-1\\.25 {
  margin-left: 5px;
}
.ml-2 {
  margin-left: 8px;
}
.ml-2\\.5 {
  margin-left: 0.625rem;
}
.ml-3 {
  margin-left: 12px;
}
.ml-4 {
  margin-left: 16px;
}
.ml-6 {
  margin-left: 24px;
}
.ml-\\[12px\\] {
  margin-left: 12px;
}
.ml-\\[258px\\] {
  margin-left: 258px;
}
.ml-\\[\\^\\\\s\\] {
  margin-left: ^\\s;
}
.ml-auto {
  margin-left: auto;
}
.mr-1 {
  margin-right: 4px;
}
.mr-2 {
  margin-right: 8px;
}
.mr-2\\.5 {
  margin-right: 0.625rem;
}
.mr-3 {
  margin-right: 12px;
}
.mr-4 {
  margin-right: 16px;
}
.mr-\\[\\^\\\\s\\] {
  margin-right: ^\\s;
}
.mr-px {
  margin-right: 1px;
}
.mt-0 {
  margin-top: 0px;
}
.mt-0\\.5 {
  margin-top: 2px;
}
.mt-1 {
  margin-top: 4px;
}
.mt-1\\.5 {
  margin-top: 0.375rem;
}
.mt-12 {
  margin-top: 48px;
}
.mt-16 {
  margin-top: 64px;
}
.mt-2 {
  margin-top: 8px;
}
.mt-20 {
  margin-top: 5rem;
}
.mt-24 {
  margin-top: 6rem;
}
.mt-3 {
  margin-top: 12px;
}
.mt-4 {
  margin-top: 16px;
}
.mt-5 {
  margin-top: 1.25rem;
}
.mt-6 {
  margin-top: 24px;
}
.mt-8 {
  margin-top: 32px;
}
.mt-\\[-20px\\] {
  margin-top: -20px;
}
.mt-\\[-5px\\] {
  margin-top: -5px;
}
.mt-\\[120px\\] {
  margin-top: 120px;
}
.mt-\\[130px\\] {
  margin-top: 130px;
}
.mt-\\[150px\\] {
  margin-top: 150px;
}
.mt-\\[2px\\] {
  margin-top: 2px;
}
.mt-\\[\\^\\\\s\\] {
  margin-top: ^\\s;
}
.mt-auto {
  margin-top: auto;
}
.box-border {
  box-sizing: border-box;
}
.\\!block {
  display: block !important;
}
.block {
  display: block;
}
.inline-block {
  display: inline-block;
}
.inline {
  display: inline;
}
.flex {
  display: flex;
}
.inline-flex {
  display: inline-flex;
}
.\\!table {
  display: table !important;
}
.table {
  display: table;
}
.grid {
  display: grid;
}
.contents {
  display: contents;
}
.hidden {
  display: none;
}
.aspect-\\[2\\/1\\.48\\] {
  aspect-ratio: 2/1.48;
}
.aspect-\\[3\\/1\\] {
  aspect-ratio: 3/1;
}
.h-0 {
  height: 0px;
}
.h-0\\.75 {
  height: 3px;
}
.h-1 {
  height: 4px;
}
.h-10 {
  height: 40px;
}
.h-12 {
  height: 48px;
}
.h-14 {
  height: 56px;
}
.h-15 {
  height: 60px;
}
.h-16 {
  height: 64px;
}
.h-2 {
  height: 8px;
}
.h-2\\.5 {
  height: 10px;
}
.h-28 {
  height: 7rem;
}
.h-3 {
  height: 12px;
}
.h-3\\.5 {
  height: 0.875rem;
}
.h-32 {
  height: 8rem;
}
.h-4 {
  height: 16px;
}
.h-5 {
  height: 1.25rem;
}
.h-6 {
  height: 24px;
}
.h-7 {
  height: 1.75rem;
}
.h-7\\.5 {
  height: 30px;
}
.h-72 {
  height: 18rem;
}
.h-8 {
  height: 32px;
}
.h-9 {
  height: 36px;
}
.h-\\[100vh\\] {
  height: 100vh;
}
.h-\\[104px\\] {
  height: 104px;
}
.h-\\[150px\\] {
  height: 150px;
}
.h-\\[170px\\] {
  height: 170px;
}
.h-\\[18px\\] {
  height: 18px;
}
.h-\\[1px\\] {
  height: 1px;
}
.h-\\[200px\\] {
  height: 200px;
}
.h-\\[20px\\] {
  height: 20px;
}
.h-\\[232px\\] {
  height: 232px;
}
.h-\\[236px\\] {
  height: 236px;
}
.h-\\[252px\\] {
  height: 252px;
}
.h-\\[26px\\] {
  height: 26px;
}
.h-\\[2px\\] {
  height: 2px;
}
.h-\\[30px\\] {
  height: 30px;
}
.h-\\[330px\\] {
  height: 330px;
}
.h-\\[349px\\] {
  height: 349px;
}
.h-\\[360px\\] {
  height: 360px;
}
.h-\\[36px\\] {
  height: 36px;
}
.h-\\[52px\\] {
  height: 52px;
}
.h-\\[60vh\\] {
  height: 60vh;
}
.h-\\[6rem\\] {
  height: 6rem;
}
.h-\\[72px\\] {
  height: 72px;
}
.h-\\[780px\\] {
  height: 780px;
}
.h-\\[90px\\] {
  height: 90px;
}
.h-\\[calc\\(100vh-1rem\\)\\] {
  height: calc(100vh - 1rem);
}
.h-fit {
  height: -moz-fit-content;
  height: fit-content;
}
.h-full {
  height: 100%;
}
.h-screen {
  height: 100vh;
}
.max-h-0 {
  max-height: 0px;
}
.max-h-60 {
  max-height: 15rem;
}
.max-h-64 {
  max-height: 16rem;
}
.max-h-96 {
  max-height: 24rem;
}
.max-h-\\[235px\\] {
  max-height: 235px;
}
.max-h-\\[250px\\] {
  max-height: 250px;
}
.max-h-\\[400px\\] {
  max-height: 400px;
}
.max-h-\\[50vh\\] {
  max-height: 50vh;
}
.min-h-15 {
  min-height: 60px;
}
.min-h-17 {
  min-height: 68px;
}
.min-h-5 {
  min-height: 1.25rem;
}
.min-h-6 {
  min-height: 24px;
}
.min-h-\\[316px\\] {
  min-height: 316px;
}
.min-h-\\[400px\\] {
  min-height: 400px;
}
.min-h-\\[52px\\] {
  min-height: 52px;
}
.min-h-\\[54px\\] {
  min-height: 54px;
}
.min-h-\\[95vh\\] {
  min-height: 95vh;
}
.min-h-full {
  min-height: 100%;
}
.min-h-screen {
  min-height: 100vh;
}
.w-1 {
  width: 4px;
}
.w-1\\/2 {
  width: 50%;
}
.w-1\\/3 {
  width: 33.333333%;
}
.w-10 {
  width: 40px;
}
.w-10\\/12 {
  width: 83.333333%;
}
.w-11 {
  width: 2.75rem;
}
.w-12 {
  width: 48px;
}
.w-14 {
  width: 56px;
}
.w-16 {
  width: 64px;
}
.w-17 {
  width: 68px;
}
.w-2 {
  width: 8px;
}
.w-2\\.5 {
  width: 10px;
}
.w-2\\/3 {
  width: 66.666667%;
}
.w-20 {
  width: 5rem;
}
.w-22\\.5 {
  width: 90px;
}
.w-24 {
  width: 6rem;
}
.w-28 {
  width: 7rem;
}
.w-3 {
  width: 12px;
}
.w-32 {
  width: 8rem;
}
.w-4 {
  width: 16px;
}
.w-40 {
  width: 10rem;
}
.w-5 {
  width: 1.25rem;
}
.w-52 {
  width: 13rem;
}
.w-6 {
  width: 24px;
}
.w-7 {
  width: 1.75rem;
}
.w-7\\.5 {
  width: 30px;
}
.w-8 {
  width: 32px;
}
.w-9 {
  width: 36px;
}
.w-\\[100px\\] {
  width: 100px;
}
.w-\\[102px\\] {
  width: 102px;
}
.w-\\[124px\\] {
  width: 124px;
}
.w-\\[136px\\] {
  width: 136px;
}
.w-\\[150px\\] {
  width: 150px;
}
.w-\\[200px\\] {
  width: 200px;
}
.w-\\[20px\\] {
  width: 20px;
}
.w-\\[224px\\] {
  width: 224px;
}
.w-\\[250px\\] {
  width: 250px;
}
.w-\\[300px\\] {
  width: 300px;
}
.w-\\[305px\\] {
  width: 305px;
}
.w-\\[310px\\] {
  width: 310px;
}
.w-\\[320px\\] {
  width: 320px;
}
.w-\\[350px\\] {
  width: 350px;
}
.w-\\[36px\\] {
  width: 36px;
}
.w-\\[389px\\] {
  width: 389px;
}
.w-\\[413px\\] {
  width: 413px;
}
.w-\\[42px\\] {
  width: 42px;
}
.w-\\[438px\\] {
  width: 438px;
}
.w-\\[472px\\] {
  width: 472px;
}
.w-\\[504px\\] {
  width: 504px;
}
.w-\\[56px\\] {
  width: 56px;
}
.w-\\[600px\\] {
  width: 600px;
}
.w-\\[6rem\\] {
  width: 6rem;
}
.w-\\[77px\\] {
  width: 77px;
}
.w-\\[80px\\] {
  width: 80px;
}
.w-\\[86px\\] {
  width: 86px;
}
.w-\\[90px\\] {
  width: 90px;
}
.w-\\[calc\\(100\\%-32px\\)\\] {
  width: calc(100% - 32px);
}
.w-auto {
  width: auto;
}
.w-fit {
  width: -moz-fit-content;
  width: fit-content;
}
.w-full {
  width: 100%;
}
.w-min {
  width: -moz-min-content;
  width: min-content;
}
.min-w-0 {
  min-width: 0px;
}
.min-w-\\[253px\\] {
  min-width: 253px;
}
.min-w-\\[280px\\] {
  min-width: 280px;
}
.min-w-\\[400px\\] {
  min-width: 400px;
}
.min-w-\\[466px\\] {
  min-width: 466px;
}
.min-w-\\[480px\\] {
  min-width: 480px;
}
.min-w-\\[716px\\] {
  min-width: 716px;
}
.min-w-\\[80px\\] {
  min-width: 80px;
}
.min-w-\\[850px\\] {
  min-width: 850px;
}
.min-w-fit {
  min-width: -moz-fit-content;
  min-width: fit-content;
}
.min-w-full {
  min-width: 100%;
}
.min-w-max {
  min-width: -moz-max-content;
  min-width: max-content;
}
.min-w-min {
  min-width: -moz-min-content;
  min-width: min-content;
}
.\\!max-w-\\[300px\\] {
  max-width: 300px !important;
}
.max-w-\\[120px\\] {
  max-width: 120px;
}
.max-w-\\[200px\\] {
  max-width: 200px;
}
.max-w-\\[320px\\] {
  max-width: 320px;
}
.max-w-\\[375px\\] {
  max-width: 375px;
}
.max-w-\\[400px\\] {
  max-width: 400px;
}
.max-w-\\[716px\\] {
  max-width: 716px;
}
.max-w-md {
  max-width: 28rem;
}
.max-w-xs {
  max-width: 20rem;
}
.flex-1 {
  flex: 1 1 0%;
}
.flex-shrink-0 {
  flex-shrink: 0;
}
.shrink {
  flex-shrink: 1;
}
.shrink-0 {
  flex-shrink: 0;
}
.flex-grow {
  flex-grow: 1;
}
.flex-grow-0 {
  flex-grow: 0;
}
.grow {
  flex-grow: 1;
}
.origin-\\[50\\%_50\\%\\] {
  transform-origin: 50% 50%;
}
.origin-bottom {
  transform-origin: bottom;
}
.-translate-x-1\\/2 {
  --tw-translate-x: -50%;
  transform: translate(-50%, var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-y-1 {
  --tw-translate-y: -4px;
  transform: translate(var(--tw-translate-x), -4px) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-translate-y-1\\/2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), -50%) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-x-0 {
  --tw-translate-x: 0px;
  transform: translate(0px, var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-x-5 {
  --tw-translate-x: 1.25rem;
  transform: translate(1.25rem, var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-x-full {
  --tw-translate-x: 100%;
  transform: translate(100%, var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-y-0 {
  --tw-translate-y: 0px;
  transform: translate(var(--tw-translate-x), 0px) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-y-1 {
  --tw-translate-y: 4px;
  transform: translate(var(--tw-translate-x), 4px) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-y-1\\/2 {
  --tw-translate-y: 50%;
  transform: translate(var(--tw-translate-x), 50%) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-y-\\[200px\\] {
  --tw-translate-y: 200px;
  transform: translate(var(--tw-translate-x), 200px) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-y-\\[calc\\(-50\\%\\+6px\\)\\] {
  --tw-translate-y: calc(-50% + 6px);
  transform: translate(var(--tw-translate-x), calc(-50% + 6px)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.translate-y-full {
  --tw-translate-y: 100%;
  transform: translate(var(--tw-translate-x), 100%) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-rotate-90 {
  --tw-rotate: -90deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(-90deg) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.rotate-0 {
  --tw-rotate: 0deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(0deg) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.rotate-180 {
  --tw-rotate: 180deg;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(180deg) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.-scale-100 {
  --tw-scale-x: -1;
  --tw-scale-y: -1;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(-1) scaleY(-1);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.scale-100 {
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(1) scaleY(1);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.scale-95 {
  --tw-scale-x: .95;
  --tw-scale-y: .95;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(.95) scaleY(.95);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.scale-\\[calc\\(20\\/24\\)\\] {
  --tw-scale-x: calc(20 / 24);
  --tw-scale-y: calc(20 / 24);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(calc(20 / 24)) scaleY(calc(20 / 24));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.animate-\\[swing_2s_ease-in-out_infinite\\] {
  animation: swing 2s ease-in-out infinite;
}
@keyframes pulse {

  50% {
    opacity: .5;
  }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes reverse-spin {

  from {
    transform: rotate(360deg);
  }
}
.animate-reverse-spin {
  animation: reverse-spin 1s linear infinite;
}
@keyframes shimmer {

  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}
.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}
@keyframes spin {

  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
.cursor-default {
  cursor: default;
}
.cursor-help {
  cursor: help;
}
.cursor-not-allowed {
  cursor: not-allowed;
}
.cursor-pointer {
  cursor: pointer;
}
.select-none {
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}
.select-all {
  -webkit-user-select: all;
     -moz-user-select: all;
          user-select: all;
}
.resize-none {
  resize: none;
}
.resize {
  resize: both;
}
.list-disc {
  list-style-type: disc;
}
.appearance-none {
  -webkit-appearance: none;
     -moz-appearance: none;
          appearance: none;
}
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.grid-cols-7 {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.grid-rows-4 {
  grid-template-rows: repeat(4, minmax(0, 1fr));
}
.flex-row {
  flex-direction: row;
}
.flex-col {
  flex-direction: column;
}
.flex-wrap {
  flex-wrap: wrap;
}
.place-items-center {
  align-items: center;
  justify-items: center;
  place-items: center;
}
.items-start {
  align-items: flex-start;
}
.items-end {
  align-items: flex-end;
}
.items-center {
  align-items: center;
}
.items-baseline {
  align-items: baseline;
}
.items-stretch {
  align-items: stretch;
}
.justify-start {
  justify-content: flex-start;
}
.justify-end {
  justify-content: flex-end;
}
.justify-center {
  justify-content: center;
}
.justify-between {
  justify-content: space-between;
}
.justify-evenly {
  justify-content: space-evenly;
}
.justify-stretch {
  justify-content: stretch;
}
.gap-0 {
  gap: 0px;
}
.gap-0\\.5 {
  gap: 2px;
}
.gap-1 {
  gap: 4px;
}
.gap-1\\.5 {
  gap: 0.375rem;
}
.gap-12 {
  gap: 48px;
}
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
.gap-4 {
  gap: 16px;
}
.gap-6 {
  gap: 24px;
}
.gap-8 {
  gap: 32px;
}
.gap-\\[5px\\] {
  gap: 5px;
}
.gap-x-1 {
  -moz-column-gap: 4px;
       column-gap: 4px;
}
.gap-x-3 {
  -moz-column-gap: 12px;
       column-gap: 12px;
}
.gap-y-1 {
  row-gap: 4px;
}
.gap-y-4 {
  row-gap: 16px;
}
.space-x-0 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(0px * 0);
  margin-right: calc(0px * var(--tw-space-x-reverse));
  margin-left: calc(0px * (1 - 0));
  margin-left: calc(0px * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(0px * calc(1 - 0));
  margin-left: calc(0px * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-0\\.5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(2px * 0);
  margin-right: calc(2px * var(--tw-space-x-reverse));
  margin-left: calc(2px * (1 - 0));
  margin-left: calc(2px * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(2px * calc(1 - 0));
  margin-left: calc(2px * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-1 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(4px * 0);
  margin-right: calc(4px * var(--tw-space-x-reverse));
  margin-left: calc(4px * (1 - 0));
  margin-left: calc(4px * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(4px * calc(1 - 0));
  margin-left: calc(4px * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-1\\.25 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(5px * 0);
  margin-right: calc(5px * var(--tw-space-x-reverse));
  margin-left: calc(5px * (1 - 0));
  margin-left: calc(5px * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(5px * calc(1 - 0));
  margin-left: calc(5px * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-2 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(8px * 0);
  margin-right: calc(8px * var(--tw-space-x-reverse));
  margin-left: calc(8px * (1 - 0));
  margin-left: calc(8px * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(8px * calc(1 - 0));
  margin-left: calc(8px * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-2\\.5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(0.625rem * 0);
  margin-right: calc(0.625rem * var(--tw-space-x-reverse));
  margin-left: calc(0.625rem * (1 - 0));
  margin-left: calc(0.625rem * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(0.625rem * calc(1 - 0));
  margin-left: calc(0.625rem * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-3 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(12px * 0);
  margin-right: calc(12px * var(--tw-space-x-reverse));
  margin-left: calc(12px * (1 - 0));
  margin-left: calc(12px * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(12px * calc(1 - 0));
  margin-left: calc(12px * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-4 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(16px * 0);
  margin-right: calc(16px * var(--tw-space-x-reverse));
  margin-left: calc(16px * (1 - 0));
  margin-left: calc(16px * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(16px * calc(1 - 0));
  margin-left: calc(16px * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-6 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(24px * 0);
  margin-right: calc(24px * var(--tw-space-x-reverse));
  margin-left: calc(24px * (1 - 0));
  margin-left: calc(24px * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(24px * calc(1 - 0));
  margin-left: calc(24px * calc(1 - var(--tw-space-x-reverse)));
}
.space-x-8 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(32px * 0);
  margin-right: calc(32px * var(--tw-space-x-reverse));
  margin-left: calc(32px * (1 - 0));
  margin-left: calc(32px * (1 - var(--tw-space-x-reverse)));
  margin-left: calc(32px * calc(1 - 0));
  margin-left: calc(32px * calc(1 - var(--tw-space-x-reverse)));
}
.space-y-0 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0px * (1 - 0));
  margin-top: calc(0px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(0px * calc(1 - 0));
  margin-top: calc(0px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0px * 0);
  margin-bottom: calc(0px * var(--tw-space-y-reverse));
}
.space-y-0\\.5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(2px * (1 - 0));
  margin-top: calc(2px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(2px * calc(1 - 0));
  margin-top: calc(2px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(2px * 0);
  margin-bottom: calc(2px * var(--tw-space-y-reverse));
}
.space-y-1 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(4px * (1 - 0));
  margin-top: calc(4px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(4px * calc(1 - 0));
  margin-top: calc(4px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(4px * 0);
  margin-bottom: calc(4px * var(--tw-space-y-reverse));
}
.space-y-1\\.5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.375rem * (1 - 0));
  margin-top: calc(0.375rem * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(0.375rem * calc(1 - 0));
  margin-top: calc(0.375rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.375rem * 0);
  margin-bottom: calc(0.375rem * var(--tw-space-y-reverse));
}
.space-y-12 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(48px * (1 - 0));
  margin-top: calc(48px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(48px * calc(1 - 0));
  margin-top: calc(48px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(48px * 0);
  margin-bottom: calc(48px * var(--tw-space-y-reverse));
}
.space-y-2 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(8px * (1 - 0));
  margin-top: calc(8px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(8px * calc(1 - 0));
  margin-top: calc(8px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(8px * 0);
  margin-bottom: calc(8px * var(--tw-space-y-reverse));
}
.space-y-2\\.5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(0.625rem * (1 - 0));
  margin-top: calc(0.625rem * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(0.625rem * calc(1 - 0));
  margin-top: calc(0.625rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(0.625rem * 0);
  margin-bottom: calc(0.625rem * var(--tw-space-y-reverse));
}
.space-y-3 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(12px * (1 - 0));
  margin-top: calc(12px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(12px * calc(1 - 0));
  margin-top: calc(12px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(12px * 0);
  margin-bottom: calc(12px * var(--tw-space-y-reverse));
}
.space-y-4 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(16px * (1 - 0));
  margin-top: calc(16px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(16px * calc(1 - 0));
  margin-top: calc(16px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(16px * 0);
  margin-bottom: calc(16px * var(--tw-space-y-reverse));
}
.space-y-5 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(1.25rem * (1 - 0));
  margin-top: calc(1.25rem * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(1.25rem * calc(1 - 0));
  margin-top: calc(1.25rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(1.25rem * 0);
  margin-bottom: calc(1.25rem * var(--tw-space-y-reverse));
}
.space-y-6 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(24px * (1 - 0));
  margin-top: calc(24px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(24px * calc(1 - 0));
  margin-top: calc(24px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(24px * 0);
  margin-bottom: calc(24px * var(--tw-space-y-reverse));
}
.space-y-7 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(1.75rem * (1 - 0));
  margin-top: calc(1.75rem * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(1.75rem * calc(1 - 0));
  margin-top: calc(1.75rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(1.75rem * 0);
  margin-bottom: calc(1.75rem * var(--tw-space-y-reverse));
}
.space-y-8 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(32px * (1 - 0));
  margin-top: calc(32px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(32px * calc(1 - 0));
  margin-top: calc(32px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(32px * 0);
  margin-bottom: calc(32px * var(--tw-space-y-reverse));
}
.space-y-\\[2px\\] > :not([hidden]) ~ :not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top: calc(2px * (1 - 0));
  margin-top: calc(2px * (1 - var(--tw-space-y-reverse)));
  margin-top: calc(2px * calc(1 - 0));
  margin-top: calc(2px * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom: calc(2px * 0);
  margin-bottom: calc(2px * var(--tw-space-y-reverse));
}
.place-self-stretch {
  align-self: stretch;
  justify-self: stretch;
  place-self: stretch;
}
.self-center {
  align-self: center;
}
.self-stretch {
  align-self: stretch;
}
.justify-self-end {
  justify-self: end;
}
.overflow-auto {
  overflow: auto;
}
.overflow-hidden {
  overflow: hidden;
}
.overflow-x-auto {
  overflow-x: auto;
}
.overflow-y-auto {
  overflow-y: auto;
}
.overflow-y-hidden {
  overflow-y: hidden;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.whitespace-nowrap {
  white-space: nowrap;
}
.whitespace-pre {
  white-space: pre;
}
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
.text-nowrap {
  text-wrap: nowrap;
}
.break-words {
  word-wrap: break-word;
}
.break-all {
  word-break: break-all;
}
.rounded {
  border-radius: 4px;
}
.rounded-10 {
  border-radius: 40px;
}
.rounded-2 {
  border-radius: 8px;
}
.rounded-3 {
  border-radius: 12px;
}
.rounded-3xl {
  border-radius: 14px;
}
.rounded-4 {
  border-radius: 16px;
}
.rounded-5xl {
  border-radius: 20px;
}
.rounded-6 {
  border-radius: 24px;
}
.rounded-\\[10px\\] {
  border-radius: 10px;
}
.rounded-\\[24px_0px_0px_24px\\] {
  border-radius: 24px 0px 0px 24px;
}
.rounded-\\[40px\\] {
  border-radius: 40px;
}
.rounded-\\[4px\\] {
  border-radius: 4px;
}
.rounded-curvy {
  border-radius: 50px;
}
.rounded-full {
  border-radius: 9999px;
}
.rounded-lg {
  border-radius: 8px;
}
.rounded-xl {
  border-radius: 10px;
}
.rounded-b-4 {
  border-bottom-right-radius: 16px;
  border-bottom-left-radius: 16px;
}
.rounded-b-5xl {
  border-bottom-right-radius: 20px;
  border-bottom-left-radius: 20px;
}
.rounded-t-4 {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.rounded-t-5xl {
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}
.rounded-bl-full {
  border-bottom-left-radius: 9999px;
}
.rounded-br-4 {
  border-bottom-right-radius: 16px;
}
.rounded-tl-full {
  border-top-left-radius: 9999px;
}
.border {
  border-width: 1px;
}
.border-2 {
  border-width: 2px;
}
.border-\\[2px\\] {
  border-width: 2px;
}
.border-b {
  border-bottom-width: 1px;
}
.border-r {
  border-right-width: 1px;
}
.border-t {
  border-top-width: 1px;
}
.border-solid {
  border-style: solid;
}
.border-dashed {
  border-style: dashed;
}
.\\!border-error {
  --tw-border-opacity: 1 !important;
  border-color: hsl(var(--twc-error) / 1) !important;
  border-color: hsl(var(--twc-error) / var(--twc-error-opacity, var(--tw-border-opacity))) !important;
}
.border-\\[a-z\\] {
  border-color: a-z;
}
.border-accent-blue {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-accent-blue) / 1);
  border-color: hsl(var(--twc-accent-blue) / var(--twc-accent-blue-opacity, var(--tw-border-opacity)));
}
.border-accent-neon-green {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-accent-neon-green) / 1);
  border-color: hsl(var(--twc-accent-neon-green) / var(--twc-accent-neon-green-opacity, var(--tw-border-opacity)));
}
.border-accent-pink {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-accent-pink) / 1);
  border-color: hsl(var(--twc-accent-pink) / var(--twc-accent-pink-opacity, var(--tw-border-opacity)));
}
.border-accent-yellow {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-accent-yellow) / 1);
  border-color: hsl(var(--twc-accent-yellow) / var(--twc-accent-yellow-opacity, var(--tw-border-opacity)));
}
.border-background-1 {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-background-1) / 1);
  border-color: hsl(var(--twc-background-1) / var(--twc-background-1-opacity, var(--tw-border-opacity)));
}
.border-background-primary {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-background-primary) / 1);
  border-color: hsl(var(--twc-background-primary) / var(--twc-background-primary-opacity, var(--tw-border-opacity)));
}
.border-backgroundPrimary {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-backgroundPrimary) / 1);
  border-color: hsl(var(--twc-backgroundPrimary) / var(--twc-backgroundPrimary-opacity, var(--tw-border-opacity)));
}
.border-backgroundTertiary {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-backgroundTertiary) / 1);
  border-color: hsl(var(--twc-backgroundTertiary) / var(--twc-backgroundTertiary-opacity, var(--tw-border-opacity)));
}
.border-black {
  --tw-border-opacity: 1;
  border-color: rgba(0, 0, 0, 1);
  border-color: rgba(0, 0, 0, var(--tw-border-opacity));
}
.border-blue-600 {
  --tw-border-opacity: 1;
  border-color: rgba(37, 99, 235, 1);
  border-color: rgba(37, 99, 235, var(--tw-border-opacity));
}
.border-error {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-error) / 1);
  border-color: hsl(var(--twc-error) / var(--twc-error-opacity, var(--tw-border-opacity)));
}
.border-error-1-default {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-error-1-default) / 1);
  border-color: hsl(var(--twc-error-1-default) / var(--twc-error-1-default-opacity, var(--tw-border-opacity)));
}
.border-error-1-opacity-1 {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-error-1-opacity-1) / 1);
  border-color: hsl(var(--twc-error-1-opacity-1) / var(--twc-error-1-opacity-1-opacity, var(--tw-border-opacity)));
}
.border-line {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-line) / 1);
  border-color: hsl(var(--twc-line) / var(--twc-line-opacity, var(--tw-border-opacity)));
}
.border-line-divider {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-line-divider) / 1);
  border-color: hsl(var(--twc-line-divider) / var(--twc-line-divider-opacity, var(--tw-border-opacity)));
}
.border-on-primary-opacity-1 {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-on-primary-opacity-1) / 1);
  border-color: hsl(var(--twc-on-primary-opacity-1) / var(--twc-on-primary-opacity-1-opacity, var(--tw-border-opacity)));
}
.border-other-Gold {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-other-Gold) / 1);
  border-color: hsl(var(--twc-other-Gold) / var(--twc-other-Gold-opacity, var(--tw-border-opacity)));
}
.border-other-Silver {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-other-Silver) / 1);
  border-color: hsl(var(--twc-other-Silver) / var(--twc-other-Silver-opacity, var(--tw-border-opacity)));
}
.border-primary {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary) / 1);
  border-color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-border-opacity)));
}
.border-primary-default {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary-default) / 1);
  border-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-border-opacity)));
}
.border-primary-opacity-1 {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary-opacity-1) / 1);
  border-color: hsl(var(--twc-primary-opacity-1) / var(--twc-primary-opacity-1-opacity, var(--tw-border-opacity)));
}
.border-red-500 {
  --tw-border-opacity: 1;
  border-color: rgba(239, 68, 68, 1);
  border-color: rgba(239, 68, 68, var(--tw-border-opacity));
}
.border-success {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-success) / 1);
  border-color: hsl(var(--twc-success) / var(--twc-success-opacity, var(--tw-border-opacity)));
}
.border-transparent {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-transparent) / 1);
  border-color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, var(--tw-border-opacity)));
}
.border-utility-1-opacity-2 {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-utility-1-opacity-2) / 1);
  border-color: hsl(var(--twc-utility-1-opacity-2) / var(--twc-utility-1-opacity-2-opacity, var(--tw-border-opacity)));
}
.border-utility-1-opacity-3 {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  border-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-border-opacity)));
}
.border-utility-1-opacity-5 {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-utility-1-opacity-5) / 1);
  border-color: hsl(var(--twc-utility-1-opacity-5) / var(--twc-utility-1-opacity-5-opacity, var(--tw-border-opacity)));
}
.border-b-error-1-default {
  --tw-border-opacity: 1;
  border-bottom-color: hsl(var(--twc-error-1-default) / 1);
  border-bottom-color: hsl(var(--twc-error-1-default) / var(--twc-error-1-default-opacity, var(--tw-border-opacity)));
}
.border-b-on-primary {
  --tw-border-opacity: 1;
  border-bottom-color: hsl(var(--twc-on-primary) / 1);
  border-bottom-color: hsl(var(--twc-on-primary) / var(--twc-on-primary-opacity, var(--tw-border-opacity)));
}
.border-b-primary-default {
  --tw-border-opacity: 1;
  border-bottom-color: hsl(var(--twc-primary-default) / 1);
  border-bottom-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-border-opacity)));
}
.border-b-utility-1-opacity-1 {
  --tw-border-opacity: 1;
  border-bottom-color: hsl(var(--twc-utility-1-opacity-1) / 1);
  border-bottom-color: hsl(var(--twc-utility-1-opacity-1) / var(--twc-utility-1-opacity-1-opacity, var(--tw-border-opacity)));
}
.border-b-utility-1-opacity-5 {
  --tw-border-opacity: 1;
  border-bottom-color: hsl(var(--twc-utility-1-opacity-5) / 1);
  border-bottom-color: hsl(var(--twc-utility-1-opacity-5) / var(--twc-utility-1-opacity-5-opacity, var(--tw-border-opacity)));
}
.border-t-line {
  --tw-border-opacity: 1;
  border-top-color: hsl(var(--twc-line) / 1);
  border-top-color: hsl(var(--twc-line) / var(--twc-line-opacity, var(--tw-border-opacity)));
}
.border-t-utility-1-opacity-5 {
  --tw-border-opacity: 1;
  border-top-color: hsl(var(--twc-utility-1-opacity-5) / 1);
  border-top-color: hsl(var(--twc-utility-1-opacity-5) / var(--twc-utility-1-opacity-5-opacity, var(--tw-border-opacity)));
}
.bg-\\[\\#111\\] {
  --tw-bg-opacity: 1;
  background-color: rgba(17, 17, 17, 1);
  background-color: rgba(17, 17, 17, var(--tw-bg-opacity));
}
.bg-\\[\\^\\\\s\\] {
  background-color: ^\\s;
}
.bg-\\[rgba\\(37\\2c 37\\2c 37\\2c 0\\.08\\)\\] {
  background-color: rgba(37,37,37,0.08);
}
.bg-accent-blue {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-accent-blue) / 1);
  background-color: hsl(var(--twc-accent-blue) / var(--twc-accent-blue-opacity, var(--tw-bg-opacity)));
}
.bg-accent-neon-green {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-accent-neon-green) / 1);
  background-color: hsl(var(--twc-accent-neon-green) / var(--twc-accent-neon-green-opacity, var(--tw-bg-opacity)));
}
.bg-accent-pink {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-accent-pink) / 1);
  background-color: hsl(var(--twc-accent-pink) / var(--twc-accent-pink-opacity, var(--tw-bg-opacity)));
}
.bg-accent-yellow {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-accent-yellow) / 1);
  background-color: hsl(var(--twc-accent-yellow) / var(--twc-accent-yellow-opacity, var(--tw-bg-opacity)));
}
.bg-background-1 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-background-1) / 1);
  background-color: hsl(var(--twc-background-1) / var(--twc-background-1-opacity, var(--tw-bg-opacity)));
}
.bg-background-2 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-background-2) / 1);
  background-color: hsl(var(--twc-background-2) / var(--twc-background-2-opacity, var(--tw-bg-opacity)));
}
.bg-background-primary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-background-primary) / 1);
  background-color: hsl(var(--twc-background-primary) / var(--twc-background-primary-opacity, var(--tw-bg-opacity)));
}
.bg-background-secondary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-background-secondary) / 1);
  background-color: hsl(var(--twc-background-secondary) / var(--twc-background-secondary-opacity, var(--tw-bg-opacity)));
}
.bg-background-tertiary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-background-tertiary) / 1);
  background-color: hsl(var(--twc-background-tertiary) / var(--twc-background-tertiary-opacity, var(--tw-bg-opacity)));
}
.bg-backgroundPrimary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-backgroundPrimary) / 1);
  background-color: hsl(var(--twc-backgroundPrimary) / var(--twc-backgroundPrimary-opacity, var(--tw-bg-opacity)));
}
.bg-backgroundSecondary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-backgroundSecondary) / 1);
  background-color: hsl(var(--twc-backgroundSecondary) / var(--twc-backgroundSecondary-opacity, var(--tw-bg-opacity)));
}
.bg-backgroundTertiary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-backgroundTertiary) / 1);
  background-color: hsl(var(--twc-backgroundTertiary) / var(--twc-backgroundTertiary-opacity, var(--tw-bg-opacity)));
}
.bg-bg3 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-bg3) / 1);
  background-color: hsl(var(--twc-bg3) / var(--twc-bg3-opacity, var(--tw-bg-opacity)));
}
.bg-black {
  --tw-bg-opacity: 1;
  background-color: rgba(0, 0, 0, 1);
  background-color: rgba(0, 0, 0, var(--tw-bg-opacity));
}
.bg-blue-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(59, 130, 246, 1);
  background-color: rgba(59, 130, 246, var(--tw-bg-opacity));
}
.bg-brand-background {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-brand-background) / 1);
  background-color: hsl(var(--twc-brand-background) / var(--twc-brand-background-opacity, var(--tw-bg-opacity)));
}
.bg-button-primary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-button-primary) / 1);
  background-color: hsl(var(--twc-button-primary) / var(--twc-button-primary-opacity, var(--tw-bg-opacity)));
}
.bg-button-secondary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-button-secondary) / 1);
  background-color: hsl(var(--twc-button-secondary) / var(--twc-button-secondary-opacity, var(--tw-bg-opacity)));
}
.bg-button-secondary-pressed {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-button-secondary-pressed) / 1);
  background-color: hsl(var(--twc-button-secondary-pressed) / var(--twc-button-secondary-pressed-opacity, var(--tw-bg-opacity)));
}
.bg-error-1-default {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-error-1-default) / 1);
  background-color: hsl(var(--twc-error-1-default) / var(--twc-error-1-default-opacity, var(--tw-bg-opacity)));
}
.bg-error-1-opacity-1 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-error-1-opacity-1) / 1);
  background-color: hsl(var(--twc-error-1-opacity-1) / var(--twc-error-1-opacity-1-opacity, var(--tw-bg-opacity)));
}
.bg-error-background {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-error-background) / 1);
  background-color: hsl(var(--twc-error-background) / var(--twc-error-background-opacity, var(--tw-bg-opacity)));
}
.bg-errorBg {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-errorBg) / 1);
  background-color: hsl(var(--twc-errorBg) / var(--twc-errorBg-opacity, var(--tw-bg-opacity)));
}
.bg-gray-100 {
  --tw-bg-opacity: 1;
  background-color: rgba(243, 244, 246, 1);
  background-color: rgba(243, 244, 246, var(--tw-bg-opacity));
}
.bg-line {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-line) / 1);
  background-color: hsl(var(--twc-line) / var(--twc-line-opacity, var(--tw-bg-opacity)));
}
.bg-primary {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary) / 1);
  background-color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-bg-opacity)));
}
.bg-primary-default {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary-default) / 1);
  background-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-bg-opacity)));
}
.bg-primary-opacity-1 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary-opacity-1) / 1);
  background-color: hsl(var(--twc-primary-opacity-1) / var(--twc-primary-opacity-1-opacity, var(--tw-bg-opacity)));
}
.bg-primary\\/10 {
  background-color: hsl(var(--twc-primary) / 0.1);
}
.bg-red-500 {
  --tw-bg-opacity: 1;
  background-color: rgba(239, 68, 68, 1);
  background-color: rgba(239, 68, 68, var(--tw-bg-opacity));
}
.bg-success-1-default {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-success-1-default) / 1);
  background-color: hsl(var(--twc-success-1-default) / var(--twc-success-1-default-opacity, var(--tw-bg-opacity)));
}
.bg-successBg {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-successBg) / 1);
  background-color: hsl(var(--twc-successBg) / var(--twc-successBg-opacity, var(--tw-bg-opacity)));
}
.bg-transparent {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-transparent) / 1);
  background-color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, var(--tw-bg-opacity)));
}
.bg-utility-1-default {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-default) / 1);
  background-color: hsl(var(--twc-utility-1-default) / var(--twc-utility-1-default-opacity, var(--tw-bg-opacity)));
}
.bg-utility-1-opacity-2 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-2) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-2) / var(--twc-utility-1-opacity-2-opacity, var(--tw-bg-opacity)));
}
.bg-utility-1-opacity-3 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-3) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-bg-opacity)));
}
.bg-utility-1-opacity-4 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-4) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-4) / var(--twc-utility-1-opacity-4-opacity, var(--tw-bg-opacity)));
}
.bg-utility-1-opacity-5 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-5) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-5) / var(--twc-utility-1-opacity-5-opacity, var(--tw-bg-opacity)));
}
.bg-utility-1-opacity-6 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-6) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-6) / var(--twc-utility-1-opacity-6-opacity, var(--tw-bg-opacity)));
}
.bg-warning {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-warning) / 1);
  background-color: hsl(var(--twc-warning) / var(--twc-warning-opacity, var(--tw-bg-opacity)));
}
.bg-warning-1-opacity-1 {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-warning-1-opacity-1) / 1);
  background-color: hsl(var(--twc-warning-1-opacity-1) / var(--twc-warning-1-opacity-1-opacity, var(--tw-bg-opacity)));
}
.bg-white {
  --tw-bg-opacity: 1;
  background-color: rgba(255, 255, 255, 1);
  background-color: rgba(255, 255, 255, var(--tw-bg-opacity));
}
.bg-opacity-50 {
  --tw-bg-opacity: 0.5;
}
.bg-gradient-primary {
  background-image: linear-gradient(268deg, var(--tw-gradient-stops));
}
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}
.from-light-gradient-mid {
  --tw-gradient-from: hsl(var(--twc-light-gradient-mid) / var(--twc-light-gradient-mid-opacity, 1)) var(--tw-gradient-from-position);
  --tw-gradient-to: hsl(var(--twc-light-gradient-mid) / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.from-utility-1-opacity-5 {
  --tw-gradient-from: hsl(var(--twc-utility-1-opacity-5) / var(--twc-utility-1-opacity-5-opacity, 1)) var(--tw-gradient-from-position);
  --tw-gradient-to: hsl(var(--twc-utility-1-opacity-5) / 0) var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}
.via-utility-1-opacity-4 {
  --tw-gradient-to: hsl(var(--twc-utility-1-opacity-4) / 0)  var(--tw-gradient-to-position);
  --tw-gradient-stops: var(--tw-gradient-from), hsl(var(--twc-utility-1-opacity-4) / var(--twc-utility-1-opacity-4-opacity, 1)) var(--tw-gradient-via-position), var(--tw-gradient-to);
}
.to-light-gradient-end {
  --tw-gradient-to: hsl(var(--twc-light-gradient-end) / var(--twc-light-gradient-end-opacity, 1)) var(--tw-gradient-to-position);
}
.to-utility-1-opacity-5 {
  --tw-gradient-to: hsl(var(--twc-utility-1-opacity-5) / var(--twc-utility-1-opacity-5-opacity, 1)) var(--tw-gradient-to-position);
}
.bg-\\[length\\:200\\%_100\\%\\] {
  background-size: 200% 100%;
}
.fill-background-2 {
  fill: hsl(var(--twc-background-2) / 1);
  fill: hsl(var(--twc-background-2) / var(--twc-background-2-opacity, 1));
}
.fill-utility-1-default {
  fill: hsl(var(--twc-utility-1-default) / 1);
  fill: hsl(var(--twc-utility-1-default) / var(--twc-utility-1-default-opacity, 1));
}
.stroke-current {
  stroke: currentColor;
}
.object-contain {
  -o-object-fit: contain;
     object-fit: contain;
}
.object-cover {
  -o-object-fit: cover;
     object-fit: cover;
}
.\\!p-0 {
  padding: 0px !important;
}
.p-0 {
  padding: 0px;
}
.p-1 {
  padding: 4px;
}
.p-1\\.5 {
  padding: 0.375rem;
}
.p-12 {
  padding: 48px;
}
.p-2 {
  padding: 8px;
}
.p-2\\.5 {
  padding: 0.625rem;
}
.p-3 {
  padding: 12px;
}
.p-3\\.5 {
  padding: 0.875rem;
}
.p-4 {
  padding: 16px;
}
.p-6 {
  padding: 24px;
}
.p-\\[10px\\] {
  padding: 10px;
}
.p-\\[\\^\\\\s\\] {
  padding: ^\\s;
}
.\\!py-2 {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}
.px-1 {
  padding-left: 4px;
  padding-right: 4px;
}
.px-2 {
  padding-left: 8px;
  padding-right: 8px;
}
.px-3 {
  padding-left: 12px;
  padding-right: 12px;
}
.px-4 {
  padding-left: 16px;
  padding-right: 16px;
}
.px-5 {
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}
.px-6 {
  padding-left: 24px;
  padding-right: 24px;
}
.px-8 {
  padding-left: 32px;
  padding-right: 32px;
}
.px-\\[10px\\] {
  padding-left: 10px;
  padding-right: 10px;
}
.px-\\[\\^\\\\s\\] {
  padding-left: ^\\s;
  padding-right: ^\\s;
}
.py-0 {
  padding-top: 0px;
  padding-bottom: 0px;
}
.py-0\\.5 {
  padding-top: 2px;
  padding-bottom: 2px;
}
.py-1 {
  padding-top: 4px;
  padding-bottom: 4px;
}
.py-1\\.5 {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}
.py-12 {
  padding-top: 48px;
  padding-bottom: 48px;
}
.py-2 {
  padding-top: 8px;
  padding-bottom: 8px;
}
.py-2\\.5 {
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
}
.py-20 {
  padding-top: 5rem;
  padding-bottom: 5rem;
}
.py-3 {
  padding-top: 12px;
  padding-bottom: 12px;
}
.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}
.py-5 {
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
}
.py-6 {
  padding-top: 24px;
  padding-bottom: 24px;
}
.py-8 {
  padding-top: 32px;
  padding-bottom: 32px;
}
.py-\\[10px\\] {
  padding-top: 10px;
  padding-bottom: 10px;
}
.py-\\[\\^\\\\s\\] {
  padding-top: ^\\s;
  padding-bottom: ^\\s;
}
.pb-0 {
  padding-bottom: 0px;
}
.pb-2 {
  padding-bottom: 8px;
}
.pb-28 {
  padding-bottom: 7rem;
}
.pb-3 {
  padding-bottom: 12px;
}
.pb-4 {
  padding-bottom: 16px;
}
.pb-5 {
  padding-bottom: 1.25rem;
}
.pb-6 {
  padding-bottom: 24px;
}
.pb-8 {
  padding-bottom: 32px;
}
.pb-\\[100\\%\\] {
  padding-bottom: 100%;
}
.pb-\\[3px\\] {
  padding-bottom: 3px;
}
.pb-\\[4px\\] {
  padding-bottom: 4px;
}
.pb-\\[\\^\\\\s\\] {
  padding-bottom: ^\\s;
}
.pl-1 {
  padding-left: 4px;
}
.pl-1\\.5 {
  padding-left: 0.375rem;
}
.pl-11 {
  padding-left: 2.75rem;
}
.pl-16 {
  padding-left: 64px;
}
.pl-2 {
  padding-left: 8px;
}
.pl-2\\.5 {
  padding-left: 0.625rem;
}
.pl-3 {
  padding-left: 12px;
}
.pl-4 {
  padding-left: 16px;
}
.pl-5 {
  padding-left: 1.25rem;
}
.pl-\\[\\^\\\\s\\] {
  padding-left: ^\\s;
}
.pr-1 {
  padding-right: 4px;
}
.pr-10 {
  padding-right: 40px;
}
.pr-2 {
  padding-right: 8px;
}
.pr-3 {
  padding-right: 12px;
}
.pr-4 {
  padding-right: 16px;
}
.pr-\\[2px\\] {
  padding-right: 2px;
}
.pr-\\[30px\\] {
  padding-right: 30px;
}
.pr-\\[56px\\] {
  padding-right: 56px;
}
.pr-\\[\\^\\\\s\\] {
  padding-right: ^\\s;
}
.pt-0 {
  padding-top: 0px;
}
.pt-0\\.5 {
  padding-top: 2px;
}
.pt-1 {
  padding-top: 4px;
}
.pt-2 {
  padding-top: 8px;
}
.pt-20 {
  padding-top: 5rem;
}
.pt-3 {
  padding-top: 12px;
}
.pt-4 {
  padding-top: 16px;
}
.pt-5 {
  padding-top: 1.25rem;
}
.pt-6 {
  padding-top: 24px;
}
.pt-8 {
  padding-top: 32px;
}
.pt-\\[40px\\] {
  padding-top: 40px;
}
.pt-\\[59px\\] {
  padding-top: 59px;
}
.pt-\\[\\^\\\\s\\] {
  padding-top: ^\\s;
}
.\\!text-left {
  text-align: left !important;
}
.text-left {
  text-align: left;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.text-start {
  text-align: left;
}
.text-end {
  text-align: right;
}
.align-middle {
  vertical-align: middle;
}
.font-brand {
  font-family: Inter, Geeza, "Ping Fang", "Binance Plex", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
.font-inter {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
.text-\\[11px\\]\\/\\[13px\\] {
  font-size: 11px;
  line-height: 13px;
}
.text-\\[16px\\] {
  font-size: 16px;
}
.text-\\[17px\\] {
  font-size: 17px;
}
.text-\\[23px\\] {
  font-size: 23px;
}
.text-\\[24px\\] {
  font-size: 24px;
}
.text-body-14 {
  font-size: 14px;
}
.text-body3 {
  font-size: 14px;
}
.text-caption1 {
  font-size: 12px;
}
.text-header-48 {
  font-size: 48px;
}
.text-headline6 {
  font-size: 24px;
}
.text-subheader-14 {
  font-size: 14px;
}
.text-subheader-16 {
  font-size: 16px;
}
.text-xx-small {
  font-size: 10px;
}
.font-bold {
  font-weight: 700;
}
.font-light {
  font-weight: 300;
}
.font-medium {
  font-weight: 500;
}
.font-normal {
  font-weight: 400;
}
.font-semibold {
  font-weight: 600;
}
.uppercase {
  text-transform: uppercase;
}
.capitalize {
  text-transform: capitalize;
}
.leading-\\[18px\\] {
  line-height: 18px;
}
.leading-\\[21px\\] {
  line-height: 21px;
}
.leading-\\[24px\\] {
  line-height: 24px;
}
.leading-\\[30px\\] {
  line-height: 30px;
}
.leading-body-12 {
  line-height: 16px;
}
.leading-body-14 {
  line-height: 18px;
}
.leading-body-16 {
  line-height: 20px;
}
.leading-body-20 {
  line-height: 24px;
}
.leading-caption-12 {
  line-height: 16px;
}
.leading-header-16 {
  line-height: 22px;
}
.leading-header-18 {
  line-height: 24px;
}
.leading-header-20 {
  line-height: 26px;
}
.leading-header-24 {
  line-height: 30px;
}
.leading-header-32 {
  line-height: 40px;
}
.leading-header-48 {
  line-height: 56px;
}
.leading-headline6 {
  line-height: 32px;
}
.leading-subheader-14 {
  line-height: 18px;
}
.leading-subheader-16 {
  line-height: 20px;
}
.leading-subheader-18 {
  line-height: 22px;
}
.leading-subheader-20 {
  line-height: 24px;
}
.leading-subheader-24 {
  line-height: 28px;
}
.leading-subtitle4 {
  line-height: 22px;
}
.\\!text-error-main {
  --tw-text-opacity: 1 !important;
  color: hsl(var(--twc-error-main) / 1) !important;
  color: hsl(var(--twc-error-main) / var(--twc-error-main-opacity, var(--tw-text-opacity))) !important;
}
.\\!text-primary {
  --tw-text-opacity: 1 !important;
  color: hsl(var(--twc-primary) / 1) !important;
  color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-text-opacity))) !important;
}
.text-\\[a-z\\] {
  color: a-z;
}
.text-accent-blue {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-accent-blue) / 1);
  color: hsl(var(--twc-accent-blue) / var(--twc-accent-blue-opacity, var(--tw-text-opacity)));
}
.text-accent-lavender {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-accent-lavender) / 1);
  color: hsl(var(--twc-accent-lavender) / var(--twc-accent-lavender-opacity, var(--tw-text-opacity)));
}
.text-accent-neon-green {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-accent-neon-green) / 1);
  color: hsl(var(--twc-accent-neon-green) / var(--twc-accent-neon-green-opacity, var(--tw-text-opacity)));
}
.text-accent-pink {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-accent-pink) / 1);
  color: hsl(var(--twc-accent-pink) / var(--twc-accent-pink-opacity, var(--tw-text-opacity)));
}
.text-accent-yellow {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-accent-yellow) / 1);
  color: hsl(var(--twc-accent-yellow) / var(--twc-accent-yellow-opacity, var(--tw-text-opacity)));
}
.text-background-1 {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-background-1) / 1);
  color: hsl(var(--twc-background-1) / var(--twc-background-1-opacity, var(--tw-text-opacity)));
}
.text-backgroundPrimary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-backgroundPrimary) / 1);
  color: hsl(var(--twc-backgroundPrimary) / var(--twc-backgroundPrimary-opacity, var(--tw-text-opacity)));
}
.text-backgroundTertiary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-backgroundTertiary) / 1);
  color: hsl(var(--twc-backgroundTertiary) / var(--twc-backgroundTertiary-opacity, var(--tw-text-opacity)));
}
.text-blue-500 {
  --tw-text-opacity: 1;
  color: rgba(59, 130, 246, 1);
  color: rgba(59, 130, 246, var(--tw-text-opacity));
}
.text-brand-on-primary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-brand-on-primary) / 1);
  color: hsl(var(--twc-brand-on-primary) / var(--twc-brand-on-primary-opacity, var(--tw-text-opacity)));
}
.text-brand-primary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-brand-primary) / 1);
  color: hsl(var(--twc-brand-primary) / var(--twc-brand-primary-opacity, var(--tw-text-opacity)));
}
.text-error {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-error) / 1);
  color: hsl(var(--twc-error) / var(--twc-error-opacity, var(--tw-text-opacity)));
}
.text-error-1-default {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-error-1-default) / 1);
  color: hsl(var(--twc-error-1-default) / var(--twc-error-1-default-opacity, var(--tw-text-opacity)));
}
.text-error-main {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-error-main) / 1);
  color: hsl(var(--twc-error-main) / var(--twc-error-main-opacity, var(--tw-text-opacity)));
}
.text-icon-disabled {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-icon-disabled) / 1);
  color: hsl(var(--twc-icon-disabled) / var(--twc-icon-disabled-opacity, var(--tw-text-opacity)));
}
.text-icon-primary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-icon-primary) / 1);
  color: hsl(var(--twc-icon-primary) / var(--twc-icon-primary-opacity, var(--tw-text-opacity)));
}
.text-icon-secondary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-icon-secondary) / 1);
  color: hsl(var(--twc-icon-secondary) / var(--twc-icon-secondary-opacity, var(--tw-text-opacity)));
}
.text-iconNormal {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-iconNormal) / 1);
  color: hsl(var(--twc-iconNormal) / var(--twc-iconNormal-opacity, var(--tw-text-opacity)));
}
.text-iconWarning {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-iconWarning) / 1);
  color: hsl(var(--twc-iconWarning) / var(--twc-iconWarning-opacity, var(--tw-text-opacity)));
}
.text-on-primary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-on-primary) / 1);
  color: hsl(var(--twc-on-primary) / var(--twc-on-primary-opacity, var(--tw-text-opacity)));
}
.text-other-Bronze {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-other-Bronze) / 1);
  color: hsl(var(--twc-other-Bronze) / var(--twc-other-Bronze-opacity, var(--tw-text-opacity)));
}
.text-other-Gold {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-other-Gold) / 1);
  color: hsl(var(--twc-other-Gold) / var(--twc-other-Gold-opacity, var(--tw-text-opacity)));
}
.text-other-Silver {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-other-Silver) / 1);
  color: hsl(var(--twc-other-Silver) / var(--twc-other-Silver-opacity, var(--tw-text-opacity)));
}
.text-primary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-primary) / 1);
  color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-text-opacity)));
}
.text-primary-default {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-primary-default) / 1);
  color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-text-opacity)));
}
.text-red-500 {
  --tw-text-opacity: 1;
  color: rgba(239, 68, 68, 1);
  color: rgba(239, 68, 68, var(--tw-text-opacity));
}
.text-star-gray {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-star-gray) / 1);
  color: hsl(var(--twc-star-gray) / var(--twc-star-gray-opacity, var(--tw-text-opacity)));
}
.text-success {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-success) / 1);
  color: hsl(var(--twc-success) / var(--twc-success-opacity, var(--tw-text-opacity)));
}
.text-success-1-default {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-success-1-default) / 1);
  color: hsl(var(--twc-success-1-default) / var(--twc-success-1-default-opacity, var(--tw-text-opacity)));
}
.text-text-disabled {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-text-disabled) / 1);
  color: hsl(var(--twc-text-disabled) / var(--twc-text-disabled-opacity, var(--tw-text-opacity)));
}
.text-text-primary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-text-primary) / 1);
  color: hsl(var(--twc-text-primary) / var(--twc-text-primary-opacity, var(--tw-text-opacity)));
}
.text-text-secondary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-text-secondary) / 1);
  color: hsl(var(--twc-text-secondary) / var(--twc-text-secondary-opacity, var(--tw-text-opacity)));
}
.text-textBrand {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-textBrand) / 1);
  color: hsl(var(--twc-textBrand) / var(--twc-textBrand-opacity, var(--tw-text-opacity)));
}
.text-textBuy {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-textBuy) / 1);
  color: hsl(var(--twc-textBuy) / var(--twc-textBuy-opacity, var(--tw-text-opacity)));
}
.text-textDisabled {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-textDisabled) / 1);
  color: hsl(var(--twc-textDisabled) / var(--twc-textDisabled-opacity, var(--tw-text-opacity)));
}
.text-textPrimary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-textPrimary) / 1);
  color: hsl(var(--twc-textPrimary) / var(--twc-textPrimary-opacity, var(--tw-text-opacity)));
}
.text-textPrimaryStatic {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-textPrimaryStatic) / 1);
  color: hsl(var(--twc-textPrimaryStatic) / var(--twc-textPrimaryStatic-opacity, var(--tw-text-opacity)));
}
.text-textSecondary {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-textSecondary) / 1);
  color: hsl(var(--twc-textSecondary) / var(--twc-textSecondary-opacity, var(--tw-text-opacity)));
}
.text-textSell {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-textSell) / 1);
  color: hsl(var(--twc-textSell) / var(--twc-textSell-opacity, var(--tw-text-opacity)));
}
.text-textThird {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-textThird) / 1);
  color: hsl(var(--twc-textThird) / var(--twc-textThird-opacity, var(--tw-text-opacity)));
}
.text-transparent {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-transparent) / 1);
  color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, var(--tw-text-opacity)));
}
.text-utility-1-default {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-utility-1-default) / 1);
  color: hsl(var(--twc-utility-1-default) / var(--twc-utility-1-default-opacity, var(--tw-text-opacity)));
}
.text-utility-1-opacity-1 {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-utility-1-opacity-1) / 1);
  color: hsl(var(--twc-utility-1-opacity-1) / var(--twc-utility-1-opacity-1-opacity, var(--tw-text-opacity)));
}
.text-utility-1-opacity-2 {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-utility-1-opacity-2) / 1);
  color: hsl(var(--twc-utility-1-opacity-2) / var(--twc-utility-1-opacity-2-opacity, var(--tw-text-opacity)));
}
.text-utility-1-opacity-3 {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-utility-1-opacity-3) / 1);
  color: hsl(var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-text-opacity)));
}
.text-warning-1-default {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-warning-1-default) / 1);
  color: hsl(var(--twc-warning-1-default) / var(--twc-warning-1-default-opacity, var(--tw-text-opacity)));
}
.text-white {
  --tw-text-opacity: 1;
  color: rgba(255, 255, 255, 1);
  color: rgba(255, 255, 255, var(--tw-text-opacity));
}
.underline {
  text-decoration-line: underline;
}
.line-through {
  text-decoration-line: line-through;
}
.decoration-strikethrough {
  text-decoration-color: hsl(var(--twc-decoration-strikethrough));
}
.caret-transparent {
  caret-color: hsl(var(--twc-transparent) / 1);
  caret-color: hsl(var(--twc-transparent) / var(--twc-transparent-opacity, 1));
}
.opacity-0 {
  opacity: 0;
}
.opacity-100 {
  opacity: 1;
}
.opacity-40 {
  opacity: 0.4;
}
.opacity-50 {
  opacity: 0.5;
}
.opacity-60 {
  opacity: 0.6;
}
.opacity-70 {
  opacity: 0.7;
}
.shadow {
  --tw-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
  box-shadow: 0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0), 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 rgba(0,0,0,0)), var(--tw-ring-shadow, 0 0 rgba(0,0,0,0)), var(--tw-shadow);
}
.shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow: 0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 rgba(0,0,0,0)), var(--tw-ring-shadow, 0 0 rgba(0,0,0,0)), var(--tw-shadow);
}
.shadow-md {
  --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
  box-shadow: 0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 rgba(0,0,0,0)), var(--tw-ring-shadow, 0 0 rgba(0,0,0,0)), var(--tw-shadow);
}
.shadow-xl {
  --tw-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);
  box-shadow: 0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 rgba(0,0,0,0)), var(--tw-ring-shadow, 0 0 rgba(0,0,0,0)), var(--tw-shadow);
}
.outline-none {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.outline-0 {
  outline-width: 0px;
}
.blur {
  --tw-blur: blur(8px);
  filter: blur(8px) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.blur-md {
  --tw-blur: blur(12px);
  filter: blur(12px) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.filter {
  filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
}
.backdrop-blur-1 {
  --tw-backdrop-blur: blur(40px);
  backdrop-filter: blur(40px) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.backdrop-blur-sm {
  --tw-backdrop-blur: blur(4px);
  backdrop-filter: blur(4px) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
}
.transition {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.duration-100 {
  transition-duration: 100ms;
}
.duration-150 {
  transition-duration: 150ms;
}
.duration-200 {
  transition-duration: 200ms;
}
.duration-300 {
  transition-duration: 300ms;
}
.duration-500 {
  transition-duration: 500ms;
}
.ease-in {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
.ease-in-out {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}
.light,[data-theme="light"] {
  --twc-primary-default: 241.20000000000005 100% 50%;
  --twc-primary-hover: 241 100% 65.5%;
  --twc-primary-pressed: 241.20000000000005 100% 69.6%;
  --twc-primary-opacity-1: 241.20000000000005 100% 50%;
  --twc-primary-opacity-1-opacity: 0.16;
  --twc-primary-opacity-2: 241.20000000000005 100% 50%;
  --twc-primary-opacity-2-opacity: 0.24;
  --twc-primary-opacity-3: 241.20000000000005 100% 50%;
  --twc-primary-opacity-3-opacity: 0.32;
  --twc-on-primary: 0 0% 100%;
  --twc-on-primary-opacity-1: 0 0% 100%;
  --twc-on-primary-opacity-1-opacity: 0.40;
  --twc-background-1: 0 0% 100%;
  --twc-background-2: 240 7.1% 94.5%;
  --twc-utility-1-default: 0 0% 14.5%;
  --twc-utility-1-opacity-1: 0 0% 14.5%;
  --twc-utility-1-opacity-1-opacity: 0.72;
  --twc-utility-1-opacity-2: 0 0% 14.5%;
  --twc-utility-1-opacity-2-opacity: 0.48;
  --twc-utility-1-opacity-3: 0 0% 14.5%;
  --twc-utility-1-opacity-3-opacity: 0.24;
  --twc-utility-1-opacity-4: 0 0% 14.5%;
  --twc-utility-1-opacity-4-opacity: 0.12;
  --twc-utility-1-opacity-5: 0 0% 14.5%;
  --twc-utility-1-opacity-5-opacity: 0.08;
  --twc-utility-1-opacity-6: 0 0% 14.5%;
  --twc-utility-1-opacity-6-opacity: 0.04;
  --twc-success-1-default: 137.3 100% 27.8%;
  --twc-success-1-opacity-1: 137.3 100% 27.8%;
  --twc-success-1-opacity-1-opacity: 0.16;
  --twc-success-1-opacity-2: 137.3 100% 27.8%;
  --twc-success-1-opacity-2-opacity: 0.24;
  --twc-success-1-opacity-3: 137.3 100% 27.8%;
  --twc-success-1-opacity-3-opacity: 0.32;
  --twc-warning-1-default: 41 85.3% 42.7%;
  --twc-warning-1-opacity-1: 41 85.3% 42.7%;
  --twc-warning-1-opacity-1-opacity: 0.16;
  --twc-warning-1-opacity-2: 41 85.3% 42.7%;
  --twc-warning-1-opacity-2-opacity: 0.24;
  --twc-warning-1-opacity-3: 41 85.3% 42.7%;
  --twc-warning-1-opacity-3-opacity: 0.32;
  --twc-error-1-default: 0 81.3% 42%;
  --twc-error-1-hover: 0 63.9% 47.8%;
  --twc-error-1-pressed: 0 58.6% 53.5%;
  --twc-error-1-opacity-1: 0 81.3% 42%;
  --twc-error-1-opacity-1-opacity: 0.16;
  --twc-error-1-opacity-2: 0 81.3% 42%;
  --twc-error-1-opacity-2-opacity: 0.24;
  --twc-error-1-opacity-3: 0 81.3% 42%;
  --twc-error-1-opacity-3-opacity: 0.32;
  --twc-accent-pink: 300.70000000000005 100% 84.1%;
  --twc-accent-neon-green: 82.80000000000001 100% 50%;
  --twc-accent-yellow: 46.69999999999999 100% 56.7%;
  --twc-accent-blue: 194.60000000000002 100% 59%;
  --twc-light-gradient-start: 194.60000000000002 80.4% 46.1%;
  --twc-light-gradient-mid: 300.9 66.8% 61%;
  --twc-light-gradient-end: 41.10000000000002 100% 42.4%;
  --twc-transparent: 0 0% 0%;
  --twc-transparent-opacity: 0.00;
  --twc-overlay-100: 0 0% 0%;
  --twc-overlay-100-opacity: 0.40;
  --twc-overlay-50: 0 0% 0%;
  --twc-overlay-50-opacity: 0.16;
  --twc-tooltip: 0 0% 96.1%;
  --twc-alert-solid: 137.5 41.4% 88.6%;
  --twc-other-Bronze: 23.399999999999977 46.6% 34.5%;
  --twc-other-Silver: 300 2% 49.2%;
  --twc-other-Gold: 40.30000000000001 61.8% 47.3%;
  --twc-decoration-strikethrough: 240 0.5% 62.5%;
  --twc-brand-primary: 241.20000000000005 100% 50%;
  --twc-button-primary-hovered: 241 100% 65.5%;
  --twc-button-primary-pressed: 241.20000000000005 100% 69.6%;
  --twc-brand-background: 241.20000000000005 100% 50%;
  --twc-brand-background-opacity: 0.16;
  --twc-brand-on-primary: 0 0% 100%;
  --twc-background-primary: 0 0% 100%;
  --twc-background-secondary: 240 7.1% 94.5%;
  --twc-success-background: 137.5 88.8% 34.9%;
  --twc-success-background-opacity: 0.16;
  --twc-error-background: 0 81.3% 42%;
  --twc-error-background-opacity: 0.16;
  --twc-warning-background: 42.10000000000002 98.1% 41.6%;
  --twc-warning-background-opacity: 0.16;
  --twc-text-primary: 0 0% 14.5%;
  --twc-text-secondary: 0 0% 14.5%;
  --twc-text-secondary-opacity: 0.72;
  --twc-_app-colour-utility-utility-1---opacity-2: 0 0% 14.5%;
  --twc-_app-colour-utility-utility-1---opacity-2-opacity: 0.48;
  --twc-background-tertiary: 0 0% 0%;
  --twc-background-tertiary-opacity: 0.08;
  --twc-success-main: 137.5 88.8% 34.9%;
  --twc-error-main: 0 81.3% 42%;
  --twc-warning-main: 42.10000000000002 98.1% 41.6%;
  --twc-accent-lavender: 267 100% 56.9%;
  --twc-accent-neon: 82.89999999999998 88.8% 49.2%;
  --twc-accent-sand: 46.80000000000001 88.1% 49.4%;
  --twc-accent-ocean: 194.60000000000002 93.4% 47.5%;
  --twc-_app-colour-utility-utility-1---opacity-4: 0 0% 14.5%;
  --twc-_app-colour-utility-utility-1---opacity-4-opacity: 0.12;
  --twc-_app-colour-utility-utility-1---opacity-5: 0 0% 14.5%;
  --twc-_app-colour-utility-utility-1---opacity-5-opacity: 0.08;
  --twc-other-skeleton: 0 0% 14.5%;
  --twc-other-skeleton-opacity: 0.04;
  --twc-_app-colour-primary-primary---opacity-2: 241.20000000000005 100% 50%;
  --twc-_app-colour-primary-primary---opacity-2-opacity: 0.24;
  --twc-_app-colour-primary-primary---opacity-3: 241.20000000000005 100% 50%;
  --twc-_app-colour-primary-primary---opacity-3-opacity: 0.32;
  --twc-error-border: 0 81.3% 42%;
  --twc-error-border-opacity: 0.24;
  --twc-error-disabled: 0 81.3% 42%;
  --twc-error-disabled-opacity: 0.32;
  --twc-error-hovered: 0 63.9% 47.8%;
  --twc-error-pressed: 0 58.6% 53.5%;
  --twc-success-border: 137.5 88.8% 34.9%;
  --twc-success-border-opacity: 0.24;
  --twc-success-disabled: 137.5 88.8% 34.9%;
  --twc-success-disabled-opacity: 0.32;
  --twc-warning-border: 42.10000000000002 98.1% 41.6%;
  --twc-warning-border-opacity: 0.24;
  --twc-warning-disabed: 42.10000000000002 98.1% 41.6%;
  --twc-warning-disabed-opacity: 0.32;
  --twc-brand-on-primary-disabled: 0 0% 100%;
  --twc-brand-on-primary-disabled-opacity: 0.80;
  --twc-accent-fuchsia: 305.4 100% 50%;
  --twc-accent-lavender-bg: 267 100% 56.9%;
  --twc-accent-lavender-bg-opacity: 0.24;
  --twc-accent-neon-bg: 82.89999999999998 88.8% 49.2%;
  --twc-accent-neon-bg-opacity: 0.24;
  --twc-accent-sand-bg: 46.80000000000001 88.1% 49.4%;
  --twc-accent-sand-bg-opacity: 0.24;
  --twc-accent-ocean-bg: 194.60000000000002 93.4% 47.5%;
  --twc-accent-ocean-bg-opacity: 0.24;
  --twc-accent-fuchsia-bg: 305.4 100% 50%;
  --twc-accent-fuchsia-bg-opacity: 0.24;
  --twc-icon-primary: 0 0% 14.5%;
  --twc-icon-secondary: 0 0% 14.5%;
  --twc-icon-secondary-opacity: 0.72;
  --twc-icon-disabled: 0 0% 14.5%;
  --twc-icon-disabled-opacity: 0.40;
  --twc-button-primary: 241.20000000000005 100% 50%;
  --twc-button-secondary: 240 7.1% 94.5%;
  --twc-button-secondary-hovered: 240 4% 85.3%;
  --twc-button-secondary-disabled: 240 16% 90.2%;
  --twc-button-secondary-disabled-opacity: 0.40;
  --twc-button-primary-disabled: 241.20000000000005 100% 50%;
  --twc-button-primary-disabled-opacity: 0.16;
  --twc-button-secondary-pressed: 240 8.8% 77.6%;
  --twc-line-divider: 0 0% 14.5%;
  --twc-line-divider-opacity: 0.08;
  --twc-line-border: 0 0% 14.5%;
  --twc-line-border-opacity: 0.08;
  --twc-input-border: 0 0% 14.5%;
  --twc-input-border-opacity: 0.18;
  --twc-input-search-bg: 0 0% 14.5%;
  --twc-input-search-bg-opacity: 0.08;
  --twc-text-disabled: 0 0% 14.5%;
  --twc-text-disabled-opacity: 0.40;
  --twc-button-icon-button: 241.20000000000005 100% 50%;
  --twc-button-icon-button-opacity: 0.12;
  --twc-action-hovered: 0 0% 0%;
  --twc-action-hovered-opacity: 0.06;
  --twc-action-pressed: 240 100% 14.3%;
  --twc-action-pressed-opacity: 0.12;
  --twc-action-focused: 241.20000000000005 100% 50%;
  --twc-action-focused-opacity: 0.24;
  --twc-background-flow: 0 0% 92.9%;
  --twc-keyboard-ios-bg: 220 10.6% 83.3%;
  --twc-keyboard-key-light: 0 0% 100%;
  --twc-keyboard-action: 211.29999999999995 100% 50%;
  --twc-keyboard-key-dark: 218.79999999999995 11.1% 70%;
  --twc-keyboard-on-key: 0 0% 19.2%;
  --twc-button-icon-button-disabled: 241.20000000000005 100% 50%;
  --twc-button-icon-button-disabled-opacity: 0.04;
  --twc-background-actionsheet-bg: 0 0% 0%;
  --twc-background-actionsheet-bg-opacity: 0.20;
  --twc-background-actionsheet: 0 0% 100%;
  --twc-background-modal: 0 0% 91.8%;
  --twc-browser-primary-bg: 0 0% 100%;
  --twc-browser-secondary-bg: 0 0% 14.5%;
  --twc-browser-secondary-bg-opacity: 0.08;
  --twc-accent-orange-bg: 37.19999999999999 92% 48.8%;
  --twc-accent-orange-bg-opacity: 0.24;
  --twc-accent-orange: 37.19999999999999 92% 48.8%;
  --twc-other-nologo: 267 100% 56.9%;
  --twc-background-tab: 0 0% 100%;
  --twc-star-gray: 0 0% 40%;
  --twc-primary: 241.20000000000005 100% 50%;
  --twc-primaryHover: 241 100% 65.5%;
  --twc-primaryPressed: 241.20000000000005 100% 69.6%;
  --twc-primaryInverse: 241.20000000000005 100% 50%;
  --twc-primaryInverse-opacity: 0.16;
  --twc-textPrimary: 0 0% 14.5%;
  --twc-textPrimaryStatic: 0 0% 14.5%;
  --twc-textSecondary: 0 0% 14.5%;
  --twc-textSecondary-opacity: 0.72;
  --twc-textThird: 0 0% 14.5%;
  --twc-textThird-opacity: 0.48;
  --twc-textBuy: 137.3 100% 27.8%;
  --twc-textSell: 0 81.3% 42%;
  --twc-textDisabled: 0 0% 14.5%;
  --twc-textDisabled-opacity: 0.24;
  --twc-textBrand: 41 85.3% 42.7%;
  --twc-bg3: 240 7.1% 94.5%;
  --twc-backgroundPrimary: 0 0% 100%;
  --twc-backgroundSecondary: 240 7.1% 94.5%;
  --twc-backgroundTertiary: 0 0% 14.5%;
  --twc-backgroundTertiary-opacity: 0.12;
  --twc-successBg: 137.3 100% 27.8%;
  --twc-successBg-opacity: 0.16;
  --twc-errorBg: 0 81.3% 42%;
  --twc-errorBg-opacity: 0.16;
  --twc-depthBuyBg: 241.20000000000005 100% 50%;
  --twc-depthBuyBg-opacity: 0.16;
  --twc-iconNormal: 0 0% 14.5%;
  --twc-iconNormal-opacity: 0.72;
  --twc-iconSuccess: 137.3 100% 27.8%;
  --twc-iconWarning: 41 85.3% 42.7%;
  --twc-error: 0 81.3% 42%;
  --twc-warning: 41 85.3% 42.7%;
  --twc-warning-opacity: 0.16;
  --twc-info: 241.20000000000005 100% 50%;
  --twc-info-opacity: 0.16;
  --twc-success: 137.5 88.8% 34.9%;
  --twc-line: 0 0% 14.5%;
  --twc-line-opacity: 0.08;
  --twc-startGradient: 241.20000000000005 100% 50%;
  --twc-finishGradient: 0 0% 14.5%;
  --twc-finishGradient-opacity: 0.48;
  --twc-lightGradientStart: 194.60000000000002 80.4% 46.1%;
  --twc-lightGradientMid: 300.9 66.8% 61%;
  --twc-lightGradientEnd: 41.10000000000002 100% 42.4%;
}
.dark,[data-theme="dark"] {
  --twc-primary-default: 143.89999999999998 100% 64.1%;
  --twc-primary-hover: 144 100% 78.4%;
  --twc-primary-pressed: 143.89999999999998 100% 82.7%;
  --twc-primary-opacity-1: 143.89999999999998 100% 64.1%;
  --twc-primary-opacity-1-opacity: 0.16;
  --twc-primary-opacity-2: 143.89999999999998 100% 64.1%;
  --twc-primary-opacity-2-opacity: 0.24;
  --twc-primary-opacity-3: 143.89999999999998 100% 64.1%;
  --twc-primary-opacity-3-opacity: 0.32;
  --twc-on-primary: 240 1.8% 10.8%;
  --twc-on-primary-opacity-1: 240 1.8% 10.8%;
  --twc-on-primary-opacity-1-opacity: 0.40;
  --twc-background-1: 240 1.8% 10.8%;
  --twc-background-2: 240 2.7% 14.5%;
  --twc-utility-1-default: 216 13.5% 92.7%;
  --twc-utility-1-opacity-1: 216 13.5% 92.7%;
  --twc-utility-1-opacity-1-opacity: 0.72;
  --twc-utility-1-opacity-2: 216 13.5% 92.7%;
  --twc-utility-1-opacity-2-opacity: 0.48;
  --twc-utility-1-opacity-3: 216 13.5% 92.7%;
  --twc-utility-1-opacity-3-opacity: 0.24;
  --twc-utility-1-opacity-4: 216 13.5% 92.7%;
  --twc-utility-1-opacity-4-opacity: 0.12;
  --twc-utility-1-opacity-5: 216 13.5% 92.7%;
  --twc-utility-1-opacity-5-opacity: 0.08;
  --twc-utility-1-opacity-6: 216 13.5% 92.7%;
  --twc-utility-1-opacity-6-opacity: 0.04;
  --twc-success-1-default: 154.89999999999998 61.1% 41.4%;
  --twc-success-1-opacity-1: 154.89999999999998 61.1% 41.4%;
  --twc-success-1-opacity-1-opacity: 0.16;
  --twc-success-1-opacity-2: 154.89999999999998 61.1% 41.4%;
  --twc-success-1-opacity-2-opacity: 0.24;
  --twc-success-1-opacity-3: 154.89999999999998 61.1% 41.4%;
  --twc-success-1-opacity-3-opacity: 0.32;
  --twc-warning-1-default: 42 84.9% 53.1%;
  --twc-warning-1-opacity-1: 42 84.9% 53.1%;
  --twc-warning-1-opacity-1-opacity: 0.16;
  --twc-warning-1-opacity-2: 42 84.9% 53.1%;
  --twc-warning-1-opacity-2-opacity: 0.24;
  --twc-warning-1-opacity-3: 42 84.9% 53.1%;
  --twc-warning-1-opacity-3-opacity: 0.32;
  --twc-error-1-default: 0 100% 68%;
  --twc-error-1-hover: 0 100% 71.2%;
  --twc-error-1-pressed: 0 100% 74.5%;
  --twc-error-1-opacity-1: 0 100% 68%;
  --twc-error-1-opacity-1-opacity: 0.16;
  --twc-error-1-opacity-2: 0 100% 68%;
  --twc-error-1-opacity-2-opacity: 0.24;
  --twc-error-1-opacity-3: 0 100% 68%;
  --twc-error-1-opacity-3-opacity: 0.32;
  --twc-accent-pink: 300.70000000000005 100% 84.1%;
  --twc-accent-neon-green: 82.80000000000001 100% 50%;
  --twc-accent-yellow: 46.69999999999999 100% 56.7%;
  --twc-accent-blue: 194.60000000000002 100% 59%;
  --twc-light-gradient-start: 194.60000000000002 100% 59%;
  --twc-light-gradient-mid: 300.70000000000005 100% 84.1%;
  --twc-light-gradient-end: 46.69999999999999 100% 56.7%;
  --twc-transparent: 0 0% 0%;
  --twc-transparent-opacity: 0.00;
  --twc-overlay-100: 0 0% 37.6%;
  --twc-overlay-100-opacity: 0.40;
  --twc-overlay-50: 0 0% 37.6%;
  --twc-overlay-50-opacity: 0.16;
  --twc-tooltip: 240 1% 20.6%;
  --twc-alert-solid: 157.10000000000002 26.6% 15.5%;
  --twc-other-Bronze: 39.80000000000001 32% 49%;
  --twc-other-Silver: 22.5 10.8% 85.5%;
  --twc-other-Gold: 45.89999999999998 96.4% 56.7%;
  --twc-decoration-strikethrough: 225 1.7% 47.5%;
  --twc-brand-primary: 143.89999999999998 100% 64.1%;
  --twc-button-primary-hovered: 144 100% 78.4%;
  --twc-button-primary-pressed: 143.89999999999998 100% 82.7%;
  --twc-brand-background: 143.89999999999998 100% 64.1%;
  --twc-brand-background-opacity: 0.16;
  --twc-brand-on-primary: 240 1.8% 10.8%;
  --twc-background-primary: 140 7.7% 7.6%;
  --twc-background-secondary: 240 3.4% 17.5%;
  --twc-success-background: 154.79999999999995 68.9% 44.1%;
  --twc-success-background-opacity: 0.16;
  --twc-error-background: 0 100% 68%;
  --twc-error-background-opacity: 0.16;
  --twc-warning-background: 42 84.9% 53.1%;
  --twc-warning-background-opacity: 0.16;
  --twc-text-primary: 216 13.5% 92.7%;
  --twc-text-secondary: 216 13.5% 92.7%;
  --twc-text-secondary-opacity: 0.60;
  --twc-_app-colour-utility-utility-1---opacity-2: 216 13.5% 92.7%;
  --twc-_app-colour-utility-utility-1---opacity-2-opacity: 0.48;
  --twc-background-tertiary: 0 0% 100%;
  --twc-background-tertiary-opacity: 0.12;
  --twc-success-main: 154.79999999999995 68.9% 44.1%;
  --twc-error-main: 0 100% 68%;
  --twc-warning-main: 42 84.9% 53.1%;
  --twc-accent-lavender: 266.9 100% 75.1%;
  --twc-accent-neon: 82.80000000000001 100% 50%;
  --twc-accent-sand: 46.69999999999999 100% 56.7%;
  --twc-accent-ocean: 194.60000000000002 100% 59%;
  --twc-_app-colour-utility-utility-1---opacity-4: 216 13.5% 92.7%;
  --twc-_app-colour-utility-utility-1---opacity-4-opacity: 0.12;
  --twc-_app-colour-utility-utility-1---opacity-5: 216 13.5% 92.7%;
  --twc-_app-colour-utility-utility-1---opacity-5-opacity: 0.08;
  --twc-other-skeleton: 216 13.5% 92.7%;
  --twc-other-skeleton-opacity: 0.04;
  --twc-_app-colour-primary-primary---opacity-2: 143.89999999999998 100% 64.1%;
  --twc-_app-colour-primary-primary---opacity-2-opacity: 0.24;
  --twc-_app-colour-primary-primary---opacity-3: 143.89999999999998 100% 64.1%;
  --twc-_app-colour-primary-primary---opacity-3-opacity: 0.32;
  --twc-error-border: 0 100% 68%;
  --twc-error-border-opacity: 0.24;
  --twc-error-disabled: 0 100% 68%;
  --twc-error-disabled-opacity: 0.32;
  --twc-error-hovered: 0 100% 71.2%;
  --twc-error-pressed: 0 100% 74.5%;
  --twc-success-border: 154.79999999999995 68.9% 44.1%;
  --twc-success-border-opacity: 0.24;
  --twc-success-disabled: 154.79999999999995 68.9% 44.1%;
  --twc-success-disabled-opacity: 0.32;
  --twc-warning-border: 42 84.9% 53.1%;
  --twc-warning-border-opacity: 0.24;
  --twc-warning-disabled: 42 84.9% 53.1%;
  --twc-warning-disabled-opacity: 0.32;
  --twc-brand-on-primary-disabled: 240 1.8% 10.8%;
  --twc-brand-on-primary-disabled-opacity: 0.80;
  --twc-accent-fuchsia: 305.4 100% 50%;
  --twc-accent-lavender-bg: 266.9 100% 75.1%;
  --twc-accent-lavender-bg-opacity: 0.32;
  --twc-accent-neon-bg: 82.80000000000001 100% 50%;
  --twc-accent-neon-bg-opacity: 0.32;
  --twc-accent-sand-bg: 46.69999999999999 100% 56.7%;
  --twc-accent-sand-bg-opacity: 0.32;
  --twc-accent-ocean-bg: 194.60000000000002 100% 59%;
  --twc-accent-ocean-bg-opacity: 0.32;
  --twc-accent-fuchsia-bg: 305.4 100% 50%;
  --twc-accent-fuchsia-bg-opacity: 0.32;
  --twc-icon-primary: 216 13.5% 92.7%;
  --twc-icon-secondary: 216 13.5% 92.7%;
  --twc-icon-secondary-opacity: 0.72;
  --twc-icon-disabled: 216 13.5% 92.7%;
  --twc-icon-disabled-opacity: 0.40;
  --twc-button-primary: 143.89999999999998 100% 64.1%;
  --twc-button-secondary: 240 3.4% 17.5%;
  --twc-button-secondary-hovered: 140 2.1% 27.6%;
  --twc-button-secondary-disabled: 140 3.4% 17.5%;
  --twc-button-secondary-disabled-opacity: 0.40;
  --twc-button-primary-disabled: 143.89999999999998 100% 64.1%;
  --twc-button-primary-disabled-opacity: 0.32;
  --twc-button-secondary-pressed: 150 2.2% 36.5%;
  --twc-line-divider: 216 13.5% 92.7%;
  --twc-line-divider-opacity: 0.12;
  --twc-line-border: 216 13.5% 92.7%;
  --twc-line-border-opacity: 0.12;
  --twc-input-border: 216 13.5% 92.7%;
  --twc-input-border-opacity: 0.24;
  --twc-input-search-bg: 216 13.5% 92.7%;
  --twc-input-search-bg-opacity: 0.12;
  --twc-text-disabled: 216 13.5% 92.7%;
  --twc-text-disabled-opacity: 0.40;
  --twc-button-icon-button: 143.89999999999998 100% 64.1%;
  --twc-button-icon-button-opacity: 0.16;
  --twc-action-hovered: 0 0% 100%;
  --twc-action-hovered-opacity: 0.08;
  --twc-action-pressed: 0 0% 100%;
  --twc-action-pressed-opacity: 0.12;
  --twc-action-focused: 143.89999999999998 100% 64.1%;
  --twc-action-focused-opacity: 0.24;
  --twc-background-flow: 0 0% 28.2%;
  --twc-keyboard-ios-bg: 0 0% 19.2%;
  --twc-keyboard-key-light: 0 0% 43.5%;
  --twc-keyboard-action: 211.29999999999995 100% 50%;
  --twc-keyboard-key-dark: 0 0% 29.4%;
  --twc-keyboard-on-key: 0 0% 100%;
  --twc-button-icon-button-disabled: 143.89999999999998 100% 64.1%;
  --twc-button-icon-button-disabled-opacity: 0.08;
  --twc-background-actionsheet-bg: 0 0% 0%;
  --twc-background-actionsheet-bg-opacity: 0.40;
  --twc-background-actionsheet: 0 0% 12.2%;
  --twc-background-modal: 0 0% 14.5%;
  --twc-browser-primary-bg: 0 0% 23.5%;
  --twc-browser-secondary-bg: 0 0% 15.7%;
  --twc-accent-orange-bg: 37.10000000000002 100% 59.4%;
  --twc-accent-orange-bg-opacity: 0.32;
  --twc-accent-orange: 37.10000000000002 100% 59.4%;
  --twc-other-nologo: 266.9 100% 75.1%;
  --twc-background-tab: 0 0% 100%;
  --twc-background-tab-opacity: 0.16;
  --twc-star-gray: 0 0% 40%;
  --twc-primary: 143.89999999999998 100% 64.1%;
  --twc-primaryHover: 144 100% 78.4%;
  --twc-primaryPressed: 143.89999999999998 100% 82.7%;
  --twc-primaryInverse: 143.89999999999998 100% 64.1%;
  --twc-primaryInverse-opacity: 0.16;
  --twc-textPrimary: 216 13.5% 92.7%;
  --twc-textPrimaryStatic: 0 0% 14.5%;
  --twc-textSecondary: 216 13.5% 92.7%;
  --twc-textSecondary-opacity: 0.72;
  --twc-textThird: 216 13.5% 92.7%;
  --twc-textThird-opacity: 0.48;
  --twc-textBuy: 154.89999999999998 61.1% 41.4%;
  --twc-textSell: 0 100% 68%;
  --twc-textDisabled: 216 13.5% 92.7%;
  --twc-textDisabled-opacity: 0.24;
  --twc-textBrand: 42 84.9% 53.1%;
  --twc-bg3: 240 2.7% 14.5%;
  --twc-bg4: 216 13.5% 92.7%;
  --twc-bg4-opacity: 0.48;
  --twc-backgroundPrimary: 240 1.8% 10.8%;
  --twc-backgroundSecondary: 240 2.7% 14.5%;
  --twc-backgroundTertiary: 216 13.5% 92.7%;
  --twc-backgroundTertiary-opacity: 0.12;
  --twc-successBg: 154.89999999999998 61.1% 41.4%;
  --twc-successBg-opacity: 0.16;
  --twc-errorBg: 0 100% 68%;
  --twc-errorBg-opacity: 0.16;
  --twc-depthBuyBg: 143.89999999999998 100% 64.1%;
  --twc-depthBuyBg-opacity: 0.16;
  --twc-iconNormal: 216 13.5% 92.7%;
  --twc-iconNormal-opacity: 0.72;
  --twc-iconSuccess: 154.89999999999998 61.1% 41.4%;
  --twc-iconWarning: 42 84.9% 53.1%;
  --twc-success: 154.79999999999995 68.9% 44.1%;
  --twc-error: 0 100% 68%;
  --twc-warning: 42 84.9% 53.1%;
  --twc-warning-opacity: 0.16;
  --twc-info: 143.89999999999998 100% 64.1%;
  --twc-info-opacity: 0.16;
  --twc-line: 216 13.5% 92.7%;
  --twc-line-opacity: 0.08;
  --twc-startGradient: 143.89999999999998 100% 64.1%;
  --twc-finishGradient: 216 13.5% 92.7%;
  --twc-finishGradient-opacity: 0.48;
  --twc-lightGradientStart: 194.60000000000002 100% 59%;
  --twc-lightGradientMid: 300.70000000000005 100% 84.1%;
  --twc-lightGradientEnd: 46.69999999999999 100% 56.7%;
}
.scrollbar::-webkit-scrollbar-track {
  background-color: var(--scrollbar-track);
  border-radius: var(--scrollbar-track-radius);
}
.scrollbar::-webkit-scrollbar-track:hover {
  background-color: var(--scrollbar-track-hover, var(--scrollbar-track));
}
.scrollbar::-webkit-scrollbar-track:active {
  background-color: var(--scrollbar-track-active, var(--scrollbar-track-hover, var(--scrollbar-track)));
}
.scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: var(--scrollbar-thumb-radius);
}
.scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--scrollbar-thumb-hover, var(--scrollbar-thumb));
}
.scrollbar::-webkit-scrollbar-thumb:active {
  background-color: var(--scrollbar-thumb-active, var(--scrollbar-thumb-hover, var(--scrollbar-thumb)));
}
.scrollbar::-webkit-scrollbar-corner {
  background-color: var(--scrollbar-corner);
  border-radius: var(--scrollbar-corner-radius);
}
.scrollbar::-webkit-scrollbar-corner:hover {
  background-color: var(--scrollbar-corner-hover, var(--scrollbar-corner));
}
.scrollbar::-webkit-scrollbar-corner:active {
  background-color: var(--scrollbar-corner-active, var(--scrollbar-corner-hover, var(--scrollbar-corner)));
}
.scrollbar {
  scrollbar-width: auto;
  scrollbar-color: initial initial;
  scrollbar-color: var(--scrollbar-thumb, initial) var(--scrollbar-track, initial);
}
.scrollbar::-webkit-scrollbar {
  display: block;
  width: 16px;
  width: var(--scrollbar-width, 16px);
  height: 16px;
  height: var(--scrollbar-height, 16px);
}
.word-break {
  word-break: break-word;
}
.text-gradient-light {
  background: linear-gradient(110deg, hsl(var(--twc-lightGradientStart)) 0%, hsl(var(--twc-lightGradientMid)) 48%, hsl(var(--twc-lightGradientEnd)) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.\\*\\:-mb-\\[18px\\] > * {
  margin-bottom: -18px;
}
.\\*\\:whitespace-nowrap > * {
  white-space: nowrap;
}
.placeholder\\:text-text-primary::-moz-placeholder {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-text-primary) / 1);
  color: hsl(var(--twc-text-primary) / var(--twc-text-primary-opacity, var(--tw-text-opacity)));
}
.placeholder\\:text-text-primary::placeholder {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-text-primary) / 1);
  color: hsl(var(--twc-text-primary) / var(--twc-text-primary-opacity, var(--tw-text-opacity)));
}
.last-of-type\\:\\!mb-5:last-of-type {
  margin-bottom: 1.25rem !important;
}
.empty\\:hidden:empty {
  display: none;
}
.data-\\[hidden\\=true\\]\\:hidden[data-hidden=true] {
  display: none;
}
.data-\\[selected\\=true\\]\\:border-primary-default[data-selected=true] {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary-default) / 1);
  border-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-border-opacity)));
}
.data-\\[selected\\=\\'true\\'\\]\\:bg-bg3[data-selected='true'] {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-bg3) / 1);
  background-color: hsl(var(--twc-bg3) / var(--twc-bg3-opacity, var(--tw-bg-opacity)));
}
.data-\\[selected\\=\\'true\\'\\]\\:bg-primary[data-selected='true'] {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary) / 1);
  background-color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-bg-opacity)));
}
.hover\\:-translate-x-0:hover {
  --tw-translate-x: -0px;
  transform: translate(-0px, var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.hover\\:scale-\\[1\\.01\\]:hover {
  --tw-scale-x: 1.01;
  --tw-scale-y: 1.01;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(1.01) scaleY(1.01);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.hover\\:scale-\\[1\\.02\\]:hover {
  --tw-scale-x: 1.02;
  --tw-scale-y: 1.02;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(1.02) scaleY(1.02);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.hover\\:cursor-pointer:hover {
  cursor: pointer;
}
.hover\\:bg-action-hovered:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-action-hovered) / 1);
  background-color: hsl(var(--twc-action-hovered) / var(--twc-action-hovered-opacity, var(--tw-bg-opacity)));
}
.hover\\:bg-bg3:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-bg3) / 1);
  background-color: hsl(var(--twc-bg3) / var(--twc-bg3-opacity, var(--tw-bg-opacity)));
}
.hover\\:bg-button-primary-hovered:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-button-primary-hovered) / 1);
  background-color: hsl(var(--twc-button-primary-hovered) / var(--twc-button-primary-hovered-opacity, var(--tw-bg-opacity)));
}
.hover\\:bg-button-secondary-hovered:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-button-secondary-hovered) / 1);
  background-color: hsl(var(--twc-button-secondary-hovered) / var(--twc-button-secondary-hovered-opacity, var(--tw-bg-opacity)));
}
.hover\\:bg-error-1-hover:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-error-1-hover) / 1);
  background-color: hsl(var(--twc-error-1-hover) / var(--twc-error-1-hover-opacity, var(--tw-bg-opacity)));
}
.hover\\:bg-error-1-opacity-2:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-error-1-opacity-2) / 1);
  background-color: hsl(var(--twc-error-1-opacity-2) / var(--twc-error-1-opacity-2-opacity, var(--tw-bg-opacity)));
}
.hover\\:bg-line:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-line) / 1);
  background-color: hsl(var(--twc-line) / var(--twc-line-opacity, var(--tw-bg-opacity)));
}
.hover\\:bg-primary-hover:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary-hover) / 1);
  background-color: hsl(var(--twc-primary-hover) / var(--twc-primary-hover-opacity, var(--tw-bg-opacity)));
}
.hover\\:bg-primary-opacity-2:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary-opacity-2) / 1);
  background-color: hsl(var(--twc-primary-opacity-2) / var(--twc-primary-opacity-2-opacity, var(--tw-bg-opacity)));
}
.hover\\:bg-utility-1-opacity-5:hover {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-5) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-5) / var(--twc-utility-1-opacity-5-opacity, var(--tw-bg-opacity)));
}
.hover\\:text-blue-600:hover {
  --tw-text-opacity: 1;
  color: rgba(37, 99, 235, 1);
  color: rgba(37, 99, 235, var(--tw-text-opacity));
}
.hover\\:text-primary:hover {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-primary) / 1);
  color: hsl(var(--twc-primary) / var(--twc-primary-opacity, var(--tw-text-opacity)));
}
.hover\\:text-textPrimary:hover {
  --tw-text-opacity: 1;
  color: hsl(var(--twc-textPrimary) / 1);
  color: hsl(var(--twc-textPrimary) / var(--twc-textPrimary-opacity, var(--tw-text-opacity)));
}
.hover\\:opacity-70:hover {
  opacity: 0.7;
}
.hover\\:opacity-80:hover {
  opacity: 0.8;
}
.focus\\:border-error:focus {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-error) / 1);
  border-color: hsl(var(--twc-error) / var(--twc-error-opacity, var(--tw-border-opacity)));
}
.focus\\:border-primary-default:focus {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-primary-default) / 1);
  border-color: hsl(var(--twc-primary-default) / var(--twc-primary-default-opacity, var(--tw-border-opacity)));
}
.focus\\:border-success:focus {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-success) / 1);
  border-color: hsl(var(--twc-success) / var(--twc-success-opacity, var(--tw-border-opacity)));
}
.focus\\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.active\\:scale-\\[0\\.9\\]:active {
  --tw-scale-x: 0.9;
  --tw-scale-y: 0.9;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(0.9) scaleY(0.9);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.active\\:scale-\\[1\\.03\\]:active {
  --tw-scale-x: 1.03;
  --tw-scale-y: 1.03;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(1.03) scaleY(1.03);
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.active\\:bg-button-primary-pressed:active {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-button-primary-pressed) / 1);
  background-color: hsl(var(--twc-button-primary-pressed) / var(--twc-button-primary-pressed-opacity, var(--tw-bg-opacity)));
}
.active\\:bg-button-secondary-pressed:active {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-button-secondary-pressed) / 1);
  background-color: hsl(var(--twc-button-secondary-pressed) / var(--twc-button-secondary-pressed-opacity, var(--tw-bg-opacity)));
}
.active\\:bg-error-1-opacity-3:active {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-error-1-opacity-3) / 1);
  background-color: hsl(var(--twc-error-1-opacity-3) / var(--twc-error-1-opacity-3-opacity, var(--tw-bg-opacity)));
}
.active\\:bg-error-1-pressed:active {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-error-1-pressed) / 1);
  background-color: hsl(var(--twc-error-1-pressed) / var(--twc-error-1-pressed-opacity, var(--tw-bg-opacity)));
}
.active\\:bg-primary-opacity-3:active {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary-opacity-3) / 1);
  background-color: hsl(var(--twc-primary-opacity-3) / var(--twc-primary-opacity-3-opacity, var(--tw-bg-opacity)));
}
.active\\:bg-primary-pressed:active {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary-pressed) / 1);
  background-color: hsl(var(--twc-primary-pressed) / var(--twc-primary-pressed-opacity, var(--tw-bg-opacity)));
}
.active\\:bg-utility-1-opacity-4:active {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-utility-1-opacity-4) / 1);
  background-color: hsl(var(--twc-utility-1-opacity-4) / var(--twc-utility-1-opacity-4-opacity, var(--tw-bg-opacity)));
}
.disabled\\:bg-button-primary-pressed:disabled {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-button-primary-pressed) / 1);
  background-color: hsl(var(--twc-button-primary-pressed) / var(--twc-button-primary-pressed-opacity, var(--tw-bg-opacity)));
}
.disabled\\:bg-button-secondary-disabled:disabled {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-button-secondary-disabled) / 1);
  background-color: hsl(var(--twc-button-secondary-disabled) / var(--twc-button-secondary-disabled-opacity, var(--tw-bg-opacity)));
}
.disabled\\:bg-error-1-opacity-1:disabled {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-error-1-opacity-1) / 1);
  background-color: hsl(var(--twc-error-1-opacity-1) / var(--twc-error-1-opacity-1-opacity, var(--tw-bg-opacity)));
}
.disabled\\:bg-primary-opacity-1:disabled {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary-opacity-1) / 1);
  background-color: hsl(var(--twc-primary-opacity-1) / var(--twc-primary-opacity-1-opacity, var(--tw-bg-opacity)));
}
.disabled\\:bg-primary-pressed:disabled {
  --tw-bg-opacity: 1;
  background-color: hsl(var(--twc-primary-pressed) / 1);
  background-color: hsl(var(--twc-primary-pressed) / var(--twc-primary-pressed-opacity, var(--tw-bg-opacity)));
}
.disabled\\:opacity-50:disabled {
  opacity: 0.5;
}
@media (min-width: 768px) {

  .md\\:h-\\[7rem\\] {
    height: 7rem;
  }

  .md\\:w-\\[7rem\\] {
    width: 7rem;
  }

  .md\\:max-w-\\[438px\\] {
    max-width: 438px;
  }

  .md\\:max-w-\\[962px\\] {
    max-width: 962px;
  }
}
@media (max-width: 378px) {

  .xs-max\\:px-1 {
    padding-left: 4px;
    padding-right: 4px;
  }
}
@media (max-width: 500px) {

  .sm-max\\:\\!w-full {
    width: 100% !important;
  }
}
@media (max-width: 925px) {

  .lg-max\\:mb-6 {
    margin-bottom: 24px;
  }

  .lg-max\\:h-\\[180px\\] {
    height: 180px;
  }

  .lg-max\\:h-\\[709px\\] {
    height: 709px;
  }

  .lg-max\\:w-\\[488px\\] {
    width: 488px;
  }

  .lg-max\\:w-full {
    width: 100%;
  }

  .lg-max\\:w-min {
    width: -moz-min-content;
    width: min-content;
  }

  .lg-max\\:flex-col {
    flex-direction: column;
  }
}
@media (min-width: 926px) {

  .lg-min\\:h-\\[312px\\] {
    height: 312px;
  }

  .lg-min\\:h-\\[320px\\] {
    height: 320px;
  }

  .lg-min\\:h-\\[497px\\] {
    height: 497px;
  }

  .lg-min\\:h-\\[540px\\] {
    height: 540px;
  }

  .lg-min\\:w-\\[342px\\] {
    width: 342px;
  }

  .lg-min\\:w-\\[925px\\] {
    width: 925px;
  }

  .lg-min\\:max-w-\\[925px\\] {
    max-width: 925px;
  }
}
@media (prefers-color-scheme: dark) {

  .dark\\:text-black {
    --tw-text-opacity: 1;
    color: rgba(0, 0, 0, 1);
    color: rgba(0, 0, 0, var(--tw-text-opacity));
  }

  .dark\\:invert {
    --tw-invert: invert(100%);
    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) invert(100%) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
  }
}
.\\[\\&\\:\\:-moz-range-thumb\\]\\:h-6::-moz-range-thumb {
  height: 24px;
}
.\\[\\&\\:\\:-moz-range-thumb\\]\\:w-6::-moz-range-thumb {
  width: 24px;
}
.\\[\\&\\:\\:-moz-range-thumb\\]\\:cursor-pointer::-moz-range-thumb {
  cursor: pointer;
}
.\\[\\&\\:\\:-moz-range-thumb\\]\\:rounded-full::-moz-range-thumb {
  border-radius: 9999px;
}
.\\[\\&\\:\\:-moz-range-thumb\\]\\:border-2::-moz-range-thumb {
  border-width: 2px;
}
.\\[\\&\\:\\:-moz-range-thumb\\]\\:border-none::-moz-range-thumb {
  border-style: none;
}
.\\[\\&\\:\\:-moz-range-thumb\\]\\:border-background-primary::-moz-range-thumb {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-background-primary) / 1);
  border-color: hsl(var(--twc-background-primary) / var(--twc-background-primary-opacity, var(--tw-border-opacity)));
}
.\\[\\&\\:\\:-moz-range-thumb\\]\\:bg-white::-moz-range-thumb {
  --tw-bg-opacity: 1;
  background-color: rgba(255, 255, 255, 1);
  background-color: rgba(255, 255, 255, var(--tw-bg-opacity));
}
.\\[\\&\\:\\:-webkit-slider-thumb\\]\\:h-6::-webkit-slider-thumb {
  height: 24px;
}
.\\[\\&\\:\\:-webkit-slider-thumb\\]\\:w-6::-webkit-slider-thumb {
  width: 24px;
}
.\\[\\&\\:\\:-webkit-slider-thumb\\]\\:cursor-pointer::-webkit-slider-thumb {
  cursor: pointer;
}
.\\[\\&\\:\\:-webkit-slider-thumb\\]\\:appearance-none::-webkit-slider-thumb {
  -webkit-appearance: none;
          appearance: none;
}
.\\[\\&\\:\\:-webkit-slider-thumb\\]\\:rounded-full::-webkit-slider-thumb {
  border-radius: 9999px;
}
.\\[\\&\\:\\:-webkit-slider-thumb\\]\\:border-2::-webkit-slider-thumb {
  border-width: 2px;
}
.\\[\\&\\:\\:-webkit-slider-thumb\\]\\:border-background-primary::-webkit-slider-thumb {
  --tw-border-opacity: 1;
  border-color: hsl(var(--twc-background-primary) / 1);
  border-color: hsl(var(--twc-background-primary) / var(--twc-background-primary-opacity, var(--tw-border-opacity)));
}
.\\[\\&\\:\\:-webkit-slider-thumb\\]\\:bg-white::-webkit-slider-thumb {
  --tw-bg-opacity: 1;
  background-color: rgba(255, 255, 255, 1);
  background-color: rgba(255, 255, 255, var(--tw-bg-opacity));
}
.\\[\\&\\:\\:-webkit-slider-thumb\\]\\:shadow-md::-webkit-slider-thumb {
  --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
  box-shadow: 0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 rgba(0,0,0,0)), var(--tw-ring-shadow, 0 0 rgba(0,0,0,0)), var(--tw-shadow);
}
.\\[\\&\\>\\*\\:last-child\\]\\:ml-auto>*:last-child {
  margin-left: auto;
}
.\\[\\&\\>\\*\\:not\\(\\:first-child\\)\\]\\:ml-4>*:not(:first-child) {
  margin-left: 16px;
}
.\\[\\&_\\*\\]\\:invisible * {
  visibility: hidden;
}
`,"",{version:3,sources:["webpack://./node_modules/tailwindcss/base.css","webpack://./node_modules/react-tooltip/dist/react-tooltip.css","webpack://./app/src/popup/uikit/styles/typography.css","webpack://./node_modules/tailwindcss/components.css","webpack://./app/src/popup/uikit/styles/components/buttons.css","webpack://./app/src/popup/uikit/styles/components/checkboxes.css","webpack://./app/src/popup/uikit/styles/components/text.css","webpack://./app/src/popup/uikit/styles/components/alerts.css","webpack://./app/src/popup/uikit/styles/components/inputs.css","webpack://./app/src/popup/uikit/styles/components/radios.css","webpack://./app/src/popup/uikit/styles/components/skeletons.css","webpack://./app/src/popup/uikit/styles/components/switches.css","webpack://./app/src/popup/uikit/styles/components/misc.css","webpack://./node_modules/tailwindcss/utilities.css","webpack://./app/src/popup/uikit/styles/index.css"],names:[],mappings:"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EAAnB,WAAmB;EAAnB;AAAmB;AAAnB;EAAA,QAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,kBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,kBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,eAAmB;EAAnB;AAAmB;AAAnB;EAAA,eAAmB;EAAnB;AAAmB;AAAnB;EAAA,eAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,mBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,eAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,mBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA,eAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,wBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,uBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,uBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,2BAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,2BAAmB;EAAnB;AAAmB;AAAnB;EAAA,2BAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,sBAAmB;EAAnB,8KAAmB;EAAnB;AAAmB;AAAnB;EAAA,sBAAmB;EAAnB,8KAAmB;EAAnB;AAAmB;A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mB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB;AAAmB;AAAnB;EAAA,gBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,eAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,+BAAmB;EAAnB,gDAAmB;EAAnB;AAAmB;AAAnB;EAAA,+BAAmB;EAAnB,6CAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,sCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,0CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,4CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,sCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,wCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,uCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,4CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,6CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,4BAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,2CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,wCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,gCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,0CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,qCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,wCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,uCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,yCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,qCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,sCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,qCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,uCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,qCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,uCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,kCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,0CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,2BAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,oCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,kCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,4CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,wCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,uCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,yCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,oCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,kCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,uCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,sCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,4CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,wCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,mCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,oCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,sCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,4CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,8CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,8CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,8CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,4CAAmB;EAAnB;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,6BAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,4CAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,8EAAmB;EAAnB,8FAAmB;EAAnB,mHAAmB;EAAnB;AAAmB;AAAnB;EAAA,mFAAmB;EAAnB,mGAAmB;EAAnB,wHAAmB;EAAnB;AAAmB;AAAnB;EAAA,iFAAmB;EAAnB,iGAAmB;EAAnB,sHAAmB;EAAnB;AAAmB;AAAnB;EAAA,oFAAmB;EAAnB,oGAAmB;EAAnB,yHAAmB;EAAnB;AAAmB;AAAnB;EAAA,8BAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB,4KAAmB;EAAnB;AAAmB;AAAnB;EAAA,qBAAmB;EAAnB,6KAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,8BAAmB;EAAnB,0PAAmB;EAAnB;AAAmB;AAAnB;EAAA,6BAAmB;EAAnB,yPAAmB;EAAnB;AAAmB;AAAnB;EAAA,wJAAmB;EAAnB,wDAAmB;EAAnB;AAAmB;AAAnB;EAAA,wBAAmB;EAAnB,wDAAmB;EAAnB;AAAmB;AAAnB;EAAA,+FAAmB;EAAnB,wDAAmB;EAAnB;AAAmB;AAAnB;EAAA,4BAAmB;EAAnB,wDAAmB;EAAnB;AAAmB;AAAnB;EAAA,8BAAmB;EAAnB,wDAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,kDAAmB;EAAnB,mCAAmB;EAAnB,oDAAmB;EAAnB,oDAAmB;EAAnB,qCAAmB;EAAnB,oDAAmB;EAAnB,qCAAmB;EAAnB,oDAAmB;EAAnB,qCAAmB;EAAnB,2BAAmB;EAAnB,qCAAmB;EAAnB,wCAAmB;EAAnB,6BAAmB;EAAnB,kCAAmB;EAAnB,mCAAmB;EAAnB,qCAAmB;EAAnB,uCAAmB;EAAnB,qCAAmB;EAAnB,uCAAmB;EAAnB,qCAAmB;EAAnB,uCAAmB;EAAnB,qCAAmB;EAAnB,uCAAmB;EAAnB,qCAAmB;EAAnB,uCAAmB;EAAnB,qCAAmB;EAAnB,uCAAmB;EAAnB,yCAAmB;EAAnB,2CAAmB;EAAnB,uCAAmB;EAAnB,2CAAmB;EAAnB,uCAAmB;EAAnB,2CAAmB;EAAnB,uCAAmB;EAAnB,uCAAmB;EAAnB,yCAAmB;EAAnB,uCAAmB;EAAnB,yCAAmB;EAAnB,uCAAmB;EAAnB,yCAAmB;EAAnB,uCAAmB;EAAnB,kCAAmB;EAAnB,kCAAmB;EAAnB,oCAAmB;EAAnB,oCAAmB;EAAnB,qCAAmB;EAAnB,oCAAmB;EAAnB,qCAAmB;EAAnB,oCAAmB;EAAnB,qCAAmB;EAAnB,gDAAmB;EAAnB,mDAAmB;EAAnB,iDAAmB;EAAnB,8CAAmB;EAAnB,0DAAmB;EAAnB,yCAAmB;EAAnB,sDAAmB;EAAnB,0BAAmB;EAAnB,+BAAmB;EAAnB,0BAAmB;EAAnB,+BAAmB;EAAnB,yBAAmB;EAAnB,8BAAmB;EAAnB,yBAAmB;EAAnB,oCAAmB;EAAnB,kDAAmB;EAAnB,gCAAmB;EAAnB,+CAAmB;EAAnB,8CAAmB;EAAnB,gDAAmB;EAAnB,4CAAmB;EAAnB,2DAAmB;EAAnB,mDAAmB;EAAnB,oCAAmB;EAAnB,iCAAmB;EAAnB,mCAAmB;EAAnB,0CAAmB;EAAnB,2CAAmB;EAAnB,sCAAmB;EAAnB,mCAAmB;EAAnB,oCAAmB;EAAnB,uDAAmB;EAAnB,sCAAmB;EAAnB,8BAAmB;EAAnB,gCAAmB;EAAnB,kCAAmB;EAAnB,2DAAmB;EAAnB,6DAAmB;EAAnB,kCAAmB;EAAnB,uCAAmB;EAAnB,qCAAmB;EAAnB,6BAAmB;EAAnB,iDAAmB;EAAnB,qCAAmB;EAAnB,gDAAmB;EAAnB,gDAAmB;EAAnB,kDAAmB;EAAnB,2DAAmB;EAAnB,6DAAmB;EAAnB,2DAAmB;EAAnB,6DAAmB;EAAnB,gCAAmB;EAAnB,kCAAmB;EAAnB,0EAAmB;EAAnB,2DAAmB;EAAnB,0EAAmB;EAAnB,2DAAmB;EAAnB,+BAAmB;EAAnB,gCAAmB;EAAnB,iCAAmB;EAAnB,kCAAmB;EAAnB,kCAAmB;EAAnB,kCAAmB;EAAnB,uCAAmB;EAAnB,kCAAmB;EAAnB,yCAAmB;EAAnB,oCAAmB;EAAnB,mDAAmB;EAAnB,kCAAmB;EAAnB,oDAAmB;EAAnB,mCAAmB;EAAnB,0CAAmB;EAAnB,6CAAmB;EAAnB,oCAAmB;EAAnB,wCAAmB;EAAnB,sCAAmB;EAAnB,mDAAmB;EAAnB,kCAAmB;EAAnB,mDAAmB;EAAnB,kCAAmB;EAAnB,qDAAmB;EAAnB,mCAAmB;EAAnB,uCAAmB;EAAnB,qCAAmB;EAAnB,8BAAmB;EAAnB,gCAAmB;EAAnB,kCAAmB;EAAnB,+BAAmB;EAAnB,iCAAmB;EAAnB,iDAAmB;EAAnB,sCAAmB;EAAnB,4CAAmB;EAAnB,8CAAmB;EAAnB,6CAAmB;EAAnB,0DAAmB;EAAnB,2CAAmB;EAAnB,8CAAmB;EAAnB,8BAAmB;EAAnB,gCAAmB;EAAnB,6BAAmB;EAAnB,+BAAmB;EAAnB,8BAAmB;EAAnB,gCAAmB;EAAnB,iCAAmB;EAAnB,mCAAmB;EAAnB,+BAAmB;EAAnB,iCAAmB;EAAnB,qDAAmB;EAAnB,sCAAmB;EAAnB,6BAAmB;EAAnB,kCAAmB;EAAnB,oCAAmB;EAAnB,kCAAmB;EAAnB,iDAAmB;EAAnB,kCAAmB;EAAnB,iCAAmB;EAAnB,sCAAmB;EAAnB,mCAAmB;EAAnB,kDAAmB;EAAnB,qDAAmB;EAAnB,iCAAmB;EAAnB,8DAAmB;EAAnB,+CAAmB;EAAnB,wCAAmB;EAAnB,6CAAmB;EAAnB,uCAAmB;EAAnB,kCAAmB;EAAnB,mCAAmB;EAAnB,sCAAmB;EAAnB,wCAAmB;EAAnB,mDAAmB;EAAnB,oCAAmB;EAAnB,gDAAmB;EAAnB,kCAAmB;EAAnB,+BAAmB;EAAnB,yBAAmB;EAAnB,0CAAmB;EAAnB,kCAAmB;EAAnB,mDAAmB;EAAnB,iDAAmB;EAAnB,kCAAmB;EAAnB,6BAAmB;EAAnB,mCAAmB;EAAnB,+BAAmB;EAAnB,iCAAmB;EAAnB,2BAAmB;EAAnB,6BAAmB;EAAnB,+BAAmB;EAAnB,2BAAmB;EAAnB,8BAAmB;EAAnB,gCAAmB;EAAnB,+BAAmB;EAAnB,yBAAmB;EAAnB,kCAAmB;EAAnB,yCAAmB;EAAnB,oCAAmB;EAAnB,sCAAmB;EAAnB,iCAAmB;EAAnB,6BAAmB;EAAnB,0BAAmB;EAAnB,2BAAmB;EAAnB,6CAAmB;EAAnB,8BAAmB;EAAnB,4BAAmB;EAAnB,8BAAmB;EAAnB,mCAAmB;EAAnB,iCAAmB;EAAnB,wBAAmB;EAAnB,6BAAmB;EAAnB,2BAAmB;EAAnB,uCAAmB;EAAnB,wBAAmB;EAAnB,gCAAmB;EAAnB,sBAAmB;EAAnB,wBAAmB;EAAnB,gDAAmB;EAAnB,gCAAmB;EAAnB,kCAAmB;EAAnB,wDAAmB;EAAnB,uCAAmB;EAAnB;AAAmB;AAAnB;EAAA,oDAAmB;EAAnB,mCAAmB;EAAnB,oDAAmB;EAAnB,sDAAmB;EAAnB,qCAAmB;EAAnB,sDAAmB;EAAnB,qCAAmB;EAAnB,sDAAmB;EAAnB,qCAAmB;EAAnB,gCAAmB;EAAnB,0CAAmB;EAAnB,wCAAmB;EAAnB,kCAAmB;EAAnB,kCAAmB;EAAnB,wCAAmB;EAAnB,0CAAmB;EAAnB,uCAAmB;EAAnB,0CAAmB;EAAnB,uCAAmB;EAAnB,0CAAmB;EAAnB,uCAAmB;EAAnB,0CAAmB;EAAnB,uCAAmB;EAAnB,0CAAmB;EAAnB,uCAAmB;EAAnB,0CAAmB;EAAnB,uCAAmB;EAAnB,uDAAmB;EAAnB,yDAAmB;EAAnB,uCAAmB;EAAnB,yDAAmB;EAAnB,uCAAmB;EAAnB,yDAAmB;EAAnB,uCAAmB;EAAnB,uCAAmB;EAAnB,yCAAmB;EAAnB,uCAAmB;EAAnB,yCAAmB;EAAnB,uCAAmB;EAAnB,yCAAmB;EAAnB,uCAAmB;EAAnB,iCAAmB;EAAnB,iCAAmB;EAAnB,mCAAmB;EAAnB,mCAAmB;EAAnB,qCAAmB;EAAnB,mCAAmB;EAAnB,qCAAmB;EAAnB,mCAAmB;EAAnB,qCAAmB;EAAnB,gDAAmB;EAAnB,mDAAmB;EAAnB,iDAAmB;EAAnB,8CAAmB;EAAnB,uDAAmB;EAAnB,uDAAmB;EAAnB,sDAAmB;EAAnB,0BAAmB;EAAnB,+BAAmB;EAAnB,6BAAmB;EAAnB,+BAAmB;EAAnB,4BAAmB;EAAnB,8BAAmB;EAAnB,2BAAmB;EAAnB,iDAAmB;EAAnB,6CAAmB;EAAnB,oCAAmB;EAAnB,+CAAmB;EAAnB,8CAAmB;EAAnB,kDAAmB;EAAnB,4CAAmB;EAAnB,2DAAmB;EAAnB,qDAAmB;EAAnB,oCAAmB;EAAnB,sCAAmB;EAAnB,uCAAmB;EAAnB,0CAAmB;EAAnB,wDAAmB;EAAnB,sCAAmB;EAAnB,kCAAmB;EAAnB,oCAAmB;EAAnB,wCAAmB;EAAnB,sCAAmB;EAAnB,mCAAmB;EAAnB,qCAAmB;EAAnB,kCAAmB;EAAnB,gEAAmB;EAAnB,6DAAmB;EAAnB,oCAAmB;EAAnB,uCAAmB;EAAnB,kDAAmB;EAAnB,4BAAmB;EAAnB,kCAAmB;EAAnB,uCAAmB;EAAnB,6CAAmB;EAAnB,+CAAmB;EAAnB,+CAAmB;EAAnB,gEAAmB;EAAnB,6DAAmB;EAAnB,gEAAmB;EAAnB,6DAAmB;EAAnB,qCAAmB;EAAnB,kCAAmB;EAAnB,4EAAmB;EAAnB,2DAAmB;EAAnB,4EAAmB;EAAnB,2DAAmB;EAAnB,8BAAmB;EAAnB,gCAAmB;EAAnB,gCAAmB;EAAnB,kCAAmB;EAAnB,iCAAmB;EAAnB,iCAAmB;EAAnB,oDAAmB;EAAnB,kCAAmB;EAAnB,sDAAmB;EAAnB,oCAAmB;EAAnB,oCAAmB;EAAnB,kCAAmB;EAAnB,sCAAmB;EAAnB,oCAAmB;EAAnB,+CAAmB;EAAnB,6CAAmB;EAAnB,oCAAmB;EAAnB,0CAAmB;EAAnB,sCAAmB;EAAnB,gDAAmB;EAAnB,kCAAmB;EAAnB,kDAAmB;EAAnB,kCAAmB;EAAnB,kDAAmB;EAAnB,mCAAmB;EAAnB,uCAAmB;EAAnB,qCAAmB;EAAnB,mCAAmB;EAAnB,qCAAmB;EAAnB,kCAAmB;EAAnB,oCAAmB;EAAnB,iCAAmB;EAAnB,mDAAmB;EAAnB,sCAAmB;EAAnB,8CAAmB;EAAnB,+CAAmB;EAAnB,6CAAmB;EAAnB,4DAAmB;EAAnB,2CAAmB;EAAnB,8CAAmB;EAAnB,mCAAmB;EAAnB,gCAAmB;EAAnB,kCAAmB;EAAnB,+BAAmB;EAAnB,mCAAmB;EAAnB,gCAAmB;EAAnB,sCAAmB;EAAnB,mCAAmB;EAAnB,oCAAmB;EAAnB,iCAAmB;EAAnB,uDAAmB;EAAnB,sCAAmB;EAAnB,+BAAmB;EAAnB,kCAAmB;EAAnB,+BAAmB;EAAnB,kCAAmB;EAAnB,mDAAmB;EAAnB,kCAAmB;EAAnB,iCAAmB;EAAnB,iCAAmB;EAAnB,oCAAmB;EAAnB,kDAAmB;EAAnB,mCAAmB;EAAnB,gCAAmB;EAAnB,gEAAmB;EAAnB,+CAAmB;EAAnB,wCAAmB;EAAnB,6CAAmB;EAAnB,wCAAmB;EAAnB,kCAAmB;EAAnB,oCAAmB;EAAnB,sCAAmB;EAAnB,oDAAmB;EAAnB,oCAAmB;EAAnB,iDAAmB;EAAnB,oCAAmB;EAAnB,+BAAmB;EAAnB,kCAAmB;EAAnB,yBAAmB;EAAnB,4CAAmB;EAAnB,kCAAmB;EAAnB,mDAAmB;EAAnB,mDAAmB;EAAnB,kCAAmB;EAAnB,kCAAmB;EAAnB,mCAAmB;EAAnB,oCAAmB;EAAnB,iCAAmB;EAAnB,gCAAmB;EAAnB,6BAAmB;EAAnB,6CAAmB;EAAnB,0BAAmB;EAAnB,mCAAmB;EAAnB,gCAAmB;EAAnB,+BAAmB;EAAnB,yBAAmB;EAAnB,0BAAmB;EAAnB,uBAAmB;EAAnB,uCAAmB;EAAnB,yCAAmB;EAAnB,yCAAmB;EAAnB,sCAAmB;EAAnB,+CAAmB;EAAnB,6BAAmB;EAAnB,yBAAmB;EAAnB,2BAAmB;EAAnB,+CAAmB;EAAnB,8BAAmB;EAAnB,iCAAmB;EAAnB,8BAAmB;EAAnB,iDAAmB;EAAnB,iCAAmB;EAAnB,6CAAmB;EAAnB,uBAAmB;EAAnB,6BAAmB;EAAnB,2BAAmB;EAAnB,yCAAmB;EAAnB,wBAAmB;EAAnB,2BAAmB;EAAnB,wBAAmB;EAAnB,kDAAmB;EAAnB,qCAAmB;EAAnB,kCAAmB;EAAnB,qDAAmB;EAAnB,qDAAmB;EAAnB;AAAmB;AAAnB;EAAA,wCAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,wCAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,yCAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,qBAAmB;EAAnB,gCAAmB;EAAnB;AAAmB;AAAnB;EAAA,cAAmB;EAAnB,WAAmB;EAAnB,mCAAmB;EAAnB,YAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,uJAAmB;EAAnB,qBAAmB;EAAnB,6BAAmB;EAAnB;AAAmB;ACAnB;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA,oBASA;EATA,uCASA;EATA;AASA;AATA;EAAA,oBASA;EATA,uCASA;EATA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA,sBASA;EATA,iDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,yCASA;EATA;AASA;AATA;EAAA,kBASA;EATA,6CASA;EATA;AASA;AATA;EAAA,sBASA;EATA,8KASA;EATA;AASA;AATA;EAAA,kBASA;EATA,kBASA;EATA,qKASA;EATA;AASA;AATA;EAAA,kBASA;EATA,kBASA;EATA,qKASA;EATA;AASA;AATA;EAAA;AASA;AATA;EAAA,kBASA;EATA,oDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,yCASA;EATA;AASA;AATA;EAAA,kBASA;EATA,4DASA;EATA;AASA;AATA;EAAA,kBASA;EATA,8DASA;EATA;AASA;AATA;EAAA,kBASA;EATA,mDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,uDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,0CASA;EATA;AASA;AATA;EAAA,kBASA;EATA,mDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,uDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,yDASA;EATA;AASA;AATA;EAAA,oBASA;EATA,2BASA;EATA;AASA;AATA;EAAA,oBASA;EATA,kCASA;EATA;AASA;AATA;EAAA,oBASA;EATA,sCASA;EATA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA,sBASA;EATA,uCASA;EATA;AASA;AATA;EAAA,sBASA;EATA,iDASA;EATA;AASA;AATA;EAAA,sBASA;EATA,yCASA;EATA;AASA;AATA;EAAA,8BASA;EATA;AASA;AATA;EAAA,iBASA;EATA,iBASA;EATA,mKASA;EATA;AASA;AATA;EAAA,kBASA;EATA,kBASA;EATA,qKASA;EATA;AASA;AATA;EAAA,kBASA;EATA,4DASA;EATA;AASA;AATA;EAAA,kBASA;EATA,8DASA;EATA;AASA;AATA;EAAA,kBASA;EATA,uDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,qDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,uDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,qDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,yDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,4DASA;EATA;AASA;AATA;EAAA,kBASA;EATA,+DASA;EATA;AASA;AATA;EAAA,kBASA;EATA,uDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,uDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,qDASA;EATA;AASA;AATA;EAAA;AASA;AATA;;EAAA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;AAAA;AATA;;EAAA;IAAA,iBASA;IATA;EASA;AAAA;AATA;;EAAA;IAAA;EASA;AAAA;AATA;;EAAA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA,uBASA;IATA;EASA;;EATA;IAAA;EASA;AAAA;AATA;;EAAA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;;EATA;IAAA;EASA;AAAA;AATA;;EAAA;IAAA,oBASA;IATA,uBASA;IATA;EASA;;EATA;IAAA,yBASA;IATA,6KASA;IATA;EASA;AAAA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA,sBASA;EATA,oDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,wCASA;EATA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA,wBASA;UATA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA,sBASA;EATA,oDASA;EATA;AASA;AATA;EAAA,kBASA;EATA,wCASA;EATA;AASA;AATA;EAAA,iFASA;EATA,iGASA;EATA,sHASA;EATA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA;AATA;EAAA;AASA",sourcesContent:[`@tailwind base;
`,`:root {
  --rt-color-white: #fff;
  --rt-color-dark: #222;
  --rt-color-success: #8dc572;
  --rt-color-error: #be6464;
  --rt-color-warning: #f0ad4e;
  --rt-color-info: #337ab7;
  --rt-opacity: 0.9;
  --rt-transition-show-delay: 0.15s;
  --rt-transition-closing-delay: 0.15s;
}

.core-styles-module_tooltip__3vRRp {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  opacity: 0;
  will-change: opacity;
}

.core-styles-module_fixed__pcSol {
  position: fixed;
}

.core-styles-module_arrow__cvMwQ {
  position: absolute;
  background: inherit;
}

.core-styles-module_noArrow__xock6 {
  display: none;
}

.core-styles-module_clickable__ZuTTB {
  pointer-events: auto;
}

.core-styles-module_show__Nt9eE {
  opacity: var(--rt-opacity);
  transition: opacity var(--rt-transition-show-delay) ease-out;
}

.core-styles-module_closing__sGnxF {
  opacity: 0;
  transition: opacity var(--rt-transition-closing-delay) ease-in;
}

/** end - core styles **/

.styles-module_tooltip__mnnfp {
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 90%;
  width: max-content;
}

.styles-module_arrow__K0L3T {
  width: 8px;
  height: 8px;
}

[class*='react-tooltip__place-top'] > .styles-module_arrow__K0L3T {
  transform: rotate(45deg);
}

[class*='react-tooltip__place-right'] > .styles-module_arrow__K0L3T {
  transform: rotate(135deg);
}

[class*='react-tooltip__place-bottom'] > .styles-module_arrow__K0L3T {
  transform: rotate(225deg);
}

[class*='react-tooltip__place-left'] > .styles-module_arrow__K0L3T {
  transform: rotate(315deg);
}

/** Types variant **/
.styles-module_dark__xNqje {
  background: var(--rt-color-dark);
  color: var(--rt-color-white);
}

.styles-module_light__Z6W-X {
  background-color: var(--rt-color-white);
  color: var(--rt-color-dark);
}

.styles-module_success__A2AKt {
  background-color: var(--rt-color-success);
  color: var(--rt-color-white);
}

.styles-module_warning__SCK0X {
  background-color: var(--rt-color-warning);
  color: var(--rt-color-white);
}

.styles-module_error__JvumD {
  background-color: var(--rt-color-error);
  color: var(--rt-color-white);
}

.styles-module_info__BWdHW {
  background-color: var(--rt-color-info);
  color: var(--rt-color-white);
}
`,`@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter/Inter-Light.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
}

@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter/Inter-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter/Inter-Medium.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
}

@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter/Inter-SemiBold.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
}

@font-face {
  font-family: 'Inter';
  src: url('../fonts/inter/Inter-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
}

@font-face {
  font-family: 'Binance Plex';
  src: url('../fonts/binancePlex/BinancePlex-Light.otf') format('opentype');
  font-weight: 300;
  font-style: normal;
}

@font-face {
  font-family: 'Binance Plex';
  src: url('../fonts/binancePlex/BinancePlex-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Binance Plex';
  src: url('../fonts/binancePlex/BinancePlex-Medium.otf') format('opentype');
  font-weight: 500;
  font-style: normal;
}

@font-face {
  font-family: 'Binance Plex';
  src: url('../fonts/binancePlex/BinancePlex-SemiBold.otf') format('opentype');
  font-weight: 600;
  font-style: normal;
}

@font-face {
  font-family: 'Geeza';
  src: url('../fonts/geeza/Geeza-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  unicode-range: U+0600-06FF, U+0750-077F;
}

@font-face {
  font-family: 'Geeza';
  src: url('../fonts/geeza/Geeza-Bold.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
  unicode-range: U+0600-06FF, U+0750-077F;
}

@font-face {
  font-family: 'Ping Fang';
  src: url('../fonts/pingFang/PingFang-Light.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
  unicode-range: U+4E00-9FFF, U+20000-2A6DF;
}

@font-face {
  font-family: 'Ping Fang';
  src: url('../fonts/pingFang/PingFang-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  unicode-range: U+4E00-9FFF, U+20000-2A6DF;
}

@font-face {
  font-family: 'Ping Fang';
  src: url('../fonts/pingFang/PingFang-Bold.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
  unicode-range: U+4E00-9FFF, U+20000-2A6DF;
}
`,`@tailwind components;
`,`@layer components {
  .button {
    @apply flex justify-center items-center cursor-pointer font-medium leading-body-16 disabled:pointer-events-none disabled:opacity-50;
  }

  .default-button {
    @apply button rounded-curvy;
  }

  .icon-circle-button {
    @apply button rounded-full;
  }

  .icon-square-button {
    @apply button rounded-3;
  }

  /* Deprecated. */
  .tiny-button {
    @apply button rounded py-px px-1 text-caption-12;
  }

  .badge-button {
    @apply button rounded py-1 px-2 text-caption-12;
  }

  .circle-button {
    @apply button rounded-full p-3 text-subheader-16 leading-subheader-16;
  }

  .word-button {
    @apply button rounded py-1 px-3 text-subheader-16 leading-subheader-16;
  }
}
`,`@layer components {
  .checkbox {
    @apply absolute appearance-none top-0 left-0;
  }

  .checkbox:checked::before {
    @apply bg-primary border-primary;
  }

  .checkbox:disabled {
    @apply opacity-40;
  }

  .checkbox::before {
    content: '';
    @apply block size-5 rounded-[5px] border-utility-1-opacity-3 border-[2.5px] aria-checked:bg-primary;
  }
}
`,`@layer components {
  /* Legacy typography. */
  .massive-text {
    @apply text-headline4 leading-headline4;
  }

  .screamer-text {
    @apply text-headline5 leading-headline5;
  }

  .headline-text {
    @apply text-headline6 leading-headline6;
  }

  .header-text {
    @apply text-subtitle1 leading-subtitle1;
  }

  .title-text {
    @apply text-subtitle3 leading-subtitle3;
  }

  .body-text {
    @apply text-subtitle4 leading-subtitle4;
  }

  .subtitle-text {
    @apply text-body3 leading-body3;
  }

  .caption-text {
    @apply text-caption1 leading-caption1;
  }

  .navigation-text {
    @apply text-caption1 leading-caption1;
  }

  /* New typography. */
  .typography-header-48 {
    @apply text-header-48 leading-header-48;
  }

  .typography-header-32 {
    @apply text-header-32 leading-header-32;
  }

  .typography-header-24 {
    @apply text-header-24 leading-header-24;
  }

  .typography-header-20 {
    @apply text-header-20 leading-header-20;
  }

  .typography-header-18 {
    @apply text-header-18 leading-header-18;
  }

  .typography-header-16 {
    @apply text-header-16 leading-header-16;
  }

  .typography-subheader-24 {
    @apply text-subheader-24 leading-subheader-24;
  }

  .typography-subheader-20 {
    @apply text-subheader-20 leading-subheader-20;
  }

  .typography-subheader-20 {
    @apply text-subheader-20 leading-subheader-20;
  }

  .typography-subheader-18 {
    @apply text-subheader-18 leading-subheader-18;
  }

  .typography-subheader-16 {
    @apply text-subheader-16 leading-subheader-16;
  }

  .typography-subheader-14 {
    @apply text-subheader-14 leading-subheader-14;
  }

  .typography-body-20 {
    @apply text-body-20 leading-body-20;
  }

  .typography-body-16 {
    @apply text-body-16 leading-body-16;
  }

  .typography-body-14 {
    @apply text-body-14 leading-body-14;
  }

  .typography-body-12 {
    @apply text-body-12 leading-body-12;
  }

  .typography-caption-12 {
    @apply text-caption-12 leading-caption-12;
  }

  /* Other styles. */
  .text-unset {
    text-align: unset;
  }

  .break-word {
    word-break: break-word;
  }
}
`,`@layer components {
  .alert {
    @apply w-full flex p-3 rounded-2;
  }

  .info-alert {
    @apply alert bg-line;
  }

  .info-alt-alert {
    @apply alert bg-depthBuyBg;
  }

  .default-alert {
    @apply alert bg-utility-1-opacity-4;
  }

  .brand-alert {
    @apply alert bg-primary-opacity-1;
  }

  .success-alert {
    @apply alert bg-success-1-opacity-1;
  }

  .error-alert {
    @apply alert bg-error-1-opacity-1;
  }

  .warning-alert {
    @apply alert bg-warning-1-opacity-1;
  }

  .danger-alert {
    @apply alert bg-errorBg;
  }
}
`,`@layer components {
  .input {
    @apply border flex items-center rounded-2 py-2 px-4 bg-transparent border-utility-1-opacity-3 focus-within:border-primary-default;
  }

  .input-field {
    @apply input;
  }

  .search-field {
    @apply input rounded-full p-2.5 border-none bg-input-search-bg;
  }

  .step-field {
    @apply input;
  }

  .step-field-long {
    @apply input;
  }
}
`,`@layer components {
  .radio-group__option {
    @apply flex items-center justify-center size-5 m-0.5 rounded-full border-utility-1-opacity-3 border-[2.5px] aria-checked:border-primary aria-disabled:opacity-40;
  }

  .radio-group__option-indicator {
    @apply size-[10px] rounded-full bg-utility-1-opacity-3;
  }

  .radio-group__option[aria-checked='true'] .radio-group__option-indicator {
    @apply bg-primary;
  }
}
`,`@layer components {
  .skeleton {
    --start-color: hsl(
      var(--twc-utility-1-opacity-6) / var(--twc-utility-1-opacity-6-opacity, var(--tw-bg-opacity))
    );
    --end-color: hsl(
      var(--twc-utility-1-opacity-3) / var(--twc-utility-1-opacity-3-opacity, var(--tw-bg-opacity))
    );

    background-image: linear-gradient(
      270deg,
      var(--start-color),
      var(--end-color),
      var(--end-color),
      var(--start-color)
    );
    background-size: 400% 100%;
    animation: bg-position 3s ease-in-out infinite;
    box-shadow: none;
    background-clip: padding-box;
    cursor: default;
    pointer-events: none;
    user-select: none;
    flex-shrink: 0;
    @apply flex-shrink-0 rounded-1;
  }

  @keyframes bg-position {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
}
`,`@layer components {
  .switch {
    @apply relative inline-flex w-10 h-6 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-utility-1-opacity-3 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75;
  }

  .switch[aria-checked='true'] {
    @apply bg-primary;
  }

  .switch[aria-checked='true'] .switch__toggle {
    @apply translate-x-4;
  }

  .switch:disabled {
    @apply opacity-40;
  }

  .switch__toggle {
    @apply pointer-events-none inline-block w-5 h-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out;
  }
}
`,`@layer components {
  .tw-scrollbar {
    @apply overflow-hidden overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded-lg scrollbar-thumb-utility-1-opacity-3 scrollbar-track-transparent;
  }

  .tw-tooltip {
    @apply !max-w-xs !bg-tooltip !opacity-100 !backdrop-blur-1 !text-utility-1-default !typography-body-14 !shadow-md !z-50 !px-3 !py-2 !rounded-1;
    font-size: 14px !important;
  }

  .tw-tooltip .react-tooltip-arrow {
    @apply hidden;
  }

  .tw-overlay {
    @apply fixed backdrop-blur-xs inset-0 bg-overlay-50;
  }
}
`,`@tailwind utilities;
`,`@import 'tailwindcss/base';
@import 'react-tooltip/dist/react-tooltip.css';
@import './typography.css';
@import './base.css';

@import 'tailwindcss/components';
@import './components/index.css';

@import 'tailwindcss/utilities';
`],sourceRoot:""}]);const T=f}),83397:((b,E,r)=>{r.d(E,{p:()=>B});var i=r(38208);function B(){return i.w.find(y=>y===navigator.language||y.split("-")[0]===navigator.language.split("-")[0])||"en"}}),84989:((b,E,r)=>{b.exports=r.p+"6563999da1964c37c508.otf"}),88407:((b,E,r)=>{r.d(E,{L:()=>n});var i=r(98649),B=r(80577),y=r(6517),o=(s,l,d)=>new Promise((u,w)=>{var h=t=>{try{m(d.next(t))}catch(A){w(A)}},g=t=>{try{m(d.throw(t))}catch(A){w(A)}},m=t=>t.done?u(t.value):Promise.resolve(t.value).then(h,g);m((d=d.apply(s,l)).next())});function n(s){return o(this,null,function*(){if(s.checking)return;s.checking=!0,(yield(0,B.r)(s))===i.k.IDLE?s.missCount++:s.statusProvider.emit(i.V.EVENT,i.k.READY),s.missCount>=s.MAX_MISS_RECONNECT&&(s.statusProvider.emit(i.V.EVENT,i.k.LOADING),s.portStream=new y.Dz(s.portName),s.statusProvider.emit(i.V.REPLACED,i.k.LOADING),s.missCount=0),s.checking=!1,setTimeout(()=>n(s),s.THRESHOLD)})}}),89419:((b,E,r)=>{r.d(E,{T:()=>y});var i=r(20038);const B={prepareSend:null,prepareSendResolvedAddress:null,prepareSendResolvingAddress:!1,earn:null,stakeDetails:null,navigation:null,stake:null,validatorSelector:null,stakeDetailsError:null,gasStatus:null,gasStation:null,homeEarnWidget:null},y=(0,i.Z0)({name:"sdkFeatureSlice",initialState:B,reducers:{setPrepareSendState(o,n){o.prepareSend=n.payload.data},removePrepareSendState(o){o.prepareSend=null,o.prepareSendResolvedAddress=null,o.prepareSendResolvingAddress=!1},setPrepareSendResolvedAddress(o,n){o.prepareSendResolvedAddress=n.payload,o.prepareSendResolvingAddress=!1},clearPrepareSendResolvedAddress(o){o.prepareSendResolvedAddress=null,o.prepareSendResolvingAddress=!1},clearPrepareSendAddressError(o){o.prepareSend&&(o.prepareSend.addressError=null)},setPrepareSendResolvingAddress(o,n){o.prepareSendResolvingAddress=n.payload},setEarnState(o,n){o.earn=n.payload},removeEarnState(o){o.earn=null},setStakeDetailsState(o,n){o.stakeDetails=n.payload},removeStakeDetailsState(o){o.stakeDetails=null},setStakeDetailsError(o,n){o.stakeDetailsError=n.payload},removeStakeDetailsError(o){o.stakeDetailsError=null},setStakeState(o,n){o.stake=n.payload},removeStakeState(o){o.stake=null},setNavigation(o,n){o.navigation=n.payload},clearNavigation(o){o.navigation=null},setValidatorSelectorState(o,n){o.validatorSelector=n.payload},removeValidatorSelectorState(o){o.validatorSelector=null},setGasStatusState(o,n){o.gasStatus=n.payload},removeGasStatusState(o){o.gasStatus=null},setGasStationState(o,n){o.gasStation=n.payload},removeGasStationState(o){o.gasStation=null},setHomeEarnWidgetState(o,n){o.homeEarnWidget=n.payload},removeHomeEarnWidgetState(o){o.homeEarnWidget=null}}})}),90658:((b,E,r)=>{r.d(E,{A:()=>s,B:()=>n});var i;const y=typeof chrome!="object"||!((i=chrome==null?void 0:chrome.runtime)!=null&&i.id)?{}:r(96815),o=y;o.action=y.action||y.browserAction;const n=()=>{var l;return!!((l=chrome==null?void 0:chrome.storage)!=null&&l.session)},s=o}),93726:((b,E,r)=>{r.d(E,{X:()=>i});const i={LIGHT:"light",DARK:"dark",SYSTEM:"system"}}),94023:((b,E,r)=>{b.exports=r.p+"dd9993384c19c3bc71d3.ttf"}),94323:((b,E,r)=>{r.d(E,{A:()=>y});var i=r(24439);const y={SITE_DISCONNECTED:(0,i.w3)("SITE_DISCONNECTED"),CHAIN_CHANGED:(0,i.w3)("CHAIN_CHANGED"),ACCOUNT_CHANGED:(0,i.w3)("ACCOUNT_CHANGED"),DEFAULT_WALLET_CHANGED:(0,i.w3)("DEFAULT_WALLET_CHANGED"),BNB_STAKING_CHAIN_CHANGED:(0,i.w3)("BNB_STAKING_CHAIN_CHANGED"),ONE_TAP_CLOSED:(0,i.w3)("OneTapClosed"),ONE_TAP_WAGMI:(0,i.w3)("OneTapWagmi"),WALLET_CONNECTED_ON_ORIGIN:(0,i.w3)("WalletConnectedOnOrigin")}}),94566:((b,E,r)=>{var i=r(14644),B=r(61855),y=r(58464),o=r(1824),n=r(28398),s=r(35328),l=r(42836),d=r(17855),u=r(31357),w=r(52856),h=r(48305),g=r(81481),m=r(64001),t=r(4387),A=r(89419),a=r(12464),e=r(54780);const c=(0,i.HY)({migrations:g.K.reducer,app:B.A.reducer,dapps:s.b.reducer,wallet:h.u.reducer,asset:y.H.reducer,nft:o.p.reducer,fiat:l.Z.reducer,notification:d.y.reducer,settings:u.s.reducer,tx:w.B.reducer,blockchains:n.A.reducer,staking:m.m.reducer,swap:t.W.reducer,sdkFeatures:A.T.reducer,approvals:a.L.reducer,migration:e.X.reducer}),p=(v,f)=>(f.type==="RESET"&&(v=void 0),f.type==="MIGRATE"&&(v=f.payload),c(v,f))}),98649:((b,E,r)=>{r.d(E,{V:()=>o,k:()=>y});var i=r(37007),B=r.n(i),y=(n=>(n.READY="READY",n.LOADING="LOADING",n.IDLE="IDLE",n.RESTARTING="RESTARTING",n))(y||{});class o extends B(){constructor(){super(...arguments),this.status="LOADING"}emit(s,l){return this.status=l,super.emit(s,l)}emitReplaced(s,l){return super.emit(s,l)}}o.EVENT="EVENT",o.REPLACED="REPLACED"})}]);

//# sourceMappingURL=15.js.map