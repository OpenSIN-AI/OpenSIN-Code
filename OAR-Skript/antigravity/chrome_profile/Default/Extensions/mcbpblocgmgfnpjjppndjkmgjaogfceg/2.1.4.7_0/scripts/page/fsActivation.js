/**
* @license FireShot - Webpage Screenshots and Annotations
* Copyright (C) 2007-2025 Evgeny Vokilsus (contacts@getfireshot.com)
*/

!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="53dd839a-b18b-5e69-a8d9-5e8c803f27a9")}catch(e){}}();
(()=>{setTimeout(()=>{window.fsActivationEvents||(window.fsActivationEvents=!0,chrome.runtime.sendMessage({message:"checkFSAvailabilityEvt"},function(t){console.log(chrome.runtime.lastError),document.addEventListener("checkFSAvailabilityEvt",function(e){for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&e.target.setAttribute(i,t[i])},!1)}),document.addEventListener("activateFireShotEvt",function(t){try{chrome.runtime.sendMessage({message:"activateFireShot",name:t.target.getAttribute("FSName"),key:t.target.getAttribute("FSKey"),usetoken:t.target.getAttribute("FSUseToken"),sid:t.target.getAttribute("FSSid")},e=>{document.dispatchEvent(new CustomEvent("activationStatus",{detail:e}))})}catch{}},!1)),document.dispatchEvent(new CustomEvent("helloFromFireShotForChrome"))},100);})();
//# sourceMappingURL=fsActivation.js.map

//# debugId=53dd839a-b18b-5e69-a8d9-5e8c803f27a9
