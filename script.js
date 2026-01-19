// State
const state = {
    startTime: Date.now(),
    isDragging: false,
    currentMilestone: null
};

// Elements
const elements = {
    subtitle: document.querySelector('.subtitle'),
    progressFill: document.querySelector('.progress-fill'),
    progressBar: document.querySelector('.progress-bar'),
    posts: document.querySelectorAll('.post')
};

// Initialize card heights based on time data
function initializeCardHeights() {
    elements.posts.forEach(post => {
        const minutes = parseInt(post.getAttribute('data-time'));
        post.style.height = `${minutes * 100}px`;
    });
}

// Create progress markers for each milestone
function initializeProgressMarkers() {
    setTimeout(() => {
        elements.posts.forEach(post => {
            const marker = document.createElement('div');
            marker.className = 'progress-marker';
            const offset = post.offsetTop;
            const percent = (offset / document.body.scrollHeight) * 100;
            marker.style.top = `${percent}%`;
            elements.progressBar.appendChild(marker);
        });
    }, 100);
}

// Update progress bar fill based on scroll position
function updateProgressBar() {
    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    elements.progressFill.style.height = `${scrollPercent}%`;
}

// Handle progress bar click to jump to position
function handleProgressBarClick(e) {
    const percent = e.clientY / window.innerHeight;
    const scrollTo = percent * (document.body.scrollHeight - window.innerHeight);
    window.scrollTo({ top: scrollTo, behavior: 'smooth' });
}

// Handle progress bar drag functionality
function handleProgressBarDrag(e) {
    if (state.isDragging) {
        const percent = e.clientY / window.innerHeight;
        const scrollTo = percent * (document.body.scrollHeight - window.innerHeight);
        window.scrollTo({ top: scrollTo });
    }
}

// Initialize progress bar interactions
function initializeProgressTracking() {
    window.addEventListener('scroll', updateProgressBar);
    elements.progressBar.addEventListener('click', handleProgressBarClick);
    elements.progressFill.addEventListener('mousedown', (e) => {
        state.isDragging = true;
        e.preventDefault();
    });
    window.addEventListener('mousemove', handleProgressBarDrag);
    window.addEventListener('mouseup', () => state.isDragging = false);
}

// Update subtitle based on current milestone
function updateMilestoneSubtitle(post) {
    const customSubtitle = post.getAttribute('data-subtitle');
    if (customSubtitle && customSubtitle !== state.currentMilestone) {
        state.currentMilestone = customSubtitle;
        elements.subtitle.textContent = customSubtitle;
    }
}

// Initialize milestone tracking with Intersection Observer
function initializeMilestoneTracking() {
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateMilestoneSubtitle(entry.target);
            }
        });
    }, observerOptions);

    elements.posts.forEach(post => observer.observe(post));
}

// Initialize timer display
function initializeTimer() {
    setInterval(() => {
        if (state.currentMilestone) return;

        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        if (minutes > 0) {
            elements.subtitle.textContent = `You've been scrolling for ${minutes}m ${seconds}s... that's time you'll never get back`;
        } else {
            elements.subtitle.textContent = `You've been scrolling for ${seconds} seconds...`;
        }
    }, 1000);
}

// Initialize all components
function init() {
    initializeCardHeights();
    initializeProgressMarkers();
    initializeProgressTracking();
    initializeMilestoneTracking();
    initializeTimer();
}

// Start the application
init();
