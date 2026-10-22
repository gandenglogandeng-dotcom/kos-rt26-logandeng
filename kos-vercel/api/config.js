module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    namaDesa: process.env.NAMA_DESA || 'Nama desa belum diatur (isi Environment Variable NAMA_DESA)'
  });
};
