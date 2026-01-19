let startTime = Date.now();
let subtitle = document.querySelector('.subtitle');
let progressFill = document.querySelector('.progress-fill');
let progressBar = document.querySelector('.progress-bar');

// Set card heights and create markers
document.querySelectorAll('.post').forEach(post => {
    let minutes = post.getAttribute('data-time');
    post.style.height = (minutes * 100) + 'px';
});

// Create markers after page layout
setTimeout(() => {
    document.querySelectorAll('.post').forEach(post => {
        let marker = document.createElement('div');
        marker.className = 'progress-marker';
        let offset = post.offsetTop;
        let percent = (offset / document.body.scrollHeight) * 100;
        marker.style.top = percent + '%';
        progressBar.appendChild(marker);
    });
}, 100);

// Update progress on scroll
function updateProgress() {
    let scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    progressFill.style.height = scrollPercent + '%';
}

window.addEventListener('scroll', updateProgress);

// Click to jump
progressBar.addEventListener('click', (e) => {
    let percent = e.clientY / window.innerHeight;
    let scrollTo = percent * (document.body.scrollHeight - window.innerHeight);
    window.scrollTo({ top: scrollTo, behavior: 'smooth' });
});

// Drag functionality
let isDragging = false;

progressFill.addEventListener('mousedown', (e) => {
    isDragging = true;
    e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        let percent = e.clientY / window.innerHeight;
        let scrollTo = percent * (document.body.scrollHeight - window.innerHeight);
        window.scrollTo({ top: scrollTo });
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// Timer
setInterval(() => {
    let elapsed = Math.floor((Date.now() - startTime) / 1000);
    let minutes = Math.floor(elapsed / 60);
    let seconds = elapsed % 60;

    if (minutes > 0) {
        subtitle.textContent = `You've been scrolling for ${minutes}m ${seconds}s... that's time you'll never get back`;
    } else {
        subtitle.textContent = `You've been scrolling for ${seconds} seconds...`;
    }
}, 1000);
