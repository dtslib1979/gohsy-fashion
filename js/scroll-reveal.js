/* GOHSY Fashion TV — Scroll Reveal */
(function(){
  'use strict';
  function init(){
    if(!('IntersectionObserver' in window)){var els=document.querySelectorAll('.reveal,.reveal-text');for(var i=0;i<els.length;i++)els[i].classList.add('is-visible');return}
    var observer=new IntersectionObserver(function(entries){for(var i=0;i<entries.length;i++){if(entries[i].isIntersecting){entries[i].target.classList.add('is-visible');observer.unobserve(entries[i].target)}}},{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
    var targets=document.querySelectorAll('.reveal,.reveal-text');for(var j=0;j<targets.length;j++)observer.observe(targets[j]);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
