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
    feed: document.querySelector('.feed'),
    scaleLabel: document.querySelector('.scale-label')
};

// Initialize card/unit heights based on hours data (area to scale)
function initializeCardHeights() {
    // Scale factor: area proportional to hours
    // Smaller multiplier = smaller cards
    const SCALE_MULTIPLIER = 15;
    const MIN_SIZE = 2; // Minimum pixels for visibility

    // Calculate size from hours (area to scale: side = √hours × multiplier)
    function getSize(hours) {
        return Math.max(Math.sqrt(hours) * SCALE_MULTIPLIER, MIN_SIZE);
    }

    // Handle small scale units (squares in the row)
    document.querySelectorAll('.scale-unit').forEach(unit => {
        const hours = parseFloat(unit.getAttribute('data-hours'));
        const size = getSize(hours);
        unit.style.width = `${size}px`;
        unit.style.height = `${size}px`;
    });

    // Handle milestone cards with data-hours attribute
    // Cards are full width, height varies so area is to scale
    // Using same area formula: area = hours × SCALE_MULTIPLIER²
    // With fixed width, height = (hours × SCALE_MULTIPLIER²) / width
    const cardWidth = elements.feed ? elements.feed.offsetWidth - 80 : 520;
    elements.milestoneCards.forEach(card => {
        const hours = parseFloat(card.getAttribute('data-hours'));
        if (hours) {
            // Height calculated so area is proportional to hours
            const area = hours * (SCALE_MULTIPLIER * SCALE_MULTIPLIER);
            const height = area / cardWidth;
            card.style.height = `${height}px`;
        }
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

// Calculate total hours from all scale units and cards
function getTotalHours() {
    let total = 0;
    document.querySelectorAll('.scale-unit, .milestone-card').forEach(el => {
        total += parseFloat(el.getAttribute('data-hours')) || 0;
    });
    return total;
}

// Update progress bar fill based on scroll position
function updateProgressBar() {
    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    elements.progressFill.style.height = `${scrollPercent}%`;

    // Update scale label
    if (elements.scaleLabel) {
        const totalHours = getTotalHours();
        const currentHours = (scrollPercent / 100) * totalHours;

        // Format hours display with appropriate units
        let displayText;
        if (currentHours < 1) {
            displayText = `${Math.round(currentHours * 60)} min`;
        } else if (currentHours < 24) {
            displayText = `${currentHours.toFixed(1)} hrs`;
        } else if (currentHours < 8760) { // Less than a year
            const days = currentHours / 24;
            displayText = `${days.toFixed(0)} days`;
        } else if (currentHours < 1000000) {
            const years = currentHours / 8760;
            displayText = `${years.toFixed(1)} yrs`;
        } else if (currentHours < 1000000000) {
            displayText = `${(currentHours / 1000000).toFixed(1)}M hrs`;
        } else {
            displayText = `${(currentHours / 1000000000).toFixed(1)}B hrs`;
        }

        elements.scaleLabel.textContent = displayText;
        elements.scaleLabel.style.top = `${scrollPercent}%`;
    }
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

// Handle sticky headers for all milestone cards via JS
function updateStickyHeaders() {
    const stickyTop = window.innerWidth <= 640 ? 156 : 153;

    elements.milestoneCards.forEach(card => {
        const header = card.querySelector('.milestone-card-header');
        if (!header) return;

        const cardRect = card.getBoundingClientRect();
        const cardPadding = parseFloat(getComputedStyle(card).paddingTop) || 0;
        const headerHeight = header.offsetHeight;

        // Top of card content area (after padding)
        const cardContentTop = cardRect.top + cardPadding;
        // Bottom of card minus header height so header doesn't overflow
        const cardBottom = cardRect.bottom - headerHeight - 20;

        if (cardContentTop <= stickyTop && cardBottom > stickyTop) {
            // Header should be stuck
            if (!header.classList.contains('is-stuck')) {
                // Create placeholder to prevent layout shift
                if (!header._placeholder) {
                    const placeholder = document.createElement('div');
                    placeholder.style.height = headerHeight + 'px';
                    placeholder.className = 'sticky-placeholder';
                    header.parentNode.insertBefore(placeholder, header);
                    header._placeholder = placeholder;
                }
                header.classList.add('is-stuck');
                header.style.left = cardRect.left + 'px';
                header.style.width = cardRect.width + 'px';
            } else {
                // Update position in case of resize
                header.style.left = cardRect.left + 'px';
                header.style.width = cardRect.width + 'px';
            }
        } else {
            // Header should not be stuck
            if (header.classList.contains('is-stuck')) {
                header.classList.remove('is-stuck');
                header.style.left = '';
                header.style.width = '';
                if (header._placeholder) {
                    header._placeholder.remove();
                    header._placeholder = null;
                }
            }
        }
    });
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
    window.addEventListener('scroll', updateStickyHeaders);
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

        // Add intro screen stat source
        const introSection = document.createElement('div');
        introSection.className = 'source-item';
        introSection.innerHTML = `
            <h3>Daily Phone Usage</h3>
            <p>The average person spends <strong>5.27 hours</strong> on their phone every day.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Calculation:</strong> 5 hours 16 minutes = 5 + (16 ÷ 60) = <strong>5.27 hours</strong>
            </p>
            <div class="source-link">Source: <a href="https://www.harmonyhit.com/phone-screen-time-statistics/" target="_blank" rel="noopener noreferrer">HarmonyHit - Phone Screen Time Statistics</a></div>
        `;
        modalBody.appendChild(introSection);

        // Add stats calculation section
        const statsSection = document.createElement('div');
        statsSection.className = 'source-item';
        statsSection.innerHTML = `
            <h3>Lives Lost Calculation</h3>
            <p>The world collectively spends <strong>11.5 billion hours</strong> on social media platforms daily.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Calculation:</strong><br>
                • 80 years in hours: 700,800<br>
                • 11.5 billion ÷ 700,800 = 16,409.82 lives lost per day<br>
                • Seconds in 24 hours: 86,400<br>
                • 16,409.82 ÷ 86,400 = <strong>0.18992 lives lost per second</strong>
            </p>
            <div class="source-link">Source: <a href="https://umaine.edu/undiscoveredmaine/small-business/resources/marketing-for-small-business/social-media-tools/social-media-statistics-details/" target="_blank" rel="noopener noreferrer">University of Maine - Social Media Statistics</a></div>
        `;
        modalBody.appendChild(statsSection);

        // Add scale units info
        const scaleUnits = document.querySelectorAll('.scale-unit');
        scaleUnits.forEach(unit => {
            const hours = unit.getAttribute('data-hours');
            const label = unit.querySelector('.scale-label-inline');
            if (label) {
                const sourceItem = document.createElement('div');
                sourceItem.className = 'source-item';
                sourceItem.innerHTML = `
                    <h3>${hours} Hour${hours !== '1' ? 's' : ''}</h3>
                    <p>Visual scale unit (1 hour = 1 pixel)</p>
                `;
                modalBody.appendChild(sourceItem);
            }
        });

        // Add massive card info
        elements.milestoneCards.forEach(card => {
            const header = card.querySelector('.milestone-card-header');
            if (!header) return;

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

// Autoplay brainrot video with sound when visible
function initializeBrainrotVideo() {
    const video = document.getElementById('brainrot-video');
    if (!video) return;

    video.muted = true;
    let playing = false;
    let userHasInteracted = false;

    // Track any user interaction so we know we can unmute
    const markInteracted = () => { userHasInteracted = true; };
    document.addEventListener('click', markInteracted, { once: true });
    document.addEventListener('touchstart', markInteracted, { once: true });
    document.addEventListener('scroll', markInteracted, { once: true });

    function tryPlay() {
        if (userHasInteracted) {
            video.muted = false;
            video.play().catch(() => {
                // Unmuted play blocked, fall back to muted
                video.muted = true;
                video.play();
            });
        } else {
            // No interaction yet, play muted then unmute when possible
            video.muted = true;
            video.play().then(() => {
                if (userHasInteracted) video.muted = false;
            }).catch(() => {});
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !playing) {
                playing = true;
                tryPlay();
            } else if (!entry.isIntersecting && playing) {
                playing = false;
                video.pause();
            }
        });
    }, { threshold: 0.1 });

    observer.observe(video);

    // If already playing muted and user interacts, unmute
    document.addEventListener('click', () => { if (playing) video.muted = false; }, { once: true });
    document.addEventListener('touchstart', () => { if (playing) video.muted = false; }, { once: true });
}

// Convert tall cards from absolute positioning to normal flow with sticky elements
function initializeStickyFloating() {
    const MIN_CARD_HEIGHT = 5000; // Only convert cards taller than this
    const STICKY_DISTANCE = 3000; // ~5 seconds of scrolling

    document.querySelectorAll('.milestone-card').forEach(card => {
        if (card.offsetHeight < MIN_CARD_HEIGHT) return;

        const cardBody = card.querySelector('.milestone-card-body');
        if (!cardBody) return;

        // Enable sticky support on this card
        card.style.overflow = 'visible';
        cardBody.style.overflow = 'visible';
        cardBody.style.display = 'block';

        // Collect elements and their computed top positions (set by initializeFloatingText)
        const els = Array.from(cardBody.querySelectorAll('.floating-text, .mini-card, .positioned-video'));
        if (els.length === 0) return;

        const items = els.map(el => ({
            el,
            top: parseFloat(el.style.top) || 0
        }));
        items.sort((a, b) => a.top - b.top);

        // Collect captions generated by initializeFloatingText for videos
        const captionTops = Array.from(cardBody.querySelectorAll('.media-caption-top'));
        const captionBottoms = Array.from(cardBody.querySelectorAll('.media-caption-bottom'));

        // Build new normal-flow structure
        const fragment = document.createDocumentFragment();

        items.forEach((item, i) => {
            const section = document.createElement('div');
            section.className = 'sticky-section';

            // Section height = distance to next element's position, or STICKY_DISTANCE for last
            const nextTop = (i < items.length - 1) ? items[i + 1].top : item.top + STICKY_DISTANCE;
            const sectionHeight = Math.max(STICKY_DISTANCE, nextTop - item.top);
            section.style.height = sectionHeight + 'px';

            // For videos, wrap with captions in a sticky container
            if (item.el.classList.contains('positioned-video')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'sticky-video-wrapper';

                // Add top caption if exists
                if (captionTops.length > 0) {
                    const cap = captionTops.shift();
                    cap.removeAttribute('style');
                    wrapper.appendChild(cap);
                }

                item.el.removeAttribute('style');
                wrapper.appendChild(item.el);

                // Add bottom caption if exists
                if (captionBottoms.length > 0) {
                    const cap = captionBottoms.shift();
                    cap.removeAttribute('style');
                    wrapper.appendChild(cap);
                }

                section.appendChild(wrapper);
            } else {
                item.el.removeAttribute('style');
                section.appendChild(item.el);
            }

            fragment.appendChild(section);
        });

        // Replace card body contents with new flow layout
        cardBody.innerHTML = '';
        cardBody.appendChild(fragment);
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
    initializeBrainrotVideo();
    initializeStickyFloating();
}

// Start the application
init();
