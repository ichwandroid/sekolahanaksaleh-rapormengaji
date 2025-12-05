document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const tableBody = document.getElementById('laporanTableBody');
    if (!tableBody) return;

    // Display teacher info
    const teacher = getCurrentTeacher();
    const teacherInfoCard = document.getElementById('teacherInfoCard');
    if (teacher && teacherInfoCard) {
        teacherInfoCard.innerHTML = `
            <div class="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <div class="flex items-center gap-4">
                    <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                        ${teacher.nama_lengkap ? teacher.nama_lengkap.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div class="flex-1">
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <i class="ph ph-user-circle mr-1"></i>
                            Anda login sebagai:
                        </p>
                        <p class="text-lg font-bold text-gray-900 dark:text-white">
                            ${teacher.nama_lengkap || 'Guru'}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            NIY: ${teacher.niy || '-'} | Menampilkan siswa yang Anda ajar
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    // Filters & Sort UI
    const filterKelas = document.getElementById('filterKelas');
    const filterKelompok = document.getElementById('filterKelompok');
    const filterShift = document.getElementById('filterShift');
    const searchInput = document.getElementById('searchInput');
    const btnSort = document.getElementById('btnSort');
    const sortLabel = document.getElementById('sortLabel');

    // Pagination UI
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnPrevMobile = document.getElementById('btnPrevMobile');
    const btnNextMobile = document.getElementById('btnNextMobile');
    const pageNumbers = document.getElementById('pageNumbers');
    const pageStart = document.getElementById('pageStart');
    const pageEnd = document.getElementById('pageEnd');
    const totalItems = document.getElementById('totalItems');

    // Rapor Container
    const raporContainer = document.getElementById('raporContainer');
    const mainContent = document.getElementById('main-content');

    // State
    let studentsData = [];
    let teachersData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortOrder = 'asc';

    // Configuration data (same as in other pages)
    const surahData = {
        "Quraisy": 4, "At-Takatsur": 8, "An-Nashr": 3, "An-Nas": 6,
        "Al-Ma'un": 7, "Al-Lahab": 5, "Al-Kautsar": 3, "Al-Kafirun": 6,
        "Al-Ikhlash": 4, "Al-Humazah": 9, "Al-Fil": 5, "Al-Falaq": 5,
        "Al-'Ashr": 3, "At-Tin": 8, "Asy-Syarh": 8, "Al-Qadr": 5,
        "Al-Bayyinah": 8, "Al-'Alaq": 19, "Al-Ghasyiyah": 26, "Al-Fajr": 30,
        "Al-A'la": 19, "Al-Muthaffifin": 36, "Al-Infithar": 19,
        "An-Nazi'at": 46, "An-Naba'": 40, "Yasin-ayat 41 s/d 83": 83
    };

    const tahfizhConfig = {
        '1': ["An-Nas", "Al-Falaq", "Al-Ikhlash", "Al-Lahab", "An-Nashr", "Al-Kafirun", "Al-Kautsar", "Al-Ma'un", "Quraisy", "Al-Fil", "Al-Humazah", "Al-'Ashr", "At-Takatsur"],
        '2': ["Al-Bayyinah", "Al-Qadr", "Al-'Alaq", "At-Tin", "Asy-Syarh"],
        '3': ["Al-Fajr", "Al-Ghasyiyah", "Al-A'la"],
        '4': ["Al-Muthaffifin", "Al-Infithar"],
        '5': ["An-Nazi'at", "An-Naba'"],
        '6': ["Yasin-ayat 41 s/d 83"]
    };

    const tahfizhThresholds = {
        "Yasin-ayat 41 s/d 83": { min: 54, mid: 68, max: 83 },
        "An-Naba'": { min: 13, mid: 30, max: 40 },
        "An-Nazi'at": { min: 14, mid: 30, max: 46 },
        "'Abasa": { min: 14, mid: 30, max: 42 },
        "At-Takwir": { min: 10, mid: 20, max: 29 },
        "Al-Infithar": { min: 6, mid: 13, max: 19 },
        "Al-Muthaffifin": { min: 12, mid: 24, max: 36 },
        "Al-Insyiqaq": { min: 8, mid: 17, max: 25 },
        "Al-Buruj": { min: 7, mid: 15, max: 22 },
        "Ath-Thariq": { min: 6, mid: 12, max: 17 },
        "Al-A'la": { min: 8, mid: 15, max: 19 },
        "Al-Ghasyiyah": { min: 8, mid: 18, max: 26 },
        "Al-Fajr": { min: 10, mid: 20, max: 30 },
        "Al-Balad": { min: 7, mid: 14, max: 20 },
        "Asy-Syams": { min: 5, mid: 11, max: 15 },
        "Al-Lail": { min: 7, mid: 15, max: 21 },
        "Adh-Dhuha": { min: 4, mid: 8, max: 11 },
        "Asy-Syarh": { min: 3, mid: 6, max: 8 },
        "At-Tin": { min: 3, mid: 6, max: 8 },
        "Al-'Alaq": { min: 8, mid: 15, max: 19 },
        "Al-Qadr": { min: 2, mid: 4, max: 5 },
        "Al-Bayyinah": { min: 3, mid: 6, max: 8 },
        "Az-Zalzalah": { min: 3, mid: 6, max: 8 },
        "Al-'Adiyat": { min: 4, mid: 8, max: 11 },
        "Al-Qari'ah": { min: 4, mid: 8, max: 11 },
        "At-Takatsur": { min: 3, mid: 6, max: 8 },
        "Al-'Ashr": { min: 1, mid: 2, max: 3 },
        "Al-Humazah": { min: 3, mid: 7, max: 9 },
        "Al-Fil": { min: 2, mid: 4, max: 5 },
        "Quraisy": { min: 1, mid: 3, max: 4 },
        "Al-Ma'un": { min: 2, mid: 4, max: 7 },
        "An-Nas": { min: 2, mid: 4, max: 6 },
        "Al-Falaq": { min: 2, mid: 3, max: 5 },
        "Al-Ikhlash": { min: 1, mid: 2, max: 4 },
        "Al-Lahab": { min: 2, mid: 3, max: 5 },
        "An-Nashr": { min: 1, mid: 2, max: 3 },
        "Al-Kafirun": { min: 2, mid: 4, max: 6 },
        "Al-Kautsar": { min: 1, mid: 2, max: 3 }
    };

    const doaConfig = {
        '1': ["Do'a Mau Tidur", "Do'a Bangun Tidur", "Do'a Masuk Kamar Mandi", "Do'a Keluar Kamar Mandi", "Do'a Sebelum Makan", "Do'a Sesudah Makan"],
        '2': ["Do'a Senandung al-Qur'an", "Do'a Kaffarotul Majlis", "Do'a Masuk Masjid", "Do'a Keluar Masjid"],
        '3': ["Do'a Mohon Kecerdasan Berpikir", "Ayat Kursi"],
        '4': ["Do'a Ketika Sakit", "Do'a Menjenguk Orang Sakit", "Do'a Qunut"],
        '5': ["Do'a Mohon Keselamatan", "Do'a Mohon Diberi Keteguhan Hati", "Shalawat Thibbil Qulub"],
        '6': ["Do'a Mohon Diberi Rahmat & Hikmah", "Do'a Mohon Petunjuk Kepada Allah"]
    };

    const tathbiqConfig = {
        '1': ["Niat Wudhu", "Sesudah Wudhu", "Niat-Niat Shalat Fardhu"],
        '2': ["Bacaan dan Jawaban Adzan", "Do'a Ba'da Adzan", "Bacaan Iqamah", "Dzikir Ba'da Shalat"],
        '3': ["Niat Shalat Tarawih", "Niat Shalat Witir", "Dzikir Ba'da Shalat Tarawih & Witir"],
        '4': ["Niat Mandi Wajib"],
        '5': ["Niat Tayammum", "Praktik Tayammum", "Niat Shalat Jama' Taqdim", "Niat Shalat Jama' Ta'khir"],
        '6': ["Niat Shalat Hajat", "Do'a Shalat Hajat", "Niat Shalat Tasbih"]
    };

    // --- Real-time Listener ---
    db.collection('students').onSnapshot((snapshot) => {
        let allStudents = [];
        snapshot.forEach((doc) => {
            allStudents.push({ id: doc.id, ...doc.data() });
        });

        // Get current teacher and filter students
        const teacher = getCurrentTeacher();
        if (teacher) {
            studentsData = filterStudentsByTeacher(allStudents, teacher);
        } else {
            studentsData = allStudents;
        }

        populateFilters();
        applyFilters();
    }, (error) => {
        console.error("Error fetching students: ", error);
        tableBody.innerHTML = `
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td colspan="7" class="px-6 py-4 text-center text-red-500">
                    Gagal memuat data: ${error.message}
                </td>
            </tr>`;
    });

    // --- Fetch Teachers ---
    db.collection('teachers').onSnapshot((snapshot) => {
        teachersData = [];
        snapshot.forEach((doc) => {
            teachersData.push({ id: doc.id, ...doc.data() });
        });
    }, (error) => {
        console.error("Error fetching teachers: ", error);
    });

    // --- Filtering & Sorting ---
    function populateFilters() {
        const kelasSet = new Set();
        const kelompokSet = new Set();
        const shiftSet = new Set();

        studentsData.forEach(s => {
            if (s.kelas) kelasSet.add(s.kelas);
            if (s.kelompok) kelompokSet.add(s.kelompok);
            if (s.shift) shiftSet.add(s.shift);
        });

        updateSelectOptions(filterKelas, kelasSet, 'Semua Kelas');
        updateSelectOptions(filterKelompok, kelompokSet, 'Semua Kelompok');
        updateSelectOptions(filterShift, shiftSet, 'Semua Shift');
    }

    function updateSelectOptions(selectElement, set, defaultText) {
        const currentValue = selectElement.value;
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        Array.from(set).sort((a, b) => {
            return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
        }).forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val;
            selectElement.appendChild(option);
        });
        selectElement.value = currentValue;
    }

    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const kelas = filterKelas.value;
        const kelompok = filterKelompok.value;
        const shift = filterShift.value;

        filteredData = studentsData.filter(s => {
            const matchSearch = (s.nama_lengkap && s.nama_lengkap.toLowerCase().includes(search)) ||
                (s.nis && s.nis.includes(search));
            const matchKelas = !kelas || s.kelas === kelas;
            const matchKelompok = !kelompok || s.kelompok === kelompok;
            const matchShift = !shift || s.shift === shift;

            return matchSearch && matchKelas && matchKelompok && matchShift;
        });

        filteredData.sort((a, b) => {
            const nameA = (a.nama_lengkap || '').toLowerCase();
            const nameB = (b.nama_lengkap || '').toLowerCase();
            if (sortOrder === 'asc') return nameA.localeCompare(nameB);
            return nameB.localeCompare(nameA);
        });

        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = 1;
        if (currentPage < 1) currentPage = 1;

        renderTable();
        renderPagination();
    }

    // --- Rendering ---
    function renderTable() {
        if (filteredData.length === 0) {
            tableBody.innerHTML = `
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data siswa yang cocok.
                    </td>
                </tr>`;
            return;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = filteredData.slice(start, end);

        let html = '';
        pageData.forEach((data) => {
            html += `
                <tr class="student-row bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors opacity-0">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${data.nis || '-'}</td>
                    <td class="px-6 py-4">${data.nisn || '-'}</td>
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${data.nama_lengkap || '-'}</td>
                    <td class="px-6 py-4">${data.kelas || '-'}</td>
                    <td class="px-6 py-4">${data.kelompok || '-'}</td>
                    <td class="px-6 py-4">${data.shift || '-'}</td>
                    <td class="px-6 py-4 text-center">${data.saran_guru_gpq ? '<i class="ph ph-check-circle text-2xl text-green-500"></i>' : '-'}</td>
                    <td class="px-6 py-4 text-center">${data.saran_guru_pai ? '<i class="ph ph-check-circle text-2xl text-green-500"></i>' : '-'}</td>
                    <td class="px-6 py-4">
                        <button class="font-medium text-primary" onclick="viewRapor('${data.id}')">
                            <i class="ph ph-file-text"></i> Lihat Rapor
                        </button>
                        <button class="font-medium text-blue-600" onclick="openSaranModal('${data.id}')">
                            <i class="ph ph-pencil-simple"></i> Edit Saran
                        </button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;

        gsap.to(".student-row", {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.out",
            onStart: function () {
                gsap.set(this.targets(), { y: 10 });
            }
        });
    }

    function renderPagination() {
        const total = filteredData.length;
        const totalPages = Math.ceil(total / itemsPerPage);

        const start = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, total);

        pageStart.textContent = start;
        pageEnd.textContent = end;
        totalItems.textContent = total;

        const isFirst = currentPage === 1;
        const isLast = currentPage === totalPages || totalPages === 0;

        [btnPrev, btnPrevMobile].forEach(btn => btn.disabled = isFirst);
        [btnNext, btnNextMobile].forEach(btn => btn.disabled = isLast);

        let pagesHtml = '';
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                const isActive = i === currentPage;
                const classes = isActive
                    ? "relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-gray-400 dark:ring-gray-600 dark:hover:bg-gray-700";

                pagesHtml += `<button onclick="changePage(${i})" class="${classes}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                pagesHtml += `<span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0 dark:text-gray-400 dark:ring-gray-600">...</span>`;
            }
        }
        pageNumbers.innerHTML = pagesHtml;
    }

    // --- Event Listeners ---
    [filterKelas, filterKelompok, filterShift, searchInput].forEach(el => {
        el.addEventListener('input', () => {
            currentPage = 1;
            applyFilters();
        });
    });

    btnSort.addEventListener('click', () => {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        sortLabel.textContent = sortOrder === 'asc' ? 'Nama A-Z' : 'Nama Z-A';
        applyFilters();
    });

    window.changePage = (page) => {
        currentPage = page;
        renderTable();
        renderPagination();
    };

    [btnPrev, btnPrevMobile].forEach(btn => btn.addEventListener('click', () => {
        if (currentPage > 1) changePage(currentPage - 1);
    }));

    [btnNext, btnNextMobile].forEach(btn => btn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < totalPages) changePage(currentPage + 1);
    }));

    // --- View Rapor Function (Generate PDF) ---
    window.viewRapor = async (id) => {
        const student = studentsData.find(s => s.id === id);
        if (!student) return;

        // Show loading indicator
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Generating PDF...';
        button.disabled = true;

        try {
            await generatePDF(student);
        } catch (error) {
            console.error('Error generating PDF:', error);
            showCustomAlert('error', 'Terjadi kesalahan!', 'Gagal membuat PDF: ' + error.message);
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    };

    async function generatePDF(student) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const kelasNum = student.kelas ? student.kelas.match(/\d+/)?.[0] : null;

        // Get current date
        const today = new Date();
        const dateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        // --- Helpers for Grading & Description ---
        function getPredicate(score) {
            if (score >= 86) return 'B';
            if (score >= 71) return 'C';
            return 'K';
        }

        function getDescription(category, name, score) {
            let quality = '';
            if (score >= 86) quality = 'mampu'; // or 'mampu'
            else if (score >= 71) quality = 'cukup mampu'; // or 'mampu'
            else quality = 'kurang mampu';

            if (category === 'Tajwid') return `Ananda ${quality} memahami tajwid dalam bacaan`;
            if (category === 'Fashahah') return `Ananda ${quality} melafalkan bacaan dengan jelas`;
            if (category === 'Lagu') return `Ananda ${quality} memahami nada bacaan`;

            if (category === 'Doa') {
                let lancar = '';
                if (score >= 86) lancar = 'lancar';
                else if (score >= 71) lancar = 'cukup lancar';
                else lancar = 'kurang lancar';
                return `Ananda ${lancar} dalam menghafalkan ${name}`;
            }

            if (category === 'Tahfizh') {
                const threshold = tahfizhThresholds[name];
                let quality = '';

                if (threshold) {
                    if (score >= threshold.max) quality = 'Baik dan';
                    else if (score >= threshold.min) quality = 'Cukup';
                    else quality = 'Kurang';
                } else {
                    // Fallback if no threshold defined
                    if (score > 0) quality = 'Baik';
                    else quality = 'Kurang';
                }

                return `Ananda ${quality} lancar dalam menghafal Surah ${name}`;
            }

            if (category === 'Ibadah') {
                return `Ananda ${quality} dalam ${name}`;
            }

            return '';
        }

        // --- Data Preparation ---

        // Bilqolam
        const tajwid = parseInt(student.bilqolam_tajwid) || 0;
        const fashahah = parseInt(student.bilqolam_fashahah) || 0;
        const lagu = parseInt(student.bilqolam_lagu) || 0;

        // Doa
        const doaList = kelasNum && doaConfig[kelasNum] ? doaConfig[kelasNum] : [];
        const doaData = student.doa_sehari || {};

        // Tahfizh
        const surahList = kelasNum && tahfizhConfig[kelasNum] ? tahfizhConfig[kelasNum] : [];
        const tahfizhData = student.tahfizh || {};

        // Ibadah
        const ibadahList = kelasNum && tathbiqConfig[kelasNum] ? tathbiqConfig[kelasNum] : [];
        const ibadahData = student.tathbiq_ibadah || {};

        // Determine name class
        let nameClass = student.kelas || '-';
        const classMap = {
            '6D': '6D-Mindi', '6C': '6C-Bintangur', '6B': '6B-Palapi', '6A': '6A-Jati',
            '5D': '5D-Cemara', '5C': '5C-Beringin', '5B': '5B-Pinus', '5A': '5A-Mersawa',
            '4D': '4D-Ulin', '4C': '4C-Cendana', '4B': '4B-Damar', '4A': '4A-Meranti',
            '3D': '3D-Cantigi', '3C': '3C-Eboni', '3B': '3B-Bungur', '3A': '3A-Saga',
            '2D': '2D-Mahoni', '2C': '2C-Sengon', '2B': '2B-Randu', '2A': '2A-Sungkai',
            '1D': '1D-Pingku', '1C': '1C-Kenanga', '1B': '1B-Kulim', '1A': '1A-Trembesi'
        };
        if (classMap[student.kelas]) nameClass = classMap[student.kelas];

        // --- PDF Generation ---

        // Header
        const logoPath = '../assets/Logo SD Anak Saleh.png';
        try {
            doc.addImage(logoPath, 'PNG', 23, 2, 25, 25);
        } catch (e) {
            console.warn("Logo not found or error loading", e);
        }

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('KEMENKUMHAM RI AHU-0011983.AH.01.04.Tahun 2016', 105, 5, { align: 'center' });

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('SEKOLAH DASAR ANAK SALEH', 105, 11, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.text('Childfriendly Based Creative Islamic School', 105, 14, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('NPSN: 20539410 | NSS: 102056104008', 105, 18, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('JL. Arumba No.31 Malang 65143 | Telp. (0341) 487088', 105, 22, { align: 'center' });
        doc.text('Email: official@sekolahanaksaleh.sch.id | www.sekolahanaksaleh.sch.id', 105, 26, { align: 'center' });

        const logoBilqolam = '../assets/Logo Bilqolam.png';
        try {
            doc.addImage(logoBilqolam, 'PNG', 160, 5, 30, 20);
        } catch (e) {
            console.warn("Logo Bilqolam not found", e);
        }

        // Line separator
        doc.setLineWidth(0.5);
        doc.line(20, 28, 190, 28);

        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('RELIGIOUS REPORT', 105, 33, { align: 'center' });

        // Student Info
        let yPos = 38;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Nama : ${student.nama_lengkap || '-'}`, 25, yPos);
        doc.text(`Kelas : ${nameClass}`, 135, yPos);

        yPos += 5;
        doc.setFont(undefined, 'bold');
        doc.text(`Tahun Ajaran : 2025/2026 (Semester 1)`, 25, yPos);
        doc.text(`No. Induk : ${student.nis || '-'}`, 135, yPos);

        // I. PENCAPAIAN KOMPETENSI
        yPos += 5;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('I. PENCAPAIAN KOMPETENSI', 14, yPos);

        // Table Construction
        yPos += 1;

        const tableBody = [];
        let sectionCode = 65; // ASCII for 'A'

        // 1. DAURAH (Only for Pasca)
        if (student.status === 'Pasca') {
            const tadarusScore = parseInt(student.daurah_tadarus) || 0;
            const bahasaArabScore = parseInt(student.daurah_bahasa_arab) || 0;
            const sectionLetter = String.fromCharCode(sectionCode++);

            tableBody.push([
                { content: sectionLetter, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } },
                { content: 'DAURAH', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } }
            ]);

            tableBody.push([
                '1.',
                "Tadarus Al-Qur'an",
                { content: tadarusScore, styles: { halign: 'center', valign: 'middle' } },
                { content: getPredicate(tadarusScore), styles: { halign: 'center', valign: 'middle' } },
                getDescription('Ibadah', "Tadarus Al-Qur'an", tadarusScore)
            ]);

            tableBody.push([
                '2.',
                "Bahasa Arab",
                { content: bahasaArabScore, styles: { halign: 'center', valign: 'middle' } },
                { content: getPredicate(bahasaArabScore), styles: { halign: 'center', valign: 'middle' } },
                getDescription('Ibadah', "Bahasa Arab", bahasaArabScore)
            ]);
        }


        // 2. BILQOLAM (Only for Regular students, NOT PDBK)
        if (student.status === 'Reguler' && student.pdbk !== true) {
            const bilqolamLetter = String.fromCharCode(sectionCode++);
            tableBody.push([
                { content: bilqolamLetter, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } },
                { content: `BILQOLAM ${student.bilqolam_jilid || '-'}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } }
            ]);

            const bilqolamItems = [
                { name: 'Tajwid', score: tajwid },
                { name: 'Fashahah', score: fashahah },
                { name: 'Lagu', score: lagu }
            ];

            bilqolamItems.forEach((item, index) => {
                tableBody.push([
                    (index + 1) + '.',
                    item.name,
                    { content: item.score, styles: { halign: 'center', valign: 'middle' } },
                    { content: getPredicate(item.score), styles: { halign: 'center', valign: 'middle' } },
                    getDescription(item.name, null, item.score)
                ]);
            });
        }

        // 3. PDBK (Only for PDBK students)
        if (student.pdbk === true) {
            const pdbkLetter = String.fromCharCode(sectionCode++);
            tableBody.push([
                { content: pdbkLetter, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } },
                { content: 'PENILAIAN KHUSUS PDBK', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } }
            ]);

            // Kriteria 1
            const kriteria1Nama = student.pdbk_kriteria1_nama || '-';
            const kriteria1Nilai = parseInt(student.pdbk_kriteria1_nilai) || 0;
            const kriteria1Desc = student.pdbk_kriteria1_desc || '-';

            tableBody.push([
                '1.',
                kriteria1Nama,
                { content: kriteria1Nilai, styles: { halign: 'center', valign: 'middle' } },
                { content: getPredicate(kriteria1Nilai), styles: { halign: 'center', valign: 'middle' } },
                kriteria1Desc
            ]);

            // Kriteria 2
            const kriteria2Nama = student.pdbk_kriteria2_nama || '-';
            const kriteria2Nilai = parseInt(student.pdbk_kriteria2_nilai) || 0;
            const kriteria2Desc = student.pdbk_kriteria2_desc || '-';

            tableBody.push([
                '2.',
                kriteria2Nama,
                { content: kriteria2Nilai, styles: { halign: 'center', valign: 'middle' } },
                { content: getPredicate(kriteria2Nilai), styles: { halign: 'center', valign: 'middle' } },
                kriteria2Desc
            ]);

            // Kriteria 3
            const kriteria3Nama = student.pdbk_kriteria3_nama || '-';
            const kriteria3Nilai = parseInt(student.pdbk_kriteria3_nilai) || 0;
            const kriteria3Desc = student.pdbk_kriteria3_desc || '-';

            tableBody.push([
                '3.',
                kriteria3Nama,
                { content: kriteria3Nilai, styles: { halign: 'center', valign: 'middle' } },
                { content: getPredicate(kriteria3Nilai), styles: { halign: 'center', valign: 'middle' } },
                kriteria3Desc
            ]);
        }


        // 3. DOA
        const doaLetter = String.fromCharCode(sectionCode++);
        tableBody.push([
            { content: doaLetter, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } },
            { content: 'TAHFIZH DO\'A SEHARI-HARI', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } }
        ]);

        doaList.forEach((doaName, index) => {
            const score = doaData[doaName] || 0;
            tableBody.push([
                (index + 1) + '.',
                doaName,
                { content: score, styles: { halign: 'center', valign: 'middle' } },
                { content: getPredicate(score), styles: { halign: 'center', valign: 'middle' } },
                getDescription('Doa', doaName, score)
            ]);
        });

        // 4. TAHFIZH
        const tahfizhLetter = String.fromCharCode(sectionCode++);
        tableBody.push([
            { content: tahfizhLetter, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } },
            { content: 'TAHFIZH AL-QUR\'AN', colSpan: 1, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } },
            { content: 'CAPAIAN', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [200, 200, 200], halign: 'center' } },
            { content: 'DESKRIPSI CAPAIAN', colSpan: 1, styles: { fontStyle: 'bold', fillColor: [200, 200, 200], halign: 'center' } }
        ]);

        surahList.forEach((surahName, index) => {
            const memorized = tahfizhData[surahName] || 0;
            const max = surahData[surahName] || 0;
            tableBody.push([
                (index + 1) + '.',
                `Q.S ${surahName}`,
                { content: `${memorized} ayat dari ${max}`, colSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                getDescription('Tahfizh', surahName, memorized)
            ]);
        });

        // 5. TATHBIQ IBADAH
        const ibadahLetter = String.fromCharCode(sectionCode++);
        tableBody.push([
            { content: ibadahLetter, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } },
            { content: 'TATHBIQ IBADAH', colSpan: 1, styles: { fontStyle: 'bold', fillColor: [200, 200, 200] } },
            { content: 'CAPAIAN', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [200, 200, 200], halign: 'center' } },
            { content: 'DESKRIPSI CAPAIAN', colSpan: 1, styles: { fontStyle: 'bold', fillColor: [200, 200, 200], halign: 'center' } }
        ]);

        ibadahList.forEach((ibadahName, index) => {
            const score = ibadahData[ibadahName] || 0;
            tableBody.push([
                (index + 1) + '.',
                ibadahName,
                { content: score, styles: { halign: 'center', valign: 'middle' } },
                { content: getPredicate(score), styles: { halign: 'center', valign: 'middle' } },
                getDescription('Ibadah', ibadahName, score)
            ]);
        });

        doc.autoTable({
            startY: yPos,
            head: [
                [
                    { content: 'NO', rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontSize: 9 } },
                    { content: 'ASPEK PENILAIAN', rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontSize: 9 } },
                    { content: 'CAPAIAN', colSpan: 2, styles: { halign: 'center', fontSize: 9 } },
                    { content: 'DESKRIPSI CAPAIAN', rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontSize: 9 } }
                ],
                [
                    { content: 'NUMERIK', styles: { halign: 'center', fontSize: 9 } },
                    { content: 'PREDIKAT', styles: { halign: 'center', fontSize: 9 } }
                ]
            ],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
            styles: { fontSize: 9, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: 0, valign: 'middle' },
            columnStyles: {
                0: { cellWidth: 'auto', halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 'auto' }
            }
        });

        // --- II. CATATAN ---
        yPos = doc.lastAutoTable.finalY + 4;

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('II. CATATAN', 14, yPos);
        yPos += 1;

        const catatanGuruPAI = student.saran_guru_pai || "-";
        const catatanGuruQuran = student.saran_guru_gpq || "-";

        doc.autoTable({
            startY: yPos,
            body: [
                [
                    { content: 'Guru Pendidikan Agama Islam dan Budi Pekerti', styles: { fontStyle: 'bold', cellWidth: 50 } },
                    { content: catatanGuruPAI, styles: { cellWidth: 'auto' } }
                ],
                [
                    { content: "Guru Pengajar Al-Qur'an", styles: { fontStyle: 'bold' } },
                    { content: catatanGuruQuran }
                ],
                // [
                //     { content: 'Orang Tua / Wali Peserta Didik', styles: { fontStyle: 'bold' } },
                //     { content: ':' },
                //     { content: '' }
                // ]
            ],
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: 0, valign: 'middle' },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 'auto' }
            }
        });

        // --- III. KONVERSI NILAI ---
        yPos = doc.lastAutoTable.finalY + 4;

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('III. KONVERSI NILAI', 14, yPos);
        yPos += 1;

        doc.autoTable({
            startY: yPos,
            head: [
                ['NILAI', 'KONVERSI', 'KETERANGAN']
            ],
            body: [
                ['86 - 100', 'B', 'Apabila ananda baca benar dan lancar, tidak ada salah sama sekali'],
                ['71 - 85', 'C', 'Apabila ananda baca dan ada kesalahan 3 kali'],
                ['< 70', 'K', 'Apabila ananda baca dan ada kesalahan lebih dari 3 kali']
            ],
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0], halign: 'center' },
            styles: { fontSize: 9, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: 0, valign: 'middle' },
            columnStyles: {
                0: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
                1: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
                2: { cellWidth: 'auto' }
            }
        });

        // --- Signatures ---
        yPos = doc.lastAutoTable.finalY + 4;

        // // Check page break
        // if (yPos > 230) {
        //     doc.addPage();
        //     yPos = 30;
        // }

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Diberikan di', 14, yPos);
        doc.text(': Malang', 40, yPos);
        yPos += 5;
        doc.text('Tanggal', 14, yPos);
        doc.text(`: ${dateStr}`, 40, yPos);

        yPos += 5;

        // Signature Columns
        const leftX = 37;
        const centerX = 100; // Approximate center
        const rightX = 167;

        doc.text('Guru PAIBP', leftX, yPos, { align: 'center' });
        doc.text('Kepala SD Anak Saleh', centerX, yPos, { align: 'center' });
        doc.text("Guru Al-Qur'an", rightX, yPos, { align: 'center' });

        yPos += 25;

        // Names
        // Names
        const guruPaiName = student.guru_pai || '...........................';
        const guruGpqName = student.bilqolam_guru || '...........................';

        const guruPai = teachersData.find(t => t.nama_lengkap === student.guru_pai);
        const guruGpq = teachersData.find(t => t.nama_lengkap === student.bilqolam_guru);

        const niyPai = guruPai ? guruPai.niy : '...........................';
        const niyGpq = guruGpq ? guruGpq.niy : '...........................';

        doc.setFont(undefined, 'bold');
        doc.text(guruPaiName, leftX, yPos, { align: 'center' });
        doc.text('Andreas Setiyono, S.Pd.Gr., M.Kom', centerX, yPos, { align: 'center' });
        doc.text(guruGpqName, rightX, yPos, { align: 'center' });

        yPos += 4;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('NIY. ' + niyPai, leftX, yPos, { align: 'center' }); // Small caption
        doc.text('NIY. 0796071420', centerX, yPos, { align: 'center' });
        doc.text('NIY. ' + niyGpq, rightX, yPos, { align: 'center' });

        // Headmaster
        // yPos += 10;
        // doc.setFontSize(10);
        // doc.text('Mengetahui:', 105, yPos, { align: 'center' });
        // yPos += 5;
        // doc.text('Kepala SD Anak Saleh,', 105, yPos, { align: 'center' });

        // Space for headmaster signature if needed, but image cuts off. 
        // Assuming standard space.
        // yPos += 25;
        // doc.text('Naminah, S.Pd', 105, yPos, { align: 'center' }); // Example name if needed


        // Open PDF in new tab
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
    }

    // --- Modal Logic ---
    const saranModal = document.getElementById('saranModal');
    const btnCancelSaran = document.getElementById('btnCancelSaran');
    const btnSaveSaran = document.getElementById('btnSaveSaran');
    const modalStudentName = document.getElementById('modalStudentName');
    const modalStudentId = document.getElementById('modalStudentId');
    const inputSaranGPQ = document.getElementById('inputSaranGPQ');
    const inputSaranPAI = document.getElementById('inputSaranPAI');

    function toggleSaranModal(show) {
        if (show) {
            saranModal.classList.remove('hidden');
            gsap.fromTo(saranModal.querySelector('.relative'),
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }
            );
        } else {
            gsap.to(saranModal.querySelector('.relative'), {
                scale: 0.95,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => saranModal.classList.add('hidden')
            });
        }
    }

    window.openSaranModal = (id) => {
        const student = studentsData.find(s => s.id === id);
        if (!student) return;

        modalStudentId.value = id;
        modalStudentName.textContent = student.nama_lengkap;

        // Populate existing values
        inputSaranGPQ.value = student.saran_guru_gpq || '';
        inputSaranPAI.value = student.saran_guru_pai || '';

        toggleSaranModal(true);
    };

    btnCancelSaran.addEventListener('click', () => toggleSaranModal(false));

    btnSaveSaran.addEventListener('click', async () => {
        const id = modalStudentId.value;
        if (!id) return;

        const updateData = {
            saran_guru_gpq: inputSaranGPQ.value,
            saran_guru_pai: inputSaranPAI.value,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('students').doc(id).update(updateData);
            toggleSaranModal(false);
        } catch (error) {
            console.error("Error updating saran: ", error);
            showCustomAlert('error', 'Terjadi kesalahan!', 'Gagal menyimpan saran: ' + error.message);
        }
    });

});
