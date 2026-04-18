const closeToggleBtn = document.getElementById('closeToggleBtn');
const mainToggleBtn = document.getElementById('mainToggleBtn');
const sidebar = document.getElementById('leftNavBar');
const toggleBtn = document.getElementById('toggleBtn');
const mainToggleBtnDiv = document.querySelector('.main-toggle-btn-div');
const overlay = document.getElementById('overlay');

function toggleSmallScreenBtn() {
  sidebar.classList.add('open');
  overlay.classList.add('active')
}

function toggleBigScreenBtn() {
  sidebar.classList.remove('active');
  toggleBtn.style.display = 'none'
}

function openBigScreenNav () {
  sidebar.classList.remove('active');
  mainToggleBtn.style.display = 'none'
}

function openSmallScreenNav () {
  sidebar.classList.add('open');
  mainToggleBtn.style.display = 'none'
  overlay.classList.add('active')
}

function closeBigScreenNav() {
  sidebar.classList.add('active');
  mainToggleBtn.style.display = 'block'
  mainToggleBtnDiv.style.display = 'block'
  toggleBtn.style.display = 'block'
}

function closeSmallScreenNav() {
  sidebar.classList.remove('open');
  mainToggleBtn.style.display = 'block'
  mainToggleBtnDiv.style.display = 'block'
  overlay.classList.remove('active')
}

const mediaQuery = window.matchMedia('(max-width: 700px)');


function handleScreenChange(e) {
  if (e.matches) {
    // Screen is ≤ 700px
    toggleBtn.addEventListener('click', toggleSmallScreenBtn);
    toggleBtn.removeEventListener('click', toggleBigScreenBtn);
    mainToggleBtn.addEventListener('click', openSmallScreenNav);
    mainToggleBtn.removeEventListener('click', openBigScreenNav);
    closeToggleBtn.addEventListener('click', closeSmallScreenNav);
    closeToggleBtn.removeEventListener('click', closeBigScreenNav);
  } else {
    // Screen is > 700px
    toggleBtn.removeEventListener('click', toggleSmallScreenBtn);
    toggleBtn.addEventListener('click', toggleBigScreenBtn);
    mainToggleBtn.removeEventListener('click', openSmallScreenNav);
    mainToggleBtn.addEventListener('click', openBigScreenNav);
    closeToggleBtn.removeEventListener('click', closeSmallScreenNav);
    closeToggleBtn.addEventListener('click', closeBigScreenNav);
  }
}

// Run on load
handleScreenChange(mediaQuery);

// Listen for screen resize changes
mediaQuery.addEventListener('change', handleScreenChange);

// Close navbar when clicking outside
overlay.addEventListener('click', (e) => {
  if(e.target === overlay) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    mainToggleBtn.style.display = 'block'
    mainToggleBtnDiv.style.display = 'block'
  }
});