# UNSGuessr — Game Geoguessr Asli Universitas Sebelas Maret (UNS)

Game tebak lokasi kampus Universitas Sebelas Maret (UNS) ala Geoguessr menggunakan **Google Street View resmi & gratis** di seluruh kampus UNS:
- **Kampus Utama Kentingan** (Boulevard UNS, Rektorat dr. Prakosa, Danau UNS, Masjid Nurul Huda, GOR, Perpustakaan, UNS Tower, Stadion, dan fakultas: FT, FK, FMIPA, FEB, FISIP, FH, FP, FIB, FKIP)
- **Kampus Manahan (FKOR)** (Jl. Menteri Supeno)
- **Kampus Kleco (FKIP II)** (Jl. Slamet Riyadi No. 449)
- **Kampus Mesen (Sekolah Vokasi)** (Jl. Jend. Urip Sumoharjo)
- **Rumah Sakit UNS (Pabelan Kartasura)** (Jl. Ahmad Yani)

---

## Cara Menjalankan Aplikasi (Port 19981)

Aplikasi telah dikonfigurasi untuk berjalan di **`http://localhost:19981`**:

### 1. Menjalankan via Docker & Docker Compose (Rekomendasi)

```bash
docker compose up -d
```
Akses di browser: **`http://localhost:19981`**

Untuk mematikan container:
```bash
docker compose down
```

---

### 2. Menjalankan via `npm start`

```bash
npm install
npm run build
npm start
```
Akses di browser: **`http://localhost:19981`**

---

### 3. Menjalankan sebagai Linux System Service (systemd)

```bash
sudo cp -r . /opt/unsguessr
cd /opt/unsguessr
sudo npm install && sudo npm run build
sudo cp unsguessr.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now unsguessr
```
Service akan aktif di `http://localhost:19981`.

---

### 4. Menjalankan via PM2

```bash
npm run build
pm2 start ecosystem.config.js
```

---

## Fitur Utama

- **Google Street View Asli & Gratis**: Menggunakan citra panorama 360° asli Google Street View resmi di titik-titik jalan kampus UNS dengan kebebasan rotasi 360°, zoom, dan panah navigasi jalan untuk berjalan mencari petunjuk.
- **Peta Interaktif Leaflet**: Minimap tebakan di sudut kanan bawah dengan layer Satelit (Esri World Imagery) dan Peta Jalan (OpenStreetMap), lengkap dengan tombol Quick-Jump kampus.
- **Formula Skoring Presisi Skala Kampus**: Jarak geodesi dihitung dengan formula Haversine (maksimal 5.000 poin per ronde, total 25.000 poin untuk 5 ronde).
- **Efek Suara Sintetis (Web Audio API)**: Efek suara klik pin, submit tebakan, denting poin, dan perayaan kemenangan.
- **Papan Skor & Riwayat**: Gelar peringkat mahasiswa UNS dan penyimpanan rekor di `localStorage`.
