// ==UserScript==
// @name         Ghostline Inventory
// @namespace    ghostline.torntools.inventory
// @version      0.3.0
// @description  In-place Ghostline inventory row restyling for TornPDA and Tampermonkey.
// @author       FatherOooogaboo [3269781]
// @match        https://www.torn.com/item.php*
// @match        https://torn.com/item.php*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  if (window.__ghostlineInventoryV030) return;
  window.__ghostlineInventoryV030 = true;
  var VERSION='0.3.0', enabled=true, observer=null, pending=false, stylesReady=false;
  function make(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function txt(el){return String(el&&(el.innerText||el.textContent)||'').replace(/\s+/g,' ').trim();}
  function button(label,handler,cls){var b=make('button',cls,label);b.type='button';b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();handler();});return b;}
  function getRoot(){
    var all=[].slice.call(document.querySelectorAll('[class*="itemsList"]')).filter(function(n){return !n.closest('#gi-control');});
    all.sort(function(a,b){return b.children.length-a.children.length;});
    return all.find(function(n){return n.children.length>=4&&n.querySelectorAll('img');})||null;
  }
  function getNative(row){
    var original=[].slice.call(row.children).filter(function(c){return !c.classList.contains('gi-skin');});
    return original;
  }
  function nativeText(row){return getNative(row).map(txt).join(' ').replace(/\s+/g,' ').trim();}
  function findImage(row){
    var nodes=getNative(row),images=[];
    nodes.forEach(function(n){images=images.concat([].slice.call(n.querySelectorAll('img')));});
    return images.find(function(n){return n.getAttribute('src')&&n.naturalWidth>0;})||images[0]||null;
  }
  function parse(row){
    var raw=nativeText(row);
    if(!raw||!findImage(row))return null;
    var match=raw.match(/\$\s*[\d,]+(?:\.\d+)?/);
    var value=match?Number(match[0].replace(/[^\d.]/g,'')):null;
    var name=match?raw.slice(0,match.index).trim():raw;
    var qtyMatch=name.match(/^x\s*([\d,]+)\s+/i);
    var qty=qtyMatch?Number(qtyMatch[1].replace(/,/g,'')):null;
    if(qtyMatch)name=name.slice(qtyMatch[0].length);
    name=name.replace(/\s+/g,' ').trim();
    var nativeControls=[];
    getNative(row).forEach(function(n){
      nativeControls=nativeControls.concat([].slice.call(n.querySelectorAll('button,a,[role="button"]')));
    });
    nativeControls=nativeControls.filter(function(n){
      var label=txt(n)||n.getAttribute('aria-label')||n.getAttribute('title')||'';
      return label.trim()&&n.isConnected;
    });
    return {name:name||'Unnamed item',qty:qty,value:value,image:findImage(row),raw:raw,controls:nativeControls};
  }
  function injectCss(){
    if(stylesReady)return;stylesReady=true;
    var st=make('style');st.id='gi-inline-css';
    st.textContent=`
      #gi-control{position:relative;z-index:20;display:flex;gap:7px;align-items:center;flex-wrap:wrap;background:linear-gradient(110deg,#0b101b,#151124);color:#d7dbe8;border:1px solid #9b6bff88;border-radius:13px;padding:10px;margin:12px 0;font:12px Inter,system-ui,sans-serif;box-shadow:0 0 14px #9b6bff22}
      #gi-control b{letter-spacing:.13em;font-size:12px;flex:1}
      #gi-control small{color:#4fe0d0}
      #gi-control button{font:11px system-ui;background:#171a2a;color:#d7dbe8;border:1px solid #514579;border-radius:9px;padding:8px}
      .gi-enhanced{position:relative!important;min-height:82px!important;height:auto!important;overflow:visible!important;background:linear-gradient(115deg,#0b101b,#171225)!important;border:1px solid #39425c!important;border-radius:13px!important;margin:6px 0!important;padding:0!important;box-shadow:inset 3px 0 0 #4fe0d0,0 4px 14px #0004!important}
      .gi-enhanced>.gi-original-hidden{display:none!important}
      .gi-enhanced>.gi-skin{display:flex!important;flex-direction:column!important;gap:7px!important;padding:11px 10px 9px 13px!important;position:relative!important;min-height:78px!important;width:100%!important;box-sizing:border-box!important;color:#d7dbe8!important;font:12px Inter,system-ui,sans-serif!important}
      .gi-skin *{box-sizing:border-box!important}
      .gi-skin .gi-top{display:flex;align-items:center;gap:10px;width:100%}
      .gi-skin .gi-pic{width:50px;height:50px;flex:none;object-fit:contain}
      .gi-skin .gi-name{flex:1;min-width:0;font-size:13px;font-weight:700;color:#e5e7f3;overflow-wrap:anywhere}
      .gi-skin .gi-name small{display:block;font-size:10px;color:#7d8399;margin-top:5px;font-weight:400}
      .gi-skin .gi-qty{color:#4fe0d0;font-size:13px;font-weight:700;white-space:nowrap}
      .gi-skin .gi-actions{display:flex;flex-wrap:wrap;gap:6px;padding-top:7px;border-top:1px solid #34304a}
      .gi-skin button{background:#15192a!important;border:1px solid #514579!important;border-radius:8px!important;color:#d7dbe8!important;padding:7px 10px!important;font:700 10px Inter,system-ui,sans-serif!important;letter-spacing:.06em!important;min-height:30px!important}
      .gi-skin button.gi-primary{background:linear-gradient(100deg,#503b9c,#1f747b)!important;color:#fff!important}
      .gi-enhanced.gi-native-mode>.gi-original-hidden{display:initial!important}
      .gi-enhanced.gi-native-mode>.gi-skin{display:none!important}
      @media(prefers-reduced-motion:reduce){.gi-enhanced{transition:none!important}}
    `;
    document.head.appendChild(st);
  }
  function buildSkin(row,data){
    var skin=make('div','gi-skin'),top=make('div','gi-top');
    var im=make('img','gi-pic');
    if(data.image){im.src=data.image.currentSrc||data.image.src;im.alt='';top.appendChild(im);}
    var info=make('div','gi-name',data.name);
    info.appendChild(make('small','',data.value===null?'Value not shown':'Displayed: $'+data.value.toLocaleString()));
    top.appendChild(info);
    top.appendChild(make('div','gi-qty',data.qty===null?'':'×'+data.qty.toLocaleString()));
    skin.appendChild(top);
    var actions=make('div','gi-actions');
    actions.appendChild(button('OPEN IN TORN',function(){
      row.classList.add('gi-native-mode');
      row.scrollIntoView({block:'nearest',behavior:'smooth'});
    },'gi-primary'));
    data.controls.slice(0,3).forEach(function(native){
      var label=txt(native)||native.getAttribute('aria-label')||native.title;
      if(!label)return;
      actions.appendChild(button(label.trim().slice(0,24),function(){
        row.classList.add('gi-native-mode');
        native.click();
      }));
    });
    skin.appendChild(actions);
    return skin;
  }
  function enhance(row){
    if(!row||row.id==='gi-control'||row.closest('#gi-control'))return;
    var existing=row.querySelector(':scope > .gi-skin');
    if(existing)return;
    var data=parse(row);
    if(!data)return;
    row.classList.add('gi-enhanced');
    getNative(row).forEach(function(n){n.classList.add('gi-original-hidden');});
    row.appendChild(buildSkin(row,data));
  }
  function restore(){
    document.querySelectorAll('.gi-enhanced').forEach(function(row){
      var skin=row.querySelector(':scope > .gi-skin');
      if(skin)skin.remove();
      getNative(row).forEach(function(n){n.classList.remove('gi-original-hidden');});
      row.classList.remove('gi-enhanced','gi-native-mode');
    });
  }
  function process(){
    if(!enabled)return;
    var root=getRoot();if(!root)return;
    [].slice.call(root.children).forEach(enhance);
    var counter=document.getElementById('gi-counter');
    if(counter)counter.textContent=document.querySelectorAll('.gi-enhanced').length+' rows styled';
  }
  function schedule(){
    if(pending)return;pending=true;
    setTimeout(function(){pending=false;process();},250);
  }
  function mountControl(){
    if(document.getElementById('gi-control'))return;
    var bar=make('div');bar.id='gi-control';
    bar.appendChild(make('b','','GHOSTLINE // INVENTORY'));
    bar.appendChild(make('small','gi-counter','Starting…')).id='gi-counter';
    bar.appendChild(button('REFRESH',function(){restore();process();}));
    bar.appendChild(button('DISABLE',function(e){
      enabled=!enabled;
      if(!enabled){restore();this.textContent='ENABLE';}
    }));
    // Explicit closure avoids relying on the userscript manager's event context.
    var toggle=bar.lastChild;
    toggle.remove();
    toggle=button('ORIGINAL TORN',function(){
      enabled=!enabled;
      if(enabled){toggle.textContent='ORIGINAL TORN';process();}
      else{toggle.textContent='ENABLE GHOSTLINE';restore();}
    });
    bar.appendChild(toggle);
    var root=getRoot();
    if(root&&root.parentElement)root.parentElement.insertBefore(bar,root);
    else document.body.appendChild(bar);
  }
  function init(){
    if(!document.body||!document.head){setTimeout(init,300);return;}
    injectCss();
    mountControl();
    process();
    observer=new MutationObserver(function(records){
      if(!enabled)return;
      var relevant=records.some(function(r){
        return !r.target.closest || !r.target.closest('#gi-control,.gi-skin');
      });
      if(relevant)schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setInterval(function(){if(enabled)process();},5000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
