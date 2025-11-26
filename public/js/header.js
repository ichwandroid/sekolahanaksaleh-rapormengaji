// Header Component
const headerHTML = `
<header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 z-10">
    <div class="flex items-center gap-4">
        <!-- Toggle Sidebar Button -->
        <button onclick="toggleSidebar()" id="sidebar-toggle"
            class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary">
            <i class="ph ph-list text-2xl"></i>
        </button>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white hidden sm:block" id="page-title">Dashboard</h2>
    </div>

    <!-- User Profile / Actions -->
    <div class="flex items-center gap-4">
        <div class="flex items-center gap-3">
            <div class="text-right hidden md:block">
                <p class="text-sm font-semibold text-gray-800 dark:text-white">Operator SD Anak Saleh</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Operator</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md">
                OP
            </div>
        </div>
    </div>
</header>
`;

// Page titles mapping
const pageTitles = {
    'dashboard': 'Dashboard',
    'siswa': 'Data Siswa',
    'bilqolam': 'Bilqolam',
    'doa': 'Doa Sehari-hari',
    'tathbiq': 'Tathbiq Ibadah'
};

// Function to load header
function loadHeader(activePage) {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = headerHTML;

        // Set page title
        const pageTitle = document.getElementById('page-title');
        if (pageTitle && activePage && pageTitles[activePage]) {
            pageTitle.textContent = pageTitles[activePage];
        }
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

    loadHeader(activePage);
});
