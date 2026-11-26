const path = require('node:path');
const fs = require('node:fs/promises');

const raiz = process.env.MOMENTOS_DIR || path.join(__dirname, '../../momentos');
const entrada = path.join(raiz, 'entrada');
const saida = path.join(raiz, 'saida');
const MiB = 1024 ** 2;
const limites = { foto: 25 * MiB, video: 480 * MiB };
const formatos = {
  foto: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
  video: ['.mp4', '.mov', '.webm', '.m4v']
};

async function prepararDiretorios() {
  await Promise.all([fs.mkdir(entrada, { recursive: true }), fs.mkdir(saida, { recursive: true })]);
}

module.exports = { raiz, entrada, saida, limites, formatos, MiB, prepararDiretorios };
