const { bersihKode, hpValid, normHp, samarkan } = require('../lib/data');
const { ambilKos, ambilSemuaPenghuni } = require('../lib/google');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, pesan: 'Metode tidak didukung.' });

  try {
    const body = req.body || {};
    const kode = bersihKode(body.kode);
    if (!(await ambilKos(kode))) return res.status(200).json({ ok: false, pesan: 'Kode kos tidak dikenali.' });
    if (!hpValid(body.hp)) return res.status(200).json({ ok: false, pesan: 'Nomor HP tidak valid.' });

    const hp = normHp(body.hp);
    const rows = await ambilSemuaPenghuni();
    const hasil = rows
      .filter(function (r) {
        return String(r[2] || '').trim().toUpperCase() === kode &&
          String(r[8] || '') === 'Aktif' &&
          normHp(r[5]) === hp;
      })
      .map(function (r) { return { id: String(r[0]), nama: samarkan(String(r[4] || '')), kamar: String(r[6] || '') }; });

    res.status(200).json({ ok: true, hasil: hasil });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: false, pesan: 'Gangguan di server. Coba lagi beberapa saat lagi.' });
  }
};
