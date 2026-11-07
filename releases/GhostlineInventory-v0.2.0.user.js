// ==UserScript==
// @name         Ghostline Inventory
// @namespace    ghostline.torntools.inventory
// @version      0.2.0
// @description  Ghostline inventory board, grounded in Torn's live item rows.
// @author       FatherOooogaboo [3269781]
// @match        https://www.torn.com/*
// @match        https://torn.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  var VERSION='0.2.0', open=false, query='', sort='original', active='All', refreshTimer=null;
  var palette={teal:'#4fe0d0',violet:'#9b6bff'};
  function node(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  function btn(text,fn,cls){var b=node('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;}
  function clean(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function rowText(n){return clean(n.innerText||n.textContent);}
  function getRows(){
    var roots=[].slice.call(document.querySelectorAll('[class*="itemsList"]')).filter(function(n){return !n.closest('#gi-app');});
    roots.sort(function(a,b){return b.querySelectorAll('img').length-a.querySelectorAll('img').length;});
    var root=roots.find(function(n){return n.children.length>4&&n.querySelectorAll('img').length>4;});
    if(!root)return [];
    var children=[].slice.call(root.children);
    return children.filter(function(n){return n.querySelector('img')&&rowText(n).length>1;});
  }
  function parseItem(n,index){
    var imgs=[].slice.call(n.querySelectorAll('img'));
    var img=imgs.find(function(x){return x.getAttribute('src')&&x.getBoundingClientRect().width>12;})||imgs[0];
    var raw=rowText(n),name=raw;
    var priceMatch=raw.match(/\$[\d,]+(?:\.\d+)?/);
    if(priceMatch)name=clean(raw.slice(0,priceMatch.index));
    name=name.replace(/^x\s*([\d,]+)\s*/i,'');
    var qtyMatch=raw.match(/^x\s*([\d,]+)/i);
    var quantity=qtyMatch?Number(qtyMatch[1].replace(/,/g,'')):1;
    var price=priceMatch?Number(priceMatch[0].slice(1).replace(/,/g,'')):null;
    var category='Items';
    var categoryNode=n.closest('[data-category],[class*="category"]');
    if(categoryNode)category=clean(categoryNode.getAttribute('data-category')||'Items')||'Items';
    var nativeButtons=[].slice.call(n.querySelectorAll('button,[role="button"],a')).filter(function(b){return b.offsetWidth>0&&clean(b.innerText||b.getAttribute('aria-label')||b.title).length>0;});
    return {index:index,node:n,name:name||'Unknown item',raw:raw,quantity:quantity,price:price,img:img?img.currentSrc||img.src:'',category:category,actions:nativeButtons};
  }
  function scan(){return getRows().map(parseItem).filter(function(x){return x.name&&x.name!=='Unknown item';});}
  function styles(){
    if(document.getElementById('gi-css'))return;
    var st=node('style');st.id='gi-css';
    st.textContent=`
    #gi-app,#gi-launcher{font-family:Inter,"Space Grotesk",system-ui,sans-serif!important}
    #gi-app *{box-sizing:border-box}
    #gi-app{position:fixed;inset:0;z-index:2147483646;background:radial-gradient(ellipse at 50% 0%,#34215d 0%,#05060c 65%);color:#d7dbe8;display:none;flex-direction:column;padding:calc(env(safe-area-inset-top) + 18px) 13px calc(env(safe-area-inset-bottom) + 12px);font-size:13px}
    #gi-app.gi-open{display:flex}
    #gi-app button,#gi-app input,#gi-app select{font:inherit}
    #gi-app button{background:#141725;border:1px solid #373a56;color:#e2e6f1;border-radius:10px;padding:10px;cursor:pointer}
    #gi-app .gi-accent{background:linear-gradient(100deg,#6240a9,#217c7c);border-color:#9b6bff;color:white}
    #gi-app .gi-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
    #gi-app .gi-brand{flex:1;min-width:0}
    #gi-app .gi-brand b{font-size:15px;letter-spacing:.15em;display:block}
    #gi-app .gi-brand small{font-size:10px;letter-spacing:.13em;color:#4fe0d0}
    #gi-app .gi-orb{width:37px;height:37px;flex:none;border-radius:50%;background:radial-gradient(circle,#05060c 45%,transparent 47%),conic-gradient(#4fe0d0,#9b6bff,#4fe0d0);box-shadow:0 0 17px #9b6bff99}
    #gi-app .gi-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
    #gi-app .gi-stat{background:#101322;border:1px solid #30324c;border-radius:12px;text-align:center;padding:12px 3px}
    #gi-app .gi-stat b{display:block;font-size:20px;color:#4fe0d0}
    #gi-app .gi-stat small{font-size:9px;letter-spacing:.08em;color:#9b9fb3}
    #gi-app .gi-tools{display:flex;gap:7px;margin-bottom:10px}
    #gi-app .gi-tools input,#gi-app .gi-tools select{background:#111321;color:#e2e6f1;border:1px solid #35374d;border-radius:11px;padding:11px;min-width:0}
    #gi-app .gi-tools input{flex:1}
    #gi-app .gi-list{flex:1;overflow:auto;overscroll-behavior:contain;padding-bottom:15px}
    #gi-app .gi-row{display:flex;align-items:center;gap:10px;background:#101321;border:1px solid #30344b;border-radius:13px;padding:10px;margin-bottom:7px}
    #gi-app .gi-row img{width:54px;height:54px;object-fit:contain;flex:none}
    #gi-app .gi-iteminfo{flex:1;min-width:0}
    #gi-app .gi-iteminfo b{font-size:13px;display:block;overflow-wrap:anywhere}
    #gi-app .gi-iteminfo small{display:block;color:#9b9fb3;margin-top:4px;font-size:10px}
    #gi-app .gi-count{color:#4fe0d0;font-size:13px;font-weight:bold}
    #gi-app .gi-actions{display:flex;gap:6px;margin-top:8px}
    #gi-app .gi-actions button{padding:7px 9px;font-size:10px}
    #gi-app .gi-empty{padding:20px;text-align:center;color:#a6abc3}
    #gi-app .gi-footer{display:flex;gap:7px;margin-top:8px}
    #gi-app .gi-footer button{flex:1;font-size:11px}
    #gi-app .gi-inspect{position:absolute;inset:0;background:#05060cf5;display:flex;align-items:center;justify-content:center;padding:15px}
    #gi-app .gi-inspectbox{background:#101321;border:1px solid #9b6bff;border-radius:16px;padding:18px;width:100%;max-width:500px;max-height:85vh;overflow:auto}
    #gi-app .gi-inspectbox p{color:#a6abc3;line-height:1.5;overflow-wrap:anywhere}
    `;
    document.head.appendChild(st);
  }
  function openBoard(){open=true;document.getElementById('gi-app').classList.add('gi-open');render();refreshTimer=setInterval(function(){if(open)render(false);},20000);}
  function closeBoard(){open=false;document.getElementById('gi-app').classList.remove('gi-open');if(refreshTimer)clearInterval(refreshTimer);refreshTimer=null;}
  function inspect(item){
    var app=document.getElementById('gi-app'),layer=node('div','gi-inspect'),box=node('div','gi-inspectbox');
    box.appendChild(node('h3','',item.name));
    box.appendChild(node('p','','Quantity: '+item.quantity+' | Displayed price: '+(item.price===null?'Unavailable':'$'+item.price.toLocaleString())));
    box.appendChild(node('p','','Original Torn row: '+item.raw.slice(0,500)));
    box.appendChild(node('p','','Native actions detected: '+item.actions.length+'. Actions are only triggered after you tap them.'));
    item.actions.forEach(function(action){
      var label=clean(action.innerText||action.getAttribute('aria-label')||action.title);
      box.appendChild(btn(label,function(){closeBoard();if(item.node.isConnected&&action.isConnected)action.click();}));
    });
    box.appendChild(btn('BACK',function(){layer.remove();},'gi-accent'));
    layer.appendChild(box);app.appendChild(layer);
  }
  function render(rebuild){
    var app=document.getElementById('gi-app');
    if(!app)return;
    if(rebuild===false&&app.querySelector('.gi-inspect'))return;
    var focus=document.activeElement;
    if(rebuild===false&&focus&&app.contains(focus)&&focus.tagName==='INPUT')return;
    app.innerHTML='';
    var items=scan();
    var head=node('div','gi-head');head.appendChild(node('div','gi-orb'));
    var brand=node('div','gi-brand');brand.appendChild(node('b','','GHOSTLINE INVENTORY'));brand.appendChild(node('small','','INVENTORY BOARD // v'+VERSION));head.appendChild(brand);
    head.appendChild(btn('✕',closeBoard));app.appendChild(head);
    var stats=node('div','gi-stats');
    [['ITEM ROWS',items.length],['QUANTITY',items.reduce(function(a,b){return a+b.quantity;},0)],['WITH PRICES',items.filter(function(x){return x.price!==null;}).length]].forEach(function(pair){
      var cell=node('div','gi-stat');cell.appendChild(node('b','',String(pair[1])));cell.appendChild(node('small','',pair[0]));stats.appendChild(cell);
    });app.appendChild(stats);
    var tools=node('div','gi-tools'),input=node('input');input.placeholder='Search inventory';input.value=query;
    input.addEventListener('input',function(){query=input.value;populate();});tools.appendChild(input);
    var select=node('select');
    [['original','Original'],['name','Name'],['quantity','Quantity'],['price','Price']].forEach(function(pair){var opt=node('option','',pair[1]);opt.value=pair[0];select.appendChild(opt);});
    select.value=sort;select.onchange=function(){sort=select.value;populate();};tools.appendChild(select);app.appendChild(tools);
    var list=node('div','gi-list');app.appendChild(list);
    function populate(){
      list.innerHTML='';
      var filtered=items.filter(function(x){return x.name.toLowerCase().includes(query.toLowerCase());});
      if(sort==='name')filtered.sort(function(a,b){return a.name.localeCompare(b.name);});
      if(sort==='quantity')filtered.sort(function(a,b){return b.quantity-a.quantity;});
      if(sort==='price')filtered.sort(function(a,b){return (b.price||0)-(a.price||0);});
      if(!filtered.length)list.appendChild(node('div','gi-empty','No inventory entries detected. Try opening the Items category in Torn, then tap REFRESH.'));
      filtered.forEach(function(item){
        var row=node('div','gi-row');
        if(item.img){var image=node('img');image.src=item.img;image.alt='';row.appendChild(image);}
        var info=node('div','gi-iteminfo');info.appendChild(node('b','',item.name));
        info.appendChild(node('small','',item.price===null?'No displayed price':'Displayed price: $'+item.price.toLocaleString()));
        var actions=node('div','gi-actions');actions.appendChild(btn('INSPECT',function(){inspect(item);},'gi-accent'));info.appendChild(actions);
        row.appendChild(info);row.appendChild(node('div','gi-count','×'+item.quantity));list.appendChild(row);
      });
    }
    populate();
    var foot=node('div','gi-footer');
    foot.appendChild(btn('REFRESH',function(){render();},'gi-accent'));
    foot.appendChild(btn('ORIGINAL TORN',closeBoard));
    app.appendChild(foot);
  }
  function init(){
    if(!document.body||!document.head){setTimeout(init,300);return;}
    if(document.getElementById('gi-launcher'))return;
    styles();
    var launcher=btn('GHOSTLINE INVENTORY 0.2.0',openBoard);
    launcher.id='gi-launcher';
    launcher.style.cssText='position:fixed!important;top:70px!important;left:10px!important;right:10px!important;z-index:2147483647!important;background:#4fe0d0!important;color:#05060c!important;border:3px solid #9b6bff!important;border-radius:12px!important;padding:12px!important;font:bold 13px system-ui!important;box-shadow:0 0 22px #9b6bff!important;display:block!important;visibility:visible!important;opacity:1!important;';
    document.body.appendChild(launcher);
    var app=node('div');app.id='gi-app';document.body.appendChild(app);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
