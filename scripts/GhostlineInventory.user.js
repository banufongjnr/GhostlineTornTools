// ==UserScript==
// @name         Ghostline Inventory
// @namespace    ghostline.torntools.inventory
// @version      0.1.5
// @description  TornPDA-compatible Ghostline Inventory launcher and inventory diagnostics.
// @author       FatherOooogaboo [3269781]
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  function init() {
    if (!document.body) { setTimeout(init, 300); return; }
    if (document.getElementById('ghostline-inventory-launcher')) return;
    var launcher = document.createElement('button');
    launcher.id = 'ghostline-inventory-launcher';
    launcher.type = 'button';
    launcher.textContent = 'GHOSTLINE INVENTORY 0.1.5';
    launcher.style.cssText = 'position:fixed!important;top:70px!important;left:10px!important;right:10px!important;z-index:2147483647!important;background:#4fe0d0!important;color:#05060c!important;border:3px solid #9b6bff!important;border-radius:12px!important;padding:14px!important;font:bold 14px system-ui!important;text-align:center!important;box-shadow:0 0 25px #9b6bff!important;display:block!important;visibility:visible!important;opacity:1!important;';
    document.body.appendChild(launcher);
    launcher.onclick = function () {
      try { showPanel(); } catch (e) { alert('Ghostline error: ' + e.message); }
    };
  }
  function showPanel() {
    var existing = document.getElementById('ghostline-inventory-panel');
    if (existing) { existing.parentNode.removeChild(existing); return; }
    var panel = document.createElement('div');
    panel.id = 'ghostline-inventory-panel';
    panel.style.cssText = 'position:fixed!important;inset:0!important;z-index:2147483646!important;background:#05060c!important;color:#d7dbe8!important;padding:70px 16px 30px!important;overflow:auto!important;font:14px system-ui!important;';
    var title = document.createElement('h2');
    title.textContent = 'GHOSTLINE // INVENTORY';
    title.style.cssText = 'color:#4fe0d0;letter-spacing:2px;font-size:19px;margin:12px 0;';
    panel.appendChild(title);
    var info = document.createElement('p');
    info.textContent = 'v0.1.5 | Startup confirmed. Inventory DOM inspection mode.';
    info.style.cssText = 'color:#9b6bff;font-size:12px;';
    panel.appendChild(info);
    var selectors = ['[class*="itemRow"]','[class*="item-row"]','[class*="items-list"]','[class*="inventory"]','[class*="itemList"]','[class*="itemsList"]'];
    var report = {url:location.href,readyState:document.readyState,selectors:{},images:document.querySelectorAll('img').length};
    for (var i=0;i<selectors.length;i++) {
      try { report.selectors[selectors[i]]=document.querySelectorAll(selectors[i]).length; } catch(e) { report.selectors[selectors[i]]='error'; }
    }
    var pre=document.createElement('pre');
    pre.textContent=JSON.stringify(report,null,2);
    pre.style.cssText='white-space:pre-wrap;word-break:break-word;color:#d7dbe8;background:#111321;border:1px solid #9b6bff;border-radius:12px;padding:14px;font:12px monospace;';
    panel.appendChild(pre);
    var copy=document.createElement('button');
    copy.textContent='SELECT DIAGNOSTICS';
    copy.style.cssText='padding:12px;background:#4fe0d0;color:#05060c;border:0;border-radius:9px;margin-right:8px;';
    copy.onclick=function(){var range=document.createRange();range.selectNodeContents(pre);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);};
    panel.appendChild(copy);
    var close=document.createElement('button');
    close.textContent='CLOSE';
    close.style.cssText='padding:12px;background:#9b6bff;color:white;border:0;border-radius:9px;';
    close.onclick=function(){panel.parentNode.removeChild(panel);};
    panel.appendChild(close);
    document.body.appendChild(panel);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
