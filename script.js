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
    gateSection: document.querySelector('.gate-section'),
    statsExplainer: document.querySelector('.stats-explainer'),
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

    // Size mini cards proportionally to their parent milestone card
    document.querySelectorAll('.mini-card[data-hours]').forEach(miniCard => {
        const hours = parseFloat(miniCard.getAttribute('data-hours'));
        const parentCard = miniCard.closest('.milestone-card');
        if (!hours || !parentCard) return;
        const parentHours = parseFloat(parentCard.getAttribute('data-hours'));
        if (!parentHours) return;
        // Mini card height = same fraction of parent card height as hours fraction
        const parentHeight = parentCard.offsetHeight;
        const miniHeight = (hours / parentHours) * parentHeight;
        miniCard.style.height = `${Math.max(miniHeight, 60)}px`; // min 60px for readability
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

// Create progress markers for each milestone + year tick marks
function initializeProgressMarkers() {
    setTimeout(() => {
        const totalScrollHeight = document.body.scrollHeight;
        const feedTop = elements.feed ? elements.feed.offsetTop : 0;
        const totalHours = getTotalHours();
        const hoursPerYear = 8760;

        // Major ticks at each milestone card
        elements.milestoneCards.forEach(card => {
            const marker = document.createElement('div');
            marker.className = 'progress-marker';
            const header = card.querySelector('.milestone-card-header');
            const offset = card.offsetTop + (header ? header.offsetTop : 40);
            const percent = (offset / totalScrollHeight) * 100;
            marker.style.top = `${percent}%`;
            elements.progressBar.appendChild(marker);
        });

        // Minor ticks at each year interval
        // Map hours to scroll position: hours are distributed proportionally across the feed area
        const feedBottom = totalScrollHeight; // feed extends to end
        const feedHeight = feedBottom - feedTop;

        for (let year = 25; year * hoursPerYear < totalHours; year += 25) {
            const hoursFraction = (year * hoursPerYear) / totalHours;
            const scrollOffset = feedTop + hoursFraction * feedHeight;
            const percent = (scrollOffset / totalScrollHeight) * 100;

            if (percent > 0 && percent < 100) {
                const isMajor = year % 50 === 0;
                const tick = document.createElement('div');
                tick.className = isMajor ? 'progress-marker-year-major' : 'progress-marker-year';
                tick.style.top = `${percent}%`;
                elements.progressBar.appendChild(tick);

                // Add label at every 50-year tick
                if (isMajor) {
                    const label = document.createElement('span');
                    label.className = 'progress-marker-year-label';
                    label.textContent = `${year}y`;
                    label.style.top = `${percent}%`;
                    elements.progressBar.appendChild(label);
                }
            }
        }
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

    // Clip progress bar to end at bottom of last milestone card
    const lastCard = elements.milestoneCards[elements.milestoneCards.length - 1];
    if (lastCard) {
        const barTop = 110; // fixed top position of progress bar
        const cardBottom = lastCard.offsetTop + lastCard.offsetHeight;
        const visibleCardBottom = cardBottom - window.scrollY;
        const maxBarHeight = Math.max(0, visibleCardBottom - barTop);
        const fullBarHeight = window.innerHeight - barTop;
        const barHeight = Math.min(maxBarHeight, fullBarHeight);
        elements.progressBar.style.height = barHeight + 'px';

        // Hide entire progress bar when fully collapsed
        const isCollapsed = barHeight <= 0;
        elements.progressBar.style.display = isCollapsed ? 'none' : '';
        if (elements.scaleLabel) {
            elements.scaleLabel.style.display = isCollapsed ? 'none' : '';
        }
        elements.progressBar.querySelectorAll('.progress-marker-year-label').forEach(l => {
            l.style.display = isCollapsed ? 'none' : '';
        });
    }

    // Update scale label — hours start at 0 when user reaches the feed (squares)
    if (elements.scaleLabel) {
        const feedTop = elements.feed ? elements.feed.offsetTop : 0;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const feedStartPercent = feedTop / maxScroll;
        const totalHours = getTotalHours();

        let currentHours = 0;
        if (scrollPercent / 100 > feedStartPercent) {
            const feedProgress = (scrollPercent / 100 - feedStartPercent) / (1 - feedStartPercent);
            currentHours = feedProgress * totalHours;
        }

        // Format hours display with appropriate units
        let displayText;
        if (currentHours < 1) {
            displayText = `${Math.round(currentHours * 60)} min`;
        } else if (currentHours < 24) {
            displayText = `${currentHours.toFixed(1)} hrs`;
        } else if (currentHours < 8760) { // Less than a year
            const days = currentHours / 24;
            displayText = `${days.toFixed(0)} days`;
        } else {
            const years = currentHours / 8760;
            displayText = `${years.toFixed(1)} yrs`;
        }

        elements.scaleLabel.textContent = displayText;
        elements.scaleLabel.style.top = `${scrollPercent}%`;
    }
}

// Calculate scroll position from a click/drag Y coordinate on the progress bar
function getScrollFromBarY(clientY) {
    const barRect = elements.progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientY - barRect.top) / barRect.height));
    return percent * (document.body.scrollHeight - window.innerHeight);
}

// Handle progress bar click to jump to position
function handleProgressBarClick(e) {
    window.scrollTo({ top: getScrollFromBarY(e.clientY), behavior: 'smooth' });
}

// Handle progress bar drag functionality
function handleProgressBarDrag(e) {
    if (state.isDragging) {
        window.scrollTo({ top: getScrollFromBarY(e.clientY) });
    }
}

// Handle sticky headers for all milestone cards via JS
function updateStickyHeaders() {
    const stickyTop = window.innerWidth <= 640 ? 156 : 153;

    elements.milestoneCards.forEach(card => {
        const header = card.querySelector('.milestone-card-header');
        if (!header) return;

        const cardRect = card.getBoundingClientRect();
        const cardStyles = getComputedStyle(card);
        const cardPaddingTop = parseFloat(cardStyles.paddingTop) || 0;
        const cardPaddingLeft = parseFloat(cardStyles.paddingLeft) || 0;
        const cardPaddingRight = parseFloat(cardStyles.paddingRight) || 0;
        const headerHeight = header.offsetHeight;

        // Content width (excluding card padding)
        const contentWidth = cardRect.width - cardPaddingLeft - cardPaddingRight;
        const contentLeft = cardRect.left + cardPaddingLeft;

        // Top of card content area (after padding)
        const cardContentTop = cardRect.top + cardPaddingTop;
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
                header.style.left = contentLeft + 'px';
                header.style.width = contentWidth + 'px';
            } else {
                // Update position in case of resize
                header.style.left = contentLeft + 'px';
                header.style.width = contentWidth + 'px';
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

    const feedTop = elements.feed ? elements.feed.offsetTop : 0;
    const isAtFeed = window.scrollY > feedTop + window.innerHeight * 0.1;

    // Hide stats bar once nearing end of last milestone card (but keep header and scrollbar unchanged)
    const lastCard = elements.milestoneCards[elements.milestoneCards.length - 1];
    const isPastLastCard = lastCard && window.scrollY > lastCard.offsetTop + lastCard.offsetHeight - window.innerHeight * 0.2;

    elements.header.classList.toggle('ui-visible', isPassedIntro);
    if (elements.statsBar) elements.statsBar.classList.toggle('ui-visible', isPassedIntro && !isPastLastCard);
    elements.progressBar.classList.toggle('ui-visible', isAtFeed);

    if (elements.gateSection) {
        elements.gateSection.classList.toggle('visible', isPassedIntro);
    }

    // Show explainer after intro, hide once feed (squares) is reached
    if (elements.statsExplainer) {
        const isBeforeFeed = window.scrollY < feedTop - window.innerHeight * 0.5;
        elements.statsExplainer.classList.toggle('visible', isPassedIntro && isBeforeFeed);
    }
}

// Initialize intro screen scroll arrow click
function initializeIntroScreen() {
    if (elements.scrollIndicator && elements.gateSection) {
        elements.scrollIndicator.addEventListener('click', () => {
            elements.gateSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Gate arrow scrolls to the feed (squares)
    const gateArrow = document.querySelector('.gate-arrow');
    if (gateArrow && elements.feed) {
        gateArrow.addEventListener('click', () => {
            elements.feed.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// Bounce back to end screen when user scrolls past the bottom
function initializeEndBounce() {
    const endScreen = document.querySelector('.end-screen');
    if (!endScreen) return;

    let bounceTimeout = null;

    window.addEventListener('scroll', () => {
        const maxScroll = document.body.scrollHeight - window.innerHeight;

        // Only trigger when user hits the very bottom
        if (window.scrollY >= maxScroll - 5) {
            if (bounceTimeout) clearTimeout(bounceTimeout);
            bounceTimeout = setTimeout(() => {
                // Bounce above the end-screen
                window.scrollTo({ top: endScreen.offsetTop - window.innerHeight * 0.9, behavior: 'smooth' });
            }, 200);
        }
    });
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
    const livesSinceLoad = getSecondsSinceLoad() * LIVES_LOST_PER_SECOND;

    const statYear = document.getElementById('statYear');
    const statToday = document.getElementById('statToday');
    const statSince = document.getElementById('statSince');

    if (statYear && statToday && statSince) {
        const livesThisYear = getSecondsThisYear() * LIVES_LOST_PER_SECOND;
        const livesToday = getSecondsToday() * LIVES_LOST_PER_SECOND;
        statYear.textContent = formatStatNumber(livesThisYear, 2);
        statToday.textContent = formatStatNumber(livesToday, 2);
        statSince.textContent = formatStatNumber(livesSinceLoad, 4);
    }

    const mini1 = document.getElementById('livesMiniCount1');
    const mini2 = document.getElementById('livesMiniCount2');
    if (mini1) mini1.textContent = formatStatNumber(livesSinceLoad, 1);
    if (mini2) mini2.textContent = formatStatNumber(livesSinceLoad, 1);
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

        // 1. Lives Lost Calculation (stats bar)
        const statsSection = document.createElement('div');
        statsSection.className = 'source-item';
        statsSection.innerHTML = `
            <h3>Lives Lost Calculation</h3>
            <p>The world collectively spends <strong>11.5 billion hours</strong> on social media platforms daily.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Calculation for lives lost:</strong><br>
                • 80 years in hours: 700,800<br>
                • 11.5 billion ÷ 700,800 = 16,409.82 lives lost per day<br>
                • Seconds in 24 hours: 86,400<br>
                • 16,409.82 ÷ 86,400 = <strong>0.18992 lives lost per second</strong>
            </p>
            <div class="source-link">Source: <a href="https://umaine.edu/undiscoveredmaine/small-business/resources/marketing-for-small-business/social-media-tools/social-media-statistics-details/" target="_blank" rel="noopener noreferrer">University of Maine — Social Media Statistics</a></div>
        `;
        modalBody.appendChild(statsSection);

        // 2. Daily Social Media Use — 2.5 hrs/day (intro screen)
        const dailySocialSection = document.createElement('div');
        dailySocialSection.className = 'source-item';
        dailySocialSection.innerHTML = `
            <h3>Daily Social Media Use — 2.5 Hours</h3>
            <p>We use <strong>2.5 hours per person per day</strong> as our baseline. Statista (2025) puts the global average at approximately 2 hours 21 minutes.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Assumption:</strong> 2.5 hrs/day is used as a round, commonly cited figure throughout all derived calculations.
            </p>
            <div class="source-link">Source: <a href="https://www.statista.com/statistics/433871/daily-social-media-usage-worldwide/" target="_blank" rel="noopener noreferrer">Statista — Daily social media usage worldwide</a></div>
        `;
        modalBody.appendChild(dailySocialSection);

        // 3. Card Calculations (yearly, lifetime, global 10 sec)
        const calcSection = document.createElement('div');
        calcSection.className = 'source-item';
        calcSection.innerHTML = `
            <h3>Card Calculations</h3>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Monthly:</strong><br>
                • 2.5 × 30 = <strong>75 hours</strong><br><br>

                <strong>Yearly:</strong><br>
                • 2.5 × 365 = <strong>912 hours</strong> (38 days)<br><br>

                <strong>Lifetime (80 years):</strong><br>
                • Assumes 2.5 hrs/day usage across a full 80-year lifespan<br>
                • 2.5 × 365.25 × 80 = <strong>73,050 hours</strong> (8.3 years)<br><br>

                <strong>Global usage every 10 seconds:</strong><br>
                • 6 billion social media users × 2.5 hrs/day = 15 billion person-hours/day<br>
                • ÷ 24 hrs/day = 625,000,000 person-hours/hr<br>
                • ÷ 60 min/hr = 10,416,667 person-hours/min<br>
                • ÷ 6 (ten-second blocks per minute) = <strong>1,736,111 hours per 10 seconds</strong><br><br>

                <strong>Lifetimes lost per year:</strong><br>
                • 80 years × 8,760 hrs/yr = 700,800 hrs per lifetime<br>
                • 15 billion hrs/day × 365 = 5,475,000,000,000 hrs/year<br>
                • 5,475,000,000,000 ÷ 700,800 = <strong>7,812,500 lifetimes/year</strong><br><br>

                <strong>Comparison markers:</strong><br>
                • Reading all of Wikipedia: ~340,000 hours (0.49 lifetimes)<br>
                • One human lifetime (80 years): 700,800 hours<br>
                • Lifetimes per 10 seconds: 1,736,111 ÷ 700,800 ≈ <strong>2.5 lifetimes</strong>
            </p>
        `;
        modalBody.appendChild(calcSection);

        // 4. Walking to the Moon (mini-card inside lifetime card)
        const moonSection = document.createElement('div');
        moonSection.className = 'source-item';
        moonSection.innerHTML = `
            <h3>Walking to the Moon — 59,750 Hours</h3>
            <p><strong>59,750 hours</strong> to walk to the moon non-stop (approx. 6.8 years).</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Assumptions:</strong><br>
                • Mean Earth–Moon distance: 238,855 miles<br>
                • Walking speed: 4 mph (brisk pace; at a standard 3 mph the figure would be ~79,600 hours / ~9 years)<br><br>
                <strong>Calculation:</strong> 238,855 ÷ 4 = <strong>59,714 hours</strong> ≈ 59,750
            </p>
            <div class="source-link">Source: <a href="https://www.reddit.com/r/theydidthemath/comments/15pllkp/comment/jvy617w/" target="_blank" rel="noopener noreferrer">r/theydidthemath — Walking to the Moon</a></div>
        `;
        modalBody.appendChild(moonSection);

        // 5. Sistine Chapel Ceiling (first mini-card in massive card)
        const sistineSection = document.createElement('div');
        sistineSection.className = 'source-item';
        sistineSection.innerHTML = `
            <h3>Sistine Chapel Ceiling — 17,520 Hours</h3>
            <p>Michelangelo painted the Sistine Chapel ceiling from <strong>1508 to 1512</strong> — a confirmed 4-year period.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Assumption:</strong> 12 hours of work per day. No historical record establishes a precise daily schedule; this is an illustrative estimate used to produce a round figure.<br><br>
                <strong>Calculation:</strong> 4 years × 365 days × 12 hrs/day = <strong>17,520 hours</strong>
            </p>
            <div class="source-link">Source: <a href="https://en.wikipedia.org/wiki/Sistine_Chapel_ceiling" target="_blank" rel="noopener noreferrer">Wikipedia — Sistine Chapel ceiling</a></div>
        `;
        modalBody.appendChild(sistineSection);

        // 6. Great Pyramid of Giza (second mini-card in massive card)
        const pyramidSection = document.createElement('div');
        pyramidSection.className = 'source-item';
        pyramidSection.innerHTML = `
            <h3>Great Pyramid of Giza — 175,200 Hours</h3>
            <p>The Great Pyramid took approximately <strong>20 years</strong> to build, with an estimated 20,000 workers and 2.3 million stone blocks.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Assumptions &amp; notes:</strong><br>
                • Construction time: 20 years (most widely cited estimate; range is roughly 10–27 years)<br>
                • Workers: 20,000 (low end of modern scholarly estimates; current consensus leans toward 20,000–30,000+)<br>
                • Blocks: 2.3 million (widely accepted figure)<br>
                • The 175,200 hours represents <em>elapsed calendar time</em>, not total worker-hours<br><br>
                <strong>Calculation:</strong> 20 × 365 × 24 = <strong>175,200 hours</strong>
            </p>
            <div class="source-link">Source: <a href="https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza" target="_blank" rel="noopener noreferrer">Wikipedia — Great Pyramid of Giza</a></div>
        `;
        modalBody.appendChild(pyramidSection);

        // 7. Reading All of Wikipedia (third mini-card in massive card)
        const wikiSection = document.createElement('div');
        wikiSection.className = 'source-item';
        wikiSection.innerHTML = `
            <h3>Reading All of Wikipedia — ~340,000 Hours</h3>
            <p>English Wikipedia contains approximately <strong>5.1 billion words</strong> across ~7.1 million articles (as of 2025).</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Assumptions:</strong><br>
                • Word count: ~5.1 billion words (English Wikipedia only; all-language total would be significantly higher)<br>
                • Reading speed: 250 words per minute (commonly cited adult average)<br><br>
                <strong>Calculation:</strong> 5,100,000,000 ÷ 250 ÷ 60 = <strong>340,000 hours</strong>
            </p>
            <div class="source-link">Source: <a href="https://en.wikipedia.org/wiki/Wikipedia:Size_of_Wikipedia" target="_blank" rel="noopener noreferrer">Wikipedia — Size of Wikipedia</a></div>
        `;
        modalBody.appendChild(wikiSection);

        // 8. Voyager 1 Flight Time (fourth mini-card in massive card)
        const voyagerSection = document.createElement('div');
        voyagerSection.className = 'source-item';
        voyagerSection.innerHTML = `
            <h3>Voyager 1 Flight Time — ~423,000 Hours</h3>
            <p><strong>~423,000 hours</strong> of continuous flight since September 5, 1977, now over 15 billion miles from Earth.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Calculation:</strong><br>
                • Launched: September 5, 1977<br>
                • As of 2025: ~48 years × 365.25 days × 24 hours ≈ 420,768 hours<br>
                • Rounded to ~423,000 hours to account for ongoing flight<br>
                • Distance: ~15.8 billion miles as of early 2026
            </p>
            <div class="source-link">Source: <a href="https://science.nasa.gov/mission/voyager/voyager-1/" target="_blank" rel="noopener noreferrer">NASA — Voyager 1 Mission</a></div>
        `;
        modalBody.appendChild(voyagerSection);

        // 9. One Human Lifetime (fifth mini-card in massive card)
        const lifetimeSection = document.createElement('div');
        lifetimeSection.className = 'source-item';
        lifetimeSection.innerHTML = `
            <h3>One Human Lifetime — 700,800 Hours</h3>
            <p>An 80-year human lifespan equals <strong>700,800 hours</strong>.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Calculation:</strong> 80 × 365 × 24 = <strong>700,800 hours</strong>
            </p>
        `;
        modalBody.appendChild(lifetimeSection);
    }

    // Open modal
    sourcesButton.addEventListener('click', () => {
        populateModal();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Report an error — copy email to clipboard
    const reportErrorButton = document.getElementById('reportErrorButton');
    if (reportErrorButton) {
        reportErrorButton.addEventListener('click', () => {
            navigator.clipboard.writeText('azaria.kelman@mail.utoronto.ca').then(() => {
                const original = reportErrorButton.textContent;
                reportErrorButton.textContent = 'Email copied!';
                setTimeout(() => { reportErrorButton.textContent = original; }, 2000);
            });
        });
    }

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

    // Pause at end and show a replay button
    let replayBtn = null;
    video.addEventListener('ended', () => {
        playing = false;
        // First time: wrap video in a relative container so the button can overlay it
        if (!replayBtn) {
            const container = document.createElement('div');
            container.className = 'video-replay-container';
            video.parentNode.insertBefore(container, video);
            container.appendChild(video);

            replayBtn = document.createElement('button');
            replayBtn.className = 'video-replay-btn';
            replayBtn.textContent = '↺';
            replayBtn.addEventListener('click', () => {
                video.currentTime = 0;
                video.play().catch(() => {});
                playing = true;
                replayBtn.classList.remove('visible');
            });
            container.appendChild(replayBtn);
        }
        replayBtn.classList.add('visible');
    });
}

// Convert tall cards from absolute positioning to normal flow with sticky elements
function initializeStickyFloating() {
    const MIN_CARD_HEIGHT = 5000; // Only convert cards taller than this
    const STICKY_DISTANCE = 5000; // ~8 seconds of scrolling

    document.querySelectorAll('.milestone-card').forEach(card => {
        if (card.offsetHeight < MIN_CARD_HEIGHT) return;

        const cardBody = card.querySelector('.milestone-card-body');
        if (!cardBody) return;

        // Enable sticky support on this card.
        // overflow: clip clips content at the card boundary without creating a scroll container,
        // so position: sticky still works for elements inside.
        card.style.overflow = 'clip';
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
            // Give the last element extra sticky time so it doesn't disappear too quickly
            const lastBonus = (i === items.length - 1) ? STICKY_DISTANCE : 0;
            const nextTop = (i < items.length - 1) ? items[i + 1].top : item.top + STICKY_DISTANCE + lastBonus;
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
    initializeEndBounce();
}

// Start the application
init();
