/* GOHSY Fashion TV — Now Playing Bar */
(function(){
  'use strict';
  var isPlaying=false,currentProduct=null,bar=null;
  var playlist=[{title:'Take On Me',artist:'a-ha',emoji:'\u266B'},{title:'Plastic Love',artist:'Mariya Takeuchi',emoji:'\u266A'},{title:'Stay With Me',artist:'Miki Matsubara',emoji:'\u266B'}];
  var trackIndex=0;
  function init(){bar=document.querySelector('.player-bar');if(!bar)return;setTimeout(function(){bar.classList.add('is-visible')},1500);bindControls();updateTrack(playlist[0]);observeProducts()}
  function bindControls(){var play=bar.querySelector('.player-bar__btn--play'),prev=bar.querySelector('[data-action="prev"]'),next=bar.querySelector('[data-action="next"]');
    if(play)play.addEventListener('click',function(){isPlaying=!isPlaying;play.textContent=isPlaying?'\u275A\u275A':'\u25B6'});
    if(prev)prev.addEventListener('click',function(){trackIndex=(trackIndex-1+playlist.length)%playlist.length;updateTrack(playlist[trackIndex])});
    if(next)next.addEventListener('click',function(){trackIndex=(trackIndex+1)%playlist.length;updateTrack(playlist[trackIndex])})}
  function updateTrack(t){var a=bar.querySelector('.player-bar__art'),ti=bar.querySelector('.player-bar__title'),ar=bar.querySelector('.player-bar__artist');if(a)a.textContent=t.emoji;if(ti)ti.textContent=t.title;if(ar)ar.textContent=t.artist}
  function observeProducts(){if(!('IntersectionObserver' in window))return;var ps=document.querySelectorAll('[data-product-id]');if(!ps.length)return;
    var obs=new IntersectionObserver(function(entries){for(var i=0;i<entries.length;i++){if(entries[i].isIntersecting&&entries[i].intersectionRatio>0.3){var el=entries[i].target;setProduct({id:el.dataset.productId,name:el.dataset.productName||'',price:el.dataset.productPrice||'',icon:el.dataset.productIcon||'',url:el.dataset.productUrl||'#'})}}},{threshold:[0.3]});
    for(var j=0;j<ps.length;j++)obs.observe(ps[j])}
  function setProduct(p){if(currentProduct&&currentProduct.id===p.id)return;currentProduct=p;var th=bar.querySelector('.player-bar__thumb'),n=bar.querySelector('.player-bar__product .player-bar__title'),pr=bar.querySelector('.player-bar__product .player-bar__artist'),b=bar.querySelector('.player-bar__buy');if(th)th.textContent=p.icon;if(n)n.textContent=p.name;if(pr)pr.textContent=p.price;if(b)b.setAttribute('href',p.url)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
