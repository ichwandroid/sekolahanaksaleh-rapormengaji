# Panduan Implementasi Custom Alert

Custom alert telah berhasil diterapkan di halaman `guru.html` dan `guru.js`. Berikut adalah panduan untuk menerapkannya ke halaman-halaman lainnya.

## File yang Sudah Selesai
- ✅ `public/js/custom-alert.js` - File reusable
- ✅ `public/guru.html` - Modal HTML + script sudah ditambahkan
- ✅ `public/js/guru.js` - Semua alert/confirm sudah diganti

## File yang Perlu Diupdate

### 1. File HTML yang Perlu Ditambahkan Custom Alert Modal

Tambahkan kode berikut **SEBELUM** tag `<!-- Firebase SDKs -->` di file-file HTML ini:
- `siswa.html v`
- `tahfizh.html v`
- `tathbiq.html v`
- `doa.html v`
- `laporan.html v`
- `bilqolam.html v`
- `dashboard.html`

```html
    <!-- Custom Alert Modal -->
    <div id="customAlertModal" class="hidden fixed inset-0 z-50 overflow-y-auto" style="backdrop-filter: blur(4px);">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50" onclick="closeCustomAlert()"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div id="alertBox" class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div id="alertIconContainer" class="flex items-center justify-center pt-8 pb-4">
                    <div id="alertIcon" class="w-20 h-20 rounded-full flex items-center justify-center">
                        <i id="alertIconElement" class="text-5xl"></i>
                    </div>
                </div>
                <div class="px-6 pb-6 text-center">
                    <h3 id="alertTitle" class="text-2xl font-bold text-gray-900 dark:text-white mb-2"></h3>
                    <p id="alertMessage" class="text-gray-600 dark:text-gray-400 mb-6"></p>
                    <div id="alertButtons" class="flex gap-3 justify-center"></div>
                </div>
            </div>
        </div>
    </div>
```

Tambahkan script **SEBELUM** script file JS utama (contoh: sebelum `siswa.js`, `tahfizh.js`, dll):

```html
    <script src="js/custom-alert.js"></script>
```

### 2. File JS yang Perlu Diupdate

#### **siswa.js** - Ganti alert/confirm berikut:

| Line | Kode Lama | Kode Baru |
|------|-----------|-----------|
| 392 | `alert('NIS dan Nama wajib diisi!');` | `showCustomAlert('warning', 'Peringatan!', 'NIS dan Nama wajib diisi!');` |
| 416 | `alert('Data siswa berhasil disimpan!');` | `showCustomAlert('success', 'Berhasil!', 'Data siswa berhasil disimpan!');` |
| 419 | `alert("Gagal menyimpan data: " + error.message);` | `showCustomAlert('error', 'Gagal!', 'Gagal menyimpan data: ' + error.message);` |
| 486 | `alert('Silakan pilih file CSV terlebih dahulu!');` | `showCustomAlert('warning', 'Peringatan!', 'Silakan pilih file CSV terlebih dahulu!');` |
| 547 | `alert(\`Upload selesai! ${total - errors} data berhasil disimpan.\`);` | `showCustomAlert('success', 'Berhasil!', \`Upload selesai! ${total - errors} data berhasil disimpan.\`);` |
| 557 | `alert("Terjadi kesalahan saat mengupload data: " + error.message);` | `showCustomAlert('error', 'Gagal!', 'Terjadi kesalahan saat mengupload data: ' + error.message);` |
| 565 | `alert("Gagal membaca file CSV.");` | `showCustomAlert('error', 'Gagal!', 'Gagal membaca file CSV.');` |
| 575-582 | `if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) { ... }` | `showConfirmAlert('Hapus Data Siswa?', 'Apakah Anda yakin ingin menghapus data siswa ini?', async () => { ... });` |

#### **tahfizh.js** - Ganti alert berikut:

| Line | Kode Lama | Kode Baru |
|------|-----------|-----------|
| 477 | `alert("Gagal menyimpan penilaian: " + error.message);` | `showCustomAlert('error', 'Gagal!', 'Gagal menyimpan penilaian: ' + error.message);` |
| 592 | `alert(\`Upload selesai!\\n${updated} siswa berhasil diperbarui.\\n${errors} baris gagal/dilewati.\`);` | `showCustomAlert('success', 'Berhasil!', \`Upload selesai! ${updated} siswa berhasil diperbarui. ${errors} baris gagal/dilewati.\`);` |
| 599 | `alert("Terjadi kesalahan saat mengupload data: " + error.message);` | `showCustomAlert('error', 'Gagal!', 'Terjadi kesalahan saat mengupload data: ' + error.message);` |
| 605 | `alert("Gagal membaca file CSV.");` | `showCustomAlert('error', 'Gagal!', 'Gagal membaca file CSV.');` |

#### **tathbiq.js** - Ganti alert berikut:

| Line | Kode Lama | Kode Baru |
|------|-----------|-----------|
| 468 | `alert("Gagal menyimpan penilaian: " + error.message);` | `showCustomAlert('error', 'Gagal!', 'Gagal menyimpan penilaian: ' + error.message);` |
| 601 | `alert(\`Upload selesai!\\n${updated} siswa berhasil diperbarui.\\n${errors} baris gagal/dilewati.\`);` | `showCustomAlert('success', 'Berhasil!', \`Upload selesai! ${updated} siswa berhasil diperbarui. ${errors} baris gagal/dilewati.\`);` |
| 608 | `alert("Terjadi kesalahan saat mengupload data: " + error.message);` | `showCustomAlert('error', 'Gagal!', 'Terjadi kesalahan saat mengupload data: ' + error.message);` |
| 614 | `alert("Gagal membaca file CSV.");` | `showCustomAlert('error', 'Gagal!', 'Gagal membaca file CSV.');` |

#### **doa.js** - Ganti alert berikut:

| Line | Kode Lama | Kode Baru |
|------|-----------|-----------|
| 470 | `alert("Gagal menyimpan penilaian: " + error.message);` | `showCustomAlert('error', 'Gagal!', 'Gagal menyimpan penilaian: ' + error.message);` |
| 603 | `alert(\`Upload selesai!\\n${updated} siswa berhasil diperbarui.\\n${errors} baris gagal/dilewati.\`);` | `showCustomAlert('success', 'Berhasil!', \`Upload selesai! ${updated} siswa berhasil diperbarui. ${errors} baris gagal/dilewati.\`);` |
| 610 | `alert("Terjadi kesalahan saat mengupload data: " + error.message);` | `showCustomAlert('error', 'Gagal!', 'Terjadi kesalahan saat mengupload data: ' + error.message);` |
| 616 | `alert("Gagal membaca file CSV.");` | `showCustomAlert('error', 'Gagal!', 'Gagal membaca file CSV.');` |

#### **laporan.js** - Ganti alert berikut:

| Line | Kode Lama | Kode Baru |
|------|-----------|-----------|
| 369 | `alert('Gagal membuat PDF: ' + error.message);` | `showCustomAlert('error', 'Gagal!', 'Gagal membuat PDF: ' + error.message);` |
| 869 | `alert("Gagal menyimpan saran: " + error.message);` | `showCustomAlert('error', 'Gagal!', 'Gagal menyimpan saran: ' + error.message);` |

#### **auth.js** - Ganti confirm berikut:

| Line | Kode Lama | Kode Baru |
|------|-----------|-----------|
| 29 | `if (confirm('Apakah Anda yakin ingin keluar?')) { ... }` | `showConfirmAlert('Logout?', 'Apakah Anda yakin ingin keluar?', () => { ... });` |

## Fungsi Custom Alert yang Tersedia

### 1. showCustomAlert(type, title, message, autoClose)
Menampilkan alert dengan berbagai tipe.

**Parameters:**
- `type`: 'success', 'error', 'warning', 'info'
- `title`: Judul alert
- `message`: Pesan alert
- `autoClose`: true/false (default: true untuk success/info)

**Contoh:**
```javascript
showCustomAlert('success', 'Berhasil!', 'Data berhasil disimpan!');
showCustomAlert('error', 'Gagal!', 'Terjadi kesalahan');
showCustomAlert('warning', 'Peringatan!', 'Harap isi semua field');
showCustomAlert('info', 'Informasi', 'Proses sedang berjalan');
```

### 2. showConfirmAlert(title, message, onConfirm, onCancel)
Menampilkan dialog konfirmasi dengan 2 tombol.

**Parameters:**
- `title`: Judul konfirmasi
- `message`: Pesan konfirmasi
- `onConfirm`: Callback function jika user klik "Ya"
- `onCancel`: Callback function jika user klik "Batal" (optional)

**Contoh:**
```javascript
showConfirmAlert(
    'Hapus Data?',
    'Apakah Anda yakin ingin menghapus data ini?',
    async () => {
        // Kode yang dijalankan jika user klik "Ya"
        await db.collection('students').doc(id).delete();
        showCustomAlert('success', 'Terhapus!', 'Data berhasil dihapus');
    }
);
```

### 3. showLoadingAlert(title, message)
Menampilkan loading alert dengan spinner.

**Parameters:**
- `title`: Judul loading (default: 'Memproses...')
- `message`: Pesan loading (default: 'Mohon tunggu sebentar')

**Contoh:**
```javascript
showLoadingAlert('Mengupload...', 'Sedang memproses file CSV');
// Setelah selesai, tutup dengan:
closeCustomAlert();
```

### 4. closeCustomAlert()
Menutup alert yang sedang ditampilkan.

**Contoh:**
```javascript
closeCustomAlert();
```

## Tips Implementasi

1. **Untuk alert biasa**: Ganti `alert('pesan')` dengan `showCustomAlert('type', 'Judul', 'pesan')`

2. **Untuk confirm**: Ganti struktur:
   ```javascript
   // LAMA
   if (confirm('Yakin?')) {
       // kode
   }
   
   // BARU
   showConfirmAlert('Judul', 'Yakin?', () => {
       // kode
   });
   ```

3. **Untuk loading**: Gunakan `showLoadingAlert()` dan `closeCustomAlert()`

4. **Auto-close**: Success dan Info alert akan auto-close setelah 3 detik

## Checklist Implementasi

- [ ] Tambahkan custom alert modal HTML ke semua file HTML
- [ ] Tambahkan `<script src="js/custom-alert.js"></script>` ke semua file HTML
- [ ] Update `siswa.js`
- [ ] Update `tahfizh.js`
- [ ] Update `tathbiq.js`
- [ ] Update `doa.js`
- [ ] Update `laporan.js`
- [ ] Update `auth.js`
- [ ] Test semua halaman untuk memastikan custom alert berfungsi

## Contoh Lengkap

Lihat implementasi di `guru.html` dan `guru.js` sebagai referensi.
