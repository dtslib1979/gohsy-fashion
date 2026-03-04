/* GOHSY Fashion TV — Now Playing Bar + YouTube Playback
   ───────────────────────────────────────────────────────
   - 페이지 오픈 시 muted 자동 재생 (브라우저 정책 준수)
   - 첫 인터랙션(클릭/터치/스크롤) 감지 → 자동 unmute
   - prev / play / next 실제 YouTube 재생 제어
   ─────────────────────────────────────────────────────── */
(function(){
  'use strict';

  var playlist = [
    { title: 'Take On Me',  artist: 'a-ha',              emoji: '\u266B', videoId: 'djV11Xbc914' },
    { title: 'Plastic Love', artist: 'Mariya Takeuchi',   emoji: '\u266A', videoId: '3bNITQR4Uso' },
    { title: 'Stay With Me', artist: 'Miki Matsubara',    emoji: '\u266B', videoId: 'JMi3CPB4yB0' }
  ];

  var trackIndex = 0;
  var ytPlayer = null;
  var bar = null;
  var isPlaying = false;
  var isMuted = true;
  var userInteracted = false;
  var currentProduct = null;
  var muteHint = null;

  /* ── Init ── */
  function init() {
    bar = document.querySelector('.player-bar');
    if (!bar) return;

    setTimeout(function(){ bar.classList.add('is-visible'); }, 1500);
    bindControls();
    updateTrackUI(playlist[0]);
    observeProducts();
    loadYouTubeAPI();
    listenForInteraction();
    createMuteHint();
  }

  /* ── YouTube IFrame API 로드 ── */
  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(tag, first);
  }

  window.onYouTubeIframeAPIReady = function() {
    createPlayer();
  };

  function createPlayer() {
    var container = document.createElement('div');
    container.id = 'ytPlayer';
    container.style.cssText = 'position:fixed;width:1px;height:1px;bottom:0;left:-9999px;opacity:0;pointer-events:none;overflow:hidden';
    document.body.appendChild(container);

    ytPlayer = new YT.Player('ytPlayer', {
      width: '1',
      height: '1',
      videoId: playlist[0].videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError
      }
    });
  }

  function onPlayerReady(e) {
    e.target.mute();
    e.target.playVideo();
    isPlaying = true;
    isMuted = true;
    updatePlayBtn();
  }

  function onPlayerStateChange(e) {
    if (e.data === YT.PlayerState.ENDED) {
      trackIndex = (trackIndex + 1) % playlist.length;
      loadTrack(trackIndex);
      return;
    }
    isPlaying = (e.data === YT.PlayerState.PLAYING);
    updatePlayBtn();
  }

  function onPlayerError() {
    /* 재생 실패 시 다음 트랙으로 */
    trackIndex = (trackIndex + 1) % playlist.length;
    loadTrack(trackIndex);
  }

  /* ── 첫 인터랙션 감지 → unmute ── */
  function listenForInteraction() {
    var events = ['click', 'touchstart', 'scroll', 'keydown'];

    function handle() {
      if (userInteracted) return;
      userInteracted = true;

      if (ytPlayer && typeof ytPlayer.unMute === 'function') {
        ytPlayer.unMute();
        ytPlayer.setVolume(80);
        isMuted = false;
      }

      hideMuteHint();

      /* 플레이어 아트 accent 플래시 */
      var art = bar ? bar.querySelector('.player-bar__art') : null;
      if (art) {
        art.style.background = 'var(--accent)';
        art.style.transition = 'background 0.6s ease';
        setTimeout(function(){ art.style.background = ''; }, 800);
      }

      for (var i = 0; i < events.length; i++) {
        document.removeEventListener(events[i], handle);
      }
    }

    for (var i = 0; i < events.length; i++) {
      document.addEventListener(events[i], handle, { passive: true });
    }
  }

  /* ── 🔇 Mute 힌트 ── */
  function createMuteHint() {
    muteHint = document.createElement('div');
    muteHint.className = 'player-bar__mute-hint';
    muteHint.textContent = '\uD83D\uDD07 Tap to unmute';
    muteHint.style.cssText = [
      'position:absolute;top:-32px;left:50%;transform:translateX(-50%)',
      'padding:4px 12px;font-size:11px;letter-spacing:0.05em',
      'background:rgba(255,255,255,0.08);color:var(--text-3)',
      'border-radius:20px;white-space:nowrap;pointer-events:none',
      'opacity:0;transition:opacity 0.4s ease'
    ].join(';');
    if (bar) {
      bar.style.position = bar.style.position || 'fixed';
      bar.appendChild(muteHint);
      setTimeout(function(){ if (muteHint) muteHint.style.opacity = '1'; }, 2000);
    }
  }

  function hideMuteHint() {
    if (!muteHint) return;
    muteHint.style.opacity = '0';
    setTimeout(function(){
      if (muteHint && muteHint.parentNode) muteHint.parentNode.removeChild(muteHint);
      muteHint = null;
    }, 400);
  }

  /* ── 컨트롤 바인딩 ── */
  function bindControls() {
    var playBtn = document.getElementById('playerPlay');
    var prevBtn = document.getElementById('playerPrev');
    var nextBtn = document.getElementById('playerNext');

    if (playBtn) playBtn.addEventListener('click', function() { togglePlay(); });
    if (prevBtn) prevBtn.addEventListener('click', function() {
      trackIndex = (trackIndex - 1 + playlist.length) % playlist.length;
      loadTrack(trackIndex);
    });
    if (nextBtn) nextBtn.addEventListener('click', function() {
      trackIndex = (trackIndex + 1) % playlist.length;
      loadTrack(trackIndex);
    });
  }

  function togglePlay() {
    if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') return;

    if (isPlaying) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
      /* 재생 버튼 직접 누르면 unmute */
      if (isMuted && ytPlayer.unMute) {
        ytPlayer.unMute();
        ytPlayer.setVolume(80);
        isMuted = false;
        userInteracted = true;
        hideMuteHint();
      }
    }
  }

  function loadTrack(index) {
    var track = playlist[index];
    updateTrackUI(track);
    if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
      ytPlayer.loadVideoById(track.videoId);
    }
  }

  /* ── UI 업데이트 ── */
  function updatePlayBtn() {
    var btn = document.getElementById('playerPlay');
    if (btn) btn.textContent = isPlaying ? '\u275A\u275A' : '\u25B6';
  }

  function updateTrackUI(t) {
    var art   = document.getElementById('playerBar') && bar.querySelector('.player-bar__art');
    var title  = document.getElementById('playerTitle');
    var artist = document.getElementById('playerArtist');
    if (art)    art.textContent = t.emoji;
    if (title)  title.textContent = t.title;
    if (artist) artist.textContent = t.artist;
  }

  /* ── 상품 카드 트래킹 ── */
  function observeProducts() {
    if (!('IntersectionObserver' in window)) return;
    var ps = document.querySelectorAll('[data-product-id]');
    if (!ps.length) return;
    var obs = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting && entries[i].intersectionRatio > 0.3) {
          var el = entries[i].target;
          setProduct({
            id:    el.dataset.productId,
            name:  el.dataset.productName  || '',
            price: el.dataset.productPrice || '',
            icon:  el.dataset.productIcon  || '',
            url:   el.dataset.productUrl   || '#'
          });
        }
      }
    }, { threshold: [0.3] });
    for (var j = 0; j < ps.length; j++) obs.observe(ps[j]);
  }

  function setProduct(p) {
    if (currentProduct && currentProduct.id === p.id) return;
    currentProduct = p;
    if (!bar) return;
    var th = bar.querySelector('.player-bar__thumb');
    var n  = bar.querySelector('.player-bar__product .player-bar__title');
    var pr = bar.querySelector('.player-bar__product .player-bar__artist');
    var b  = bar.querySelector('.player-bar__buy');
    if (th) th.textContent = p.icon;
    if (n)  n.textContent = p.name;
    if (pr) pr.textContent = p.price;
    if (b)  b.setAttribute('href', p.url);
  }

  /* ── 부트 ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
