# 🎨 SeragamKu Studio - Aplikasi Pemesanan & Kustomisasi Desain Seragam

Aplikasi web modern untuk industri konveksi dan apparel seragam di Indonesia. Memudahkan pelanggan maupun tim internal untuk mendesain seragam secara interaktif (mengubah warna bagian, menambahkan logo sablon/bordir), melihat portofolio hasil produksi, dan langsung melakukan pemesanan dengan kalkulator harga otomatis serta direct WhatsApp checkout.

---

## 🚀 Fitur Unggulan

### 1. 🎨 Studio Desain 2D (Interactive Mockup Canvas)
- **6 Tipe Seragam Siap Pakai:**
  - **Kaos Oblong / Sablon** (Tampak Depan & Belakang)
  - **Kemeja PDH / PDL / Tactical** (Lidah pundak/epaulet, saku tempel flap berkancing, Tampak Depan & Belakang)
  - **Kemeja Kantor / Kasual** (Tampak Depan & Belakang)
  - **Rompi Lapangan / Rompi Safety K3** (Dilengkapi saku multifungsi & pita scotlite reflektif)
  - **Polo Shirt (Wangki)** (Kerah rib & manset lengan kontras)
  - **Jaket Bomber / Parka** (Rib elastis pinggang & lengan)
- **Kustomisasi Warna Realtime:**
  - Ganti warna per bagian: *Badan Utama, Kerah / Leher, Lengan, Saku Depan, Variasi List / Scotlite*.
  - Palet warna standar kain konveksi (Navy, Hitam, Khaki Pemda, Maroon, Hijau Army, Oranye K3, dll.) + Color Picker Hex bebas.
- **Upload Logo & Tambah Teks:**
  - Upload file logo (PNG / JPG / SVG) dari perangkat.
  - Preset logo cepat: Bendera Merah Putih & Badge K3 Keselamatan.
  - Tambah teks nama/komunitas dengan efek **Bordir Timbul** atau **Sablon DTF**.
  - Drag & drop untuk menggeser posisi logo, tombol rotasi, dan perbesar/perkecil.
  - Preset posisi otomatis: *Dada Kiri (Logo), Dada Kanan (Nama), Punggung Tengah (Besar), Lengan Kiri (Bendera), dll.*
- **Ekspor Desain:**
  - Unduh hasil pratinjau mockup resolusi tinggi (.PNG).
  - Sekali klik *"Lanjut ke Form Pemesanan"* untuk memindahkan konfigurasi warna dan gambar ke formulir order.

---

### 2. 📝 Formulir Pemesanan & Kalkulator Biaya (Live Pricing)
- **Pilihan Bahan Kain Resmi:**
  - *PDH/PDL:* American Drill 1919 Original, Japan Drill (Nagata/Verlando), Ripstop Kotak.
  - *Kemeja Kantor:* Taipan Tropical Silk Cotton.
  - *Kaos:* Cotton Combed 30s & 24s Reaktif, Cotton Bamboo Eco-Friendly.
  - *Rompi:* Taslan Waterproof + Furing Jala, American Drill Tebal.
  - *Polo:* Lacoste CVC 24s Pique, Lacoste 100% Cotton.
- **Distribusi Ukuran:**
  - Matriks ukuran: S, M, L, XL, XXL, 3XL, dan Custom.
  - Surcharge otomatis untuk ukuran besar (+Rp 5.000 s/d Rp 15.000).
- **Diskon Grosir Bertingkat:**
  - 24 - 49 pcs: Diskon 5%
  - 50 - 99 pcs: Diskon 8%
  - ≥ 100 pcs: Diskon 12%
- **Metode Checkout:**
  - **Direct WhatsApp Checkout:** Pesan otomatis tersusun rapi dengan rincian ukuran, spesifikasi bahan, detail warna, dan total estimasi harga ke nomor WhatsApp Admin konveksi.
  - **Cetak Surat Perintah Kerja (SPK / Invoice PDF):** Dokumen resmi siap cetak langsung dari browser (`Ctrl + P`) dengan pratinjau mockup visual dan lembar tanda tangan.

---

### 3. 📂 Portofolio & Katalog Inspirasi
- Galeri proyek seragam nyata (BEM Universitas, Perusahaan BUMN, Proyek Tambang K3, dsb.).
- Filter berdasarkan kategori: PDH, Kaos, Rompi, Kemeja, Polo.
- Fitur **"Buka Desain Ini di Canvas"**: Sekali klik langsung memuat kombinasi model & warna seragam portofolio ke Studio Desain untuk diedit ulang!

---

### 4. 📐 Panduan Ukuran (Size Chart Modal)
- Tabel panduan ukuran Pria & Wanita (Lebar Dada, Panjang Baju, Panjang Lengan, Lebar Bahu).
- Petunjuk cara mengukur pakaian yang benar.

---

## 🛠️ Cara Menjalankan Aplikasi

Aplikasi berada di direktori:
```bash
C:\Users\samba\.gemini\antigravity\scratch\seragamku-app
```

### 1. Jalankan Mode Pengembangan (Local Dev Server)
Buka terminal / PowerShell di direktori proyek dan jalankan:
```bash
npm run dev
```
Akses aplikasi melalui browser di: `http://localhost:5173`

### 2. Membangun Versi Produksi (Production Build)
```bash
npm run build
```
Hasil file statis yang siap di-upload ke hosting (Vercel, Netlify, cPanel) berada di folder `dist/`.

---

## ⚙️ Pengaturan & Kustomisasi

- **Mengubah Nomor WhatsApp Admin:**
  Buka file `src/components/OrderForm.tsx` baris `adminWhatsApp = '6281234567890'` dan ganti dengan nomor WhatsApp aktif Anda (awali dengan kode negara tanpa tanda plus, misal `628xxxxxxxx`).
- **Mengubah Harga Bahan Kain:**
  Buka file `src/data/garments.ts` pada array `FABRICS`. Anda dapat menyesuaikan harga dasar (`basePrice`) sesuai harga modal konveksi Anda.
- **Menambah Portofolio Baru:**
  Buka file `src/data/portfolio.ts` dan tambahkan data proyek baru ke array `PORTFOLIO_ITEMS`.
