/* ═══════════════════════════════════════════
   DONGSEON STUDIO - ELEVATOR NAVIGATION
   Floor Access Control + Password System
   ═══════════════════════════════════════════ */

const DongseonBuilding = {
  // Floor passwords (hashed in production)
  passwords: {
    '2f': '1126',          // 자동화 센터
    '3f': '1126',          // 프로덕션 스튜디오
    '4f': '1126'           // 대제학실
  },

  // Floor definitions
  floors: {
    '1f': {
      name: 'Lobby',
      nameKo: '로비',
      locked: false,
      url: 'floors/1f/index.html'
    },
    '2f': {
      name: 'Automation Center',
      nameKo: '자동화 센터',
      locked: true,
      url: 'floors/2f/index.html'
    },
    '3f': {
      name: 'Production Studio',
      nameKo: '프로덕션 스튜디오',
      locked: true,
      url: 'floors/3f/index.html'
    },
    '4f': {
      name: 'Daejehak Office',
      nameKo: '대제학실',
      locked: true,
      url: 'floors/4f/index.html'
    }
  },

  // Check if floor is unlocked
  isUnlocked(floor) {
    if (!this.floors[floor].locked) return true;
    return localStorage.getItem(`dongseon_${floor}_unlocked`) === 'true';
  },

  // Unlock floor with password
  unlock(floor, password) {
    if (password === this.passwords[floor]) {
      localStorage.setItem(`dongseon_${floor}_unlocked`, 'true');
      return true;
    }
    return false;
  },

  // Navigate to floor
  goToFloor(floor) {
    if (!this.floors[floor]) return;

    if (this.isUnlocked(floor)) {
      window.location.href = this.floors[floor].url;
    } else {
      this.showPasswordModal(floor);
    }
  },

  // Show password modal
  showPasswordModal(floor) {
    const modal = document.getElementById('passwordModal');
    const floorLabel = document.getElementById('floorLabel');
    const passwordInput = document.getElementById('passwordInput');

    if (!modal) return;

    floorLabel.textContent = `${floor.toUpperCase()} - ${this.floors[floor].nameKo}`;
    modal.dataset.floor = floor;
    modal.classList.add('active');
    passwordInput.value = '';
    passwordInput.focus();
  },

  // Hide password modal
  hidePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  // Handle password submit
  handlePasswordSubmit() {
    const modal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const floor = modal.dataset.floor;
    const password = passwordInput.value;

    if (this.unlock(floor, password)) {
      this.hidePasswordModal();
      this.updateUI();
      this.goToFloor(floor);
    } else {
      passwordInput.classList.add('error');
      passwordInput.value = '';
      setTimeout(() => {
        passwordInput.classList.remove('error');
      }, 500);
    }
  },

  // Update UI based on unlock status
  updateUI() {
    document.querySelectorAll('.floor').forEach(floorEl => {
      const floor = floorEl.dataset.floor;
      const lockIcon = floorEl.querySelector('.lock-icon');

      if (this.isUnlocked(floor)) {
        lockIcon.textContent = '🔓';
        lockIcon.classList.remove('locked');
        lockIcon.classList.add('unlocked');
      }
    });

    document.querySelectorAll('.elevator-btn').forEach(btn => {
      const floor = btn.dataset.floor;
      if (this.isUnlocked(floor)) {
        btn.classList.remove('locked');
      }
    });
  },

  // Initialize
  init() {
    this.updateUI();

    // Floor click handlers
    document.querySelectorAll('.floor').forEach(floorEl => {
      floorEl.addEventListener('click', () => {
        const floor = floorEl.dataset.floor;
        this.goToFloor(floor);
      });
    });

    // Elevator button handlers
    document.querySelectorAll('.elevator-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const floor = btn.dataset.floor;
        this.goToFloor(floor);
      });
    });

    // Password modal handlers
    const submitBtn = document.getElementById('passwordSubmit');
    const cancelBtn = document.getElementById('passwordCancel');
    const passwordInput = document.getElementById('passwordInput');
    const modal = document.getElementById('passwordModal');

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.handlePasswordSubmit());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hidePasswordModal());
    }

    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handlePasswordSubmit();
        }
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hidePasswordModal();
        }
      });
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  DongseonBuilding.init();
});
