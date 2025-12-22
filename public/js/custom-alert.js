/**
 * Custom Alert System with GSAP Animations
 * Usage:
 * - showCustomAlert(type, title, message, autoClose)
 * - showConfirmAlert(title, message, onConfirm, onCancel)
 * - showLoadingAlert(title, message)
 * - closeCustomAlert()
 */

// Alert Configuration
const alertConfig = {
    success: {
        icon: 'ph-check-circle',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700'
    },
    error: {
        icon: 'ph-x-circle',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        buttonClass: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
        icon: 'ph-warning',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        buttonClass: 'bg-amber-600 hover:bg-amber-700'
    },
    info: {
        icon: 'ph-info',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        buttonClass: 'bg-blue-600 hover:bg-blue-700'
    },
    question: {
        icon: 'ph-question',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        buttonClass: 'bg-purple-600 hover:bg-purple-700'
    },
    loading: {
        icon: 'ph-spinner',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        buttonClass: 'bg-indigo-600 hover:bg-indigo-700'
    }
};

// Show Custom Alert
function showCustomAlert(type = 'success', title = '', message = '', autoClose = true) {
    const modal = document.getElementById('customAlertModal');
    const alertBox = document.getElementById('alertBox');
    const alertIcon = document.getElementById('alertIcon');
    const alertIconElement = document.getElementById('alertIconElement');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertButtons = document.getElementById('alertButtons');

    const config = alertConfig[type] || alertConfig.success;

    // Set icon
    alertIcon.className = `w-20 h-20 rounded-full flex items-center justify-center ${config.iconBg}`;
    alertIconElement.className = `ph ${config.icon} text-5xl ${config.iconColor}`;

    // Set content
    alertTitle.textContent = title;
    alertMessage.textContent = message;

    // Set button
    alertButtons.innerHTML = `
        <button onclick="closeCustomAlert()" 
                class="${config.buttonClass} text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            OK
        </button>
    `;

    // Show modal
    modal.classList.remove('hidden');

    // GSAP Animation
    gsap.fromTo(alertBox,
        { scale: 0.7, opacity: 0, y: -50 },
        {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "back.out(1.7)"
        }
    );

    // Icon bounce animation
    gsap.fromTo(alertIconElement,
        { scale: 0, rotation: 0 },
        {
            scale: 1,
            rotation: 0,
            duration: 0.6,
            delay: 0.2,
            ease: "power2.out"
        }
    );

    // Auto close for success/info alerts
    if (autoClose && (type === 'success' || type === 'info')) {
        setTimeout(() => {
            closeCustomAlert();
        }, 3000);
    }
}

// Show Confirm Alert
function showConfirmAlert(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customAlertModal');
        const alertBox = document.getElementById('alertBox');
        const alertIcon = document.getElementById('alertIcon');
        const alertIconElement = document.getElementById('alertIconElement');
        const alertTitle = document.getElementById('alertTitle');
        const alertMessage = document.getElementById('alertMessage');
        const alertButtons = document.getElementById('alertButtons');

        const config = alertConfig.question;

        // Set icon
        alertIcon.className = `w-20 h-20 rounded-full flex items-center justify-center ${config.iconBg}`;
        alertIconElement.className = `ph ${config.icon} text-5xl ${config.iconColor}`;

        // Set content
        alertTitle.textContent = title;
        alertMessage.textContent = message;

        // Set buttons
        alertButtons.innerHTML = `
            <button id="cancelBtn"
                    class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Batal
            </button>
            <button id="confirmBtn"
                    class="${config.buttonClass} text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Ya, Lanjutkan
            </button>
        `;

        // Show modal
        modal.classList.remove('hidden');

        // GSAP Animation
        gsap.fromTo(alertBox,
            { scale: 0.7, opacity: 0, y: -50 },
            {
                scale: 1,
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "back.out(1.7)"
            }
        );

        // Add button listeners
        document.getElementById('cancelBtn').addEventListener('click', () => {
            closeCustomAlert();
            resolve(false);
        });

        document.getElementById('confirmBtn').addEventListener('click', () => {
            closeCustomAlert();
            resolve(true);
        });
    });
}

// Show Loading Alert
function showLoadingAlert(title = 'Memproses...', message = 'Mohon tunggu sebentar') {
    const modal = document.getElementById('customAlertModal');
    const alertBox = document.getElementById('alertBox');
    const alertIcon = document.getElementById('alertIcon');
    const alertIconElement = document.getElementById('alertIconElement');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertButtons = document.getElementById('alertButtons');

    const config = alertConfig.loading;

    // Set icon
    alertIcon.className = `w-20 h-20 rounded-full flex items-center justify-center ${config.iconBg}`;
    alertIconElement.className = `ph ${config.icon} text-5xl ${config.iconColor}`;

    // Set content
    alertTitle.textContent = title;
    alertMessage.textContent = message;

    // No buttons for loading
    alertButtons.innerHTML = '';

    // Show modal
    modal.classList.remove('hidden');

    // GSAP Animation
    gsap.fromTo(alertBox,
        { scale: 0.7, opacity: 0 },
        {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
        }
    );

    // Continuous spinner rotation
    gsap.to(alertIconElement, {
        rotation: 360,
        duration: 1,
        repeat: -1,
        ease: "none"
    });
}

// Update Loading Alert Message (for progress updates)
function updateLoadingAlert(title, message) {
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');

    if (alertTitle && alertMessage) {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
    }
}

// Show Progress Bar
function showProgressBar() {
    const progressBarContainer = document.getElementById('progressBarContainer');
    if (progressBarContainer) {
        progressBarContainer.classList.remove('hidden');
        // Animate entrance
        gsap.fromTo(progressBarContainer,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
    }
}

// Hide Progress Bar
function hideProgressBar() {
    const progressBarContainer = document.getElementById('progressBarContainer');
    if (progressBarContainer) {
        gsap.to(progressBarContainer,
            {
                opacity: 0,
                y: -10,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => progressBarContainer.classList.add('hidden')
            }
        );
    }
}

// Update Progress Bar
function updateProgressBar(current, total, subtext = '') {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressSubtext = document.getElementById('progressSubtext');

    if (progressBar && progressText) {
        const percentage = Math.round((current / total) * 100);

        // Animate progress bar width
        gsap.to(progressBar, {
            width: `${percentage}%`,
            duration: 0.5,
            ease: "power2.out"
        });

        // Update text
        progressText.textContent = `${percentage}%`;

        if (progressSubtext) {
            progressSubtext.textContent = subtext;
        }
    }
}

// Close Custom Alert
function closeCustomAlert() {
    const modal = document.getElementById('customAlertModal');
    const alertBox = document.getElementById('alertBox');

    gsap.to(alertBox, {
        scale: 0.7,
        opacity: 0,
        y: -50,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
            modal.classList.add('hidden');
        }
    });
}

// Close on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('customAlertModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeCustomAlert();
        }
    }
});
