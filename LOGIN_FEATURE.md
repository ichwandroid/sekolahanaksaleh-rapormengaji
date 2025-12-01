# Portal Login Guru - Rapor Mengaji SD Anak Saleh

## Fitur Baru: Autentikasi Guru

### Deskripsi
Sistem sekarang memiliki portal login untuk guru sebelum mengakses dashboard. Guru hanya perlu memasukkan NIY (Nomor Induk Yayasan) untuk login, dan sistem akan otomatis menampilkan hanya data siswa yang diajar oleh guru tersebut.

### Cara Kerja

1. **Halaman Login** (`login.html`)
   - Guru memasukkan NIY
   - Sistem memvalidasi NIY dengan database guru di Firebase
   - Jika valid, data guru disimpan di localStorage dan redirect ke dashboard

2. **Filter Otomatis Siswa**
   - Sistem memfilter siswa berdasarkan field `guru_pai` atau `bilqolam_guru`
   - Hanya siswa yang diajar oleh guru yang login akan ditampilkan
   - Filter berlaku di semua halaman (Dashboard, Laporan, dll)

3. **Session Management**
   - Session tersimpan di localStorage
   - Halaman dashboard dan laporan dilindungi - redirect ke login jika belum login
   - Tombol logout tersedia di header

### File yang Dibuat/Dimodifikasi

#### File Baru:
- `public/login.html` - Halaman portal login guru
- `public/js/login.js` - Logic autentikasi login
- `public/js/auth.js` - Utilities untuk session management dan filtering

#### File yang Dimodifikasi:
- `public/index.html` - Link mengarah ke login.html
- `public/dashboard.html` - Menambahkan auth.js dan Firebase
- `public/laporan.html` - Menambahkan auth.js dan info card guru
- `public/js/dashboard.js` - Menampilkan jumlah siswa yang diajar
- `public/js/laporan.js` - Filter siswa berdasarkan guru yang login
- `public/js/header.js` - Menampilkan info guru dan tombol logout

### Cara Menggunakan

1. **Login**
   - Buka aplikasi, klik "Login Guru" atau "Mulai Sekarang"
   - Masukkan NIY guru (contoh: cari NIY dari database guru)
   - Klik "Masuk ke Dashboard"

2. **Melihat Data Siswa**
   - Setelah login, dashboard menampilkan jumlah siswa yang Anda ajar
   - Halaman Laporan menampilkan info guru dan hanya siswa yang Anda ajar
   - Filter dan pencarian tetap berfungsi normal

3. **Logout**
   - Klik icon logout (sign-out) di header
   - Konfirmasi logout
   - Redirect ke halaman login

### Keamanan

- Session tersimpan di localStorage (client-side)
- Setiap halaman dashboard memeriksa session
- Jika tidak ada session, otomatis redirect ke login
- Data guru divalidasi dengan database Firebase

### Catatan Teknis

**Fungsi Filtering:**
```javascript
filterStudentsByTeacher(students, teacher)
```
Filter siswa dimana:
- `student.guru_pai === teacher.nama_lengkap` ATAU
- `student.bilqolam_guru === teacher.nama_lengkap`

**Session Storage:**
```javascript
localStorage.setItem('currentTeacher', JSON.stringify(teacherData))
```

**Check Auth:**
```javascript
getCurrentTeacher() // Returns teacher object or null
checkAuth() // Redirects to login if not authenticated
```

### Testing

Untuk testing, gunakan NIY dari database guru yang ada. Pastikan:
1. NIY ada di collection `teachers`
2. Field `niy` di database guru terisi
3. Nama guru di database sama dengan field `guru_pai` atau `bilqolam_guru` di siswa

---

**Dibuat:** 1 Desember 2025
**Versi:** 1.0
