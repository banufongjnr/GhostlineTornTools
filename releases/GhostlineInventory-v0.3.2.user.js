// ==UserScript==
// @name         Ghostline Inventory
// @namespace    ghostline.torntools.inventory
// @version      0.3.2
// @description  Compact in-place Torn inventory styling with a secondary Ghostline quick-info row.
// @author       FatherOooogaboo [3269781]
// @match        https://www.torn.com/item.php*
// @match        https://torn.com/item.php*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  if (window.__ghostlineInventory032) return;
  window.__ghostlineInventory032 = true;
  var enabled = true, scheduled = false, observing = false;
  var obs, currentRoot = null;
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function label(n) {
    return String((n && (n.getAttribute('aria-label') || n.getAttribute('title') || n.innerText || n.textContent)) || '').replace(/\s+/g, ' ').trim();
  }
  function getRoot() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[class*="itemsList"]'));
    nodes = nodes.filter(function(n) { return !n.closest('#gi-toolbar'); });
    nodes.sort(function(a,b) { return b.children.length - a.children.length; });
    return nodes.find(function(n) {
      return n.children.length >= 4 && n.querySelectorAll('img');
    }) || null;
  }
  function rows(root) {
    return root ? Array.prototype.slice.call(root.children).filter(function(n) {
      return n.nodeType === 1 && n.querySelector('img') && n.textContent.trim().length > 0;
    }) : [];
  }
  function getPrice(row) {
    // Price information is optional; only use a clearly labelled native price node.
    var matches = row.querySelectorAll('[class*="price"],[class*="value"]');
    for (var i = 0; i < matches.length; i++) {
      if (matches[i].closest('.gi-secondary')) continue;
      var t = (matches[i].innerText || matches[i].textContent || '').trim();
      var m = t.match(/\$[\d,]+(?:\.\d+)?/);
      if (m) return m[0];
    }
    return null;
  }
  function getQuantity(row) {
    var nodes = row.querySelectorAll('[class*="amount"],[class*="quantity"],[class*="count"]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].closest('.gi-secondary')) continue;
      var t = (nodes[i].innerText || nodes[i].textContent || '').trim();
      var m = t.match(/^x\s*([\d,]+)$/i);
      if (m) return m[1];
    }
    return null;
  }
  function actionVerb(n) {
    // Torn often puts the item name inside accessible action labels.
    // Extract only the actual action, never the item name.
    var s = label(n);
    var m = s.match(/\b(unequip|equip|send|trash|sell|use|open|activate|consume|wear|remove)\b/i);
    return m ? m[1].toUpperCase() : '';
  }
  function nativeActions(row) {
    var all = Array.prototype.slice.call(row.querySelectorAll('button,a,[role="button"]'));
    var seen = {};
    return all.filter(function(n) {
      if (n.closest('.gi-secondary')) return false;
      var s = label(n);
      if (!s || /^(show info|show options|show group)/i.test(s)) return false;
      var key = actionVerb(n);
      if (!key) return false;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, 3);
  }
  function button(text, fn) {
    var b = el('button', '', text);
    b.type = 'button';
    b.addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      fn();
    });
    return b;
  }
  function buildSecondary(row) {
    var strip = el('div','gi-secondary');
    var left = el('span','gi-meta');
    var price = getPrice(row), quantity = getQuantity(row);
    left.textContent = price ? 'VALUE  ' + price : 'QUICK ACTIONS';
    if (quantity) left.textContent += '  ·  QTY ' + quantity;
    strip.appendChild(left);
    var actions = el('span','gi-quick');
    var native = nativeActions(row);
    if (native.length) {
      native.forEach(function(control) {
        var text = actionVerb(control);
        actions.appendChild(button(text, function() {
          if (!control.isConnected) return;
          control.click();
        }));
      });
    }
    actions.appendChild(button('MORE', function() {
      // Torn owns the original item options; activate its existing disclosure.
      var controls = Array.prototype.slice.call(row.querySelectorAll('button,a,[role="button"]'));
      var toggle = controls.find(function(n) {
        return !n.closest('.gi-secondary') && /show options|show info/i.test(label(n));
      });
      if (toggle) toggle.click();
      else row.classList.toggle('gi-details-open');
    }));
    strip.appendChild(actions);
    return strip;
  }
  function enhance(row) {
    if (row.classList.contains('gi-row')) return;
    row.classList.add('gi-row');
    row.appendChild(buildSecondary(row));
  }
  function restore() {
    document.querySelectorAll('.gi-row').forEach(function(row) {
      var strip = row.querySelector(':scope > .gi-secondary');
      if (strip) strip.remove();
      row.classList.remove('gi-row','gi-details-open');
    });
  }
  function scan() {
    if (!enabled) return;
    var root = getRoot();
    if (!root) return;
    currentRoot = root;
    rows(root).forEach(enhance);
    var counter = document.getElementById('gi-count');
    if (counter) counter.textContent = rows(root).filter(function(n){return n.classList.contains('gi-row');}).length + ' ROWS';
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function() { scheduled = false; scan(); }, 350);
  }
  function css() {
    var style = el('style');
    style.id = 'gi-css-032';
    style.textContent = `
      #gi-toolbar {display:flex;align-items:center;gap:8px;flex-wrap:wrap;position:relative;z-index:10;margin:8px 0;padding:8px 10px;border:1px solid rgba(155,107,255,.4);border-radius:10px;background:#0c0e19;color:#d7dbe8;font:11px Inter,system-ui,sans-serif}
      #gi-toolbar strong{letter-spacing:.12em;font-size:11px;flex:1;min-width:110px}
      #gi-toolbar #gi-count{color:#4fe0d0;font:10px monospace}
      #gi-toolbar button{background:#19182a;color:#d7dbe8;border:1px solid #494067;border-radius:7px;padding:6px 9px;font:10px system-ui}
      .gi-row {position:relative!important;box-sizing:border-box!important;min-height:0!important;height:auto!important;overflow:visible!important;margin:3px 0!important;border:1px solid rgba(130,140,255,.23)!important;border-left:1px solid rgba(130,140,255,.23)!important;border-radius:9px!important;background:linear-gradient(110deg,#10121d,#161321)!important;box-shadow:0 2px 9px #0003!important;color:#d7dbe8!important}
      .gi-row > :not(.gi-secondary) {box-sizing:border-box}
      .gi-row > .gi-secondary {clear:both!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;flex-wrap:nowrap!important;width:100%!important;min-height:31px!important;padding:5px 9px!important;margin:0!important;border-top:1px solid rgba(130,140,255,.2)!important;background:rgba(5,6,12,.65)!important;color:#aeb3c8!important;font:10px Inter,system-ui,sans-serif!important;box-sizing:border-box!important}
      .gi-row .gi-meta{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.04em;color:#4fe0d0}
      .gi-row .gi-quick{display:flex;gap:4px;align-items:center;flex:none}
      .gi-row .gi-quick button{min-width:0!important;min-height:23px!important;padding:3px 7px!important;border:1px solid #4c426e!important;border-radius:6px!important;background:#211b36!important;color:#d7dbe8!important;font:700 9px Inter,system-ui,sans-serif!important;line-height:1.2!important;white-space:nowrap!important;cursor:pointer!important}
      .gi-row .gi-quick button:last-child{color:#4fe0d0!important}
      @media(max-width:450px){.gi-row .gi-secondary{padding:4px 6px!important}.gi-row .gi-quick button{padding:3px 5px!important;font-size:9px!important}.gi-row .gi-meta{font-size:9px!important}}
    `;
    document.head.appendChild(style);
  }
  function toolbar() {
    var bar = el('div');bar.id='gi-toolbar';
    bar.appendChild(el('strong','','GHOSTLINE // INVENTORY'));
    var count = el('span','', 'SCANNING');count.id='gi-count';bar.appendChild(count);
    bar.appendChild(button('REFRESH',function(){restore();scan();}));
    var toggle = button('ORIGINAL TORN',function(){
      enabled = !enabled;
      if (enabled) { toggle.textContent='ORIGINAL TORN';scan(); }
      else { toggle.textContent='ENABLE GHOSTLINE';restore();count.textContent='OFF'; }
    });
    bar.appendChild(toggle);
    var root = getRoot();
    if (root && root.parentElement) root.parentElement.insertBefore(bar,root);
    else document.body.appendChild(bar);
  }
  function init() {
    if (!document.body || !document.head) { setTimeout(init,300);return; }
    if (document.getElementById('gi-toolbar')) return;
    css();toolbar();scan();
    obs = new MutationObserver(function(records) {
      if (!enabled) return;
      var changed = records.some(function(r) {
        return !(r.target.closest && r.target.closest('#gi-toolbar,.gi-secondary'));
      });
      if (changed) schedule();
    });
    obs.observe(document.body,{childList:true,subtree:true});
    setInterval(function(){if(enabled)scan();},6000);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
