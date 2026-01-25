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

// Handle share button functionality
function initializeShareButton() {
    const shareButton = document.getElementById('shareButton');
    if (!shareButton) return;

    shareButton.addEventListener('click', async () => {
        const shareData = {
            title: 'The Cost of Scrolling',
            text: 'An interactive visualization showing the true scale of time spent on social media.',
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                const originalText = shareButton.innerHTML;
                shareButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!';
                setTimeout(() => {
                    shareButton.innerHTML = originalText;
                }, 2000);
            }
        } catch (err) {
            console.log('Share failed:', err);
        }
    });
}

// Handle sources modal functionality
function initializeSourcesModal() {
    const sourcesButton = document.getElementById('sourcesButton');
    const modal = document.getElementById('sourcesModal');
    const closeButton = document.getElementById('closeModal');
    const modalBody = document.getElementById('sourcesModalBody');

    if (!sourcesButton || !modal || !closeButton || !modalBody) return;

    // Populate modal with milestone data
    function populateModal() {
        modalBody.innerHTML = '';

        elements.milestoneCards.forEach(card => {
            const header = card.querySelector('.milestone-card-header');
            const title = header.querySelector('h2')?.textContent || '';
            const description = header.querySelector('p')?.textContent || '';
            const source = card.getAttribute('data-source') || '';

            const sourceItem = document.createElement('div');
            sourceItem.className = 'source-item';

            let content = `<h3>${title}</h3>`;

            if (description) {
                content += `<p>${description}</p>`;
            }

            if (source) {
                content += `<div class="source-link">Source: <a href="${source}" target="_blank" rel="noopener noreferrer">${source}</a></div>`;
            } else {
                content += `<div class="source-link">Source: <span style="color: #555;">No source specified</span></div>`;
            }

            sourceItem.innerHTML = content;
            modalBody.appendChild(sourceItem);
        });
    }

    // Open modal
    sourcesButton.addEventListener('click', () => {
        populateModal();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeButton.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Initialize all components
function init() {
    initializeCardHeights();
    initializeFloatingText();
    initializeProgressMarkers();
    initializeProgressTracking();
    initializeMilestoneTracking();
    initializeTimer();
    initializeShareButton();
    initializeSourcesModal();
}

// Start the application
init();
