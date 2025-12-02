// Authentication and Session Management

// Check if user is logged in
function checkAuth() {
    const currentTeacher = localStorage.getItem('currentTeacher');

    // If not logged in and not on login page, redirect to login
    if (!currentTeacher && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
        window.location.href = 'login.html';
        return null;
    }

    if (currentTeacher) {
        return JSON.parse(currentTeacher);
    }

    return null;
}

// Get current logged in teacher
function getCurrentTeacher() {
    const teacherData = localStorage.getItem('currentTeacher');
    return teacherData ? JSON.parse(teacherData) : null;
}

// Logout function
function logout() {
    // Show confirmation
    if (typeof showConfirmAlert === 'function') {
        showConfirmAlert(
            'Konfirmasi Logout',
            'Apakah Anda yakin ingin keluar dari aplikasi?',
            () => {
                localStorage.removeItem('currentTeacher');
                window.location.href = 'login.html';
            }
        );
    } else {
        // Fallback if custom alert is not loaded
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            localStorage.removeItem('currentTeacher');
            window.location.href = 'login.html';
        }
    }
}

// Check if teacher is an admin
function isAdmin(teacher) {
    if (!teacher) return false;
    // Cek berdasarkan role, jabatan, atau NIY spesifik
    const adminJabatan = ['Admin', 'Kepala Sekolah', 'Operator'];
    const adminNiy = ['admin', '000000']; // NIY khusus admin

    return (teacher.role === 'admin') ||
        (adminJabatan.includes(teacher.jabatan)) ||
        (adminNiy.includes(teacher.niy));
}

// Filter students by teacher
function filterStudentsByTeacher(students, teacher) {
    if (!teacher) return students;

    // Jika admin, kembalikan semua data (tidak difilter)
    if (isAdmin(teacher)) {
        return students;
    }

    const teacherName = teacher.nama_lengkap;

    // Filter students where the teacher is either guru_pai or bilqolam_guru
    return students.filter(student => student.guru_pai === teacherName || student.bilqolam_guru === teacherName);
}

// Get teacher info display
function getTeacherInfoHTML(teacher) {
    if (!teacher) return '';

    return `
        <div class="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex items-center justify-center font-semibold">
                ${teacher.nama_lengkap ? teacher.nama_lengkap.charAt(0).toUpperCase() : 'G'}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    ${teacher.nama_lengkap || 'Guru'}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    NIY: ${teacher.niy || '-'}
                </p>
            </div>
            <button 
                onclick="logout()" 
                class="flex-shrink-0 p-2 text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                title="Keluar"
            >
                <i class="ph ph-sign-out text-xl"></i>
            </button>
        </div>
    `;
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only check auth if not on index or login page
    if (!window.location.pathname.includes('index.html') &&
        !window.location.pathname.includes('login.html') &&
        window.location.pathname !== '/') {
        checkAuth();
    }
});
