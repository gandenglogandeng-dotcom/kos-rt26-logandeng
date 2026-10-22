const { keObjekPenghuni, formatTanggal } = require('../lib/data');
const { ambilSemuaPenghuni, ambilSemuaKos } = require('../lib/google');

function cekToken(req) {
  const benar = String(process.env.RT_TOKEN || '').trim();
  const dikirim = String((req.query && req.query.k) || '').trim();
  if (!benar) return { ok: false, pesan: 'RT_TOKEN belum diatur di Environment Variable Vercel.' };
  if (!dikirim || dikirim !== benar) return { ok: false, pesan: 'Link tidak valid. Minta link terbaru kepada admin.' };
  return { ok: true };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const cek = cekToken(req);
    if (!cek.ok) return res.status(200).json(cek);

    const [barisPenghuni, kosMentah] = await Promise.all([ambilSemuaPenghuni(), ambilSemuaKos()]);

    const penghuni = barisPenghuni.filter(function (r) { return r[0]; }).map(keObjekPenghuni);
    const aktifPerKos = {};
    penghuni.forEach(function (p) {
      if (p.status === 'Aktif') aktifPerKos[p.kode] = (aktifPerKos[p.kode] || 0) + 1;
    });

    const kos = kosMentah.map(function (k) {
      return {
        kode: k.kode, nama: k.nama, pengelola: k.pengelola, wa: k.wa, alamat: k.alamat,
        kamar: k.kamar, aktif: aktifPerKos[k.kode] || 0
      };
    });

    res.status(200).json({ ok: true, penghuni: penghuni, kos: kos, diperbarui: formatTanggal(new Date().toISOString()) });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: false, pesan: 'Gangguan di server. Coba lagi beberapa saat lagi.' });
  }
};
