document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const tableBody = document.getElementById('doaTableBody');
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
    const doaModal = document.getElementById('doaModal');
    const btnCancelDoa = document.getElementById('btnCancelDoa');
    const btnSaveDoa = document.getElementById('btnSaveDoa');
    const modalStudentName = document.getElementById('modalStudentName');
    const modalStudentKelas = document.getElementById('modalStudentKelas');
    const modalStudentId = document.getElementById('modalStudentId');
    const doaChecklistContainer = document.getElementById('doaChecklistContainer');

    // State
    let studentsData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortOrder = 'asc';

    // Doa configuration per class
    const doaConfig = {
        '1': [
            "Do'a Mau Tidur",
            "Do'a Bangun Tidur",
            "Do'a Masuk Kamar Mandi",
            "Do'a Keluar Kamar Mandi",
            "Do'a Sebelum Makan",
            "Do'a Sesudah Makan"
        ],
        '2': [
            "Do'a Senandung al-Qur'an",
            "Do'a Kaffarotul Majlis",
            "Do'a Masuk Masjid",
            "Do'a Keluar Masjid"
        ],
        '3': [
            "Do'a Mohon Kecerdasan Berpikir",
            "Ayat Kursi"
        ],
        '4': [
            "Do'a Ketika Sakit",
            "Do'a Menjenguk Orang Sakit",
            "Do'a Qunut"
        ],
        '5': [
            "Do'a Mohon Keselamatan",
            "Do'a Mohon Diberi Keteguhan Hati",
            "Shalawat Thibbil Qulub"
        ],
        '6': [
            "Do'a Mohon Diberi Rahmat & Hikmah",
            "Do'a Mohon Petunjuk Kepada Allah"
        ]
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
                <td colspan="8" class="px-6 py-4 text-center text-red-500">
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
                    <td colspan="8" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
            // Get class number for doa count
            const kelasNum = data.kelas ? data.kelas.match(/\d+/)?.[0] : null;
            const doaList = kelasNum && doaConfig[kelasNum] ? doaConfig[kelasNum] : [];
            const doaData = data.doa_sehari || {};

            // Count completed prayers and calculate average
            let completedCount = 0;
            let totalScore = 0;
            let scoredCount = 0;

            doaList.forEach(doa => {
                const score = doaData[doa];
                if (typeof score === 'number' && score >= 0) {
                    completedCount++;
                    totalScore += score;
                    scoredCount++;
                }
            });

            const totalCount = doaList.length;
            const maxPossibleScore = totalCount * 100;
            const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

            // Color coding based on percentage
            let badgeColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            if (scoredCount > 0) {
                if (percentage >= 80) {
                    badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                } else if (percentage >= 50) {
                    badgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                } else {
                    badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                }
            }

            const displayText = totalCount > 0
                ? `${completedCount}/${totalCount} Doa (${percentage}%)`
                : `0/${totalCount} Doa`;

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
                    </td>
                    <td class="px-6 py-4">
                        <button class="font-medium text-primary hover:underline" onclick="openDoaModal('${data.id}')">Nilai</button>
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
            doaModal.classList.remove('hidden');
            gsap.fromTo(doaModal.querySelector('.relative'),
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }
            );
        } else {
            gsap.to(doaModal.querySelector('.relative'), {
                scale: 0.95,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => doaModal.classList.add('hidden')
            });
        }
    }

    window.openDoaModal = (id) => {
        const student = studentsData.find(s => s.id === id);
        if (!student) return;

        modalStudentId.value = id;
        modalStudentName.textContent = student.nama_lengkap;
        modalStudentKelas.textContent = student.kelas || '-';

        // Get doa list based on class
        const kelasNum = student.kelas ? student.kelas.match(/\d+/)?.[0] : null;
        const doaList = kelasNum && doaConfig[kelasNum] ? doaConfig[kelasNum] : [];

        // Get existing doa data
        const doaData = student.doa_sehari || {};

        // Generate checklist with score inputs
        let checklistHtml = '';
        if (doaList.length === 0) {
            checklistHtml = '<p class="text-sm text-gray-500 dark:text-gray-400">Tidak ada daftar doa untuk kelas ini.</p>';
        } else {
            doaList.forEach((doa, index) => {
                const doaScore = doaData[doa];
                const score = typeof doaScore === 'number' ? doaScore : '';
                const isChecked = doaScore !== undefined && doaScore !== null && doaScore !== '';

                // Tooltip logic
                if (score !== '') {
                    // const numScore = parseInt(score);
                }

                checklistHtml += `
                    <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <input type="checkbox" id="doa_check_${index}" data-index="${index}" ${isChecked ? 'checked' : ''} 
                            class="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 doa-checkbox">
                        <label for="doa_check_${index}" class="text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer flex-1">${doa}</label>
                        <div class="flex items-center gap-2">
                            <input type="number" id="doa_score_${index}" data-doa="${doa}" value="${score}" min="0" max="100" placeholder="0-100"
                                class="w-20 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-primary focus:border-primary p-2 doa-score">
                            <span class="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
                        </div>
                    </div>
                `;
            });
        }

        doaChecklistContainer.innerHTML = checklistHtml;

        // Add event listeners to auto-check when score is entered
        const scoreInputs = doaChecklistContainer.querySelectorAll('.doa-score');
        scoreInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const checkbox = document.getElementById(`doa_check_${index}`);
                const value = e.target.value;

                // Auto-check if value is entered
                if (value !== '' && value >= 0 && value <= 100) {
                    checkbox.checked = true;

                    // Update tooltip logic removed
                } else {
                    // Tooltip removal logic removed
                }
            });
        });

        // Auto-uncheck if checkbox is unchecked manually
        const checkboxes = doaChecklistContainer.querySelectorAll('.doa-checkbox');
        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', (e) => {
                if (!e.target.checked) {
                    const scoreInput = document.getElementById(`doa_score_${index}`);
                    scoreInput.value = '';
                }
            });
        });

        toggleModal(true);
    };

    btnCancelDoa.addEventListener('click', () => toggleModal(false));

    btnSaveDoa.addEventListener('click', async () => {
        const id = modalStudentId.value;
        if (!id) return;

        // Collect doa scores
        const scoreInputs = doaChecklistContainer.querySelectorAll('.doa-score');
        const doaData = {};

        scoreInputs.forEach(input => {
            const doaName = input.dataset.doa;
            const value = input.value;

            // Only save if there's a valid score
            if (value !== '' && !isNaN(value)) {
                const score = parseInt(value);
                if (score >= 0 && score <= 100) {
                    doaData[doaName] = score;
                }
            }
        });

        try {
            await db.collection('students').doc(id).update({
                doa_sehari: doaData,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            toggleModal(false);
        } catch (error) {
            console.error("Error updating doa: ", error);
            showCustomAlert('error', 'Terjadi kesalahan!', 'Gagal menyimpan penilaian: ' + error.message);
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
        // Get all unique doa names from all classes
        const allDoas = new Set();
        Object.values(doaConfig).forEach(doaList => {
            doaList.forEach(doa => allDoas.add(doa));
        });

        // Create CSV header
        const headers = ['NIS', 'NISN', 'Nama Lengkap', 'Kelas', ...Array.from(allDoas)];

        // Create sample data
        const sampleRow = ['12345', '0012345678', 'Nama Siswa', '1', ...Array(allDoas.size).fill('85')];

        // Combine into CSV
        const csvContent = [
            headers.join(','),
            sampleRow.join(','),
            '# Isi nilai 0-100 untuk setiap doa yang sesuai dengan kelas siswa',
            '# Kolom doa yang tidak relevan untuk kelas tertentu bisa dikosongkan'
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'template_doa_sehari_hari.csv';
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

                console.log(`Found ${total} rows in CSV`);

                try {
                    for (const row of data) {
                        // Skip comment rows
                        if (row.NIS && row.NIS.startsWith('#')) {
                            processed++;
                            continue;
                        }

                        // Normalize keys
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

                        // Get student's class to determine relevant doas
                        const studentDoc = await db.collection('students').doc(String(nis)).get();

                        if (!studentDoc.exists) {
                            console.warn(`Student with NIS ${nis} not found`);
                            errors++;
                            processed++;

                            // Update progress
                            const percent = Math.round((processed / total) * 100);
                            progressBar.style.width = `${percent}%`;
                            progressText.textContent = `${percent}%`;
                            continue;
                        }

                        const studentData = studentDoc.data();
                        const kelasNum = studentData.kelas ? studentData.kelas.match(/\d+/)?.[0] : null;
                        const relevantDoas = kelasNum && doaConfig[kelasNum] ? doaConfig[kelasNum] : [];

                        // Extract doa scores from CSV
                        const doaScores = {};
                        relevantDoas.forEach(doaName => {
                            const score = normalizedRow[doaName];
                            if (score && score !== '' && !isNaN(score)) {
                                const numScore = parseInt(score);
                                if (numScore >= 0 && numScore <= 100) {
                                    doaScores[doaName] = numScore;
                                }
                            }
                        });

                        // Update student document if there are valid scores
                        if (Object.keys(doaScores).length > 0) {
                            await db.collection('students').doc(String(nis)).update({
                                doa_sehari: doaScores,
                                updated_at: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            updated++;
                        }

                        processed++;

                        // Update progress
                        const percent = Math.round((processed / total) * 100);
                        progressBar.style.width = `${percent}%`;
                        progressText.textContent = `${percent}%`;
                    }

                    // Success
                    setTimeout(() => {
                        showCustomAlert('success', 'Upload Selesai!', `Upload selesai!\n${updated} siswa berhasil diperbarui.\n${errors} baris gagal/dilewati.`);
                        uploadProgress.classList.add('hidden');
                        csvFileInput.value = '';
                    }, 500);

                } catch (error) {
                    console.error("Error uploading CSV: ", error);
                    showCustomAlert('error', 'Terjadi kesalahan!', 'Terjadi kesalahan saat mengupload data: ' + error.message);
                    uploadProgress.classList.add('hidden');
                }
            },
            error: (error) => {
                console.error("CSV Parse Error: ", error);
                showCustomAlert('error', 'Terjadi kesalahan!', 'Gagal membaca file CSV.');
                uploadProgress.classList.add('hidden');
            }
        });
    });

});
