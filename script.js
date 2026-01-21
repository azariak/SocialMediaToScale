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
    milestoneCards: document.querySelectorAll('.milestone-card')
};

// Initialize card heights based on time data
function initializeCardHeights() {
    elements.milestoneCards.forEach(card => {
        const minutes = parseInt(card.getAttribute('data-time'));
        card.style.height = `${minutes * 100}px`;
    });
}

// Position floating text, mini-cards, and images based on their data-position attribute
function initializeFloatingText() {
    document.querySelectorAll('.floating-text, .mini-card, .positioned-image').forEach(element => {
        const position = parseFloat(element.getAttribute('data-position'));
        const card = element.closest('.milestone-card');
        if (card && !isNaN(position)) {
            const cardHeight = card.offsetHeight;
            element.style.top = `${position * cardHeight}px`;
        }
    });
}

// Create progress markers for each milestone
function initializeProgressMarkers() {
    setTimeout(() => {
        elements.milestoneCards.forEach(card => {
            const marker = document.createElement('div');
            marker.className = 'progress-marker';
            const header = card.querySelector('.milestone-card-header');
            const offset = card.offsetTop + (header ? header.offsetTop : 40);
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

// Format timer text based on elapsed time
function formatTimerText(elapsed) {
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    if (minutes > 0) {
        return `You've been scrolling for ${minutes}m ${seconds}s... that's time you'll never get back`;
    } else {
        return `You've been scrolling for ${seconds} seconds...`;
    }
}

// Update subtitle display
function updateSubtitleDisplay() {
    if (state.currentMilestone) {
        elements.subtitle.textContent = state.currentMilestone;
    } else {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        elements.subtitle.textContent = formatTimerText(elapsed);
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
            const customSubtitle = entry.target.getAttribute('data-subtitle');

            if (entry.isIntersecting && customSubtitle) {
                state.currentMilestone = customSubtitle;
            } else if (!entry.isIntersecting && customSubtitle === state.currentMilestone) {
                state.currentMilestone = null;
            }
        });
    }, observerOptions);

    elements.milestoneCards.forEach(card => observer.observe(card));
}

// Initialize timer display
function initializeTimer() {
    setInterval(updateSubtitleDisplay, 1000);
}

// Initialize all components
function init() {
    initializeCardHeights();
    initializeFloatingText();
    initializeProgressMarkers();
    initializeProgressTracking();
    initializeMilestoneTracking();
    initializeTimer();
}

// Start the application
init();
