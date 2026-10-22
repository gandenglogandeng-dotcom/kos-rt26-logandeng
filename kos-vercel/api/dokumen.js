const { idDariLink } = require('../lib/data');
const { ambilSemuaPenghuni, unduhFile } = require('../lib/google');

const KOLOM_JENIS = { ktp: 7, nikah: 10, kk: 11 };
const LABEL = { ktp: 'KTP', nikah: 'Buku Nikah', kk: 'KK' };

function cekToken(req) {
  const benar = String(process.env.RT_TOKEN || '').trim();
  const dikirim = String((req.query && req.query.k) || '').trim();
  return !!benar && dikirim === benar;
}

function halamanPesan(res, status, judul) {
  res.status(status).setHeader('Content-Type', 'text/plain; charset=utf-8').send(judul);
}

/** GET ?k=TOKEN&id=ID_PENGHUNI&jenis=ktp|nikah|kk — mengirim BYTES file langsung (bukan JSON/base64),
 *  supaya bisa dipakai langsung sebagai src="" dari <img> atau <iframe> di dashboard Pak RT. */
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!cekToken(req)) return halamanPesan(res, 403, 'Link tidak valid.');

    const jenis = req.query.jenis;
    const kolom = KOLOM_JENIS[jenis];
    if (kolom === undefined) return halamanPesan(res, 400, 'Jenis dokumen tidak dikenali.');

    const id = String(req.query.id || '');
    const rows = await ambilSemuaPenghuni();
    const baris = rows.find(function (r) { return String(r[0]) === id; });
    if (!baris) return halamanPesan(res, 404, 'Data tidak ditemukan.');

    const fileId = idDariLink(baris[kolom]);
    if (!fileId) return halamanPesan(res, 404, 'File ' + LABEL[jenis] + ' tidak ditemukan.');

    let file;
    try {
      file = await unduhFile(fileId);
    } catch (err) {
      if (err.message === 'TRASHED') return halamanPesan(res, 410, 'File ' + LABEL[jenis] + ' ini sudah dihapus.');
      throw err;
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', 'inline; filename="' + file.nama.replace(/"/g, '') + '"');
    res.status(200).send(file.buffer);
  } catch (err) {
    console.error(err);
    halamanPesan(res, 502, 'Gagal memuat dokumen. Coba lagi.');
  }
};
