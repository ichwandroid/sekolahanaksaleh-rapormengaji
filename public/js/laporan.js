document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const tableBody = document.getElementById('laporanTableBody');
    if (!tableBody) return;

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
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortOrder = 'asc';

    // Configuration data (same as in other pages)
    const surahData = {
        "Quraisy": 4, "At-Takātsur": 8, "An-Nashr": 3, "An-Nās": 6,
        "Al-Mā'Ūn": 7, "Al-Lahab": 5, "Al-Kautsar": 3, "Al-Kāfirūn": 6,
        "Al-Ikhlāsh": 4, "Al-Humazah": 9, "Al-Fīl": 5, "Al-Falaq": 5,
        "Al-'Ashr": 3, "At-Tīn": 8, "Asy-Syarh": 8, "Al-Qadr": 5,
        "Al-Bayyinah": 8, "Al-'Alaq": 19, "Al-Ghāsyiyah": 26, "Al-Fajr": 30,
        "Al-A'Lā": 19, "Al-Muthaffifīn": 36, "Al-Infithār": 19,
        "An-Nāzi'Āt": 46, "An-Naba'": 40, "Yāsīn-ayat41sd83": 83
    };

    const tahfizhConfig = {
        '1': ["An-Nās", "Al-Falaq", "Al-Ikhlāsh", "Al-Lahab", "An-Nashr", "Al-Kāfirūn", "Al-Kautsar", "Al-Mā'ūn", "Quraisy", "Al-Fīl", "Al-Humazah", "Al-'Ashr", "At-Takātsur"],
        '2': ["Al-Bayyinah", "Al-Qadr", "Al-'Alaq", "At-Tīn", "Asy-Syarh"],
        '3': ["Al-Fajr", "Al-Ghāsyiyah", "Al-A'lā"],
        '4': ["Al-Muthaffifīn", "Al-Infithār"],
        '5': ["An-Nāzi'āt", "An-Naba'"],
        '6': ["Yāsīn-ayat41sd83"]
    };

    const doaConfig = {
        '1': ["Do'a Mau Tidur", "Do'a Bangun Tidur", "Do'a Masuk Kamar Mandi", "Do'a Keluar Kamar Mandi", "Do'a Sebelum Makan", "Do'a Sesudah Makan"],
        '2': ["Do'a Senandung al-Qur'an", "Do'a Kaffārotul Majlis", "Do'a Masuk Masjid", "Do'a Keluar Masjid"],
        '3': ["Do'a Mohon Kecerdasan Berpikir", "Ayat Kursi"],
        '4': ["Do'a Ketika Sakit", "Do'a Menjenguk Orang Sakit", "Do'a Qunut"],
        '5': ["Do'a Mohon Keselamatan", "Do'a Mohon Diberi Keteguhan Hati", "Shalawat Thibbil Qulub"],
        '6': ["Do'a Mohon Diberi Rahmat & Hikmah", "Do'a Mohon Petunjuk Kepada Allah"]
    };

    const tathbiqConfig = {
        '1': ["Niat Wudhu\tDo'a", "Sesudah Wudhu", "Niat-Niat Shalat Fardhu"],
        '2': ["Bacaan dan Jawaban Adzan", "Do'a Ba'da Adzan", "Bacaan Iqamah", "Dzikir Ba'da Shalat"],
        '3': ["Niat Shalat Tarawih", "Niat Shalat Witir", "Dzikir Ba'da Shalat Tarawih & Witir"],
        '4': ["Niat Mandi Wajib"],
        '5': ["Niat Tayammum", "Praktik Tayammum", "Niat Shalat Jama' Taqdim", "Niat Shalat Jama' Ta'khir"],
        '6': ["Niat Shalat Hajat", "Do'a Shalat Hajat", "Niat Shalat Tasbih"]
    };

    // --- Real-time Listener ---
    db.collection('students').onSnapshot((snapshot) => {
        studentsData = [];
        snapshot.forEach((doc) => {
            studentsData.push({ id: doc.id, ...doc.data() });
        });

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
                    <td class="px-6 py-4">
                        <button class="font-medium text-primary hover:underline" onclick="viewRapor('${data.id}')">
                            <i class="ph ph-file-text"></i> Lihat Rapor
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
            alert('Gagal membuat PDF: ' + error.message);
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

        // Calculate Bilqolam
        const tajwid = parseInt(student.bilqolam_tajwid) || 0;
        const fashahah = parseInt(student.bilqolam_fashahah) || 0;
        const lagu = parseInt(student.bilqolam_lagu) || 0;
        const bilqolamTotal = tajwid + fashahah + lagu;
        const bilqolamPercentage = Math.round((bilqolamTotal / 300) * 100);

        // Calculate Doa
        const doaList = kelasNum && doaConfig[kelasNum] ? doaConfig[kelasNum] : [];
        const doaData = student.doa_sehari || {};
        let doaTotalScore = 0;
        doaList.forEach(doa => {
            const score = doaData[doa];
            if (typeof score === 'number' && score >= 0) {
                doaTotalScore += score;
            }
        });
        const doaMaxScore = doaList.length * 100;
        const doaPercentage = doaMaxScore > 0 ? Math.round((doaTotalScore / doaMaxScore) * 100) : 0;

        // Calculate Tahfizh
        const surahList = kelasNum && tahfizhConfig[kelasNum] ? tahfizhConfig[kelasNum] : [];
        const tahfizhData = student.tahfizh || {};
        let totalVersesTarget = 0;
        let totalVersesMemorized = 0;
        let completedSurahs = 0;
        surahList.forEach(surah => {
            const maxVerses = surahData[surah] || 0;
            totalVersesTarget += maxVerses;
            const memorized = tahfizhData[surah] || 0;
            totalVersesMemorized += memorized;
            if (memorized >= maxVerses && maxVerses > 0) {
                completedSurahs++;
            }
        });
        const tahfizhPercentage = totalVersesTarget > 0 ? Math.round((totalVersesMemorized / totalVersesTarget) * 100) : 0;

        // Calculate Tathbiq
        const tathbiqList = kelasNum && tathbiqConfig[kelasNum] ? tathbiqConfig[kelasNum] : [];
        const tathbiqData = student.tathbiq_ibadah || {};
        let tathbiqTotalScore = 0;
        tathbiqList.forEach(tathbiq => {
            const score = tathbiqData[tathbiq];
            if (typeof score === 'number' && score >= 0) {
                tathbiqTotalScore += score;
            }
        });
        const tathbiqMaxScore = tathbiqList.length * 100;
        const tathbiqPercentage = tathbiqMaxScore > 0 ? Math.round((tathbiqTotalScore / tathbiqMaxScore) * 100) : 0;

        // Overall average
        const overallPercentage = Math.round((bilqolamPercentage + doaPercentage + tahfizhPercentage + tathbiqPercentage) / 4);

        // Determine grade
        function getGrade(percentage) {
            if (percentage >= 90) return 'A (Sangat Baik)';
            if (percentage >= 80) return 'B (Baik)';
            if (percentage >= 70) return 'C (Cukup)';
            if (percentage >= 60) return 'D (Kurang)';
            return 'E (Sangat Kurang)';
        }

        // Determine name class
        if (student.kelas === '6D') {
            nameClass = '6D-Mindi';
        } else if (student.kelas === '6C') {
            nameClass = '6C-Bintangur';
        } else if (student.kelas === '6B') {
            nameClass = '6B-Palapi';
        } else if (student.kelas === '6A') {
            nameClass = '6A-Jati';
        } else if (student.kelas === '5D') {
            nameClass = '5D-Cemara';
        } else if (student.kelas === '5C') {
            nameClass = '5C-Beringin';
        } else if (student.kelas === '5B') {
            nameClass = '5B-Pinus';
        } else if (student.kelas === '5A') {
            nameClass = '5A-Mersawa';
        } else if (student.kelas === '4D') {
            nameClass = '4D-Ulin';
        } else if (student.kelas === '4C') {
            nameClass = '4C-Cendana';
        } else if (student.kelas === '4B') {
            nameClass = '4B-Damar';
        } else if (student.kelas === '4A') {
            nameClass = '4A-Meranti';
        } else if (student.kelas === '3D') {
            nameClass = '3D-Cantigi';
        } else if (student.kelas === '3C') {
            nameClass = '3C-Eboni';
        } else if (student.kelas === '3B') {
            nameClass = '3B-Bungur';
        } else if (student.kelas === '3A') {
            nameClass = '3A-Saga';
        } else if (student.kelas === '2D') {
            nameClass = '2D-Mahoni';
        } else if (student.kelas === '2C') {
            nameClass = '2C-Sengon';
        } else if (student.kelas === '2B') {
            nameClass = '2B-Randu';
        } else if (student.kelas === '2A') {
            nameClass = '2A-Sungkai';
        } else if (student.kelas === '1D') {
            nameClass = '1D-Pingku';
        } else if (student.kelas === '1C') {
            nameClass = '1C-Kenanga';
        } else if (student.kelas === '1B') {
            nameClass = '1B-Kulim';
        } else if (student.kelas === '1A') {
            nameClass = '1A-Trembesi';
        }

        // PDF Header
        logoPath = '../assets/Logo SD Anak Saleh.png';
        doc.addImage(logoPath, 'PNG', 23, 2, 25, 25);

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

        logoPath = '../assets/Logo Bilqolam.png';
        doc.addImage(logoPath, 'PNG', 160, 5, 30, 20);

        // Line separator
        doc.setLineWidth(0.5);
        doc.line(20, 28, 190, 28);

        doc.setFontSize(15);
        doc.setFont(undefined, 'bold');
        doc.text('RELIGIOUS REPORT', 105, 33, { align: 'center' });

        // Student Info
        let yPos = 38;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Nama : ${student.nama_lengkap || '-'}`, 25, yPos);
        doc.text(`Kelas : ${nameClass || '-'}`, 135, yPos);

        yPos += 5;
        doc.setFont(undefined, 'bold');
        doc.text(`Tahun Ajaran : 2025/2026 (Semester 1)`, 25, yPos);
        doc.text(`No. Induk : ${student.nis || '-'}`, 135, yPos);

        // Scores Table
        yPos += 10;
        doc.autoTable({
            startY: yPos,
            head: [['Komponen', 'Nilai (%)', 'Predikat']],
            body: [
                ['Bilqolam', `${bilqolamPercentage}%`, getGrade(bilqolamPercentage)],
                ['Doa Sehari-hari', `${doaPercentage}%`, getGrade(doaPercentage)],
                ['Tahfizh Al-Qur\'an', `${tahfizhPercentage}%`, getGrade(tahfizhPercentage)],
                ['Tathbiq Ibadah', `${tathbiqPercentage}%`, getGrade(tathbiqPercentage)],
            ],
            foot: [['Rata-rata', `${overallPercentage}%`, getGrade(overallPercentage)]],
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 40, halign: 'center' },
                2: { cellWidth: 70, halign: 'center' }
            }
        });

        // Detail Bilqolam
        yPos = doc.lastAutoTable.finalY + 10;
        doc.setFont(undefined, 'bold');
        doc.text('Detail Bilqolam:', 20, yPos);

        yPos += 6;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(`Tajwid: ${tajwid}/100  |  Fashahah: ${fashahah}/100  |  Lagu: ${lagu}/100`, 25, yPos);

        yPos += 5;
        doc.text(`Jilid: ${student.bilqolam_jilid || '-'}  |  Guru GPQ: ${student.bilqolam_guru || '-'}`, 25, yPos);

        if (student.bilqolam_saran) {
            yPos += 5;
            doc.text(`Saran: ${student.bilqolam_saran}`, 25, yPos, { maxWidth: 160 });
        }

        // Detail Tahfizh
        yPos += 10;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.text('Detail Tahfizh Al-Qur\'an:', 20, yPos);

        yPos += 6;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(`Surat yang dihafal: ${completedSurahs}/${surahList.length} Surat`, 25, yPos);

        yPos += 5;
        doc.text(`Total Ayat: ${totalVersesMemorized}/${totalVersesTarget} Ayat`, 25, yPos);

        // Footer - Signatures
        yPos = 250; // Fixed position near bottom
        doc.setFontSize(9);
        doc.text('Orang Tua/Wali', 40, yPos, { align: 'center' });
        doc.text(`Jakarta, ${dateStr}`, 150, yPos, { align: 'center' });

        yPos += 5;
        doc.text('Guru Mengaji', 150, yPos, { align: 'center' });

        yPos += 20;
        doc.line(20, yPos, 60, yPos); // Parent signature line
        doc.line(130, yPos, 170, yPos); // Teacher signature line

        yPos += 5;
        doc.text('(...........................)', 40, yPos, { align: 'center' });
        doc.text('(...........................)', 150, yPos, { align: 'center' });

        // Open PDF in new tab
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
    }
});
