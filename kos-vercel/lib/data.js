/**
 * Logika murni (tanpa panggilan ke Google API) untuk sistem pendataan kos.
 * Dipisah dari lib/google.js supaya bisa diuji otomatis tanpa kredensial.
 */

const TZ = 'Asia/Jakarta';
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const TIPE_BOLEH = ['application/pdf', 'image/jpeg', 'image/png'];
const MAKS_BYTE = 2 * 1024 * 1024; // 2 MB per file — dikecilkan dari versi Apps Script (3 MB) karena
                                    // batas ukuran body request di Vercel Serverless Function (~4.5 MB).
                                    // Tiap dokumen diunggah lewat request TERPISAH, jadi aman asal per-file ≤ 2 MB.

/* Urutan kolom Data_Penghuni (0-based). Sama seperti versi Apps Script, supaya data lama kompatibel. */
const KOLOM = {
  ID: 0, WAKTU: 1, KODE: 2, NAMA_KOS: 3, NAMA: 4, HP: 5, KAMAR: 6, KTP: 7, STATUS: 8, KELUAR: 9,
  BUKU_NIKAH: 10, KK: 11
};

function bersihKode(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 20);
}

function normHp(hp) {
  let s = String(hp || '').replace(/[^0-9+]/g, '');
  if (s.indexOf('+62') === 0) s = '0' + s.slice(3);
  else if (s.indexOf('62') === 0) s = '0' + s.slice(2);
  else if (s.charAt(0) === '8') s = '0' + s;
  return s;
}

function hpValid(hp) {
  return /^08\d{8,12}$/.test(normHp(hp));
}

/* Mencegah isi sel dibaca sebagai rumus oleh Google Sheets (=, +, -, @ di awal teks) */
function aman(s) {
  return String(s == null ? '' : s).replace(/^[=+\-@\s]+/, '');
}

function samarkan(nama) {
  return String(nama).split(' ').map(function (w) { return w.slice(0, 2) + '***'; }).join(' ');
}

function formatTanggal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const opt = { timeZone: TZ };
  const tgl = new Intl.DateTimeFormat('en-GB', Object.assign({ day: 'numeric', month: 'numeric', year: 'numeric' }, opt)).format(d);
  const jam = new Intl.DateTimeFormat('en-GB', Object.assign({ hour: '2-digit', minute: '2-digit', hour12: false }, opt)).format(d);
  const bagian = tgl.split('/');
  const tg = bagian[0], bl = bagian[1], th = bagian[2];
  return tg + ' ' + BULAN[Number(bl) - 1] + ' ' + th + ', ' + jam;
}

/** Validasi data pendaftaran. Mengembalikan {ok:true,...} atau {ok:false, pesan}. Tidak menyentuh jaringan. */
function validasiPendaftaran(data) {
  const nama = aman(String(data.nama || '').trim().replace(/\s+/g, ' '));
  if (nama.length < 3 || nama.length > 80) return { ok: false, pesan: 'Nama lengkap harus 3-80 karakter.' };

  if (!hpValid(data.hp)) return { ok: false, pesan: 'Nomor HP tidak valid. Contoh: 081234567890' };

  if (!data.setuju) return { ok: false, pesan: 'Centang pernyataan persetujuan terlebih dulu.' };

  if (!data.ktpFileId) return { ok: false, pesan: 'File KTP belum berhasil diunggah.' };

  return { ok: true, nama: nama, hp: normHp(data.hp), kamar: aman(String(data.kamar || '').trim()).slice(0, 20) };
}

/** Validasi satu file sebelum diunggah (dipakai endpoint /api/upload). */
function validasiFile(tipe, ukuranByte, labelDok) {
  if (TIPE_BOLEH.indexOf(tipe) < 0) return { ok: false, pesan: 'Format file ' + labelDok + ' harus PDF, JPG, atau PNG.' };
  if (ukuranByte > MAKS_BYTE) return { ok: false, pesan: 'Ukuran file ' + labelDok + ' terlalu besar (maksimal ' + (MAKS_BYTE / 1024 / 1024) + ' MB).' };
  return { ok: true };
}

/** Membangun satu baris untuk ditulis ke sheet Data_Penghuni (urutan harus sama persis dengan KOLOM). */
function barisPendaftaran(id, waktuIso, kode, namaKos, nama, hp, kamar, ktpLink, nikahLink, kkLink) {
  return [id, waktuIso, kode, namaKos, nama, hp, kamar, ktpLink || '', 'Aktif', '', nikahLink || '', kkLink || ''];
}

function buatId() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: '2-digit', month: '2-digit', day: '2-digit' })
    .formatToParts(now).reduce(function (o, x) { o[x.type] = x.value; return o; }, {});
  const acak = Math.random().toString(16).slice(2, 6).toUpperCase();
  return 'P' + parts.year + parts.month + parts.day + '-' + acak;
}

/** Mengubah baris mentah sheet jadi objek penghuni untuk dashboard RT. Aman walau kolom K/L belum ada (data lama). */
function keObjekPenghuni(row) {
  const waktuMasuk = row[KOLOM.WAKTU] || '';
  const waktuKeluar = row[KOLOM.KELUAR] || '';
  return {
    id: String(row[KOLOM.ID] || ''),
    masuk: formatTanggal(waktuMasuk),
    masukMs: waktuMasuk ? new Date(waktuMasuk).getTime() : 0,
    kode: String(row[KOLOM.KODE] || '').trim().toUpperCase(),
    kos: String(row[KOLOM.NAMA_KOS] || ''),
    nama: String(row[KOLOM.NAMA] || ''),
    hp: normHp(row[KOLOM.HP]),
    kamar: String(row[KOLOM.KAMAR] || ''),
    status: String(row[KOLOM.STATUS] || ''),
    keluar: formatTanggal(waktuKeluar),
    keluarMs: waktuKeluar ? new Date(waktuKeluar).getTime() : 0,
    adaKtp: !!row[KOLOM.KTP],
    adaBukuNikah: !!row[KOLOM.BUKU_NIKAH],
    adaKK: !!row[KOLOM.KK]
  };
}

/** Mengambil ID file Drive dari sebuah link (format drive.google.com/file/d/ID/view atau sejenis). */
function idDariLink(link) {
  const m = String(link || '').match(/[-\w]{25,}/);
  return m ? m[0] : null;
}

module.exports = {
  TZ, TIPE_BOLEH, MAKS_BYTE, KOLOM,
  bersihKode, normHp, hpValid, aman, samarkan, formatTanggal,
  validasiPendaftaran, validasiFile, barisPendaftaran, buatId, keObjekPenghuni, idDariLink
};
