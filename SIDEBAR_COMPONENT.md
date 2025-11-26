# Sidebar Component Documentation

## Overview
Sidebar telah diubah menjadi komponen yang dapat digunakan kembali (reusable component) menggunakan JavaScript.

## File Structure
```
public/
├── js/
│   └── sidebar.js          # Komponen sidebar yang dapat digunakan kembali
├── dashboard.html          # Menggunakan sidebar component
├── siswa.html             # Menggunakan sidebar component
├── bilqolam.html          # Menggunakan sidebar component
├── doa.html               # Menggunakan sidebar component
└── tathbiq.html           # Menggunakan sidebar component
```

## Cara Kerja

### 1. HTML Structure
Setiap halaman hanya perlu container div:
```html
<!-- Sidebar Container (populated by sidebar.js) -->
<div id="sidebar-container"></div>
```

### 2. JavaScript Include
Tambahkan script sidebar.js sebelum script halaman:
```html
<script src="js/sidebar.js"></script>
<script src="js/dashboard.js"></script>
```

### 3. Automatic Active State
Sidebar otomatis mendeteksi halaman aktif berdasarkan URL dan memberikan styling yang sesuai.

## Keuntungan

✅ **Single Source of Truth**: Hanya 1 file sidebar yang perlu dikelola
✅ **Konsistensi**: Semua halaman menggunakan sidebar yang sama
✅ **Mudah Update**: Perubahan di `sidebar.js` otomatis berlaku di semua halaman
✅ **Auto Active State**: Otomatis highlight menu yang sedang aktif

## Menambah Menu Baru

Edit file `public/js/sidebar.js` dan tambahkan link baru di bagian Navigation:

```javascript
<a href="menu-baru.html" data-page="menu-baru"
    class="nav-link flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors">
    <i class="ph ph-icon-name text-xl"></i>
    <span>Menu Baru</span>
</a>
```

## URL Clean (Tanpa .html)

Firebase Hosting dikonfigurasi untuk menghilangkan ekstensi `.html` dari URL:

### firebase.json
```json
{
  "hosting": {
    "cleanUrls": true,
    "rewrites": [...]
  }
}
```

### Hasil
- ✅ `http://localhost:5000/dashboard` (bukan `/dashboard.html`)
- ✅ `http://localhost:5000/siswa`
- ✅ `http://localhost:5000/bilqolam`
- ✅ `http://localhost:5000/doa`
- ✅ `http://localhost:5000/tathbiq`

## Tooltip

Semua tooltip telah dihapus dari:
- `bilqolam.js`
- `doa.js`
- `tathbiq.js`

Nilai sekarang ditampilkan langsung tanpa hover effect.
