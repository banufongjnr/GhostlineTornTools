// ==UserScript==
// @name         Ghostline Injection Test
// @namespace    ghostline.torntools.injectiontest
// @version      0.1.3
// @description  Minimal TornPDA execution diagnostic; does not modify inventory.
// @author       FatherOooogaboo [3269781]
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  function show() {
    if (!document.body) { setTimeout(show, 300); return; }
    if (document.getElementById('ghostline-injection-test')) return;
    var bar = document.createElement('div');
    bar.id = 'ghostline-injection-test';
    bar.textContent = 'GHOSTLINE TEST 0.1.3 — SCRIPT RUNNING';
    bar.style.cssText = 'position:fixed!important;top:70px!important;left:10px!important;right:10px!important;z-index:2147483647!important;background:#4fe0d0!important;color:#05060c!important;border:3px solid #9b6bff!important;border-radius:12px!important;padding:16px!important;font:bold 15px system-ui!important;text-align:center!important;box-shadow:0 0 30px #9b6bff!important;display:block!important;visibility:visible!important;opacity:1!important;';
    bar.addEventListener('click', function () { alert('Ghostline script executed on: ' + location.href); });
    document.body.appendChild(bar);
    console.log('[Ghostline] injection test v0.1.3 running on', location.href);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show, {once:true});
  else show();
})();
