# Panduan Upload CSV Saran GPAI

## Fitur Baru
Fitur upload CSV untuk mengisi saran GPAI secara massal telah ditambahkan ke halaman Laporan.

## Cara Menggunakan

### 1. Download Template CSV
1. Buka halaman **Laporan**
2. Klik tombol **"Download Template"** (hijau)
3. File CSV akan otomatis terdownload dengan data siswa yang sudah ada
4. Template akan berisi kolom:
   - **NIS**: Nomor Induk Siswa (jangan diubah)
   - **Nama**: Nama siswa (hanya referensi)
   - **Kelas**: Kelas siswa (hanya referensi)
   - **Saran_GPAI**: Kolom yang perlu diisi

### 2. Isi Template CSV
1. Buka file CSV dengan Excel, Google Sheets, atau text editor
2. Isi kolom **Saran_GPAI** untuk setiap siswa
3. **PENTING**: Jangan ubah kolom NIS, Nama, dan Kelas
4. Jika ada koma dalam saran, gunakan titik koma (;) sebagai gantinya
5. Simpan file dalam format CSV

### 3. Upload File CSV
1. Kembali ke halaman **Laporan**
2. Klik tombol **"Upload CSV Saran GPAI"** (biru)
3. Pilih file CSV yang sudah diisi
4. Tunggu proses upload selesai
5. Sistem akan menampilkan hasil:
   - Jumlah siswa yang berhasil diupdate
   - Jumlah siswa yang gagal (jika ada)
   - Detail error (jika ada)

## Keamanan Data
✅ **Saran GPQ AMAN**: Fitur ini **HANYA** mengupdate field `saran_guru_pai`
✅ **Tidak Menghapus Saran GPQ**: Field `saran_guru_gpq` tidak akan tersentuh sama sekali
✅ **Update Individual**: Setiap siswa diupdate berdasarkan NIS yang unik

## Format CSV
```csv
NIS,Nama,Kelas,Saran_GPAI
12345,Ahmad Fauzi,1A,Ananda sudah baik dalam membaca Al-Quran
12346,Siti Nurhaliza,1A,Perlu lebih banyak latihan dalam tajwid
```

## Troubleshooting

### File CSV tidak valid
- Pastikan file berformat `.csv`
- Pastikan ada kolom `NIS` dan `Saran_GPAI` (atau `Saran`)
- Pastikan minimal ada 1 baris data (selain header)

### NIS tidak ditemukan
- Pastikan NIS sesuai dengan data di database
- Jangan mengubah kolom NIS dari template

### Saran tidak tersimpan
- Pastikan tidak ada karakter khusus yang aneh
- Jika ada koma, gunakan titik koma (;)
- Pastikan koneksi internet stabil

## Catatan
- Template yang didownload sudah berisi saran GPAI yang ada (jika sudah pernah diisi)
- Anda bisa mengedit saran yang sudah ada melalui CSV
- Upload CSV akan **menimpa** saran GPAI yang lama dengan yang baru
- Saran GPQ tetap aman dan tidak akan berubah
