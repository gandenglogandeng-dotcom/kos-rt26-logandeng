# Panduan kloning — Sistem Pendataan Kos (GitHub + Vercel)

Panduan ini sudah diperbarui berdasarkan hasil pemasangan nyata di **RT 21**
yang sudah berhasil berjalan. Ikuti urutannya persis — beberapa langkah di sini
memperbaiki jebakan yang sempat terjadi saat pemasangan pertama.

Spreadsheet tetap jadi database. Satu paket ini dipasang **satu kali per RT**
(satu project GitHub disalin + satu project Vercel + satu Spreadsheet = satu RT).

---

## Bagian A — Siapkan akses Google (±20 menit per RT)

### A.1 Buat/pilih project Google Cloud

Boleh pakai **satu project Google Cloud untuk semua RT** (tidak perlu bikin baru
tiap RT) — yang beda nanti cukup Spreadsheet, folder Drive, dan deployment
Vercel-nya saja. Kalau sudah pernah bikin project sebelumnya (misal `My First
Project` atau `causal-flame-xxxxx`), boleh dipakai lagi, tidak perlu bikin baru.

1. **console.cloud.google.com**, pastikan **Google Sheets API** dan
   **Google Drive API** sudah **Enabled** (cek di **APIs & Services > Enabled
   APIs & services**). Kalau belum, cari namanya di kotak pencarian atas,
   buka, klik **Enable**.

### A.2 Service Account (untuk Sheets saja) — boleh satu untuk semua RT

Kalau sudah pernah buat Service Account di RT sebelumnya, **boleh dipakai
ulang** untuk RT baru — tidak perlu bikin baru tiap RT. Kalau belum pernah:

1. **IAM & Admin > Service Accounts > + Create Service Account**.
2. Nama bebas, misalnya `kos-sheets`. **Create and Continue > Done**
   (lewati bagian role/izin, tidak diperlukan).
3. Klik service account itu > tab **Keys** > **Add Key > Create new key** >
   pilih **JSON** > **Create**. File `.json` otomatis terunduh — simpan baik-baik.
4. Buka file itu dengan Notepad, catat:
   - `client_email` → ini **sama untuk semua RT** kalau Service Account dipakai ulang
   - `private_key` → ini juga **sama untuk semua RT**

### A.3 OAuth Client untuk Drive — boleh satu untuk semua RT

**PENTING:** harus jenis **Web application**, bukan "Desktop app" (jenis Desktop
app akan gagal dipakai di langkah A.4 dengan error `redirect_uri_mismatch`).

Kalau sudah pernah dibuat di RT sebelumnya, **boleh dipakai ulang**, lewati ke A.4.

1. **APIs & Services > Credentials > + Create Credentials > OAuth client ID**.
2. Kalau diminta mengatur **OAuth consent screen** dulu: pilih **External**,
   isi nama aplikasi bebas, email Anda, **Save and Continue** terus sampai selesai.
3. **Application type: Web application**.
4. Nama bebas, misalnya `Kos Vercel Web`.
5. Di **Authorized redirect URIs**, klik **+ Add URI**, **ketik manual** (jangan
   paste dari sumber lain yang mungkin menyisipkan spasi tak terlihat):
   ```
   https://developers.google.com/oauthplayground
   ```
6. **Create**. Catat **Client ID** dan **Client Secret** yang muncul — ini
   **sama untuk semua RT**.

### A.4 Refresh Token — ini yang BEDA tiap RT (akun Drive pemilik dokumen beda-beda boleh, atau sama juga boleh)

Refresh Token ini mewakili **akun Google yang jadi pemilik folder dokumen**.
Boleh pakai akun yang sama untuk semua RT (semua dokumen tersimpan di satu
akun), atau beda akun per RT (lebih rapi tapi lebih ribet) — bebas, pilih yang
Anda mau kelola.

1. **developers.google.com/oauthplayground**.
2. Klik ⚙️ (gear, pojok kanan atas) > centang **"Use your own OAuth credentials"**.
3. Tempel **Client ID** dan **Client Secret** dari A.3.
4. Di kolom kiri, kotak paling bawah **"Input your own scopes"**, ketik:
   ```
   https://www.googleapis.com/auth/drive
   ```
   **Authorize APIs**.
5. Login dengan akun Google yang akan memiliki folder dokumen RT ini. **Allow**.
6. Kembali ke Playground, klik **Exchange authorization code for tokens**.
7. Salin **Refresh token** yang muncul.

### A.5 Buat Spreadsheet untuk RT ini

Kalau belum punya: buat Spreadsheet baru, buat 2 sheet: `Daftar_Kos` (kolom
A-F: Kode Kos, Nama Kos, Nama Pengelola, No. WA, Alamat, Jumlah Kamar) dan
`Data_Penghuni` (biarkan kosong, nanti terisi otomatis oleh sistem, format
kolom lihat bagian "Struktur data" di bawah).

1. **Share** Spreadsheet ini ke `client_email` dari A.2, akses **Editor**.
2. Catat **Spreadsheet ID** dari alamat browser:
   `https://docs.google.com/spreadsheets/d/INI_ID_NYA/edit`

### A.6 Buat folder Drive untuk dokumen RT ini

1. Buka Drive **dengan akun yang sama** yang dipakai login di langkah A.4.
2. Buat folder baru, misalnya `KTP Kos RT 22`.
3. Catat **Folder ID** dari alamat browser:
   `https://drive.google.com/drive/folders/INI_ID_NYA`
4. **Tidak perlu dibagikan ke siapa pun** — akun pemilik folder ini sendiri
   yang akan dipakai sistem untuk mengunggah file (lewat Refresh Token A.4).

Catatan yang harus sudah ada sebelum lanjut Bagian B:
`client_email`, `private_key`, `Client ID`, `Client Secret`, `Refresh Token`,
`Spreadsheet ID`, `Folder ID`.

---

## Bagian B — Salin kode ke GitHub (repo baru per RT)

### B.1 Unduh & ekstrak

Unduh `kos-vercel.zip`, **ekstrak dulu** (klik kanan > Extract All). Jangan
upload file ZIP-nya langsung ke GitHub.

### B.2 Buat repository baru

**github.com > + > New repository**. Nama misalnya `kos-rt22-logandeng`.
Pilih **Private**. **Create repository**.

### B.3 Upload dengan cara yang benar (hindari folder bertingkat)

Ini bagian yang paling sering salah. Lakukan persis urutan ini:

1. Buka folder hasil ekstrak di File Explorer. **Masuk ke dalamnya** sampai
   Anda melihat langsung isinya: `api`, `lib`, `public`, `package.json`,
   `vercel.json`, dst — sejajar, bukan di dalam satu folder lagi.
2. Di repository GitHub yang baru, klik **uploading an existing file**.
3. Di File Explorer, **blok semua isi folder itu** (klik satu file, **Ctrl+A**),
   **bukan folder pembungkusnya**.
4. Seret semua yang terblok ke kotak upload GitHub. **Commit changes**.

**Cara mengecek sudah benar:** buka halaman utama repository. Yang harus
terlihat **langsung** (tanpa masuk folder apa pun dulu) adalah `api/`, `lib/`,
`public/`, `package.json`, `vercel.json`. Kalau yang terlihat malah satu
folder pembungkus (misalnya `kos-vercel/`), berarti salah — hapus isinya,
ulangi langkah di atas.

---

## Bagian C — Deploy ke Vercel

### C.1 Import

**vercel.com/new > Import Git Repository**, pilih repo RT ini, **Import**.

### C.2 Root Directory

Kalau struktur di Bagian B.3 sudah benar (file langsung terlihat di root repo),
**Root Directory dibiarkan kosong/default** — tidak perlu diisi apa-apa.

(Kalau ternyata masih ada folder pembungkus karena keburu ter-upload salah,
isi Root Directory dengan nama folder pembungkus itu, di **Settings > General
> Root Directory**, lalu Redeploy — tapi lebih baik diperbaiki di GitHub-nya
langsung seperti B.3.)

### C.3 Environment Variables

Isi sebelum klik **Deploy** (atau sesudahnya lewat **Settings > Environment
Variables**, lalu wajib **Redeploy**):

| Key | Isi dengan |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` dari A.2 |
| `GOOGLE_PRIVATE_KEY` | `private_key` dari A.2 (apa adanya, termasuk `\n`) |
| `SPREADSHEET_ID` | dari A.5 |
| `GOOGLE_OAUTH_CLIENT_ID` | dari A.3 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | dari A.3 |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | dari A.4 |
| `DRIVE_FOLDER_ID` | dari A.6 |
| `RT_TOKEN` | buat baru, acak, minimal 24 karakter (lihat catatan di bawah) |
| `NAMA_DESA` | contoh: `Desa Logandeng RT 22` |

**Tentang `RT_TOKEN`:** ini kunci rahasia dashboard Pak RT, **wajib beda untuk
setiap RT**. Jangan dibuat kata yang mudah ditebak — ini kunci ke semua KTP,
Buku Nikah, dan KK warga. Minta dibuatkan token acak kalau belum ada.

### C.4 Deploy

Klik **Deploy**, tunggu sampai **Ready**. Catat alamatnya, contoh:
```
https://kos-rt22-logandeng.vercel.app
```

---

## Bagian D — Hubungkan ke Spreadsheet (biar link ter-generate otomatis)

Buka Spreadsheet RT ini, buat sheet baru bernama **`Pengaturan`**, isi:

| | A | B |
|---|---|---|
| 1 | Alamat Vercel | *(tempel alamat dari C.4, tanpa `/` di akhir)* |
| 2 | Token Pak RT | *(tempel nilai `RT_TOKEN` yang sama persis dengan C.3)* |
| 3 | LINK UNTUK PAK RT | *(rumus, lihat di bawah)* |

Rumus untuk **B3**:
```
=IF(OR($B$1="",$B$2=""),"",REGEXREPLACE($B$1,"/$","")&"/rt.html?k="&$B$2)
```

Di sheet **`Daftar_Kos`**, tambah judul kolom **G1**: `Link Form (untuk QR)`
dan **H1**: `Link Poster (untuk dicetak)`, lalu isi baris pertama datanya:

**G2:**
```
=IF(OR($A2="",Pengaturan!$B$1=""),"",REGEXREPLACE(Pengaturan!$B$1,"/$","")&"/?kos="&$A2)
```

**H2:**
```
=IF(OR($A2="",Pengaturan!$B$1=""),"",REGEXREPLACE(Pengaturan!$B$1,"/$","")&"/poster.html?kos="&$A2)
```

Blok **G2:H2**, tarik ke bawah (atau copy-paste) sepanjang jumlah baris kos Anda.

---

## Bagian E — Uji coba sebelum dipakai sungguhan

1. Buka link kolom **H** (poster) untuk satu kos — pastikan QR muncul, tidak
   ada pesan merah.
2. Buka link kolom **G** (atau scan QR dari poster) — coba daftar dengan data
   tes, termasuk unggah file KTP.
3. Buka link **Pengaturan!B3** (dashboard Pak RT) — pastikan data tes muncul,
   coba tombol **Lihat KTP**.
4. Hapus baris data tes di `Data_Penghuni`, hapus file tesnya di folder Drive.
5. **Coba khusus di HP yang pernah gagal di sistem lama** — ini pengujian
   paling penting.

---

## Struktur kolom `Data_Penghuni` (dibuat otomatis oleh sistem, untuk referensi)

```
A: ID            B: Waktu Daftar     C: Kode Kos        D: Nama Kos
E: Nama Lengkap  F: No. HP           G: No. Kamar       H: Link KTP
I: Status        J: Waktu Keluar     K: Link Buku Nikah L: Link KK
```

Tidak perlu diisi manual — baris baru muncul otomatis setiap ada pendaftaran.

---

## Kesalahan yang sudah pernah terjadi (supaya tidak terulang)

| Gejala | Penyebab | Solusi |
|---|---|---|
| GitHub: isi repo cuma 1 folder pembungkus | Menyeret folder itu sendiri, bukan isinya | Lihat Bagian B.3 |
| Vercel: "This page doesn't exist" di `/` | Memang sengaja kosong | Buka dengan `?kos=KODE` di belakangnya |
| Vercel: "Root Directory ... does not exist" | Nama folder di Settings tidak cocok dengan yang di GitHub | Cocokkan persis, atau kosongkan kalau struktur sudah rapi |
| `GaxiosError: storageQuotaExceeded` | Pakai Service Account untuk upload file | Pakai OAuth (Bagian A.3-A.4), bukan Service Account, untuk Drive |
| `redirect_uri_mismatch` di OAuth Playground | OAuth Client jenis "Desktop app" | Buat ulang jenis **Web application** + redirect URI (A.3) |
| `Invalid Redirect: cannot contain whitespace` | Ada spasi tak terlihat ikut ter-paste di redirect URI | Ketik manual, jangan paste dari sumber lain |
| `File not found` saat upload | `DRIVE_FOLDER_ID` salah (sering ikut ke-copy `?usp=...` di belakangnya) | Ambil ID murni antara `/folders/` dan tanda `?` |
