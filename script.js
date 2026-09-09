document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progress');

    const bgAudio = document.getElementById('bg-audio');
    const finalAudio = document.getElementById('final-audio');
    const muteBtn = document.getElementById('mute-btn');

    let currentSlide = 0;
    let isAnimating = false;

    // Audio state
    let audioUnlocked = false;
    let isMuted = false;

    // ==================================================
    // AUDIO
    // ==================================================

    /*
     * Try to play background music.
     *
     * Important:
     * We ONLY mark audioUnlocked = true AFTER play()
     * actually succeeds.
     *
     * This is important on mobile browsers because the
     * first autoplay attempt may be rejected.
     */
    const playBackgroundAudio = async () => {
        if (!bgAudio) return false;

        // Don't restart an already playing audio element.
        if (!bgAudio.paused) {
            audioUnlocked = true;
            return true;
        }

        try {
            bgAudio.volume = 0.4;
            bgAudio.muted = isMuted;

            await bgAudio.play();

            audioUnlocked = true;
            return true;
        } catch (error) {
            // Autoplay may have been blocked.
            // DO NOT mark the audio as unlocked.
            console.log('Background audio waiting for user interaction.');

            return false;
        }
    };

    /*
     * Start the final song.
     *
     * It uses the same audio-unlock state as the
     * background song. This makes it much more reliable
     * after the user has interacted with the page.
     */
    const playFinalAudio = async () => {
        if (!finalAudio) return false;

        try {
            finalAudio.volume = 0.5;
            finalAudio.muted = isMuted;
            finalAudio.currentTime = 0;

            await finalAudio.play();

            audioUnlocked = true;
            return true;
        } catch (error) {
            console.log('Final audio could not start yet.');

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
     * This function is called whenever the user interacts
     * with the page.
     *
     * We deliberately keep trying until playback succeeds.
     * This fixes the situation where the first attempt was
     * blocked by Chrome/Safari/mobile autoplay policy.
     */
    const unlockAudio = () => {
        if (audioUnlocked) return;

        // The final slide should use finalAudio instead.
        if (currentSlide === slides.length - 1) {
            playFinalAudio();
        } else {
            playBackgroundAudio();
        }
    };

    /*
     * User interaction events.
     *
     * These are intentionally NOT { once: true }.
     * If Safari/Chrome blocks the first attempt, another
     * interaction can try again.
     */
    [
        'pointerdown',
        'touchstart',
        'click',
        'keydown',
        'wheel'
    ].forEach(eventName => {
        window.addEventListener(
            eventName,
            unlockAudio,
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
            // Stop background song
            stopBackgroundAudio();

            /*
             * Try to start final song.
             *
             * If the browser allows it, it starts immediately.
             * If not, the next user interaction will retry it.
             */
            await playFinalAudio();
        }

        // ==================================================
        // NORMAL SLIDES
        // ==================================================

        else {
            // Stop final song
            stopFinalAudio();

            /*
             * If audio has already been unlocked, resume it.
             *
             * If it hasn't been unlocked yet, don't force
             * playback here. The next user interaction will
             * unlock it.
             */
            if (audioUnlocked) {
                await playBackgroundAudio();
            }
        }

        // Small delay to prevent accidental rapid navigation
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
        } else if (difference < -swipeThreshold) {
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
         * Don't navigate when clicking the mute button.
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
    // MUTE / UNMUTE
    // ==================================================

    if (muteBtn) {
        muteBtn.addEventListener('click', async event => {
            /*
             * Prevent the click from also changing slides.
             */
            event.stopPropagation();

            isMuted = !isMuted;

            /*
             * Apply mute state to BOTH songs.
             */
            if (bgAudio) {
                bgAudio.muted = isMuted;
            }

            if (finalAudio) {
                finalAudio.muted = isMuted;
            }

            muteBtn.textContent =
                isMuted ? '🔇' : '🔊';

            /*
             * IMPORTANT:
             *
             * If audio hasn't started yet, clicking the
             * mute button should still attempt to start it.
             *
             * This means the user does NOT have to:
             *
             *     mute -> unmute
             *
             * just to get audio working.
             */
            if (!audioUnlocked) {
                if (currentSlide === slides.length - 1) {
                    await playFinalAudio();
                } else {
                    await playBackgroundAudio();
                }
            }
        });
    }

    // ==================================================
    // INITIALIZE
    // ==================================================

    updateProgress();

    /*
     * Try autoplay once on page load.
     *
     * If the browser blocks it, that's completely fine.
     * The interaction listeners above will retry it when
     * the user touches/clicks the page.
     */
    playBackgroundAudio();
});
