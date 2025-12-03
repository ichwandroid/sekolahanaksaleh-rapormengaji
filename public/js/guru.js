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
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${data.email || '-'}</td>
                    <td class="px-6 py-4">${data.jabatan || '-'}</td>
                    <td class="px-6 py-4">${data.kelas_diampu || '-'}</td>
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
            // Close kelas dropdown when modal closes
            const kelasDiampuDropdown = document.getElementById('kelasDiampuDropdown');
            if (kelasDiampuDropdown) {
                kelasDiampuDropdown.classList.add('hidden');
            }

            gsap.to(addGuruModal.querySelector('.relative'), {
                scale: 0.95,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => addGuruModal.classList.add('hidden')
            });
        }
    }

    // --- Multi-Select Kelas Diampu Logic ---
    const btnKelasDiampuDropdown = document.getElementById('btnKelasDiampuDropdown');
    const kelasDiampuDropdown = document.getElementById('kelasDiampuDropdown');
    const kelasDiampuOptions = document.getElementById('kelasDiampuOptions');
    const selectedKelasBadges = document.getElementById('selectedKelasBadges');
    const emptyKelasPlaceholder = document.getElementById('emptyKelasPlaceholder');
    const inputKelasDiampu = document.getElementById('inputKelasDiampu');
    const selectedCountSpan = document.getElementById('selectedCount');
    const btnClearAllKelas = document.getElementById('btnClearAllKelas');
    const btnCloseKelasDiampu = document.getElementById('btnCloseKelasDiampu');

    // Generate kelas options (1A - 6D)
    const kelasOptions = [];
    for (let tingkat = 1; tingkat <= 6; tingkat++) {
        for (let kelas of ['A', 'B', 'C', 'D']) {
            kelasOptions.push(`${tingkat}${kelas}`);
        }
    }

    // Populate kelas options with modern checkbox cards
    kelasOptions.forEach(kelas => {
        const label = document.createElement('label');
        label.className = 'kelas-option relative cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" value="${kelas}" class="kelas-checkbox peer sr-only">
            <div class="flex items-center justify-center h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-lg peer-checked:scale-105 hover:border-primary/50 hover:shadow-md">
                ${kelas}
            </div>
        `;
        kelasDiampuOptions.appendChild(label);
    });

    // Toggle dropdown
    btnKelasDiampuDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        kelasDiampuDropdown.classList.toggle('hidden');
    });

    // Close dropdown button
    btnCloseKelasDiampu.addEventListener('click', () => {
        kelasDiampuDropdown.classList.add('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!btnKelasDiampuDropdown.contains(e.target) && !kelasDiampuDropdown.contains(e.target)) {
            kelasDiampuDropdown.classList.add('hidden');
        }
    });

    // Clear all button
    btnClearAllKelas.addEventListener('click', () => {
        document.querySelectorAll('.kelas-checkbox').forEach(cb => cb.checked = false);
        updateKelasDiampuDisplay();
    });

    // Update display with badges
    function updateKelasDiampuDisplay() {
        const checkboxes = document.querySelectorAll('.kelas-checkbox:checked');
        const selectedKelas = Array.from(checkboxes).map(cb => cb.value);

        // Update count
        selectedCountSpan.textContent = selectedKelas.length;

        // Clear badges container
        selectedKelasBadges.innerHTML = '';

        if (selectedKelas.length === 0) {
            // Show placeholder
            const placeholder = document.createElement('span');
            placeholder.className = 'text-xs text-gray-500 dark:text-gray-400';
            placeholder.textContent = 'Belum ada kelas dipilih';
            selectedKelasBadges.appendChild(placeholder);
        } else {
            // Show badges
            selectedKelas.forEach(kelas => {
                const badge = document.createElement('div');
                badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white text-xs font-medium rounded-full shadow-sm';
                badge.innerHTML = `
                    <span>${kelas}</span>
                    <button type="button" class="remove-kelas hover:bg-white/20 rounded-full p-0.5 transition-colors" data-kelas="${kelas}">
                        <i class="ph ph-x text-xs"></i>
                    </button>
                `;
                selectedKelasBadges.appendChild(badge);
            });

            // Add event listeners to remove buttons
            selectedKelasBadges.querySelectorAll('.remove-kelas').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const kelasToRemove = btn.getAttribute('data-kelas');
                    const checkbox = document.querySelector(`.kelas-checkbox[value="${kelasToRemove}"]`);
                    if (checkbox) {
                        checkbox.checked = false;
                        updateKelasDiampuDisplay();
                    }
                });
            });
        }

        // Update hidden input
        inputKelasDiampu.value = selectedKelas.join(', ');
    }

    // Listen to checkbox changes
    kelasDiampuOptions.addEventListener('change', updateKelasDiampuDisplay);

    // Function to set selected kelas from string
    function setSelectedKelas(kelasString) {
        // Uncheck all first
        document.querySelectorAll('.kelas-checkbox').forEach(cb => cb.checked = false);

        if (kelasString) {
            const kelasList = kelasString.split(',').map(k => k.trim());
            kelasList.forEach(kelas => {
                const checkbox = document.querySelector(`.kelas-checkbox[value="${kelas}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        updateKelasDiampuDisplay();
    }

    btnAddGuru.addEventListener('click', () => {
        // Reset form
        document.getElementById('inputNIY').value = '';
        document.getElementById('inputNama').value = '';
        document.getElementById('inputEmail').value = '';
        document.getElementById('inputJabatan').value = 'Guru PAIBP';
        setSelectedKelas(''); // Reset kelas selection
        document.getElementById('modal-title').textContent = 'Tambah Guru Baru';

        // Remove any editing ID
        btnSaveGuru.removeAttribute('data-edit-id');

        toggleModal(true);
    });

    btnCancelModal.addEventListener('click', () => toggleModal(false));

    btnSaveGuru.addEventListener('click', async () => {
        const niy = document.getElementById('inputNIY').value.trim();
        const nama = document.getElementById('inputNama').value.trim();
        const email = document.getElementById('inputEmail').value.trim();
        const jabatan = document.getElementById('inputJabatan').value;
        const kelasDiampu = document.getElementById('inputKelasDiampu').value;
        const editId = btnSaveGuru.getAttribute('data-edit-id');

        if (!nama) {
            showCustomAlert('warning', 'Peringatan!', 'Nama wajib diisi!');
            return;
        }

        try {
            const data = {
                niy: niy || '',
                nama_lengkap: nama,
                email: email,
                jabatan,
                kelas_diampu: kelasDiampu,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (editId) {
                await db.collection('teachers').doc(editId).update(data);
                showCustomAlert('success', 'Berhasil!', 'Data guru berhasil diperbarui!');
            } else {
                if (niy) {
                    await db.collection('teachers').doc(niy).set(data, { merge: true });
                } else {
                    await db.collection('teachers').add(data);
                }
                showCustomAlert('success', 'Berhasil!', 'Data guru berhasil disimpan!');
            }

            toggleModal(false);
        } catch (error) {
            console.error("Error saving teacher: ", error);
            showCustomAlert('error', 'Gagal!', 'Gagal menyimpan data: ' + error.message);
        }
    });

    // --- Edit Function ---
    window.editGuru = (id) => {
        const teacher = teachersData.find(t => t.id === id);
        if (!teacher) return;

        document.getElementById('inputNIY').value = teacher.niy || '';
        document.getElementById('inputNama').value = teacher.nama_lengkap || '';
        document.getElementById('inputEmail').value = teacher.email || '';
        document.getElementById('inputJabatan').value = teacher.jabatan || 'Guru PAIBP';
        setSelectedKelas(teacher.kelas_diampu || ''); // Set selected kelas

        document.getElementById('modal-title').textContent = 'Edit Data Guru';
        btnSaveGuru.setAttribute('data-edit-id', id);

        toggleModal(true);
    };

    // --- Delete Function ---
    window.deleteGuru = async (id) => {
        showConfirmAlert(
            'Hapus Data Guru?',
            'Apakah Anda yakin ingin menghapus data guru ini? Tindakan ini tidak dapat dibatalkan.',
            async () => {
                try {
                    await db.collection('teachers').doc(id).delete();
                    showCustomAlert('success', 'Terhapus!', 'Data guru berhasil dihapus.');
                } catch (error) {
                    console.error("Error removing document: ", error);
                    showCustomAlert('error', 'Gagal!', 'Gagal menghapus data: ' + error.message);
                }
            }
        );
    };

    // --- CSV Upload Logic ---
    const uploadCSVModal = document.getElementById('uploadCSVModal');
    const btnUploadCSV = document.getElementById('btnUploadCSV');
    const btnCancelCSV = document.getElementById('btnCancelCSV');
    const btnDownloadTemplate = document.getElementById('btnDownloadTemplate');
    const csvFileInput = document.getElementById('csvFileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const btnProcessCSV = document.getElementById('btnProcessCSV');

    function toggleCSVModal(show) {
        if (show) {
            uploadCSVModal.classList.remove('hidden');
            gsap.fromTo(uploadCSVModal.querySelector('.relative'),
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }
            );
        } else {
            gsap.to(uploadCSVModal.querySelector('.relative'), {
                scale: 0.95,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => uploadCSVModal.classList.add('hidden')
            });
        }
    }

    btnUploadCSV.addEventListener('click', () => {
        csvFileInput.value = ''; // Reset file input
        fileNameDisplay.classList.add('hidden');
        fileNameDisplay.querySelector('span').textContent = '';
        toggleCSVModal(true);
    });

    btnCancelCSV.addEventListener('click', () => toggleCSVModal(false));

    btnDownloadTemplate.addEventListener('click', () => {
        const headers = ['NIY', 'Nama Lengkap', 'Email', 'Jabatan'];
        const csvContent = headers.join(',') + '\n' + '12345,Contoh Guru,contoh@gmail.com,Guru PAIBP';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'template_guru.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.classList.remove('hidden');
            fileNameDisplay.querySelector('span').textContent = file.name;
        }
    });

    btnProcessCSV.addEventListener('click', async () => {
        const file = csvFileInput.files[0];
        if (!file) {
            showCustomAlert('warning', 'Peringatan!', 'Silakan pilih file CSV terlebih dahulu!');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            const teachers = [];

            // Start from index 1 to skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Simple CSV split by comma (assuming no commas in fields for now)
                // For better robustness, a regex or parser library is recommended
                const parts = line.split(',');

                if (parts.length >= 3) {
                    const niy = parts[0].trim();
                    const nama = parts[1].trim();
                    const email = parts[2].trim();
                    const jabatan = parts.length > 3 ? parts[3].trim() : 'Pilih Jabatan'; // Default if missing

                    if (niy && nama) {
                        teachers.push({
                            niy,
                            nama_lengkap: nama,
                            email,
                            jabatan,
                            updated_at: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }
            }

            if (teachers.length === 0) {
                showCustomAlert('warning', 'Peringatan!', 'Tidak ada data valid yang ditemukan dalam file CSV.');
                return;
            }

            showConfirmAlert(
                'Upload Data CSV?',
                `Ditemukan ${teachers.length} data guru. Apakah Anda yakin ingin mengupload?`,
                async () => {

                    // Batch write
                    const batch = db.batch();
                    let batchCount = 0;
                    const BATCH_LIMIT = 500; // Firestore batch limit

                    try {
                        btnProcessCSV.disabled = true;
                        btnProcessCSV.textContent = 'Memproses...';
                        showLoadingAlert('Mengupload Data...', 'Mohon tunggu, sedang memproses file CSV');

                        for (const teacher of teachers) {
                            // Use NIY as doc ID
                            const docRef = db.collection('teachers').doc(teacher.niy);
                            batch.set(docRef, teacher, { merge: true });
                            batchCount++;

                            if (batchCount >= BATCH_LIMIT) {
                                await batch.commit();
                                batchCount = 0;
                            }
                        }

                        if (batchCount > 0) {
                            await batch.commit();
                        }

                        closeCustomAlert();
                        showCustomAlert('success', 'Berhasil!', `Berhasil mengupload ${teachers.length} data guru!`);
                        toggleCSVModal(false);
                    } catch (error) {
                        console.error("Error uploading CSV: ", error);
                        closeCustomAlert();
                        showCustomAlert('error', 'Gagal!', 'Gagal mengupload data: ' + error.message);
                    } finally {
                        btnProcessCSV.disabled = false;
                        btnProcessCSV.textContent = 'Upload & Proses';
                    }
                }
            );
        };

        reader.readAsText(file);
    });
});
