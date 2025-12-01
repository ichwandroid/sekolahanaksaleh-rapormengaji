document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const tableBody = document.getElementById('tahfizhTableBody');
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

    // Modal UI
    const tahfizhModal = document.getElementById('tahfizhModal');
    const btnCancelTahfizh = document.getElementById('btnCancelTahfizh');
    const btnSaveTahfizh = document.getElementById('btnSaveTahfizh');
    const modalStudentName = document.getElementById('modalStudentName');
    const modalStudentKelas = document.getElementById('modalStudentKelas');
    const modalStudentId = document.getElementById('modalStudentId');
    const tahfizhChecklistContainer = document.getElementById('tahfizhChecklistContainer');

    // State
    let studentsData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortOrder = 'asc';

    // Surah Data (Name -> Total Verses)
    const surahData = {
        "Quraisy": 4,
        "At-Takatsur": 8,
        "An-Nashr": 3,
        "An-Nas": 6,
        "Al-Maun": 7,
        "Al-Lahab": 5,
        "Al-Kautsar": 3,
        "Al-Kafirun": 6,
        "Al-Ikhlash": 4,
        "Al-Humazah": 9,
        "Al-Fil": 5,
        "Al-Falaq": 5,
        "Al-Ashr": 3,
        "At-Tin": 8,
        "Asy-Syarh": 8,
        "Al-Qadr": 5,
        "Al-Bayyinah": 8,
        "Al-Alaq": 19,
        "Al-Ghasyiyah": 26,
        "Al-Fajr": 30,
        "Al-A’La": 19,
        "Al-Muthaffifin": 36,
        "Al-Infithar": 19,
        "An-Nazi’at": 46,
        "An-Naba’": 40,
        "Yasin-ayat 41 s/d 83": 83
    };

    // Tahfizh configuration per class (List of Surahs)
    // This can be customized. For now, assigning common Juz 30 surahs.
    const tahfizhConfig = {
        '1': ["An-Nas", "Al-Falaq", "Al-Ikhlash", "Al-Lahab", "An-Nashr", "Al-Kafirun", "Al-Kautsar", "Al-Maun", "Quraisy", "Al-Fil", "Al-Humazah", "Al-Ashr", "At-Takatsur"],
        '2': ["Al-Bayyinah", "Al-Qadr", "Al-Alaq", "At-Tin", "Asy-Syarh"],
        '3': ["Al-Fajr", "Al-Ghasyiyah", "Al-Ala"],
        '4': ["Al-Muthaffifin", "Al-Infithar"],
        '5': ["An-Naziat", "An-Naba"],
        '6': ["Yasin-ayat 41 s/d 83"]
    };

    // Display teacher info
    const teacher = getCurrentTeacher();
    const teacherInfoCard = document.getElementById('teacherInfoCard');
    if (teacher && teacherInfoCard) {
        teacherInfoCard.innerHTML = `
            <div class="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-4">
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

    // --- Real-time Listener ---
    db.collection('students').onSnapshot((snapshot) => {
        let allStudents = [];
        snapshot.forEach((doc) => {
            allStudents.push({ id: doc.id, ...doc.data() });
        });

        // Get current teacher and filter students
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
                <td colspan="6" class="px-6 py-4 text-center text-red-500">
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
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
            // Get class number for tahfizh list
            const kelasNum = data.kelas ? data.kelas.match(/\d+/)?.[0] : null;
            const surahList = kelasNum && tahfizhConfig[kelasNum] ? tahfizhConfig[kelasNum] : [];
            const tahfizhData = data.tahfizh || {};

            // Calculate progress
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

            const percentage = totalVersesTarget > 0 ? Math.round((totalVersesMemorized / totalVersesTarget) * 100) : 0;

            // Color coding based on percentage
            let badgeColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            if (totalVersesTarget > 0) {
                if (percentage >= 80) {
                    badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                } else if (percentage >= 50) {
                    badgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                } else {
                    badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                }
            }

            const displayText = totalVersesTarget > 0
                ? `${completedSurahs}/${surahList.length} Surat (${percentage}%)`
                : `0/${surahList.length} Surat`;

            html += `
                <tr class="student-row bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors opacity-0">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${data.nis || '-'}</td>
                    <td class="px-6 py-4">${data.nisn || '-'}</td>
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${data.nama_lengkap || '-'}</td>
                    <td class="px-6 py-4">${data.kelas || '-'}</td>
                    <td class="px-6 py-4">
                        <span class="${badgeColor} text-xs font-medium px-2.5 py-0.5 rounded">
                            ${displayText}
                        </span>
                        <div class="text-xs text-gray-500 mt-1">${totalVersesMemorized} / ${totalVersesTarget} Ayat</div>
                    </td>
                    <td class="px-6 py-4">
                        <button class="font-medium text-primary hover:underline" onclick="openTahfizhModal('${data.id}')">Nilai</button>
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

    // --- Modal Logic ---
    function toggleModal(show) {
        if (show) {
            tahfizhModal.classList.remove('hidden');
            gsap.fromTo(tahfizhModal.querySelector('.relative'),
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }
            );
        } else {
            gsap.to(tahfizhModal.querySelector('.relative'), {
                scale: 0.95,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => tahfizhModal.classList.add('hidden')
            });
        }
    }

    window.openTahfizhModal = (id) => {
        const student = studentsData.find(s => s.id === id);
        if (!student) return;

        modalStudentId.value = id;
        modalStudentName.textContent = student.nama_lengkap;
        modalStudentKelas.textContent = student.kelas || '-';

        // Get tahfizh list based on class
        const kelasNum = student.kelas ? student.kelas.match(/\d+/)?.[0] : null;
        const surahList = kelasNum && tahfizhConfig[kelasNum] ? tahfizhConfig[kelasNum] : [];

        // Get existing tahfizh data
        const tahfizhData = student.tahfizh || {};

        // Generate checklist with verse inputs
        let checklistHtml = '';
        if (surahList.length === 0) {
            checklistHtml = '<p class="text-sm text-gray-500 dark:text-gray-400">Tidak ada daftar surat untuk kelas ini.</p>';
        } else {
            surahList.forEach((surah, index) => {
                const maxVerses = surahData[surah] || 0;
                const memorized = tahfizhData[surah];
                const value = (memorized !== undefined && memorized !== null) ? memorized : '';
                const isChecked = value !== '' && value > 0;

                checklistHtml += `
                    <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <input type="checkbox" id="tahfizh_check_${index}" data-index="${index}" ${isChecked ? 'checked' : ''} 
                            class="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 tahfizh-checkbox">
                        <div class="flex-1">
                            <label for="tahfizh_check_${index}" class="text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer block">${surah}</label>
                            <span class="text-xs text-gray-500 dark:text-gray-400">Total: ${maxVerses} Ayat</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <input type="number" id="tahfizh_input_${index}" data-surah="${surah}" data-max="${maxVerses}" value="${value}" min="0" max="${maxVerses}"
                                class="w-20 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-primary focus:border-primary p-2 tahfizh-input">
                            <span class="text-xs text-gray-500 dark:text-gray-400">/ ${maxVerses}</span>
                        </div>
                    </div>
                `;
            });
        }

        tahfizhChecklistContainer.innerHTML = checklistHtml;

        // Add event listeners
        const inputs = tahfizhChecklistContainer.querySelectorAll('.tahfizh-input');
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const checkbox = document.getElementById(`tahfizh_check_${index}`);
                const value = parseInt(e.target.value);
                const max = parseInt(e.target.dataset.max);

                if (!isNaN(value) && value > 0) {
                    checkbox.checked = true;
                    if (value > max) e.target.value = max; // Cap at max
                } else if (value === 0) {
                    // checkbox.checked = false; // Optional: uncheck if 0? Maybe keep checked to show they tried but know 0?
                }
            });
        });

        const checkboxes = tahfizhChecklistContainer.querySelectorAll('.tahfizh-checkbox');
        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', (e) => {
                const input = document.getElementById(`tahfizh_input_${index}`);
                if (e.target.checked) {
                    if (input.value === '' || input.value == 0) {
                        input.value = input.dataset.max; // Default to max if checked
                    }
                } else {
                    input.value = '';
                }
            });
        });

        toggleModal(true);
    };

    btnCancelTahfizh.addEventListener('click', () => toggleModal(false));

    btnSaveTahfizh.addEventListener('click', async () => {
        const id = modalStudentId.value;
        if (!id) return;

        // Collect scores
        const inputs = tahfizhChecklistContainer.querySelectorAll('.tahfizh-input');
        const tahfizhData = {};

        inputs.forEach(input => {
            const surah = input.dataset.surah;
            const value = input.value;

            if (value !== '' && !isNaN(value)) {
                const verses = parseInt(value);
                if (verses >= 0) {
                    tahfizhData[surah] = verses;
                }
            }
        });

        try {
            await db.collection('students').doc(id).update({
                tahfizh: tahfizhData,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            toggleModal(false);
        } catch (error) {
            console.error("Error updating tahfizh: ", error);
            alert("Gagal menyimpan penilaian: " + error.message);
        }
    });

    // --- CSV Upload Logic ---
    const csvFileInput = document.getElementById('csvFileInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const btnDownloadTemplate = document.getElementById('btnDownloadTemplate');

    // Download Template CSV
    btnDownloadTemplate.addEventListener('click', () => {
        // Get all unique surahs
        const allSurahs = new Set();
        Object.values(tahfizhConfig).forEach(list => {
            list.forEach(s => allSurahs.add(s));
        });

        const headers = ['NIS', 'NISN', 'Nama Lengkap', 'Kelas', ...Array.from(allSurahs)];
        const sampleRow = ['12345', '0012345678', 'Nama Siswa', '1', ...Array(allSurahs.size).fill('5')];

        const csvContent = [
            headers.join(','),
            sampleRow.join(','),
            '# Isi jumlah ayat yang dihafal untuk setiap surat',
            '# Pastikan jumlah tidak melebihi total ayat surat tersebut'
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'template_tahfizh.csv';
        link.click();
    });

    // CSV Upload Handler
    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadProgress.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data;
                const total = data.length;
                let processed = 0;
                let errors = 0;
                let updated = 0;

                try {
                    for (const row of data) {
                        if (row.NIS && row.NIS.startsWith('#')) {
                            processed++;
                            continue;
                        }

                        const normalizedRow = {};
                        Object.keys(row).forEach(key => {
                            normalizedRow[key.trim()] = row[key];
                        });

                        const nis = normalizedRow['NIS'];
                        if (!nis) {
                            errors++;
                            processed++;
                            continue;
                        }

                        const studentDoc = await db.collection('students').doc(String(nis)).get();
                        if (!studentDoc.exists) {
                            errors++;
                            processed++;
                            const percent = Math.round((processed / total) * 100);
                            progressBar.style.width = `${percent}%`;
                            progressText.textContent = `${percent}%`;
                            continue;
                        }

                        const studentData = studentDoc.data();
                        const kelasNum = studentData.kelas ? studentData.kelas.match(/\d+/)?.[0] : null;
                        const relevantSurahs = kelasNum && tahfizhConfig[kelasNum] ? tahfizhConfig[kelasNum] : [];

                        const tahfizhScores = {};
                        relevantSurahs.forEach(surah => {
                            const val = normalizedRow[surah];
                            if (val && val !== '' && !isNaN(val)) {
                                const numVal = parseInt(val);
                                const max = surahData[surah] || 999;
                                if (numVal >= 0) {
                                    tahfizhScores[surah] = Math.min(numVal, max);
                                }
                            }
                        });

                        if (Object.keys(tahfizhScores).length > 0) {
                            await db.collection('students').doc(String(nis)).update({
                                tahfizh: tahfizhScores,
                                updated_at: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            updated++;
                        }

                        processed++;
                        const percent = Math.round((processed / total) * 100);
                        progressBar.style.width = `${percent}%`;
                        progressText.textContent = `${percent}%`;
                    }

                    setTimeout(() => {
                        alert(`Upload selesai!\n${updated} siswa berhasil diperbarui.\n${errors} baris gagal/dilewati.`);
                        uploadProgress.classList.add('hidden');
                        csvFileInput.value = '';
                    }, 500);

                } catch (error) {
                    console.error("Error uploading CSV: ", error);
                    alert("Terjadi kesalahan saat mengupload data: " + error.message);
                    uploadProgress.classList.add('hidden');
                }
            },
            error: (error) => {
                console.error("CSV Parse Error: ", error);
                alert("Gagal membaca file CSV.");
                uploadProgress.classList.add('hidden');
            }
        });
    });
});
