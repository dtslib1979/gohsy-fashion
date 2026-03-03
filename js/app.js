/* GOHSY Fashion TV — Core App */
(function(){
  'use strict';
  var BASE=(function(){var p=window.location.pathname;return(p.indexOf('/channels/')!==-1||p.indexOf('/showroom/')!==-1)?'../catalog/':'catalog/'})();
  var COLOR_MAP={ivory:'#FFFFF0',charcoal:'#36454F',camel:'#C19A6B',black:'#1a1a1a',khaki:'#BDB76B',beige:'#F5F5DC',cream:'#FFFDD0',olive:'#808000',white:'#f5f5f5',navy:'#1a1a3e',brown:'#8B4513',gray:'#808080'};
  var CAT_ICONS={outer:'\uD83E\uDDE5',top:'\uD83D\uDC55',bottom:'\uD83D\uDC56',acc:'\uD83D\uDC5C'};
  var catalog=null;
  window.GOHSY={COLOR_MAP:COLOR_MAP,CAT_ICONS:CAT_ICONS,getCatalog:getCatalog,formatPrice:formatPrice,getColorHex:getColorHex,getCatIcon:getCatIcon};
  function getCatalog(){if(catalog)return Promise.resolve(catalog);return fetch(BASE+'index.json').then(function(r){return r.json()}).then(function(d){catalog=d;return d})}
  function formatPrice(n){return'\u20A9'+Number(n).toLocaleString('ko-KR')}
  function getColorHex(name){return COLOR_MAP[name]||'#888'}
  function getCatIcon(cat){return CAT_ICONS[cat.split('/')[0]]||'\uD83D\uDC57'}
  function initLoader(){var l=document.querySelector('.loader');if(!l)return;var s=Date.now();function dismiss(){var d=Math.max(0,800-(Date.now()-s));setTimeout(function(){l.classList.add('is-done');setTimeout(function(){if(l.parentNode)l.parentNode.removeChild(l)},700)},d)}if(document.readyState==='complete')dismiss();else window.addEventListener('load',dismiss)}
  function initNavScroll(){var n=document.querySelector('.nav');if(!n)return;var s=false;function onS(){var is=window.scrollY>10;if(is!==s){s=is;n.classList.toggle('nav--scrolled',s)}}window.addEventListener('scroll',onS,{passive:true});onS()}
  function initActiveChannel(){var tabs=document.querySelectorAll('.nav__ch');if(!tabs.length)return;var p=window.location.pathname;for(var i=0;i<tabs.length;i++){var h=tabs[i].getAttribute('href');if(h&&p.indexOf(h.replace(/^\.\.?\//,''))!==-1)tabs[i].classList.add('is-active')}}
  function init(){initLoader();initNavScroll();initActiveChannel()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
