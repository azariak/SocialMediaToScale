// Constants
const LIVES_LOST_PER_SECOND = 0.24773268; // 6B users × 2.5 hrs/day = 15B hrs/day ÷ 700,800 ÷ 86,400

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
        const feedStartPercent = (feedTop + window.innerHeight * 0.8) / maxScroll;
        const totalHours = getTotalHours();

        let currentHours = 0;
        if (scrollPercent / 100 > feedStartPercent) {
            const feedProgress = (scrollPercent / 100 - feedStartPercent) / (1 - feedStartPercent);
            currentHours = feedProgress * totalHours;
        }

        // Format hours display with appropriate units
        let displayText;
        if (currentHours < 8760) {
            const days = Math.round(currentHours / 24);
            displayText = `${days} days`;
        } else {
            const years = currentHours / 8760;
            if (currentHours >= 74039.5) {
                const seconds = currentHours / 173611.1;
                const secText = seconds < 10 ? seconds.toFixed(1) : Math.round(seconds);
                displayText = `${years.toFixed(1)} yrs (~${secText}s)`;
            } else {
                displayText = `${years.toFixed(1)} yrs`;
            }
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
    const defaultStickyTop = window.innerWidth <= 640 ? 156 : 153;

    elements.milestoneCards.forEach(card => {
        const stickyTop = card.dataset.hours === '73050'
            ? (window.innerWidth <= 640 ? 133 : 130)
            : defaultStickyTop;
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
    document.body.classList.toggle('header-visible', isPassedIntro);
    if (elements.statsBar) elements.statsBar.classList.toggle('ui-visible', isPassedIntro && !isPastLastCard);
    elements.progressBar.classList.toggle('ui-visible', isAtFeed);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.classList.toggle('visible', !isPassedIntro);

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
    if (elements.scrollIndicator) {
        elements.scrollIndicator.addEventListener('click', () => {
            const target = elements.feed || elements.introScreen;
            if (target) {
                window.scrollTo({ top: target.offsetTop + window.innerHeight * 0.3, behavior: 'smooth' });
            }
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

    const years = Math.round(livesSinceLoad * 80);
    const years1 = document.getElementById('livesYears1');
    const years2 = document.getElementById('livesYears2');
    if (years1) years1.textContent = years.toLocaleString();
    if (years2) years2.textContent = years.toLocaleString();
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
            sourceCodeLink.innerHTML = `View the source code on <a href="https://github.com/azariak/SocialMediaToScale" target="_blank" rel="noopener noreferrer" style="color: #ff4444; text-decoration: none;">GitHub</a> `;
            modalHeader.appendChild(sourceCodeLink);
        }

        // Note
        const noteSection = document.createElement('p');
        noteSection.style.cssText = 'font-size: 14px; color: #888; margin-bottom: 16px;';
        noteSection.innerHTML = `<strong>Note:</strong> Some of these numbers are rough estimates. Much of this data is unknown or unknowable. It is our belief that this information is broadly true. If you spot an error, <button id="sourcesNoteReportBtn" style="background:none;border:none;padding:0;color:#888;cursor:pointer;font-size:14px;text-decoration:underline;">please tell us!</button>`;
        modalBody.appendChild(noteSection);
        document.getElementById('sourcesNoteReportBtn')?.addEventListener('click', () => {
            navigator.clipboard.writeText('azaria.kelman@mail.utoronto.ca').then(() => {
                const btn = document.getElementById('sourcesNoteReportBtn');
                if (btn) { btn.textContent = 'Email copied!'; setTimeout(() => { btn.textContent = 'please tell us!'; }, 2000); }
            });
        });

        // Assumptions
        const assumptionsSection = document.createElement('div');
        assumptionsSection.className = 'source-item';
        assumptionsSection.innerHTML = `
            <h3>Assumptions</h3>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                All calculations on this page use the following baselines:<br><br>
                • <strong>Average human lifespan:</strong> 80 years (700,800 hours)<br>
                • <strong>Daily social media use:</strong> 2.5 hrs/day per person, a round figure; Statista (2025) puts the global average at ~2 hrs 21 min<br>
                • <strong>Global social media users:</strong> 6 billion
            </p>
            <div class="source-link">Source: <a href="https://www.statista.com/statistics/433871/daily-social-media-usage-worldwide/" target="_blank" rel="noopener noreferrer">Statista — Daily social media usage worldwide</a></div>
        `;
        modalBody.appendChild(assumptionsSection);

        // 1. Lives Lost Calculation (stats bar)
        const statsSection = document.createElement('div');
        statsSection.className = 'source-item';
        statsSection.innerHTML = `
            <h3>Lives Lost Calculation</h3>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Lives lost per second:</strong><br>
                • 6 billion users × 2.5 hrs/day = 15 billion person-hours/day<br>
                • 15 billion ÷ 700,800 (80 yrs × 365 days × 24 hrs) = 21,404.11 lives lost per day<br>
                • 21,404.11 ÷ 86,400 seconds = <strong>0.24773 lives lost per second</strong>
            </p>
        `;
        modalBody.appendChild(statsSection);

        // 2. Card Calculations (yearly, lifetime, global 10 sec)
        const calcSection = document.createElement('div');
        calcSection.className = 'source-item';
        calcSection.innerHTML = `
            <h3>Card Calculations</h3>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Monthly:</strong><br>
                • 2.5 × 30 = <strong>75 hours</strong><br><br>

                <strong>Yearly:</strong><br>
                • 2.5 × 365 = <strong>912 hours</strong> (38 days)<br><br>

                <strong>Lifetime:</strong><br>
                • 2.5 × 365.25 × 80 = <strong>73,050 hours</strong> (8.3 years)<br><br>

                <strong>Global usage every 10 seconds:</strong><br>
                • 15 billion hrs/day ÷ 24 = 625,000,000 hrs/hr<br>
                • ÷ 60 = 10,416,667 hrs/min<br>
                • ÷ 6 = <strong>1,736,111 hours per 10 seconds</strong><br><br>

                <strong>Lifetimes lost per year:</strong><br>
                • 15 billion hrs/day × 365 = 5,475,000,000,000 hrs/year<br>
                • ÷ 700,800 = <strong>7,812,500 lifetimes/year</strong><br><br>

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
            <p>Michelangelo painted the Sistine Chapel ceiling from <strong>1508 to 1512</strong>, a 4-year period.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Assumption:</strong> 12 hours of work per day. No historical record establishes a precise daily schedule; this is an illustrative estimate used to produce a round figure.<br><br>
                <strong>Calculation:</strong> 4 years × 365 days × 12 hrs/day = <strong>17,520 hours</strong>
            </p>
            <div class="source-link">Source: <a href="https://en.wikipedia.org/wiki/Sistine_Chapel_ceiling" target="_blank" rel="noopener noreferrer">Wikipedia — Sistine Chapel ceiling</a></div>
        `;
        modalBody.appendChild(sistineSection);

        // 5b. ~21,404 Lifetimes per Day (floating text at position 0.02 in massive card)
        const lifetimesPerDaySection = document.createElement('div');
        lifetimesPerDaySection.className = 'source-item';
        lifetimesPerDaySection.innerHTML = `
            <h3>~21,404 Lifetimes Lost Per Day</h3>
            <p>Every day, the world collectively loses approximately <strong>21,404 lifetimes</strong> to social media scrolling.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Assumptions:</strong><br>
                • 6 billion social media users<br>
                • 2.5 hours/day average usage<br>
                • 1 lifetime = 80 years = 700,800 hours<br><br>
                <strong>Calculation:</strong><br>
                • 6,000,000,000 × 2.5 hrs/day = 15,000,000,000 hrs/day<br>
                • 15,000,000,000 ÷ 700,800 = <strong>21,404 lifetimes/day</strong>
            </p>
        `;
        modalBody.appendChild(lifetimesPerDaySection);

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



        // 9b. Circumnavigate the Globe in ~3 Seconds (floating text at position 0.37 in massive card)
        const circumnavigateSection = document.createElement('div');
        circumnavigateSection.className = 'source-item';
        circumnavigateSection.innerHTML = `
            <h3>Circumnavigate the Globe in ~3 Seconds</h3>
            <p>After roughly <strong>3 seconds</strong> of collective global scrolling, our combined swipe distance equals the circumference of the Earth.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Assumptions:</strong><br>
                • 6 billion social media users<br>
                • 2.5 hours of scrolling per person per day<br>
                • Each scroll gesture: ~2 inches up + 2 inches down = 4 inches<br>
                • ~2 gestures every 10 seconds = 8 inches per 10 seconds (0.8 in/sec per person)<br>
                • Earth's circumference: ~24,901 miles = ~1,577,727,360 inches<br><br>
                <strong>Calculation:</strong><br>
                • Daily distance per person: 0.8 in/sec × (2.5 × 3,600 sec) = 7,200 in/day<br>
                • Global daily total: 6,000,000,000 × 7,200 = 43,200,000,000,000 in/day<br>
                • Rate per second of the day: 43,200,000,000,000 ÷ 86,400 = <strong>500,000,000 in/sec</strong><br>
                • Time to circumnavigate: 1,577,727,360 ÷ 500,000,000 ≈ <strong>3.16 seconds</strong>
            </p>
        `;
        modalBody.appendChild(circumnavigateSection);

        // 10. Life of Moses (sixth mini-card in massive card)
        const mosesSection = document.createElement('div');
        mosesSection.className = 'source-item';
        mosesSection.innerHTML = `
            <h3>Life of Moses — 1,051,920 Hours</h3>
            <p><em>"Moses was a hundred and twenty years old when he died; his eyes were not dim, nor his natural force abated."</em> (Deuteronomy 34:7)</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Calculation:</strong><br>
                • 120 years × 365.25 days/year = 43,830 days<br>
                • 43,830 days × 24 hours/day = <strong>1,051,920 hours</strong>
            </p>
            <div class="source-link">Source: <a href="https://www.sefaria.org/Deuteronomy.34.7?lang=bi" target="_blank" rel="noopener noreferrer">Sefaria — Deuteronomy 34:7</a></div>
        `;
        modalBody.appendChild(mosesSection);

        // 11. Statue of Liberty (seventh mini-card in massive card)
        const statueSection = document.createElement('div');
        statueSection.className = 'source-item';
        statueSection.innerHTML = `
            <h3>Statue of Liberty — 1,227,240 Hours</h3>
            <p>The Statue of Liberty was dedicated on <strong>October 28, 1886</strong> — approximately <strong>140 years ago</strong> as of 2026.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Calculation:</strong> 140 × 365.25 × 24 = <strong>1,227,240 hours</strong>
            </p>
            <div class="source-link">Source: <a href="https://en.wikipedia.org/wiki/Statue_of_Liberty" target="_blank" rel="noopener noreferrer">Wikipedia — Statue of Liberty</a></div>
        `;
        modalBody.appendChild(statueSection);

        // 12. 5 Billion Heartbeats (eighth mini-card in massive card)
        const heartbeatSection = document.createElement('div');
        heartbeatSection.className = 'source-item';
        heartbeatSection.innerHTML = `
            <h3>5 Billion Heartbeats — 1,314,900 Hours</h3>
            <p>A sesquicentennial (150-year) human lifespan contains approximately <strong>5 billion heartbeats</strong>.</p>
            <p style="font-size: 14px; color: #888; line-height: 1.8;">
                <strong>Assumptions:</strong><br>
                • Average resting heart rate: ~63 beats per minute (within the normal 60–100 bpm range)<br>
                • Lifespan: 150 years<br><br>
                <strong>Calculation:</strong><br>
                • 150 × 365.25 × 24 = <strong>1,314,900 hours</strong><br>
                • 1,314,900 × 60 min × 63 bpm ≈ <strong>4,970,000,000 beats</strong> ≈ 5 billion
            </p>
            <div class="source-link">Source: <a href="https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates" target="_blank" rel="noopener noreferrer">American Heart Association — Target Heart Rates</a></div>
        `;
        modalBody.appendChild(heartbeatSection);

        // 13. Brainrot video
        const videoSection = document.createElement('div');
        videoSection.className = 'source-item';
        videoSection.innerHTML = `
            <h3>Brainrot Video</h3>
            <p>The subway surfers clip was generated using Easy Brainrot.</p>
            <div class="source-link">Source: <a href="https://easybrainrot.com/subway-surfers-video-generator" target="_blank" rel="noopener noreferrer">easybrainrot.com — Subway Surfers Video Generator</a></div>
        `;
        modalBody.appendChild(videoSection);
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

    // Sources footer: Credits button
    const sourcesCreditsBtn = document.getElementById('sourcesCreditsBtn');
    if (sourcesCreditsBtn) {
        sourcesCreditsBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            const attributionModal = document.getElementById('attributionModal');
            if (attributionModal) {
                attributionModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Sources footer: Report an error — copy email to clipboard
    const sourcesReportErrorBtn = document.getElementById('sourcesReportErrorBtn');
    if (sourcesReportErrorBtn) {
        sourcesReportErrorBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('azaria.kelman@mail.utoronto.ca').then(() => {
                const original = sourcesReportErrorBtn.textContent;
                sourcesReportErrorBtn.textContent = 'Email copied!';
                setTimeout(() => { sourcesReportErrorBtn.textContent = original; }, 2000);
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
    const azariaLink = document.getElementById('azariaLink');
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
    if (azariaLink) azariaLink.addEventListener('click', openModal);
    isaacLink.addEventListener('click', openModal);
    maxLink.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);

    const creditsSourcesBtn = document.getElementById('creditsSourcesBtn');
    if (creditsSourcesBtn) {
        creditsSourcesBtn.addEventListener('click', () => {
            closeModal();
            const sourcesButton = document.getElementById('sourcesButton');
            if (sourcesButton) sourcesButton.click();
        });
    }

    const creditsReportErrorBtn = document.getElementById('creditsReportErrorBtn');
    if (creditsReportErrorBtn) {
        creditsReportErrorBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('azaria.kelman@mail.utoronto.ca').then(() => {
                const original = creditsReportErrorBtn.textContent;
                creditsReportErrorBtn.textContent = 'Email copied!';
                setTimeout(() => { creditsReportErrorBtn.textContent = original; }, 2000);
            });
        });
    }

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
            const minDist = item.el.dataset.stickyDist ? parseInt(item.el.dataset.stickyDist) : STICKY_DISTANCE;
            const remainingCardHeight = item.el.dataset.stickyToEnd ? card.offsetHeight - item.top : 0;
            const sectionHeight = Math.max(minDist, nextTop - item.top, remainingCardHeight);
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

// Counter explosion: animate the massive card's number from 73,050 → 1,736,111
// with a slot-machine blur effect when it first scrolls into view.
function runCounterExplosion(numSpan) {
    const endValue = 1736111;
    const duration = 2400;
    const startTime = performance.now();
    const finalStr = endValue.toLocaleString('en-US'); // "1,736,111"

    // Each digit position gets a settle threshold (0→1 of animation progress).
    // Digits settle left to right between t=0.35 and t=0.88.
    let digitCount = 0;
    for (const ch of finalStr) { if (ch !== ',') digitCount++; }
    const settleAt = [];
    let d = 0;
    for (const ch of finalStr) {
        if (ch === ',') { settleAt.push(null); continue; }
        settleAt.push(0.35 + (d / (digitCount - 1)) * 0.53);
        d++;
    }

    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

    function frame(now) {
        const t = Math.min((now - startTime) / duration, 1);

        if (t >= 1) {
            numSpan.textContent = finalStr;
            numSpan.style.filter = '';
            numSpan.style.letterSpacing = '';
            return;
        }

        const eased = easeOutQuart(t);

        // Global blur: ramps up fast, then fades as digits settle
        const blur = t < 0.08
            ? (t / 0.08) * 7
            : (1 - eased) * 7;

        // Build slot-machine display
        let display = '';
        for (let i = 0; i < finalStr.length; i++) {
            if (finalStr[i] === ',') { display += ','; continue; }
            display += t >= settleAt[i]
                ? finalStr[i]
                : Math.floor(Math.random() * 10);
        }

        numSpan.textContent = display;
        numSpan.style.filter = `blur(${blur.toFixed(1)}px)`;
        // Slight letter-spacing chaos at start
        numSpan.style.letterSpacing = t < 0.25 ? `${((1 - t / 0.25) * 4).toFixed(1)}px` : '';

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

function initializeCounterExplosion() {
    const targets = [
        { hours: '1736111', spanId: 'massiveCounterNum' },
    ];

    targets.forEach(({ hours, spanId }) => {
        const card = document.querySelector(`.milestone-card[data-hours="${hours}"]`);
        const numSpan = document.getElementById(spanId);
        if (!card || !numSpan) return;

        let triggered = false;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !triggered) {
                    triggered = true;
                    observer.disconnect();
                    runCounterExplosion(numSpan);
                }
            });
        }, { threshold: 0 });

        observer.observe(card);
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
    initializeThemeToggle();
    initializeCounterExplosion();
}

function initializeThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    const label = btn.querySelector('.theme-toggle-label');

    function applyTheme(dark) {
        document.body.classList.toggle('dark-mode', dark);
        if (label) label.textContent = dark ? 'Dark' : 'Light';
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    }

    // Use saved preference, otherwise default to light
    const saved = localStorage.getItem('theme');
    applyTheme(saved === 'dark');

    // Visible immediately on load (user starts at top of page)
    btn.classList.add('visible');

    btn.addEventListener('click', () => {
        applyTheme(!document.body.classList.contains('dark-mode'));
    });
}

// Start the application
init();

// ── iPhone frame overlay ─────────────────────────────────────
function updateIphoneFrame() {
    const svg = document.getElementById('iphone-frame-svg');
    if (!svg) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const bezel = 12;
    const r = 44;
    const innerR = r - bezel / 2; // radius of screen inner edge
    const btnW = 5, btnOverlap = 1;

    // Frame left edge = just past the progress bar; right edge is mirrored
    const pb = document.querySelector('.progress-bar');
    const pbLeft = pb ? pb.getBoundingClientRect().left : (w / 2 - 350);
    const frameLeft = Math.max(btnW + 3, pbLeft - 30);
    const frameRight = w - frameLeft;
    const frameW = frameRight - frameLeft;

    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    // Corner fills: full viewport rect minus rounded screen cutout (evenodd)
    const ix = frameLeft + bezel, iy = bezel, iw = frameW - bezel * 2, ih = h - bezel * 2;
    const outerPath = `M0,0 H${w} V${h} H0 Z`;
    const innerPath = [
        `M${ix + innerR},${iy}`,
        `H${ix + iw - innerR}`,
        `A${innerR},${innerR} 0 0 1 ${ix + iw},${iy + innerR}`,
        `V${iy + ih - innerR}`,
        `A${innerR},${innerR} 0 0 1 ${ix + iw - innerR},${iy + ih}`,
        `H${ix + innerR}`,
        `A${innerR},${innerR} 0 0 1 ${ix},${iy + ih - innerR}`,
        `V${iy + innerR}`,
        `A${innerR},${innerR} 0 0 1 ${ix + innerR},${iy} Z`
    ].join(' ');
    document.getElementById('iphone-corner-fills').setAttribute('d', `${outerPath} ${innerPath}`);

    // Frame border rect
    const border = document.getElementById('iphone-frame-border');
    border.setAttribute('x', frameLeft + bezel / 2);
    border.setAttribute('y', bezel / 2);
    border.setAttribute('width', frameW - bezel);
    border.setAttribute('height', h - bezel);
    border.setAttribute('rx', r);
    border.setAttribute('ry', r);

    // Dynamic island pill — centered within the frame
    const notchW = 126;
    const notch = document.getElementById('iphone-notch-pill');
    notch.setAttribute('x', Math.round(frameLeft + (frameW - notchW) / 2));
    notch.setAttribute('y', bezel + 8);
    notch.setAttribute('width', notchW);

    // Side buttons (protrude outward from the frame)
    const btnStartY = Math.round(h * 0.20);

    const volUp = document.getElementById('iphone-vol-up');
    volUp.setAttribute('x', frameLeft - btnW + btnOverlap);
    volUp.setAttribute('y', btnStartY);
    volUp.setAttribute('width', btnW);
    volUp.setAttribute('height', 44);

    const volDown = document.getElementById('iphone-vol-down');
    volDown.setAttribute('x', frameLeft - btnW + btnOverlap);
    volDown.setAttribute('y', btnStartY + 56);
    volDown.setAttribute('width', btnW);
    volDown.setAttribute('height', 44);

    const powerBtn = document.getElementById('iphone-power-btn');
    powerBtn.setAttribute('x', frameRight - btnOverlap);
    powerBtn.setAttribute('y', btnStartY);
    powerBtn.setAttribute('width', btnW);
    powerBtn.setAttribute('height', 66);
}

updateIphoneFrame();
window.addEventListener('resize', updateIphoneFrame);
