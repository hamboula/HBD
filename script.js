document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progress');
    const bgAudio = document.getElementById('bg-audio');
    let currentSlide = 0;
    let isAnimating = false;
    let audioStarted = false;

    const startAudio = () => {
        if (!audioStarted && bgAudio) {
            bgAudio.volume = 0.4;
            bgAudio.play().catch(e => console.log('Audio autoplay prevented', e));
            audioStarted = true;
            // Remove listeners once audio has started
            ['click', 'touchstart', 'wheel', 'keydown'].forEach(evt => {
                window.removeEventListener(evt, startAudio);
            });
        }
    };

    // Attach to any interaction
    ['click', 'touchstart', 'wheel', 'keydown'].forEach(evt => {
        window.addEventListener(evt, startAudio, { once: true });
    });

    // Update progress bar
    const updateProgress = () => {
        const progress = (currentSlide / (slides.length - 1)) * 100;
        progressBar.style.width = `${progress}%`;
    };

    // Go to specific slide
    const goToSlide = (index) => {
        if (isAnimating || index < 0 || index >= slides.length || index === currentSlide) return;

        isAnimating = true;

        // Remove active class from current
        slides[currentSlide].classList.remove('active');

        currentSlide = index;

        // Add active class to new slide
        slides[currentSlide].classList.add('active');

        updateProgress();

        // Handle audio switching
        const finalAudio = document.getElementById('final-audio');
        if (currentSlide === slides.length - 1) {
            if (bgAudio) bgAudio.pause();
            if (finalAudio) {
                finalAudio.volume = 0.5;
                finalAudio.currentTime = 0;
                finalAudio.play().catch(e => console.log('Final audio prevented', e));
            }
        } else {
            if (finalAudio && !finalAudio.paused) {
                finalAudio.pause();
                if (bgAudio && audioStarted) bgAudio.play().catch(e => console.log(e));
            }
        }

        // Prevent rapid scrolling
        setTimeout(() => {
            isAnimating = false;
        }, 1000); // matches CSS transition duration + buffer
    };

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            goToSlide(currentSlide + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    };

    // Mouse wheel navigation
    window.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) {
            nextSlide();
        } else if (e.deltaY < 0) {
            prevSlide();
        }
    });

    // Touch navigation for mobile
    let touchStartY = 0;
    let touchEndY = 0;

    window.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    });

    window.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        handleTouch();
    });

    const handleTouch = () => {
        const swipeThreshold = 50;
        if (touchStartY - touchEndY > swipeThreshold) {
            nextSlide();
        } else if (touchEndY - touchStartY > swipeThreshold) {
            prevSlide();
        }
    };

    // Click anywhere to go to next (except on links if any)
    window.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        // Just advance if not clicking a specific interactive element
        nextSlide();
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
            nextSlide();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            prevSlide();
        }
    });

    // Initialize progress bar
    updateProgress();

    // Mute button logic
    const muteBtn = document.getElementById('mute-btn');
    let isMuted = false;
    
    if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent slide advancement
            isMuted = !isMuted;
            if (bgAudio) bgAudio.muted = isMuted;
            const finalAudio = document.getElementById('final-audio');
            if (finalAudio) finalAudio.muted = isMuted;
            muteBtn.textContent = isMuted ? '🔇' : '🔊';
        });
    }
});
