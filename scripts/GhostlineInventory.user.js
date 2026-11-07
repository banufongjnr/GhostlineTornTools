// ==UserScript==
// @name         Ghostline Inventory
// @namespace    ghostline.torntools.inventory
// @version      0.3.3
// @description  Compact in-place Torn inventory styling with a secondary Ghostline quick-info row.
// @author       FatherOooogaboo [3269781]
// @match        https://www.torn.com/item.php*
// @match        https://torn.com/item.php*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  if (window.__ghostlineInventory033) return;
  window.__ghostlineInventory033 = true;
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
    // Read the visible native price, including Torn's "$price | Nx = $total" layout.
    var native = Array.prototype.slice.call(row.querySelectorAll('*')).filter(function(n) {
      return !n.closest('.gi-secondary') && n.children.length === 0;
    });
    for (var i=0;i<native.length;i++) {
      var t = (native[i].textContent||'').trim();
      var match = t.match(/\$\s*[\d,]+(?:\.\d+)?/);
      if (match) return match[0].replace(/\s+/g,'');
    }
    var text = Array.prototype.slice.call(row.childNodes).map(function(n) {
      return n.nodeType===3?n.textContent:(n.nodeType===1&&!n.classList.contains('gi-secondary')?n.textContent:'');
    }).join(' ');
    var fallback=text.match(/\$\s*[\d,]+(?:\.\d+)?/);
    return fallback?fallback[0].replace(/\s+/g,''):null;
  }
  function getQuantity(row) {
    var raw = Array.prototype.slice.call(row.querySelectorAll('*')).filter(function(n){
      return !n.closest('.gi-secondary') && n.children.length===0;
    }).map(function(n){return n.textContent||'';}).join(' ');
    var m=raw.match(/(?:^|\s)x\s*([\d,]+)\b/i);
    return m?m[1]:null;
  }
  function actionVerb(n) {
    var s=label(n);
    if (/\b(unequip)\b/i.test(s)) return 'UNEQUIP';
    var m=s.match(/\b(equip|send|trash|sell|use|open|activate|consume|wear|remove|drink|eat)\b/i);
    if(!m)return '';
    var verb=m[1].toUpperCase();
    return /^(CONSUME|DRINK|EAT)$/.test(verb)?'USE':verb;
  }
  function nativeActions(row) {
    var all=Array.prototype.slice.call(row.querySelectorAll('button,a,[role="button"]'));
    var seen={};
    return all.filter(function(n){
      if(n.closest('.gi-secondary'))return false;
      var s=label(n);
      if(!s || /^(show info|show options|show group)/i.test(s))return false;
      var key=actionVerb(n);
      if(!key||seen[key])return false;
      seen[key]=true;
      return true;
    });
  }
  function consumable(row, native) {
    var type = native.map(actionVerb);
    return type.some(function(v){return ['USE','OPEN','ACTIVATE'].indexOf(v)!==-1;});
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
    var strip=el('div','gi-secondary');
    var left=el('span','gi-meta');
    var price=getPrice(row),quantity=getQuantity(row);
    var native=nativeActions(row),isConsumable=consumable(row,native);
    left.textContent=price?'VALUE '+price:(isConsumable?'CONSUMABLE':'ITEM');
    left.title=price?'Native Torn displayed unit value':'No verified item price available';
    strip.appendChild(left);
    var actions=el('span','gi-quick');
    var priority={USE:0,OPEN:1,ACTIVATE:2,EQUIP:3,UNEQUIP:3,SEND:4,SELL:5,TRASH:6};
    native.sort(function(a,b){return (priority[actionVerb(a)]||9)-(priority[actionVerb(b)]||9);});
    var main=native.slice(0,2);
    main.forEach(function(control){
      var verb=actionVerb(control);
      actions.appendChild(button(verb,function(){
        if(!control.isConnected)return;
        // Let Torn show any native confirmation or cooldown warning.
        control.click();
      }));
    });
    var more=button('MORE',function(){
      var existing=row.querySelector(':scope > .gi-more-panel');
      if(existing){existing.remove();return;}
      var panel=el('div','gi-more-panel');
      if(isConsumable)panel.appendChild(el('span','gi-note','Consumable actions use Torn’s native confirmation and cooldown rules.'));
      if(price)panel.appendChild(el('span','gi-note','Unit value: '+price+(quantity?' · Qty: '+quantity:'')));
      native.slice(2).forEach(function(control){
        panel.appendChild(button(actionVerb(control),function(){
          panel.remove();
          if(control.isConnected)control.click();
        }));
      });
      var toggles=Array.prototype.slice.call(row.querySelectorAll('button,a,[role="button"]')).filter(function(n){
        return !n.closest('.gi-secondary,.gi-more-panel')&&/show options|show info|show group/i.test(label(n));
      });
      toggles.slice(0,2).forEach(function(control){
        panel.appendChild(button(/show info/i.test(label(control))?'INFO':'OPTIONS',function(){
          panel.remove();if(control.isConnected)control.click();
        }));
      });
      panel.appendChild(button('CLOSE',function(){panel.remove();}));
      row.appendChild(panel);
    });
    actions.appendChild(more);
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
      var more = row.querySelector(':scope > .gi-more-panel');
      if (more) more.remove();
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
    style.id = 'gi-css-033';
    style.textContent = `
      #gi-toolbar {display:flex;align-items:center;gap:8px;flex-wrap:wrap;position:relative;z-index:10;margin:8px 0;padding:8px 10px;border:1px solid rgba(155,107,255,.4);border-radius:10px;background:#0c0e19;color:#d7dbe8;font:11px Inter,system-ui,sans-serif}
      #gi-toolbar strong{letter-spacing:.12em;font-size:11px;flex:1;min-width:110px}
      #gi-toolbar #gi-count{color:#4fe0d0;font:10px monospace}
      #gi-toolbar button{background:#19182a;color:#d7dbe8;border:1px solid #494067;border-radius:7px;padding:6px 9px;font:10px system-ui}
      .gi-row {position:relative!important;box-sizing:border-box!important;min-height:0!important;height:auto!important;overflow:visible!important;margin:3px 0!important;border:1px solid rgba(130,140,255,.23)!important;border-left:1px solid rgba(130,140,255,.23)!important;border-radius:9px!important;background:linear-gradient(110deg,#10121d,#161321)!important;box-shadow:0 2px 9px #0003!important;color:#d7dbe8!important}
      .gi-row > :not(.gi-secondary) {box-sizing:border-box}
      .gi-row > .gi-secondary {clear:both!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;flex-wrap:nowrap!important;width:100%!important;min-height:31px!important;padding:5px 9px!important;margin:0!important;border-top:1px solid rgba(130,140,255,.2)!important;background:rgba(5,6,12,.65)!important;color:#aeb3c8!important;font:10px Inter,system-ui,sans-serif!important;box-sizing:border-box!important}
      .gi-row .gi-meta{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.04em;color:#4fe0d0}
      .gi-row .gi-quick{display:flex;gap:4px;align-items:center;flex:none;max-width:62%;min-width:0}.gi-row .gi-meta{flex:1;min-width:0}
      .gi-row .gi-quick button{min-width:0!important;min-height:23px!important;padding:3px 7px!important;border:1px solid #4c426e!important;border-radius:6px!important;background:#211b36!important;color:#d7dbe8!important;font:700 9px Inter,system-ui,sans-serif!important;line-height:1.2!important;white-space:nowrap!important;cursor:pointer!important}
      .gi-row .gi-quick button:last-child{color:#4fe0d0!important}
      .gi-row > .gi-more-panel{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:5px!important;background:#0c0e1a!important;border-top:1px solid #35324d!important;padding:7px!important;color:#aeb3c8!important}
      .gi-row .gi-more-panel button{background:#211b36!important;color:#d7dbe8!important;border:1px solid #514579!important;border-radius:6px!important;padding:5px 8px!important;font:700 10px system-ui!important}
      .gi-row .gi-note{font:10px system-ui!important;width:100%;color:#9a9fb5!important}
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
