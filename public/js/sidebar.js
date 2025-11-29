// Sidebar Component
const sidebarHTML = `
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
        <a href="dashboard.html" data-page="dashboard"
            class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i class="ph ph-house text-xl"></i>
            <span>Home</span>
        </a>

        <a href="siswa.html" data-page="siswa"
            class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i class="ph ph-student text-xl"></i>
            <span>Data Siswa</span>
        </a>

        <a href="guru.html" data-page="guru"
            class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i class="ph ph-chalkboard-teacher text-xl"></i>
            <span>Data Guru</span>
        </a>

        <a href="bilqolam.html" data-page="bilqolam"
            class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i class="ph ph-book-bookmark text-xl"></i>
            <span>Bilqolam</span>
        </a>

        <a href="doa.html" data-page="doa"
            class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i class="ph ph-hands-praying text-xl"></i>
            <span>Doa Sehari-hari</span>
        </a>

        <a href="tathbiq.html" data-page="tathbiq"
            class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i class="ph ph-mosque text-xl"></i>
            <span>Tathbiq Ibadah</span>
        </a>

        <a href="tahfizh.html" data-page="tahfizh"
            class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i class="ph ph-book-open-text text-xl"></i>
            <span>Tahfizh Al-Qur'an</span>
        </a>

        <a href="laporan.html" data-page="laporan"
            class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i class="ph ph-file-text text-xl"></i>
            <span>Laporan</span>
        </a>
    </nav>

    <!-- Sidebar Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">

        <!-- Theme Toggle -->
        <button onclick="toggleTheme()"
            class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
            <i id="theme-icon" class="ph ph-moon text-xl"></i>
            <span id="theme-text">Dark Mode</span>
        </button>

        <!-- Logout -->
        <a href="index.html"
            class="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors">
            <i class="ph ph-sign-out text-xl"></i>
            <span>Logout</span>
        </a>
    </div>
</aside>
`;

// Function to load sidebar
function loadSidebar(activePage) {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = sidebarHTML;

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
