const { execFile } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout: pausar } = require('node:timers/promises');
const { promisify } = require('node:util');
const connectDB = require('../config/db');
const Momento = require('../models/momento.model');
const { entrada, saida, MiB, prepararDiretorios } = require('../config/momentos');

const executar = promisify(execFile);
const minutos = 60_000;
const formatos = 'image2,jpeg_pipe,png_pipe,webp_pipe,mov,matroska,webm';
const entradaSegura = ['-protocol_whitelist', 'file', '-format_whitelist', formatos, '-max_alloc', '350000000'];
const traducao = 'Não foi possível processar o arquivo. Confira o formato ou exporte em JPEG ou MP4 e tente novamente.';

function falhar(message) {
  throw Object.assign(new Error(message), { mensagemPublica: message });
}

async function ffmpeg(origem, argumentos, timeout) {
  await executar('ffmpeg', [
    '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-filter_threads', '1', '-threads', '1',
    ...entradaSegura, '-i', origem, '-map_metadata', '-1', '-map_chapters', '-1', ...argumentos
  ], { timeout, killSignal: 'SIGKILL', maxBuffer: 128 * 1024 });
}

async function sondar(origem) {
  const { stdout } = await executar('ffprobe', [
    '-v', 'error', ...entradaSegura, '-show_entries',
    'stream=codec_type,width,height,color_transfer:stream_disposition=attached_pic:format=duration',
    '-of', 'json', origem
  ], { timeout: 20_000, killSignal: 'SIGKILL' });
  const dados = JSON.parse(stdout);
  const imagem = dados.streams?.find(item => item.codec_type === 'video' && !item.disposition?.attached_pic);
  if (!imagem?.width || !imagem?.height || imagem.width * imagem.height > 55_000_000)
    falhar('O arquivo não tem uma imagem válida ou ultrapassa 55 megapixels.');
  return { duracao: Number(dados.format?.duration), hdr: ['smpte2084', 'arib-std-b67'].includes(imagem.color_transfer) };
}

function escala(tamanho) {
  return `scale=w='min(iw,${tamanho})':h='min(ih,${tamanho})':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1`;
}

async function gerar(tipo, original, diretorio) {
  let origem = original;
  if (tipo === 'foto' && /\.hei[cf]$/i.test(original)) {
    await executar('heif-convert', [original, path.join(diretorio, 'heic.jpg')], {
      timeout: 45_000, killSignal: 'SIGKILL'
    });
    const temporarios = await fs.readdir(diretorio);
    const primeiro = temporarios.find(nome => nome === 'heic.jpg') || temporarios.find(nome => /^heic-\d+\.jpg$/.test(nome));
    if (!primeiro) falhar('Não foi possível converter essa foto HEIC.');
    origem = path.join(diretorio, primeiro);
  }
  const { duracao, hdr } = await sondar(origem);
  const video = tipo === 'video';
  if (video && (!Number.isFinite(duracao) || duracao <= 0 || duracao > 900))
    falhar('Envie um vídeo com até 15 minutos.');

  const principal = path.join(diretorio, video ? 'video.mp4' : 'foto.webp');
  if (video) {
    const cores = hdr ? ',zscale=t=linear:npl=100,format=gbrpf32le,tonemap=mobius,zscale=p=bt709:t=bt709:m=bt709:r=tv' : '';
    await ffmpeg(origem, [
      '-map', '0:V:0', '-map', '0:a:0?', '-vf', escala(720) + cores + ',format=yuv420p',
      '-fpsmax', '30', '-threads', '1', '-c:v', 'libx264', '-preset', 'veryfast',
      '-crf', '25', '-maxrate', '1100k', '-bufsize', '1800k', '-c:a', 'aac', '-b:a', '80k',
      '-ac', '2', '-movflags', '+faststart', '-t', '900', '-fs', String(174 * MiB), principal
    ], 35 * minutos);
  } else {
    await ffmpeg(origem, ['-map', '0:V:0', '-frames:v', '1', '-vf', escala(1600),
      '-c:v', 'libwebp', '-quality', '83', principal], minutos);
  }
  const capa = path.join(diretorio, 'capa.webp');
  await ffmpeg(principal, ['-map', '0:V:0', '-frames:v', '1', '-vf', escala(480),
    '-c:v', 'libwebp', '-quality', '72', capa], minutos);
  const { stdout } = await executar('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'json', principal], { timeout: 20_000 });
  const tamanho = (await fs.stat(principal)).size + (await fs.stat(capa)).size;
  const [{ width, height }] = JSON.parse(stdout).streams;
  return { tamanho, largura: width, altura: height, ...(video && { duracao }) };
}

async function proximaMidia() {
  const recuperavel = new Date(Date.now() - 40_000);
  const agora = new Date();
  const processamento = randomUUID();
  const expirado = { estado: 'processando', $or: [{ tocadoEm: { $lt: recuperavel } }, { tocadoEm: { $exists: false } }] };
  const filtro = { $or: [{ estado: 'fila' }, expirado] };
  const doc = await Momento.findOneAndUpdate({ midias: { $elemMatch: filtro } },
    { $set: { 'midias.$.estado': 'processando', 'midias.$.iniciadoEm': agora,
      'midias.$.tocadoEm': agora, 'midias.$.processamento': processamento } },
    { sort: { _id: 1 } }).lean();
  if (!doc) return false;
  const item = doc.midias.find(midia => midia.estado === 'fila' ||
    (midia.estado === 'processando' && (!midia.tocadoEm || midia.tocadoEm < recuperavel)));
  const original = path.join(entrada, item.entrada);
  const destino = path.join(saida, String(item._id));
  const temporario = destino + '-trabalho-' + processamento;
  const sessao = { _id: doc._id, midias: { $elemMatch: { _id: item._id, processamento } } };
  const sinal = setInterval(() => {
    Momento.updateOne(sessao, { $set: { 'midias.$.tocadoEm': new Date() } })
      .catch(falha => console.error('Sinal do processador de Momentos:', falha.name));
  }, 10_000);
  let resultado;
  try {
    await fs.mkdir(temporario);
    resultado = { ...await gerar(doc.tipo, original, temporario), estado: 'pronta' };
    const arquivos = await fs.readdir(temporario);
    await Promise.all(arquivos.filter(nome => nome.startsWith('heic')).map(nome => fs.rm(path.join(temporario, nome))));
    if (!await Momento.exists(sessao)) return true;
    await fs.rm(destino, { recursive: true, force: true });
    await fs.rename(temporario, destino);
  } catch (falha) {
    resultado = { estado: 'falhou', erro: falha.mensagemPublica || traducao, tamanho: 0 };
    console.error('Conversão de Momentos:', item._id, falha.code || falha.name);
  } finally {
    clearInterval(sinal);
    await fs.rm(temporario, { recursive: true, force: true });
  }
  const salvo = await Momento.updateOne(sessao, {
    $set: Object.fromEntries(Object.entries(resultado).map(([chave, valor]) => [`midias.$.${chave}`, valor])),
    $unset: { 'midias.$.entrada': '', 'midias.$.iniciadoEm': '', 'midias.$.processamento': '' }
  });
  if (salvo.modifiedCount) await fs.rm(original, { force: true });
  return true;
}

async function limparEnviosInterrompidos() {
  const prazo = new Date(Date.now() - 24 * 60 * minutos);
  const parado = { estado: 'enviando', tocadoEm: { $lt: prazo } };
  await Momento.updateMany({ midias: { $elemMatch: parado } }, { $pull: { midias: parado } });
  const candidatos = await fs.readdir(entrada);
  for (const nome of candidatos) {
    const arquivo = path.join(entrada, nome);
    const info = await fs.stat(arquivo).catch(falha => {
      if (falha.code !== 'ENOENT') throw falha;
    });
    if (info && info.mtimeMs < prazo.getTime() && !await Momento.exists({ 'midias.entrada': nome }))
      await fs.rm(arquivo, { force: true });
  }
  for (const nome of await fs.readdir(saida)) {
    const partes = /^(?:[a-f0-9]{24})-trabalho-([a-f0-9-]{36})$/.exec(nome);
    if (partes && !await Momento.exists({ 'midias.processamento': partes[1] }))
      await fs.rm(path.join(saida, nome), { force: true, recursive: true });
  }
}

async function iniciar() {
  await prepararDiretorios();
  await connectDB({ dbName: 'intergil2026' });
  let limparEm = 0;
  for (;;) {
    if (Date.now() >= limparEm) {
      await limparEnviosInterrompidos();
      limparEm = Date.now() + 60 * minutos;
    }
    if (!await proximaMidia()) await pausar(2500);
  }
}

if (require.main === module) iniciar().catch(falha => {
  console.error('Processador de Momentos:', falha.message);
  process.exit(1);
});
