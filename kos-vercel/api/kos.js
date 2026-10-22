const { bersihKode } = require('../lib/data');
const { ambilKos } = require('../lib/google');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const kode = bersihKode(req.query.kos);
    if (!kode) return res.status(200).json({ ok: false, pesan: 'Kode kos tidak ditemukan. Scan QR yang ditempel di kos Anda.' });

    const kos = await ambilKos(kode);
    if (!kos) return res.status(200).json({ ok: false, pesan: 'Kode kos tidak dikenali. Scan ulang QR yang ditempel di kos Anda.' });

    res.status(200).json({ ok: true, kode: kos.kode, nama: kos.nama });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: false, pesan: 'Gangguan di server. Coba lagi beberapa saat lagi.' });
  }
};
