document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const guruTableBody = document.getElementById('guruTableBody');

    // Filters & Sort UI
    const filterJabatan = document.getElementById('filterJabatan');
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
    const btnAddGuru = document.getElementById('btnAddGuru');
    const addGuruModal = document.getElementById('addGuruModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const btnSaveGuru = document.getElementById('btnSaveGuru');

    // State
    let teachersData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortOrder = 'asc'; // 'asc' or 'desc'

    // --- Real-time Listener ---
    db.collection('teachers').onSnapshot((snapshot) => {
        teachersData = [];
        snapshot.forEach((doc) => {
            teachersData.push({ id: doc.id, ...doc.data() });
        });

        // Apply Filters & Render
        applyFilters();
    }, (error) => {
        console.error("Error fetching teachers: ", error);
        guruTableBody.innerHTML = `
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td colspan="4" class="px-6 py-4 text-center text-red-500">
                    Gagal memuat data: ${error.message}
                </td>
            </tr>`;
    });

    // --- Filtering & Sorting Logic ---
    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const jabatan = filterJabatan.value;

        filteredData = teachersData.filter(t => {
            const matchSearch = (t.nama_lengkap && t.nama_lengkap.toLowerCase().includes(search)) ||
                (t.niy && t.niy.includes(search));
            const matchJabatan = !jabatan || t.jabatan === jabatan;

            return matchSearch && matchJabatan;
        });

        // Sort
        filteredData.sort((a, b) => {
            const nameA = (a.nama_lengkap || '').toLowerCase();
            const nameB = (b.nama_lengkap || '').toLowerCase();
            if (sortOrder === 'asc') return nameA.localeCompare(nameB);
            return nameB.localeCompare(nameA);
        });

        // Reset to page 1 if current page is out of bounds
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = 1;
        if (currentPage < 1) currentPage = 1;

        renderTable();
        renderPagination();
    }

    // --- Rendering ---
    function renderTable() {
        if (filteredData.length === 0) {
            guruTableBody.innerHTML = `
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td colspan="4" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data guru yang cocok.
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
                <tr class="teacher-row bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors opacity-0">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${data.niy || '-'}</td>
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${data.nama_lengkap || '-'}</td>
                    <td class="px-6 py-4">${data.jabatan || '-'}</td>
                    <td class="px-6 py-4">
                        <div class="flex gap-2">
                            <button class="font-medium text-blue-600 dark:text-blue-500 hover:underline" onclick="editGuru('${data.id}')">Edit</button>
                            <button class="font-medium text-red-600 dark:text-red-500 hover:underline" onclick="deleteGuru('${data.id}')">Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        guruTableBody.innerHTML = html;

        // GSAP Animation for rows
        gsap.to(".teacher-row", {
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

        // Disable/Enable buttons
        const isFirst = currentPage === 1;
        const isLast = currentPage === totalPages || totalPages === 0;

        [btnPrev, btnPrevMobile].forEach(btn => btn.disabled = isFirst);
        [btnNext, btnNextMobile].forEach(btn => btn.disabled = isLast);

        // Render Page Numbers (Desktop)
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
    [filterJabatan, searchInput].forEach(el => {
        el.addEventListener('input', () => {
            currentPage = 1; // Reset to first page on filter change
            applyFilters();
        });
    });

    btnSort.addEventListener('click', () => {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        sortLabel.textContent = sortOrder === 'asc' ? 'Nama A-Z' : 'Nama Z-A';
        applyFilters();
    });

    // Pagination Events
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
            addGuruModal.classList.remove('hidden');
            gsap.fromTo(addGuruModal.querySelector('.relative'),
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }
            );
        } else {
            gsap.to(addGuruModal.querySelector('.relative'), {
                scale: 0.95,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => addGuruModal.classList.add('hidden')
            });
        }
    }

    btnAddGuru.addEventListener('click', () => {
        // Reset form
        document.getElementById('inputNIY').value = '';
        document.getElementById('inputNama').value = '';
        document.getElementById('inputJabatan').value = 'Guru PAIBP';
        document.getElementById('modal-title').textContent = 'Tambah Guru Baru';

        // Remove any editing ID
        btnSaveGuru.removeAttribute('data-edit-id');

        toggleModal(true);
    });

    btnCancelModal.addEventListener('click', () => toggleModal(false));

    btnSaveGuru.addEventListener('click', async () => {
        const niy = document.getElementById('inputNIY').value;
        const nama = document.getElementById('inputNama').value;
        const jabatan = document.getElementById('inputJabatan').value;
        const editId = btnSaveGuru.getAttribute('data-edit-id');

        if (!niy || !nama) {
            alert('NIY dan Nama wajib diisi!');
            return;
        }

        try {
            const data = {
                niy,
                nama_lengkap: nama,
                jabatan,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (editId) {
                await db.collection('teachers').doc(editId).update(data);
                alert('Data guru berhasil diperbarui!');
            } else {
                // Use NIY as doc ID or auto-gen? Using NIY as ID is safer for uniqueness if guaranteed unique.
                // But let's use NIY as ID to be consistent with students (using NIS).
                await db.collection('teachers').doc(niy).set(data, { merge: true });
                alert('Data guru berhasil disimpan!');
            }

            toggleModal(false);
        } catch (error) {
            console.error("Error saving teacher: ", error);
            alert("Gagal menyimpan data: " + error.message);
        }
    });

    // --- Edit Function ---
    window.editGuru = (id) => {
        const teacher = teachersData.find(t => t.id === id);
        if (!teacher) return;

        document.getElementById('inputNIY').value = teacher.niy || '';
        document.getElementById('inputNama').value = teacher.nama_lengkap || '';
        document.getElementById('inputJabatan').value = teacher.jabatan || 'Guru PAIBP';

        document.getElementById('modal-title').textContent = 'Edit Data Guru';
        btnSaveGuru.setAttribute('data-edit-id', id);

        toggleModal(true);
    };

    // --- Delete Function ---
    window.deleteGuru = async (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
            try {
                await db.collection('teachers').doc(id).delete();
            } catch (error) {
                console.error("Error removing document: ", error);
                alert("Gagal menghapus data: " + error.message);
            }
        }
    };
});
