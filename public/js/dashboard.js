document.addEventListener('DOMContentLoaded', () => {
    // Get current teacher
    const teacher = getCurrentTeacher();

    if (teacher) {
        const db = firebase.firestore();
        // Student count & Updates
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

            // --- Populate Recent Updates Table ---
            const recentUpdatesTableBody = document.getElementById('recentUpdatesTableBody');
            if (recentUpdatesTableBody) {
                // Sort by updated_at desc (handle missing updated_at by treating as old)
                const sortedStudents = [...teacherStudents].sort((a, b) => {
                    const dateA = a.updated_at ? new Date(a.updated_at.toDate()) : new Date(0);
                    const dateB = b.updated_at ? new Date(b.updated_at.toDate()) : new Date(0);
                    return dateB - dateA;
                });

                // Take top 5
                const recentUpdates = sortedStudents.slice(0, 5);

                recentUpdatesTableBody.innerHTML = '';
                if (recentUpdates.length === 0) {
                    recentUpdatesTableBody.innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center">Belum ada data update.</td></tr>';
                } else {
                    recentUpdates.forEach(student => {
                        const date = student.updated_at ? new Date(student.updated_at.toDate()).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '-';

                        const row = `
                            <tr class="studentUpdate bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                    ${student.nama_lengkap || 'Tanpa Nama'}
                                </td>
                                <td class="px-4 py-3">
                                    ${student.kelas || '-'}
                                </td>
                                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
                                    ${date}
                                </td>
                                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
                                    ${student.bilqolam_guru || '-'}
                                </td>
                                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
                                    ${student.guru_pai || '-'}
                                </td>
                            </tr>
                        `;
                        recentUpdatesTableBody.innerHTML += row;
                    });

                    // GSAP
                    gsap.from('.studentUpdate', {
                        opacity: 0,
                        y: 20,
                        duration: 0.5,
                        stagger: 0.1,
                        ease: 'power3.out'
                    });
                }
            }

            // --- Populate Quick Stats (Reguler vs Pasca) ---
            const statReguler = document.getElementById('statReguler');
            const statPasca = document.getElementById('statPasca');
            const barReguler = document.getElementById('barReguler');
            const barPasca = document.getElementById('barPasca');

            if (statReguler && statPasca) {
                const regulerCount = teacherStudents.filter(s => s.status === 'Reguler').length;
                const pascaCount = teacherStudents.filter(s => s.status === 'Pasca').length;
                const total = teacherStudents.length || 1; // Avoid division by zero

                statReguler.textContent = regulerCount;
                statPasca.textContent = pascaCount;

                if (barReguler) barReguler.style.width = `${(regulerCount / total) * 100}%`;
                if (barPasca) barPasca.style.width = `${(pascaCount / total) * 100}%`;
            }

        }).catch((error) => {
            console.error("Error fetching students: ", error);
            const recentUpdatesTableBody = document.getElementById('recentUpdatesTableBody');
            if (recentUpdatesTableBody) {
                recentUpdatesTableBody.innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center text-red-500">Gagal memuat data.</td></tr>';
            }
        });

        // Teacher count
        db.collection('teachers').get().then((snapshot) => {
            let allTeachers = [];
            snapshot.forEach((doc) => {
                allTeachers.push({ id: doc.id, ...doc.data() });
            });
            const totalTeachersEl = document.getElementById('totalTeachers');
            if (totalTeachersEl) {
                totalTeachersEl.textContent = allTeachers.length;
            }
        }).catch((error) => {
            console.error("Error fetching teachers: ", error);
        });

        // completed student count
        db.collection('students').where('status', '==', 'completed').get().then((snapshot) => {
            let completedStudents = [];
            snapshot.forEach((doc) => {
                completedStudents.push({ id: doc.id, ...doc.data() });
            });
            const completedStudentsEl = document.getElementById('completedStudents');
            if (completedStudentsEl) {
                completedStudentsEl.textContent = completedStudents.length;
            }
        }).catch((error) => {
            console.error("Error fetching completed students: ", error);
        });

    }

    // Register GSAP plugins if needed (not needed for core)

    // Initial Animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from("#sidebar", { x: -50, opacity: 0, duration: 0.8 })
        .from(".stat-card", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.2")
        .to(["#recent-updates-card", "#quick-stats-card"], {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1
        }, "-=0.2");

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
