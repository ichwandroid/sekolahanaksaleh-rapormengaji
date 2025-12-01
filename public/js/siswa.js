document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const siswaTableBody = document.getElementById('siswaTableBody');
    const csvFileInput = document.getElementById('csvFileInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // Filters & Sort UI
    const filterKelas = document.getElementById('filterKelas');
    const filterKelompok = document.getElementById('filterKelompok');
    const filterShift = document.getElementById('filterShift');
    const filterGuruGPQ = document.getElementById('filterGuruGPQ');
    const filterGuruPAI = document.getElementById('filterGuruPAI');
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
    const btnAddSiswa = document.getElementById('btnAddSiswa');
    const addStudentModal = document.getElementById('addStudentModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const btnSaveStudent = document.getElementById('btnSaveStudent');

    // State
    let studentsData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortOrder = 'asc'; // 'asc' or 'desc'

    // --- Real-time Listener ---
    db.collection('students').onSnapshot((snapshot) => {
        studentsData = [];
        snapshot.forEach((doc) => {
            studentsData.push({ id: doc.id, ...doc.data() });
        });

        // Populate Filter Options
        populateFilters();

        // Apply Filters & Render
        applyFilters();
    }, (error) => {
        console.error("Error fetching students: ", error);
        siswaTableBody.innerHTML = `
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td colspan="7" class="px-6 py-4 text-center text-red-500">
                    Gagal memuat data: ${error.message}
                </td>
            </tr>`;
    });

    // --- Fetch Teachers ---
    const inputGuruPAI = document.getElementById('inputGuruPAI');
    const inputGuruGPQ = document.getElementById('inputGuruGPQ');

    db.collection('teachers').onSnapshot((snapshot) => {
        const teachers = [];
        snapshot.forEach((doc) => {
            teachers.push({ id: doc.id, ...doc.data() });
        });

        // Populate Dropdowns
        populateTeacherDropdown(inputGuruPAI, teachers, 'Guru PAIBP');
        populateTeacherDropdown(inputGuruGPQ, teachers, 'Guru GPQ');
    });

    function populateTeacherDropdown(selectElement, teachers, jabatan) {
        selectElement.innerHTML = `<option value="">Pilih ${jabatan}</option>`;
        teachers.filter(t => t.jabatan === jabatan).forEach(t => {
            const option = document.createElement('option');
            option.value = t.nama_lengkap; // Storing name as value for simplicity in display
            option.textContent = t.nama_lengkap;
            selectElement.appendChild(option);
        });
    }

    // --- Filtering & Sorting Logic ---
    function populateFilters() {
        const kelasSet = new Set();
        const kelompokSet = new Set();
        const shiftSet = new Set();
        const guruGPQSet = new Set();
        const guruPAISet = new Set();

        studentsData.forEach(s => {
            if (s.kelas) kelasSet.add(s.kelas);
            if (s.kelompok) kelompokSet.add(s.kelompok);
            if (s.shift) shiftSet.add(s.shift);
            if (s.bilqolam_guru) guruGPQSet.add(s.bilqolam_guru);
            if (s.guru_pai) guruPAISet.add(s.guru_pai);
        });

        updateSelectOptions(filterKelas, kelasSet, 'Semua Kelas');
        updateSelectOptions(filterKelompok, kelompokSet, 'Semua Kelompok');
        updateSelectOptions(filterShift, shiftSet, 'Semua Shift');
        updateSelectOptions(filterGuruGPQ, guruGPQSet, 'Semua Guru GPQ');
        updateSelectOptions(filterGuruPAI, guruPAISet, 'Semua Guru PAI');
    }

    function updateSelectOptions(selectElement, set, defaultText) {
        const currentValue = selectElement.value;
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;

        // Use natural sort order (numeric: true) so "2" comes before "10"
        Array.from(set).sort((a, b) => {
            return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
        }).forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val;
            selectElement.appendChild(option);
        });

        selectElement.value = currentValue; // Restore selection if possible
    }

    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const kelas = filterKelas.value;
        const kelompok = filterKelompok.value;
        const shift = filterShift.value;
        const guruGPQ = filterGuruGPQ.value;
        const guruPAI = filterGuruPAI.value;

        filteredData = studentsData.filter(s => {
            const matchSearch = (s.nama_lengkap && s.nama_lengkap.toLowerCase().includes(search)) ||
                (s.nis && s.nis.includes(search));
            const matchKelas = !kelas || s.kelas === kelas;
            const matchKelompok = !kelompok || s.kelompok === kelompok;
            const matchShift = !shift || s.shift === shift;
            const matchGuruGPQ = !guruGPQ || s.bilqolam_guru === guruGPQ;
            const matchGuruPAI = !guruPAI || s.guru_pai === guruPAI;

            return matchSearch && matchKelas && matchKelompok && matchShift && matchGuruGPQ && matchGuruPAI;
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
            siswaTableBody.innerHTML = `
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
                    <td class="px-6 py-4"><span class="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">${data.status || 'Reguler'}</span></td>
                    <td class="px-6 py-4">${data.kelas || '-'}</td>
                    <td class="px-6 py-4">${data.kelompok || '-'}</td>
                    <td class="px-6 py-4">${data.shift || '-'}</td>
                    <td class="px-6 py-4">${data.bilqolam_guru || '-'}</td>
                    <td class="px-6 py-4">${data.guru_pai || '-'}</td>
                    <td class="px-6 py-4">
                        <div class="flex gap-2">
                            <button class="font-medium text-blue-600 dark:text-blue-500 hover:underline" onclick="editStudent('${data.id}')">Edit</button>
                            <button class="font-medium text-red-600 dark:text-red-500 hover:underline" onclick="deleteStudent('${data.id}')">Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        siswaTableBody.innerHTML = html;

        // GSAP Animation for rows
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

        // Disable/Enable buttons
        const isFirst = currentPage === 1;
        const isLast = currentPage === totalPages || totalPages === 0;

        [btnPrev, btnPrevMobile].forEach(btn => btn.disabled = isFirst);
        [btnNext, btnNextMobile].forEach(btn => btn.disabled = isLast);

        // Render Page Numbers (Desktop)
        let pagesHtml = '';
        // Simple logic: show all pages if <= 7, otherwise show range (simplified for now)
        for (let i = 1; i <= totalPages; i++) {
            // Show first, last, current, and neighbors
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
    [filterKelas, filterKelompok, filterShift, filterGuruGPQ, filterGuruPAI, searchInput].forEach(el => {
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
            addStudentModal.classList.remove('hidden');
            gsap.fromTo(addStudentModal.querySelector('.relative'),
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }
            );
        } else {
            gsap.to(addStudentModal.querySelector('.relative'), {
                scale: 0.95,
                opacity: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => addStudentModal.classList.add('hidden')
            });
        }
    }

    btnAddSiswa.addEventListener('click', () => {
        // Reset form
        document.getElementById('inputNIS').value = '';
        document.getElementById('inputNISN').value = '';
        document.getElementById('inputNama').value = '';
        document.getElementById('inputStatus').value = 'Reguler';
        document.getElementById('inputKelas').value = '';
        document.getElementById('inputKelompok').value = '';
        document.getElementById('inputShift').value = '';
        document.getElementById('inputGuruGPQ').value = '';
        document.getElementById('inputGuruPAI').value = '';

        document.getElementById('modal-title').textContent = 'Tambah Siswa Baru';
        // Enable NIS input for new student
        document.getElementById('inputNIS').disabled = false;
        document.getElementById('inputNIS').classList.remove('bg-gray-200', 'dark:bg-gray-600');

        toggleModal(true);
    });

    window.editStudent = (id) => {
        const student = studentsData.find(s => s.id === id);
        if (!student) return;

        document.getElementById('inputNIS').value = student.nis || '';
        document.getElementById('inputNISN').value = student.nisn || '';
        document.getElementById('inputNama').value = student.nama_lengkap || '';
        document.getElementById('inputStatus').value = student.status || 'Reguler';
        document.getElementById('inputKelas').value = student.kelas || '';
        document.getElementById('inputKelompok').value = student.kelompok || '';
        document.getElementById('inputShift').value = student.shift || '';
        document.getElementById('inputGuruGPQ').value = student.bilqolam_guru || '';
        document.getElementById('inputGuruPAI').value = student.guru_pai || '';

        document.getElementById('modal-title').textContent = 'Edit Data Siswa';
        // Disable NIS input for editing to prevent ID change issues
        document.getElementById('inputNIS').disabled = true;
        document.getElementById('inputNIS').classList.add('bg-gray-200', 'dark:bg-gray-600');

        toggleModal(true);
    };
    btnCancelModal.addEventListener('click', () => toggleModal(false));

    btnSaveStudent.addEventListener('click', async () => {
        const nis = document.getElementById('inputNIS').value;
        const nisn = document.getElementById('inputNISN').value;
        const nama = document.getElementById('inputNama').value;
        const status = document.getElementById('inputStatus').value;
        const kelas = document.getElementById('inputKelas').value;
        const kelompok = document.getElementById('inputKelompok').value;
        const shift = document.getElementById('inputShift').value;

        if (!nis || !nama) {
            alert('NIS dan Nama wajib diisi!');
            return;
        }

        try {
            await db.collection('students').doc(nis).set({
                nis, nisn, nama_lengkap: nama, status, kelas, kelompok, shift,
                bilqolam_guru: document.getElementById('inputGuruGPQ').value,
                guru_pai: document.getElementById('inputGuruPAI').value,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            toggleModal(false);
            // Clear form
            document.getElementById('inputNIS').value = '';
            document.getElementById('inputNISN').value = '';
            document.getElementById('inputNama').value = '';
            document.getElementById('inputStatus').value = 'Reguler';
            document.getElementById('inputKelas').value = '';
            document.getElementById('inputKelompok').value = '';
            document.getElementById('inputShift').value = '';
            document.getElementById('inputGuruGPQ').value = '';
            document.getElementById('inputGuruPAI').value = '';

            alert('Data siswa berhasil disimpan!');
        } catch (error) {
            console.error("Error adding student: ", error);
            alert("Gagal menyimpan data: " + error.message);
        }
    });

    // --- CSV Upload Logic ---
    const uploadCSVModal = document.getElementById('uploadCSVModal');
    const btnUploadCSV = document.getElementById('btnUploadCSV');
    const btnCancelCSV = document.getElementById('btnCancelCSV');
    const btnDownloadTemplate = document.getElementById('btnDownloadTemplate');
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
        const headers = ['NIS', 'NISN', 'Nama Lengkap', 'Kelas', 'Kelompok', 'Shift', 'Guru GPQ', 'Guru PAI'];
        const csvContent = headers.join(',') + '\n' + '12345,0012345678,Contoh Siswa,1A,A,Pagi,Nama Guru GPQ,Nama Guru PAI';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'template_siswa.csv');
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

    btnProcessCSV.addEventListener('click', () => {
        const file = csvFileInput.files[0];
        if (!file) {
            alert('Silakan pilih file CSV terlebih dahulu!');
            return;
        }

        uploadProgress.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        btnProcessCSV.disabled = true;
        btnProcessCSV.textContent = 'Memproses...';

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data;
                const total = data.length;
                let processed = 0;
                let errors = 0;

                const batchSize = 500;
                const chunks = [];
                for (let i = 0; i < total; i += batchSize) {
                    chunks.push(data.slice(i, i + batchSize));
                }

                try {
                    for (const chunk of chunks) {
                        const batch = db.batch();
                        chunk.forEach((row) => {
                            const normalizedRow = {};
                            Object.keys(row).forEach(key => {
                                normalizedRow[key.toLowerCase().trim().replace(/ /g, '_')] = row[key];
                            });

                            const nis = normalizedRow['nis'];
                            if (nis) {
                                const docRef = db.collection('students').doc(String(nis));
                                batch.set(docRef, {
                                    nis: String(nis),
                                    nisn: normalizedRow['nisn'] ? String(normalizedRow['nisn']) : '',
                                    nama_lengkap: normalizedRow['nama_lengkap'] || normalizedRow['nama'] || '',
                                    kelas: normalizedRow['kelas'] || '',
                                    kelompok: normalizedRow['kelompok'] || '',
                                    shift: normalizedRow['shift'] || '',
                                    bilqolam_guru: normalizedRow['guru_gpq'] || '',
                                    guru_pai: normalizedRow['guru_pai'] || '',
                                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                                }, { merge: true });
                            } else {
                                errors++;
                            }
                        });

                        await batch.commit();
                        processed += chunk.length;
                        const percent = Math.round((processed / total) * 100);
                        progressBar.style.width = `${percent}%`;
                        progressText.textContent = `${percent}%`;
                    }

                    setTimeout(() => {
                        alert(`Upload selesai! ${total - errors} data berhasil disimpan.`);
                        uploadProgress.classList.add('hidden');
                        toggleCSVModal(false);
                        btnProcessCSV.disabled = false;
                        btnProcessCSV.textContent = 'Upload & Proses';
                        csvFileInput.value = '';
                    }, 500);

                } catch (error) {
                    console.error("Error uploading batch: ", error);
                    alert("Terjadi kesalahan saat mengupload data: " + error.message);
                    uploadProgress.classList.add('hidden');
                    btnProcessCSV.disabled = false;
                    btnProcessCSV.textContent = 'Upload & Proses';
                }
            },
            error: (error) => {
                console.error("CSV Parse Error: ", error);
                alert("Gagal membaca file CSV.");
                uploadProgress.classList.add('hidden');
                btnProcessCSV.disabled = false;
                btnProcessCSV.textContent = 'Upload & Proses';
            }
        });
    });

    // --- Delete Function (Global) ---
    window.deleteStudent = async (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
            try {
                await db.collection('students').doc(id).delete();
            } catch (error) {
                console.error("Error removing document: ", error);
                alert("Gagal menghapus data: " + error.message);
            }
        }
    };
});
