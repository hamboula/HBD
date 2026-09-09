document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progress');

    const bgAudio = document.getElementById('bg-audio');
    const finalAudio = document.getElementById('final-audio');

    let currentSlide = 0;
    let isAnimating = false;
    let audioStarted = false;

    // ==================================================
    // AUDIO
    // ==================================================

    const playBackgroundAudio = async () => {
        if (!bgAudio) return false;

        // Already playing
        if (!bgAudio.paused) {
            audioStarted = true;
            return true;
        }

        try {
            bgAudio.volume = 0.4;

            await bgAudio.play();

            // Only set this AFTER play succeeds
            audioStarted = true;

            return true;
        } catch (error) {
            console.log(
                'Background audio could not start:',
                error
            );

            return false;
        }
    };

    const playFinalAudio = async () => {
        if (!finalAudio) return false;

        try {
            finalAudio.volume = 0.5;
            finalAudio.currentTime = 0;

            await finalAudio.play();

            return true;
        } catch (error) {
            console.log(
                'Final audio could not start:',
                error
            );

            return false;
        }
    };

    const stopBackgroundAudio = () => {
        if (!bgAudio) return;

        bgAudio.pause();
    };

    const stopFinalAudio = () => {
        if (!finalAudio) return;

        finalAudio.pause();
    };

    /*
     * Try to start the background music after user
     * interaction.
     *
     * We intentionally DO NOT use { once: true }.
     * If the browser blocks audio once, another
     * interaction can try again.
     */
    const startAudio = () => {
        if (currentSlide === slides.length - 1) {
            return;
        }

        playBackgroundAudio();
    };

    [
        'click',
        'touchstart',
        'wheel',
        'keydown'
    ].forEach(eventName => {
        window.addEventListener(
            eventName,
            startAudio,
            {
                passive: true
            }
        );
    });

    // ==================================================
    // PROGRESS BAR
    // ==================================================

    const updateProgress = () => {
        if (!progressBar || slides.length <= 1) {
            return;
        }

        const progress =
            (currentSlide / (slides.length - 1)) * 100;

        progressBar.style.width = `${progress}%`;
    };

    // ==================================================
    // SLIDES
    // ==================================================

    const goToSlide = async (index) => {
        if (
            isAnimating ||
            index < 0 ||
            index >= slides.length ||
            index === currentSlide
        ) {
            return;
        }

        isAnimating = true;

        // Remove active slide
        slides[currentSlide].classList.remove('active');

        // Change slide
        currentSlide = index;

        // Activate new slide
        slides[currentSlide].classList.add('active');

        updateProgress();

        // ==================================================
        // FINAL SLIDE
        // ==================================================

        if (currentSlide === slides.length - 1) {
            // Stop background music
            stopBackgroundAudio();

            // Play final music
            await playFinalAudio();
        }

        // ==================================================
        // NORMAL SLIDES
        // ==================================================

        else {
            // Stop final music
            stopFinalAudio();

            /*
             * Resume background music if it has already
             * successfully started before.
             */
            if (audioStarted) {
                playBackgroundAudio();
            }
        }

        // Small delay to prevent accidental rapid changes
        setTimeout(() => {
            isAnimating = false;
        }, 1000);
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

    // ==================================================
    // MOUSE WHEEL
    // ==================================================

    window.addEventListener(
        'wheel',
        event => {
            if (event.deltaY > 0) {
                nextSlide();
            } else if (event.deltaY < 0) {
                prevSlide();
            }
        },
        {
            passive: true
        }
    );

    // ==================================================
    // TOUCH / SWIPE
    // ==================================================

    let touchStartY = 0;
    let touchEndY = 0;

    window.addEventListener(
        'touchstart',
        event => {
            touchStartY =
                event.changedTouches[0].screenY;
        },
        {
            passive: true
        }
    );

    window.addEventListener(
        'touchend',
        event => {
            touchEndY =
                event.changedTouches[0].screenY;

            handleTouch();
        },
        {
            passive: true
        }
    );

    const handleTouch = () => {
        const swipeThreshold = 50;

        const difference =
            touchStartY - touchEndY;

        if (difference > swipeThreshold) {
            nextSlide();
        } else if (
            difference < -swipeThreshold
        ) {
            prevSlide();
        }
    };

    // ==================================================
    // CLICK NAVIGATION
    // ==================================================

    window.addEventListener('click', event => {
        /*
         * Don't navigate when clicking a link.
         */
        if (event.target.closest('a')) {
            return;
        }

        /*
         * Don't navigate when clicking mute button.
         */
        if (event.target.closest('#mute-btn')) {
            return;
        }

        nextSlide();
    });

    // ==================================================
    // KEYBOARD
    // ==================================================

    window.addEventListener('keydown', event => {
        if (
            event.key === 'ArrowDown' ||
            event.key === 'ArrowRight' ||
            event.key === ' '
        ) {
            event.preventDefault();

            nextSlide();

        } else if (
            event.key === 'ArrowUp' ||
            event.key === 'ArrowLeft'
        ) {
            prevSlide();
        }
    });

    // ==================================================
    // MUTE BUTTON
    // ==================================================

    const muteBtn =
        document.getElementById('mute-btn');

    let isMuted = false;

    if (muteBtn) {
        muteBtn.addEventListener(
            'click',
            event => {
                /*
                 * Prevent the click from also changing
                 * the slide.
                 */
                event.stopPropagation();

                isMuted = !isMuted;

                if (bgAudio) {
                    bgAudio.muted = isMuted;
                }

                if (finalAudio) {
                    finalAudio.muted = isMuted;
                }

                muteBtn.textContent =
                    isMuted ? '🔇' : '🔊';
            }
        );
    }

    // ==================================================
    // INITIALIZE
    // ==================================================

    updateProgress();
});
