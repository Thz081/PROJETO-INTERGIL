const multer = require('multer');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => cb(null, randomUUID() + path.extname(file.originalname).toLowerCase())
});
const fotos = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif' };
function upload(formatos, megabytes) {
  return multer({ storage, limits: { fileSize: megabytes * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (formatos[ext] === file.mimetype) return cb(null,true);
      cb(Object.assign(new Error('Formato de arquivo não aceito.'), { status: 400 }));
    }
  });
}
async function verificarPDF(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'Selecione um arquivo PDF.' });
  const fs = require('node:fs/promises');
  const arquivo = await fs.open(req.file.path, 'r');
  const inicio = Buffer.alloc(5);
  try { await arquivo.read(inicio,0,5,0); } finally { await arquivo.close(); }
  if (inicio.toString() !== '%PDF-') {
    await fs.unlink(req.file.path);
    return res.status(400).json({ message: 'O arquivo enviado não é um PDF válido.' });
  }
  next();
}
module.exports = {
  verificarPDF,
  uploadLogo: upload(fotos,5),
  uploadGeral: upload({ '.pdf':'application/pdf' },10),
  uploadMomento: upload({ ...fotos, '.mp4':'video/mp4', '.webm':'video/webm' },100)
};
