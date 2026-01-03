document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check (Admin Only)
    const teacher = getCurrentTeacher();
    if (!teacher) {
        window.location.href = 'login.html';
        return;
    }

    // Explicit Admin Check
    const jabatanKey = teacher.jabatan || '';
    const niyKey = teacher.niy || '';
    const isAdmin = (teacher.role === 'admin') ||
        (['Admin', 'Kepala Sekolah', 'Operator'].includes(jabatanKey)) ||
        (['admin', '000000'].includes(niyKey));

    if (!isAdmin) {
        alert('Akses Ditolak: Halaman ini hanya untuk Administrator.');
        window.location.href = 'dashboard.html';
        return;
    }

    // 2. Setup Firebase
    const db = firebase.firestore();
    const kurikulumTableBody = document.getElementById('kurikulumTableBody');

    // UI Elements
    const searchInput = document.getElementById('searchInput');
    const filterKategori = document.getElementById('filterKategori');
    const filterKelas = document.getElementById('filterKelas');

    // Pagination UI
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const pageNumbers = document.getElementById('pageNumbers');
    const pageStart = document.getElementById('pageStart');
    const pageEnd = document.getElementById('pageEnd');
    const totalItems = document.getElementById('totalItems');

    // Modal UI
    const materiModal = document.getElementById('materiModal');
    const btnAddMateri = document.getElementById('btnAddMateri');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const btnCancelModalX = document.getElementById('btnCancelModalX');
    const btnSaveMateri = document.getElementById('btnSaveMateri');
    const modalTitle = document.getElementById('modal-title');

    // Form Inputs
    const inputKategori = document.getElementById('inputKategori');
    const inputNamaMateri = document.getElementById('inputNamaMateri');
    const inputTarget = document.getElementById('inputTarget');
    const checkboxTargets = document.querySelectorAll('input[name="targetKelas"]');

    // State
    let allMaterials = [];
    let filteredMaterials = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let isEditingId = null;

    // 3. Real-time Listener
    // Note: We'll use a new collection 'curriculum'
    db.collection('curriculum').onSnapshot((snapshot) => {
        allMaterials = [];
        snapshot.forEach((doc) => {
            allMaterials.push({ id: doc.id, ...doc.data() });
        });

        applyFilters();
    }, (error) => {
        console.error("Error fetching curriculum: ", error);
        kurikulumTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-500">
                    Gagal memuat data: ${error.message}
                </td>
            </tr>`;
    });

    // 4. Filtering & Pagination Logic
    function applyFilters() {
        const search = searchInput.value.toLowerCase().trim();
        const kategori = filterKategori.value;
        const kelas = filterKelas.value;

        filteredMaterials = allMaterials.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(search);
            const matchKategori = !kategori || item.category === kategori;

            // Check if item.targetKelas array contains the selected class filter
            // item.targetKelas should be an array like ['1', '2'] or just '1'
            let itemClasses = item.targetKelas;
            if (!Array.isArray(itemClasses)) {
                // Handle legacy or single string format just in case
                itemClasses = itemClasses ? [itemClasses.toString()] : [];
            }

            const matchKelas = !kelas || itemClasses.includes(kelas);

            return matchSearch && matchKategori && matchKelas;
        });

        // Sort by Category then Name
        filteredMaterials.sort((a, b) => {
            if (a.category === b.category) {
                return a.name.localeCompare(b.name);
            }
            return a.category.localeCompare(b.category);
        });

        // Pagination reset
        const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = 1;
        if (currentPage < 1) currentPage = 1;

        renderTable();
        renderPagination();
    }

    function renderTable() {
        if (filteredMaterials.length === 0) {
            kurikulumTableBody.innerHTML = `
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        <div class="flex flex-col items-center justify-center gap-2">
                            <i class="ph ph-files text-3xl text-gray-300"></i>
                            <span>Tidak ada data materi yang ditemukan.</span>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = filteredMaterials.slice(start, end);

        let html = '';
        pageData.forEach((data) => {
            // Format Badge Kategori
            let categoryClass = 'bg-gray-100 text-gray-800';
            if (data.category === 'Tahfizh') categoryClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
            else if (data.category === 'Doa') categoryClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            else if (data.category === 'Tathbiq') categoryClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';

            // Format Badge Kelas
            let kelasBadges = '';
            if (Array.isArray(data.targetKelas)) {
                // Sort numeric
                const sorted = [...data.targetKelas].sort();

                // If contains '1' through '6', show "Semua Kelas"
                const allLevels = ['1', '2', '3', '4', '5', '6'];
                if (allLevels.every(l => sorted.includes(l))) {
                    kelasBadges = '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-white dark:bg-white dark:text-gray-800">Semua Kelas</span>';
                } else {
                    kelasBadges = sorted.map(k =>
                        `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">${k}</span>`
                    ).join(' ');
                }
            } else {
                kelasBadges = '-';
            }

            html += `
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryClass}">
                            ${data.category}
                        </span>
                    </td>
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        ${data.name}
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex flex-wrap gap-1">
                            ${kelasBadges}
                        </div>
                    </td>
                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
                        ${data.target || '-'}
                    </td>
                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
                        ${data.semester || '-'}
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="editMateri('${data.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <i class="ph ph-pencil-simple text-lg"></i>
                            </button>
                            <button onclick="deleteMateri('${data.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                <i class="ph ph-trash text-lg"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        kurikulumTableBody.innerHTML = html;

        // GSAP Animation for rows
        gsap.to("#kurikulumTableBody tr", {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.out",
            onStart: function () {
                gsap.set(this.targets(), { y: 10, opacity: 0 });
            }
        });
    }

    function renderPagination() {
        const total = filteredMaterials.length;
        const totalPages = Math.ceil(total / itemsPerPage);
        const start = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, total);

        pageStart.textContent = start;
        pageEnd.textContent = end;
        totalItems.textContent = total;

        const isFirst = currentPage === 1;
        const isLast = currentPage === totalPages || totalPages === 0;

        btnPrev.disabled = isFirst;
        btnNext.disabled = isLast;

        // Simple Page Numbers
        let pagesHtml = '';
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                const isActive = i === currentPage;
                const classes = isActive
                    ? "w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-sm font-medium shadow-sm transition-all"
                    : "w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium transition-all";
                pagesHtml += `<button onclick="changePage(${i})" class="${classes}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                pagesHtml += `<span class="w-8 h-8 flex items-center justify-center text-gray-400">...</span>`;
            }
        }
        pageNumbers.innerHTML = pagesHtml;
    }

    // --- Modal Logic ---
    function toggleModal(show) {
        if (show) {
            materiModal.classList.remove('hidden');
            gsap.fromTo(materiModal.querySelector('.relative'),
                { scale: 0.95, opacity: 0, y: 10 },
                { scale: 1, opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
            );
        } else {
            gsap.to(materiModal.querySelector('.relative'), {
                scale: 0.95,
                opacity: 0,
                y: 10,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => materiModal.classList.add('hidden')
            });
        }
    }

    btnAddMateri.addEventListener('click', () => {
        isEditingId = null;
        modalTitle.innerHTML = 'Tambah Materi Baru';

        // Reset Form
        inputKategori.value = 'Tahfizh';
        inputNamaMateri.value = '';
        inputTarget.value = '';
        checkboxTargets.forEach(cb => cb.checked = false);

        toggleModal(true);
    });

    [btnCancelModal, btnCancelModalX].forEach(btn => btn.addEventListener('click', () => toggleModal(false)));

    btnSaveMateri.addEventListener('click', async () => {
        const kategori = inputKategori.value;
        const nama = inputNamaMateri.value.trim();
        const target = inputTarget.value.trim();
        const semester = inputSemester.value;

        // Get Checkboxes
        const targetKelas = [];
        checkboxTargets.forEach(cb => {
            if (cb.checked) targetKelas.push(cb.value);
        });

        if (!nama) {
            showCustomAlert('warning', 'Validasi Gagal', 'Nama materi wajib diisi!');
            return;
        }

        if (targetKelas.length === 0) {
            showCustomAlert('warning', 'Validasi Gagal', 'Pilih minimal satu target kelas!');
            return;
        }

        const data = {
            category: kategori,
            name: nama,
            targetKelas: targetKelas, // Array of strings ['1', '2']
            target: target, // Optional score/count target
            semester: semester,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            btnSaveMateri.disabled = true;
            btnSaveMateri.textContent = 'Menyimpan...';

            if (isEditingId) {
                await db.collection('curriculum').doc(isEditingId).update(data);
                showCustomAlert('success', 'Berhasil', 'Materi berhasil diperbarui!');
            } else {
                await db.collection('curriculum').add(data);
                showCustomAlert('success', 'Berhasil', 'Materi baru berhasil ditambahkan!');
            }

            toggleModal(false);
        } catch (error) {
            console.error(error);
            showCustomAlert('error', 'Gagal', error.message);
        } finally {
            btnSaveMateri.disabled = false;
            btnSaveMateri.textContent = 'Simpan';
        }
    });

    // --- Global Functions (Edit/Delete) ---
    window.editMateri = (id) => {
        const item = allMaterials.find(m => m.id === id);
        if (!item) return;

        isEditingId = id;
        modalTitle.innerHTML = '<i class="ph ph-pencil-simple text-primary text-xl"></i> Edit Materi';

        inputKategori.value = item.category || 'Tahfizh';
        inputNamaMateri.value = item.name || '';
        inputTarget.value = item.target || '';

        // Checklist Checkboxes
        const targets = Array.isArray(item.targetKelas) ? item.targetKelas : [];
        checkboxTargets.forEach(cb => {
            cb.checked = targets.includes(cb.value);
        });

        toggleModal(true);
    };

    window.deleteMateri = async (id) => {
        const result = await showConfirmAlert(
            'Hapus Materi?',
            'Apakah Anda yakin ingin menghapus materi ini? Data yang dihapus tidak dapat dikembalikan.'
        );

        if (result) {
            try {
                await db.collection('curriculum').doc(id).delete();
                showCustomAlert('success', 'Terhapus', 'Materi berhasil dihapus.');
            } catch (error) {
                showCustomAlert('error', 'Gagal', error.message);
            }
        }
    };

    // --- Event Listeners for Filter/Page ---
    [searchInput, filterKategori, filterKelas].forEach(el => {
        el.addEventListener('input', () => {
            currentPage = 1;
            applyFilters();
        });
    });

    [btnPrev, btnNext].forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.currentTarget.id === 'btnPrev' && currentPage > 1) currentPage--;
            if (e.currentTarget.id === 'btnNext') currentPage++;
            applyFilters(); // will handle boundary check
        });
    });

    window.changePage = (p) => {
        currentPage = p;
        applyFilters();
    };

});
