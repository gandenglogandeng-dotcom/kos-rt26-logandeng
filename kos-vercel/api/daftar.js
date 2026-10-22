const { bersihKode, validasiPendaftaran, barisPendaftaran, buatId, normHp } = require('../lib/data');
const { ambilKos, ambilSemuaPenghuni, tambahBarisPenghuni } = require('../lib/google');

/**
 * POST { kode, nama, hp, kamar, setuju, ktpFileId, ktpUrl, nikahUrl, kkUrl }
 * File-file sudah diunggah lebih dulu lewat /api/upload; di sini hanya menulis barisnya ke sheet.
 */
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, pesan: 'Metode tidak didukung.' });

  try {
    const body = req.body || {};
    const kode = bersihKode(body.kode);
    const kos = await ambilKos(kode);
    if (!kos) return res.status(200).json({ ok: false, pesan: 'Kode kos tidak dikenali. Scan ulang QR di kos Anda.' });

    const v = validasiPendaftaran(body);
    if (!v.ok) return res.status(200).json(v);

    // Cegah pendaftaran ganda: nomor HP yang sama masih "Aktif" di kos yang sama.
    const rows = await ambilSemuaPenghuni();
    const sudahAda = rows.some(function (r) {
      return String(r[2] || '').trim().toUpperCase() === kode &&
        String(r[8] || '') === 'Aktif' &&
        normHp(r[5]) === v.hp;
    });
    if (sudahAda) {
      return res.status(200).json({ ok: false, pesan: 'Nomor HP ini sudah terdaftar aktif di kos ini. Jika ingin pindah, pilih "Keluar kos".' });
    }

    const id = buatId();
    const baris = barisPendaftaran(
      id, new Date().toISOString(), kode, kos.nama, v.nama, v.hp, v.kamar,
      body.ktpUrl || '', body.nikahUrl || '', body.kkUrl || ''
    );
    await tambahBarisPenghuni(baris);

    res.status(200).json({ ok: true, id: id, namaKos: kos.nama });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: false, pesan: 'Terjadi gangguan. Coba lagi beberapa saat lagi.' });
  }
};
