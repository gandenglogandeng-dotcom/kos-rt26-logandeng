const { bersihKode, hpValid, normHp } = require('../lib/data');
const { keluarkanPenghuni } = require('../lib/google');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, pesan: 'Metode tidak didukung.' });

  try {
    const body = req.body || {};
    const kode = bersihKode(body.kode);
    if (!hpValid(body.hp)) return res.status(200).json({ ok: false, pesan: 'Nomor HP tidak valid.' });
    if (!body.id) return res.status(200).json({ ok: false, pesan: 'Data tidak lengkap.' });

    const berhasil = await keluarkanPenghuni(String(body.id), kode, normHp(body.hp));
    if (!berhasil) return res.status(200).json({ ok: false, pesan: 'Data tidak ditemukan atau sudah tercatat keluar.' });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: false, pesan: 'Terjadi gangguan. Coba lagi beberapa saat lagi.' });
  }
};
