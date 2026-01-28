# Moleawiz K6 Performance Test Suite

Suite pengujian performa otomatis untuk **Moleawiz Web & Dashboard** menggunakan [K6](https://k6.io/).

## 🚀 Quick Start (Cara Menjalankan)

Pastikan Anda sudah menginstall **Node.js** dan **K6**.

### 1. Install Dependencies
```bash
npm install
```

### 2. Jalankan Test
Pilih jenis test yang ingin dijalankan. Report HTML akan otomatis terbuka setelah test selesai.

| Command | Jenis Test | Kapan Dijalankan? |
| :--- | :--- | :--- |
| `npm run test:smoke` | **Smoke Test** | Cek kesehatan dasar (Health Check). Wajib jalan sebelum test lain. |
| `npm run test:load` | **Load Test** | Simulasi trafik harian normal (50 User). Rutin mingguan. |
| `npm run test:stress` | **Stress Test** | Mencari titik hancur server (Max Capacity). Sebelum event besar. |
| `npm run test:spike` | **Spike Test** | Simulasi lonjakan tiba-tiba (Flash Sale). |
| `npm run test:scenario` | **Scenario Test** | Simulasi perilaku user yang berbeda-beda (Browsing vs Login). |
| `npm run test:comprehensive` | **Full Test** | Gabungan semua skenario untuk laporan lengkap. |

---

## 📖 Penjelasan Jenis Test

### 1. Smoke Test (`test:smoke`)
*   **Tujuan:** Memastikan sistem **bisa jalan** tanpa error fatal.
*   **Beban:** Sangat Rendah (5 User).
*   **Harapan:** Harus **100% Sukses**. Jika gagal, STOP. Jangan lanjut ke test lain.

### 2. Load Test (`test:load`)
*   **Tujuan:** Mengukur performa server saat melayani jumlah user rata-rata.
*   **Beban:** Menengah (Target 50 User).
*   **Pertanyaan:** *"Apakah server lemot kalau dipakai 50 orang barengan?"*

### 3. Stress Test (`test:stress`)
*   **Tujuan:** Menyiksa server sampai **error** untuk mengetahui batas maksimalnya.
*   **Beban:** Sangat Tinggi (Target 200+ User).
*   **Pertanyaan:** *"Di user ke berapa server mulai error/mati?"*

### 4. Spike Test (`test:spike`)
*   **Tujuan:** Menguji ketahanan terhadap lonjakan trafik instan (misal: Iklan TV/Flash Sale).
*   **Pola:** Tenang -> **BOOM!** (200 user dalam 30 detik) -> Tenang.

---

## 📊 Cara Membaca Report HTML

Setelah test selesai, browser akan membuka report. Fokus pada 3 indikator utama ini:

### 1. P(95) Response Time (Kecepatan)
Waktu loading yang dirasakan oleh 95% user.
*   ✅ **< 2000ms (2s):** Bagus/Normal.
*   ⚠️ **2s - 5s:** Agak lambat, perlu optimasi.
*   ❌ **> 5000ms (5s):** Server overload/sangat lambat.

### 2. Request Failure Rate (Error)
Persentase request yang gagal (Error 500/Timeout).
*   ✅ **0% - 1%:** Sehat.
*   ⚠️ **1% - 5%:** Warning (Cek log server).
*   ❌ **> 5%:** Critical (Server tidak kuat).

### 3. Checks (Validasi)
Validasi logika bisnis (misal: "Login Sukses", "Halaman tidak blank").
*   Pastikan semua bar berwarna **Hijau**.

---

## 🛠 Troubleshooting

**Q: Report HTML tidak muncul otomatis?**
A: Coba jalankan perintah manual: `npm run report:load` (sesuaikan dengan jenis testnya).

**Q: Muncul error "Thresholds crossed"?**
A: Itu artinya performa server di bawah standar yang ditetapkan. Cek report HTML untuk detailnya.

**Q: Test gagal terus (banyak error)?**
A:
1. Cek koneksi internet Anda.
2. Pastikan server staging sedang menyala.
3. Cek apakah kredensial login (email/password) di script masih valid.

---

## 📂 Struktur Folder
*   `tests/`: Berisi script test (load, stress, smoke, dll).
*   `reports/`: Hasil generate report (HTML & JSON).
*   `utils/`: Script pendukung (Custom HTML Reporter).

---
*Dibuat oleh: Hafizh - QA*
