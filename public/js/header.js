// Header Component
function getHeaderHTML() {
    let teacher = null;
    try {
        if (typeof getCurrentTeacher === 'function') {
            teacher = getCurrentTeacher();
        }
    } catch (e) {
        console.error("Error getting teacher info:", e);
    }

    const name = teacher ? teacher.nama_lengkap : 'Guru';
    const niy = teacher ? teacher.niy : '';
    const initial = name.charAt(0).toUpperCase();

    // Cek admin status
    let isAdminUser = false;
    if (teacher) {
        const jabatan = teacher.jabatan || '';
        const niyVal = teacher.niy || '';
        isAdminUser = (teacher.role === 'admin') ||
            (['Admin', 'Kepala Sekolah', 'Operator'].includes(jabatan)) ||
            (['admin', '000000'].includes(niyVal));
    }

    const roleBadge = isAdminUser ? '<span class="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded ml-2">ADMIN</span>' : '';

    return `
    <header class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 w-full z-30 transition-all duration-300 relative">
        <div class="px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Left: Sidebar Toggle & Title -->
                <div class="flex items-center gap-4">
                    <button onclick="toggleSidebar()" class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                        <i class="ph ph-list text-2xl"></i>
                    </button>
                    <h1 id="page-title" class="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
                        Rapor Mengaji
                    </h1>
                </div>

                <!-- Right: User Profile -->
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div class="text-right hidden md:block">
                            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-end">
                                ${name}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">NIY: ${niy}</p>
                        </div>
                        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 shadow-lg">
                            <div class="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                                <span class="font-bold text-primary text-lg">${initial}</span>
                            </div>
                        </div>
                        <button 
                            onclick="logout()" 
                            class="flex-shrink-0 p-2 text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                            title="Keluar"
                        >
                            <i class="ph ph-sign-out text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </header>
    `;
}

// Page titles mapping
const pageTitles = {
    'dashboard': 'Dashboard',
    'siswa': 'Data Siswa',
    'bilqolam': 'Bilqolam',
    'doa': 'Doa Sehari-hari',
    'tathbiq': 'Tathbiq Ibadah',
    'tahfizh': "Tahfizh Al-Qur'an",
    'laporan': 'Laporan',
    'guru': 'Data Guru',
    'kurikulum': 'Data Kurikulum'
};

// Function to load header
function loadHeader(activePage) {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = getHeaderHTML();

        // Set page title
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            // Default title
            let title = 'Rapor Mengaji';

            // Try to match active page
            if (activePage && pageTitles[activePage]) {
                title = pageTitles[activePage];
            }

            pageTitle.textContent = title;
        }
    } else {
        console.error("Header container not found!");
    }
}

// Auto-detect current page and load header
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    let activePage = '';

    if (path.includes('dashboard')) activePage = 'dashboard';
    else if (path.includes('siswa')) activePage = 'siswa';
    else if (path.includes('bilqolam')) activePage = 'bilqolam';
    else if (path.includes('doa')) activePage = 'doa';
    else if (path.includes('tathbiq')) activePage = 'tathbiq';
    else if (path.includes('tahfizh')) activePage = 'tahfizh';
    else if (path.includes('laporan')) activePage = 'laporan';
    else if (path.includes('guru')) activePage = 'guru';
    else if (path.includes('kurikulum')) activePage = 'kurikulum';

    loadHeader(activePage);
});
