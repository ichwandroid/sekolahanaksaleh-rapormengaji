document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const tableBody = document.getElementById('bilqolamTableBody');
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
    const gradeModal = document.getElementById('gradeModal');
    const btnCancelGrade = document.getElementById('btnCancelGrade');
    const btnSaveGrade = document.getElementById('btnSaveGrade');
    const modalStudentName = document.getElementById('modalStudentName');
    const modalStudentId = document.getElementById('modalStudentId');

    // Inputs
    const inputJilid = document.getElementById('inputJilid');

    const inputTajwid = document.getElementById('inputTajwid');
    const inputFashahah = document.getElementById('inputFashahah');
    const inputLagu = document.getElementById('inputLagu');

    // Daurah Inputs
    const daurahFields = document.getElementById('daurahFields');
    const inputTadarus = document.getElementById('inputTadarus');
    const inputBahasaArab = document.getElementById('inputBahasaArab');


    // State
    let studentsData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortOrder = 'asc';

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
                <td colspan="12" class="px-6 py-4 text-center text-red-500">
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
                    <td colspan="12" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
            // Bilqolam specific fields
            const jilid = data.bilqolam_jilid || '-';
            const tajwid = data.bilqolam_tajwid || '-';
            const fashahah = data.bilqolam_fashahah || '-';
            const lagu = data.bilqolam_lagu || '-';

            const tajwidScore = parseInt(tajwid) || 0;
            const fashahahScore = parseInt(fashahah) || 0;
            const laguScore = parseInt(lagu) || 0;
            const totalScore = tajwidScore + fashahahScore + laguScore;
            const percentage = Math.round((totalScore / 300) * 100);

            // Color coding based on percentage
            let badgeColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            if (totalScore > 0) {
                if (percentage >= 80) {
                    badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                } else if (percentage >= 50) {
                    badgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                } else {
                    badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
                }
            }

            html += `
                <tr class="student-row bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors opacity-0">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${data.nis || '-'}</td>
                    <td class="px-6 py-4">${data.nisn || '-'}</td>
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${data.nama_lengkap || '-'}</td>
                    <td class="px-6 py-4"><span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">${jilid}</span></td>
                    <td class="px-6 py-4">${tajwid}</td>
                    <td class="px-6 py-4">${fashahah}</td>
                    <td class="px-6 py-4">${lagu}</td>
                    <td class="px-6 py-4">
                        <span class="${badgeColor} text-xs font-medium px-2.5 py-0.5 rounded">
                            ${percentage}%
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <button class="font-medium text-primary hover:underline" onclick="openGradeModal('${data.id}')">Nilai</button>
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
            gradeModal.classList.remove('hidden');
            gsap.fromTo(gradeModal.querySelector('.relative'),
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }
            );
        } else {
            gsap.to(gradeModal.querySelector('.relative'), {
                scale: 0.95,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => gradeModal.classList.add('hidden')
            });
        }
    }

    window.openGradeModal = (id) => {
        const student = studentsData.find(s => s.id === id);
        if (!student) return;

        modalStudentId.value = id;
        modalStudentName.textContent = student.nama_lengkap;

        // Populate existing values
        inputJilid.value = student.bilqolam_jilid || '';

        inputTajwid.value = student.bilqolam_tajwid || '';
        inputFashahah.value = student.bilqolam_fashahah || '';
        inputLagu.value = student.bilqolam_lagu || '';

        // Handle Daurah Fields
        if (student.status === 'Pasca') {
            daurahFields.classList.remove('hidden');
            inputTadarus.value = student.daurah_tadarus || '';
            inputBahasaArab.value = student.daurah_bahasa_arab || '';
            bilqolamReguler.classList.add('hidden');
        } else {
            daurahFields.classList.add('hidden');
            inputTadarus.value = '';
            inputBahasaArab.value = '';
            bilqolamReguler.classList.remove('hidden');
        }

        toggleModal(true);
    };

    btnCancelGrade.addEventListener('click', () => toggleModal(false));

    btnSaveGrade.addEventListener('click', async () => {
        const id = modalStudentId.value;
        if (!id) return;

        const updateData = {
            bilqolam_jilid: inputJilid.value,

            bilqolam_tajwid: inputTajwid.value,
            bilqolam_fashahah: inputFashahah.value,
            bilqolam_lagu: inputLagu.value,

            // Daurah fields (will be saved even if empty/hidden, but that's okay)
            daurah_tadarus: inputTadarus.value,
            daurah_bahasa_arab: inputBahasaArab.value,

            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('students').doc(id).update(updateData);
            toggleModal(false);
            // No alert needed, realtime listener updates UI
        } catch (error) {
            console.error("Error updating grade: ", error);
            alert("Gagal menyimpan nilai: " + error.message);
        }
    });

});
