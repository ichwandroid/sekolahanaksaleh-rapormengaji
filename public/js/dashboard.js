document.addEventListener('DOMContentLoaded', () => {
    // Get current teacher
    const teacher = getCurrentTeacher();

    // Fetch and display student count
    if (teacher) {
        const db = firebase.firestore();
        db.collection('students').get().then((snapshot) => {
            let allStudents = [];
            snapshot.forEach((doc) => {
                allStudents.push({ id: doc.id, ...doc.data() });
            });

            // Filter students by teacher
            const teacherStudents = filterStudentsByTeacher(allStudents, teacher);

            // Update total students display
            const totalStudentsEl = document.getElementById('totalStudents');
            if (totalStudentsEl) {
                totalStudentsEl.textContent = teacherStudents.length;
            }
        }).catch((error) => {
            console.error("Error fetching students: ", error);
        });
    }

    // Register GSAP plugins if needed (not needed for core)

    // Initial Animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from("#sidebar", { x: -50, opacity: 0, duration: 0.8 })
        .from(".stat-card", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.2")
        .from("#main-content-placeholder", { scale: 0.95, opacity: 0, duration: 0.6 }, "-=0.4");

    // Sidebar Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    // State
    let isSidebarOpen = window.innerWidth >= 1024;

    // Toggle Function
    window.toggleSidebar = function () {
        isSidebarOpen = !isSidebarOpen;
        updateSidebarUI();
    }

    // UI Update Logic
    function updateSidebarUI() {
        const isDesktop = window.innerWidth >= 1024;

        if (isDesktop) {
            // Desktop Behavior
            if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');

            // Reset mobile transforms
            gsap.set(sidebar, { x: 0 });

            if (isSidebarOpen) {
                // Slide In (Desktop - Margin)
                gsap.to(sidebar, { marginLeft: 0, duration: 0.4, ease: "power3.inOut" });
            } else {
                // Slide Out (Desktop - Margin)
                gsap.to(sidebar, { marginLeft: -256, duration: 0.4, ease: "power3.inOut" });
            }
        } else {
            // Mobile Behavior
            // Reset desktop margins
            gsap.set(sidebar, { marginLeft: 0 });

            if (isSidebarOpen) {
                if (sidebarBackdrop) {
                    sidebarBackdrop.classList.remove('hidden');
                    gsap.fromTo(sidebarBackdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                }
                gsap.to(sidebar, { x: 0, duration: 0.4, ease: "power3.inOut" });
            } else {
                if (sidebarBackdrop) {
                    gsap.to(sidebarBackdrop, { opacity: 0, duration: 0.3, onComplete: () => sidebarBackdrop.classList.add('hidden') });
                }
                gsap.to(sidebar, { x: -280, duration: 0.4, ease: "power3.inOut" });
            }
        }
    }

    // Initialize
    // We set initial state immediately without animation to match the isSidebarOpen flag
    if (window.innerWidth >= 1024) {
        gsap.set(sidebar, { marginLeft: 0, x: 0 });
    } else {
        gsap.set(sidebar, { marginLeft: 0, x: -280 });
    }

    // Handle Resize
    window.addEventListener('resize', () => {
        const isDesktop = window.innerWidth >= 1024;

        // Auto-correct state when crossing breakpoints
        if (isDesktop) {
            if (!isSidebarOpen && gsap.getProperty(sidebar, "x") < 0) {
                isSidebarOpen = true;
            }
        } else {
            if (isSidebarOpen && gsap.getProperty(sidebar, "marginLeft") === 0) {
                isSidebarOpen = false;
            }
        }
        updateSidebarUI();
    });

    // Dark Mode Logic
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    // Check local storage or system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
        updateThemeUI(true);
    } else {
        html.classList.remove('dark');
        updateThemeUI(false);
    }

    window.toggleTheme = function () {
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.theme = 'light';
            updateThemeUI(false);
        } else {
            html.classList.add('dark');
            localStorage.theme = 'dark';
            updateThemeUI(true);
        }
    }

    function updateThemeUI(isDark) {
        if (!themeIcon || !themeText) return;

        if (isDark) {
            themeIcon.classList.replace('ph-moon', 'ph-sun');
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.classList.replace('ph-sun', 'ph-moon');
            themeText.textContent = 'Dark Mode';
        }
    }
});
