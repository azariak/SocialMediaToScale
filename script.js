// Constants
const LIVES_LOST_PER_SECOND = 0.18992844156;

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
    milestoneCards: document.querySelectorAll('.milestone-card'),
    introScreen: document.querySelector('.intro-screen'),
    header: document.querySelector('.header'),
    statsBar: document.querySelector('.stats-bar'),
    scrollIndicator: document.querySelector('.scroll-indicator'),
    feed: document.querySelector('.feed')
};

// Initialize card heights based on time data
function initializeCardHeights() {
    elements.milestoneCards.forEach(card => {
        const minutes = parseInt(card.getAttribute('data-time'));
        card.style.height = `${minutes * 100}px`;
    });
}

// Position floating text, mini-cards, images, and videos based on their data-position attribute
function initializeFloatingText() {
    document.querySelectorAll('.floating-text, .mini-card, .positioned-image, .positioned-video').forEach(element => {
        const position = parseFloat(element.getAttribute('data-position'));
        const card = element.closest('.milestone-card');
        if (card && !isNaN(position)) {
            const cardHeight = card.offsetHeight;
            element.style.top = `${position * cardHeight}px`;

            // Handle captions for images and videos
            if (element.classList.contains('positioned-image') || element.classList.contains('positioned-video')) {
                const captionTop = element.getAttribute('data-caption-top');
                const captionBottom = element.getAttribute('data-caption-bottom');
                const cardBody = card.querySelector('.milestone-card-body');

                if (captionTop && cardBody) {
                    const topCaption = document.createElement('div');
                    topCaption.className = 'media-caption-top';
                    topCaption.textContent = captionTop;
                    cardBody.appendChild(topCaption);

                    // Position above the media element (accounting for media height)
                    const mediaCenterY = position * cardHeight;
                    const mediaHeight = element.offsetHeight || element.videoHeight || 0;
                    const mediaTopEdge = mediaCenterY - (mediaHeight / 2);
                    topCaption.style.top = `${mediaTopEdge - 265}px`;
                }

                if (captionBottom && cardBody) {
                    const bottomCaption = document.createElement('div');
                    bottomCaption.className = 'media-caption-bottom';
                    bottomCaption.textContent = captionBottom;
                    cardBody.appendChild(bottomCaption);

                    // Position below the media element (accounting for media height)
                    const mediaCenterY = position * cardHeight;
                    const mediaHeight = element.offsetHeight || element.videoHeight || 0;
                    const mediaBottomEdge = mediaCenterY + (mediaHeight / 2);
                    bottomCaption.style.top = `${mediaBottomEdge + 245}px`;
                }
            }
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

// Update UI visibility based on scroll position (show after intro screen)
function updateUIVisibility() {
    const introBottom = elements.introScreen ? elements.introScreen.offsetHeight : 0;
    const isPassedIntro = window.scrollY > introBottom * 0.5;

    elements.header.classList.toggle('ui-visible', isPassedIntro);
    elements.statsBar.classList.toggle('ui-visible', isPassedIntro);
    elements.progressBar.classList.toggle('ui-visible', isPassedIntro);
}

// Initialize intro screen scroll arrow click
function initializeIntroScreen() {
    if (elements.scrollIndicator && elements.feed) {
        elements.scrollIndicator.addEventListener('click', () => {
            elements.feed.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// Initialize progress bar interactions
function initializeProgressTracking() {
    window.addEventListener('scroll', updateProgressBar);
    window.addEventListener('scroll', updateUIVisibility);
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

// Calculate seconds elapsed since start of current year
function getSecondsThisYear() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return (now - startOfYear) / 1000;
}

// Calculate seconds elapsed since start of today (midnight)
function getSecondsToday() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return (now - startOfDay) / 1000;
}

// Calculate seconds elapsed since site load
function getSecondsSinceLoad() {
    return (Date.now() - state.startTime) / 1000;
}

// Format number with commas and decimal places
function formatStatNumber(num, decimals = 2) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Update stats display
function updateStatsDisplay() {
    const statYear = document.getElementById('statYear');
    const statToday = document.getElementById('statToday');
    const statSince = document.getElementById('statSince');

    if (!statYear || !statToday || !statSince) return;

    const livesThisYear = getSecondsThisYear() * LIVES_LOST_PER_SECOND;
    const livesToday = getSecondsToday() * LIVES_LOST_PER_SECOND;
    const livesSinceLoad = getSecondsSinceLoad() * LIVES_LOST_PER_SECOND;

    statYear.textContent = formatStatNumber(livesThisYear, 2);
    statToday.textContent = formatStatNumber(livesToday, 2);
    statSince.textContent = formatStatNumber(livesSinceLoad, 4);
}

// Initialize stats tracking
function initializeStats() {
    updateStatsDisplay();
    setInterval(updateStatsDisplay, 100); // Update every 100ms for smooth animation
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

        // Add source code link to header
        const modalHeader = modal.querySelector('.sources-modal-header');
        let existingLink = modalHeader.querySelector('.source-code-link');
        if (!existingLink) {
            const sourceCodeLink = document.createElement('div');
            sourceCodeLink.className = 'source-code-link';
            sourceCodeLink.style.cssText = 'font-size: 14px; color: #888; margin-top: 8px; grid-column: 1; grid-row: 2;';
            sourceCodeLink.innerHTML = `View the source code on <a href="https://github.com/azariak/SocialMediaToScale" target="_blank" rel="noopener noreferrer" style="color: #ff4444; text-decoration: none;">GitHub</a>`;
            modalHeader.appendChild(sourceCodeLink);
        }

        // Add stats calculation section
        const statsSection = document.createElement('div');
        statsSection.className = 'source-item';
        statsSection.innerHTML = `
            <h3>Lives Lost Calculation</h3>
            <p>The stats bar shows lives lost based on the following calculation:</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                The world collectively spends <strong>11.5 billion hours</strong> on social media platforms daily.<br>
                <div class="source-link">Source: <a href="https://umaine.edu/undiscoveredmaine/small-business/resources/marketing-for-small-business/social-media-tools/social-media-statistics-details/" target="_blank" rel="noopener noreferrer">University of Maine - Social Media Statistics</a></div><br>
                <strong>Calculation:</strong><br>
                • 80 years in hours: 700,800<br>
                • 11.5 billion ÷ 700,800 = 16,409.82 lives lost per day<br>
                • Seconds in 24 hours: 86,400<br>
                • 16,409.82 ÷ 86,400 = <strong>0.18992 lives lost per second</strong>
            </p>
        `;
        modalBody.appendChild(statsSection);

        // Add milestone cards
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

// Handle attribution modal functionality
function initializeAttributionModal() {
    const isaacLink = document.getElementById('isaacLink');
    const maxLink = document.getElementById('maxLink');
    const modal = document.getElementById('attributionModal');
    const closeButton = document.getElementById('closeAttributionModal');

    if (!isaacLink || !maxLink || !modal || !closeButton) return;

    // Open modal function
    function openModal(e) {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close modal function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners
    isaacLink.addEventListener('click', openModal);
    maxLink.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
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
    initializeStats();
    initializeAttributionModal();
    initializeIntroScreen();
}

// Start the application
init();
