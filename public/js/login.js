document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');

    // Check if already logged in
    const currentTeacher = localStorage.getItem('currentTeacher');
    if (currentTeacher) {
        window.location.href = 'dashboard.html';
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let email = emailInput.value.trim();

        if (!email) {
            showError('Email tidak boleh kosong');
            return;
        }

        // Auto-append domain if not present
        if (!email.includes('@')) {
            email += '@sekolahanaksaleh.sch.id';
        }

        // Show loading state
        setLoading(true);
        hideError();

        try {
            // Query teacher by email
            const teacherQuery = await db.collection('teachers')
                .where('email', '==', email)
                .get();

            if (teacherQuery.empty) {
                showError('Email tidak ditemukan. Silakan periksa kembali Email Anda.');
                setLoading(false);
                return;
            }

            // Get teacher data
            const teacherDoc = teacherQuery.docs[0];
            const teacherData = {
                id: teacherDoc.id,
                ...teacherDoc.data()
            };

            // Save to localStorage
            localStorage.setItem('currentTeacher', JSON.stringify(teacherData));

            // Show success animation
            gsap.to(loginButton, {
                scale: 1.05,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            showError('Terjadi kesalahan saat login. Silakan coba lagi.');
            setLoading(false);
        }
    });

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        gsap.fromTo(errorMessage,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.3 }
        );
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            loginButton.disabled = true;
            loginButton.classList.add('opacity-75', 'cursor-not-allowed');
            buttonText.innerHTML = '<i class="ph ph-spinner ph-spin mr-2"></i>Memproses...';
        } else {
            loginButton.disabled = false;
            loginButton.classList.remove('opacity-75', 'cursor-not-allowed');
            buttonText.textContent = 'Masuk ke Dashboard';
        }
    }

    // Auto-focus on email input
    emailInput.focus();

    // Add input animation
    emailInput.addEventListener('focus', () => {
        gsap.to(emailInput, {
            scale: 1.02,
            duration: 0.2
        });
    });

    emailInput.addEventListener('blur', () => {
        gsap.to(emailInput, {
            scale: 1,
            duration: 0.2
        });
    });
});
