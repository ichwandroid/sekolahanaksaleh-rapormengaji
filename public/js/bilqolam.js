document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const tableBody = document.getElementById('bilqolamTableBody');

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
    const inputGuru = document.getElementById('inputGuru');
    const inputTajwid = document.getElementById('inputTajwid');
    const inputFashahah = document.getElementById('inputFashahah');
    const inputLagu = document.getElementById('inputLagu');
    const inputSaran = document.getElementById('inputSaran');

    // State
    let studentsData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortOrder = 'asc';

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
            const saran = data.bilqolam_saran || '-';
            const guru = data.bilqolam_guru || '-';

            // Tooltip Logic for Tajwid
            let tajwidTooltip = '';
            let tajwidClass = '';

            if (tajwid !== '-') {
                const score = parseInt(tajwid);
                if (!isNaN(score)) {
                    // Added 'has-tooltip' class for JS targeting
                    tajwidClass = 'cursor-help border-b-2 border-dotted border-gray-300 dark:border-gray-600 has-tooltip text-xs';
                    if (score >= 86) {
                        tajwidTooltip = "Ananda mampu memahami tajwid dalam bacaan";
                    } else if (score >= 71) {
                        tajwidTooltip = "Ananda cukup mampu memahami tajwid dalam bacaan";
                    } else if (score >= 0) {
                        tajwidTooltip = "Ananda kurang mampu memahami tajwid dalam bacaan";
                    }
                }
            }

            // Tooltip Logic for Fashahah
            let fashahahTooltip = '';
            let fashahahClass = '';

            if (fashahah !== '-') {
                const score = parseInt(fashahah);
                if (!isNaN(score)) {
                    // Added 'has-tooltip' class for JS targeting
                    fashahahClass = 'cursor-help border-b-2 border-dotted border-gray-300 dark:border-gray-600 has-tooltip text-xs';
                    if (score >= 86) {
                        fashahahTooltip = "Ananda mampu melafalkan bacaan dengan jelas";
                    } else if (score >= 71) {
                        fashahahTooltip = "Ananda cukup mampu melafalkan bacaan dengan jelas";
                    } else if (score >= 0) {
                        fashahahTooltip = "Ananda kurang mampu melafalkan bacaan dengan jelas";
                    }
                }
            }

            // Tooltip Logic for Lagu
            let laguTooltip = '';
            let laguClass = '';

            if (lagu !== '-') {
                const score = parseInt(lagu);
                if (!isNaN(score)) {
                    // Added 'has-tooltip' class for JS targeting
                    laguClass = 'cursor-help border-b-2 border-dotted border-gray-300 dark:border-gray-600 has-tooltip text-xs';
                    if (score >= 86) {
                        laguTooltip = "Ananda mampu memahami nada bacaan";
                    } else if (score >= 71) {
                        laguTooltip = "Ananda cukup mampu memahami nada bacaan";
                    } else if (score >= 0) {
                        laguTooltip = "Ananda kurang mampu memahami nada bacaan";
                    }
                }
            }

            html += `
                <tr class="student-row bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors opacity-0">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${data.nis || '-'}</td>
                    <td class="px-6 py-4">${data.nisn || '-'}</td>
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${data.nama_lengkap || '-'}</td>
                    <td class="px-6 py-4"><span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">${jilid}</span></td>
                    <td class="px-6 py-4">
                        <!-- Removed title, added data-tooltip -->
                        <span class="${tajwidClass}" data-tooltip="${tajwidTooltip}">${tajwid}</span>
                    </td>
                    <td class="px-6 py-4">
                        <!-- Removed title, added data-tooltip -->
                        <span class="${fashahahClass}" data-tooltip="${fashahahTooltip}">${fashahah}</span>
                    </td>
                    <td class="px-6 py-4">
                        <!-- Removed title, added data-tooltip -->
                        <span class="${laguClass}" data-tooltip="${laguTooltip}">${lagu}</span>
                    </td>
                    <td class="px-6 py-4 max-w-xs truncate" title="${saran}">${saran}</td>
                    <td class="px-6 py-4">${guru}</td>
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
        inputGuru.value = student.bilqolam_guru || '';
        inputTajwid.value = student.bilqolam_tajwid || '';
        inputFashahah.value = student.bilqolam_fashahah || '';
        inputLagu.value = student.bilqolam_lagu || '';
        inputSaran.value = student.bilqolam_saran || '';

        toggleModal(true);
    };

    btnCancelGrade.addEventListener('click', () => toggleModal(false));

    btnSaveGrade.addEventListener('click', async () => {
        const id = modalStudentId.value;
        if (!id) return;

        const updateData = {
            bilqolam_jilid: inputJilid.value,
            bilqolam_guru: inputGuru.value,
            bilqolam_tajwid: inputTajwid.value,
            bilqolam_fashahah: inputFashahah.value,
            bilqolam_lagu: inputLagu.value,
            bilqolam_saran: inputSaran.value,
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

    // --- Custom Tooltip Implementation ---
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed z-50 hidden bg-gray-900/95 backdrop-blur-sm text-white text-lg font-medium px-4 py-3 rounded-xl shadow-2xl pointer-events-none max-w-sm transition-all duration-200 border border-gray-700';
    tooltip.style.opacity = '0';
    document.body.appendChild(tooltip);

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.has-tooltip');
        if (target && target.dataset.tooltip) {
            tooltip.textContent = target.dataset.tooltip;
            tooltip.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            requestAnimationFrame(() => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translateY(0) scale(1)';
            });
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!tooltip.classList.contains('hidden')) {
            const x = e.clientX + 15;
            const y = e.clientY + 15;

            // Prevent tooltip from going off screen
            const rect = tooltip.getBoundingClientRect();
            let finalX = x;
            let finalY = y;

            if (x + rect.width > window.innerWidth) {
                finalX = e.clientX - rect.width - 10;
            }
            if (y + rect.height > window.innerHeight) {
                finalY = e.clientY - rect.height - 10;
            }

            tooltip.style.left = `${finalX}px`;
            tooltip.style.top = `${finalY}px`;
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('.has-tooltip');
        if (target) {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(5px) scale(0.95)';
            setTimeout(() => {
                if (tooltip.style.opacity === '0') {
                    tooltip.classList.add('hidden');
                }
            }, 200);
        }
    });
});
