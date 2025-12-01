// Sidebar Component
function getSidebarHTML() {
    let teacher = null;
    try {
        if (typeof getCurrentTeacher === 'function') {
            teacher = getCurrentTeacher();
        }
    } catch (e) {
        console.error("Error getting teacher info:", e);
    }

    // Default: Guru biasa
    let isAdminUser = false;
    let isGPQUser = false;
    let isGPAIUser = false;
    if (teacher) {
        const jabatan = teacher.jabatan || '';
        // const niyVal = teacher.niy || '';
        isAdminUser = (teacher.role === 'admin') ||
            (['Admin', 'Kepala Sekolah', 'Operator'].includes(jabatan)) ||
            (['admin', '000000'].includes(jabatan));
        isGPQUser = (teacher.role === 'Guru GPQ') ||
            (['Guru GPQ', '000000'].includes(jabatan));
        isGPAIUser = (teacher.role === 'Guru PAIBP') ||
            (['Guru PAIBP', '000000'].includes(jabatan));
    }

    // Define menu items
    const menuItems = [
        { href: 'dashboard.html', page: 'dashboard', icon: 'ph-house', text: 'Home', show: true },
        { href: 'siswa.html', page: 'siswa', icon: 'ph-student', text: 'Data Siswa', show: true },
        { href: 'guru.html', page: 'guru', icon: 'ph-chalkboard-teacher', text: 'Data Guru', show: isAdminUser }, // Only show for Admin
        { href: 'bilqolam.html', page: 'bilqolam', icon: 'ph-book-bookmark', text: 'Bilqolam', show: isAdminUser || isGPQUser },
        { href: 'doa.html', page: 'doa', icon: 'ph-hands-praying', text: 'Doa Sehari-hari', show: isAdminUser || isGPAIUser },
        { href: 'tathbiq.html', page: 'tathbiq', icon: 'ph-mosque', text: 'Tathbiq Ibadah', show: isAdminUser || isGPAIUser },
        { href: 'tahfizh.html', page: 'tahfizh', icon: 'ph-book-open-text', text: "Tahfizh Al-Qur'an", show: true },
        { href: 'laporan.html', page: 'laporan', icon: 'ph-file-text', text: 'Laporan', show: true }
    ];

    // Generate menu HTML
    const navLinks = menuItems.map(item => {
        if (!item.show) return '';
        return `
        <a href="${item.href}" data-page="${item.page}"
            class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i class="ph ${item.icon} text-xl"></i>
            <span>${item.text}</span>
        </a>`;
    }).join('');

    return `
<aside id="sidebar"
    class="fixed lg:static inset-y-0 left-0 z-30 w-64 -translate-x-full lg:translate-x-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-lg lg:shadow-none">

    <!-- Sidebar Header -->
    <div class="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center">
                <i class="ph ph-book-open-text text-xl"></i>
            </div>
            <span class="text-lg font-bold tracking-tight text-gray-800 dark:text-white">Rapor Mengaji</span>
        </div>
        <!-- Close Button (Mobile) -->
        <button onclick="toggleSidebar()" id="close-sidebar"
            class="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <i class="ph ph-x text-2xl"></i>
        </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        ${navLinks}
    </nav>

    <!-- Sidebar Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <!-- Theme Toggle -->
        <button onclick="toggleTheme()"
            class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i id="theme-icon" class="ph ph-moon text-xl"></i>
            <span id="theme-text">Dark Mode</span>
        </button>
    </div>
</aside>
`;
}

// Function to load sidebar
function loadSidebar(activePage) {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = getSidebarHTML();

        // Set active state
        if (activePage) {
            const activeLink = document.querySelector(`[data-page="${activePage}"]`);
            if (activeLink) {
                activeLink.classList.remove('text-gray-600', 'hover:bg-gray-100', 'hover:text-gray-900', 'dark:text-gray-400', 'dark:hover:bg-gray-700', 'dark:hover:text-white');
                activeLink.classList.add('bg-primary/10', 'text-primary', 'dark:bg-primary/20', 'dark:text-primary');
            }
        }
    }
}

// Auto-detect current page and load sidebar
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    let activePage = '';

    if (path.includes('dashboard')) activePage = 'dashboard';
    else if (path.includes('siswa')) activePage = 'siswa';
    else if (path.includes('guru')) activePage = 'guru';
    else if (path.includes('bilqolam')) activePage = 'bilqolam';
    else if (path.includes('doa')) activePage = 'doa';
    else if (path.includes('tathbiq')) activePage = 'tathbiq';
    else if (path.includes('tahfizh')) activePage = 'tahfizh';
    else if (path.includes('laporan')) activePage = 'laporan';

    loadSidebar(activePage);
});
