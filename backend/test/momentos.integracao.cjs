const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: esperar } = require('node:timers/promises');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Monitor = require('/app/src/models/monitor.model');
const Sala = require('/app/src/models/sala.model');

const base = process.env.MOMENTOS_URL_TESTE || 'http://web';
const senha = 'credencial-sintetica-da-cobertura';
const editor = '/api/equipe/momentos';
const galeria = '/api/acervo-momentos';

async function chamar(rota, status, { metodo = 'GET', token, dados, bloco, offset, intervalo } = {}) {
  const resposta = await fetch(base + rota, {
    method: metodo,
    headers: {
      ...(token && { Authorization: 'Bearer ' + token }),
      ...(dados && { 'Content-Type': 'application/json' }),
      ...(bloco && { 'Content-Type': 'application/octet-stream', 'Upload-Offset': String(offset) }),
      ...(intervalo && { Range: intervalo })
    },
    body: bloco || (dados && JSON.stringify(dados))
  });
  const bytes = Buffer.from(await resposta.arrayBuffer());
  assert.equal(resposta.status, status, metodo + ' ' + rota + ': ' + bytes.subarray(0, 200));
  return resposta.headers.get('content-type')?.includes('application/json') ? JSON.parse(bytes) : bytes;
}

async function testar() {
  assert.match(process.env.MONGO_URI || '', /^mongodb:\/\/mongo:27017\/intergil2026\?/);
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash(senha, 4);
  const monitor = await Monitor.create({ matricula: 'teste-momentos-comum', nome: 'Monitor sintético', senha: hash });
  const agr = await Monitor.create({ matricula: 'teste-momentos-agr', nome: 'AGR TV sintética', senha: hash, agrTv: true });
  const entrar = matricula => chamar('/api/auth/login-monitor', 200, { metodo: 'POST', dados: { matricula, senha } });
  const sessao = await entrar(agr.matricula);
  assert.equal(sessao.user.agrTv, true);
  const { token } = sessao;
  await chamar(editor, 401);
  await chamar(editor, 403, { token: (await entrar(monitor.matricula)).token });

  const salas = (await Sala.find().limit(3).select('_id').lean()).map(item => String(item._id));
  const catalogo = await chamar(galeria + '/catalogo', 200);
  assert.equal(catalogo.salas.length, 12);
  const futsal = catalogo.modalidades.find(item => item.slug === 'futsal');
  const formato = futsal.submodalidades[0].nome;
  const abrirAlbum = dados => chamar(editor + '/colecoes', 200, { metodo: 'POST', token, dados });
  const [colaboracao, reaberto] = await Promise.all([
    abrirAlbum({ modalidade: futsal._id, formato, salas: salas.slice(0, 2) }),
    abrirAlbum({ modalidade: futsal._id, formato, salas: [salas[1], salas[0]] })
  ]);
  assert.equal(colaboracao._id, reaberto._id);
  await chamar(galeria + '/' + colaboracao._id, 404);
  const criar = dados => chamar(editor, 201, { metodo: 'POST', token, dados });
  const album = await criar({ titulo: 'Dança sintética', assunto: 'danca', tipo: 'foto', tema: 'Tema de teste', salas });
  const publicar = (id, estado, status = 200) => chamar(editor + '/' + id + '/estado', status,
    { metodo: 'PATCH', token, dados: { estado } });
  await chamar(galeria + '/' + album._id, 404);
  await publicar(album._id, 'publicado', 409);

  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'intergil-qa-midia-'));
  try {
    const jpeg = path.join(pasta, 'fixture.jpeg');
    const mov = path.join(pasta, 'fixture.mov');
    const horizontal = path.join(pasta, 'horizontal.mov');
    const segundaFoto = path.join(pasta, 'segunda.jpeg');
    const ffmpeg = opcoes => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-filter_threads', '1', ...opcoes]);
    ffmpeg(['-f','lavfi','-i','color=c=orange:s=128x96','-frames:v','1','-threads','1',jpeg]);
    ffmpeg(['-f','lavfi','-i','testsrc2=s=128x192:r=24','-t','2','-c:v','libx264','-threads','1',mov]);
    ffmpeg(['-f','lavfi','-i','testsrc2=s=192x128:r=24','-t','2','-c:v','libx264','-threads','1',horizontal]);
    await fs.copyFile(jpeg, segundaFoto);

    async function enviar(id, origem) {
      const arquivo = await fs.readFile(origem);
      const dados = { nome: path.basename(origem), bytes: arquivo.length, alteradoEm: 1 };
      const baseEnvio = editor + '/' + id + '/envios';
      const inicio = await chamar(baseEnvio, 201, { metodo: 'POST', token, dados });
      const trecho = Math.floor(arquivo.length / 2);
      const url = baseEnvio + '/' + inicio.midia;
      await chamar(url, 200, { metodo: 'PUT', token, bloco: arquivo.subarray(0, trecho), offset: 0 });
      assert.equal((await chamar(baseEnvio, 200, { metodo: 'POST', token, dados })).recebido, trecho);
      await chamar(url, 409, { metodo: 'PUT', token, bloco: arquivo.subarray(0, trecho), offset: 0 });
      await chamar(url, 200, { metodo: 'PUT', token, bloco: arquivo.subarray(trecho), offset: trecho });
      for (let i = 0; i < 40; i++) {
        const doc = await chamar(editor + '/' + id, 200, { token });
        const midia = doc.midias.find(item => item._id === inicio.midia);
        assert.notEqual(midia.estado, 'falhou', midia.erro);
        if (midia.estado === 'pronta') return midia.url;
        await esperar(500);
      }
      throw new Error('Worker não processou o arquivo de teste.');
    }

    const rascunho = await criar({ tipo: 'foto', titulo: 'Rascunho de teste descartável', assunto: 'evento' });
    const fotoDescartavel = await enviar(rascunho._id, jpeg);
    const idDaFoto = fotoDescartavel.split('/').at(-2);
    const pastaDaFoto = path.join('/app/momentos/saida', idDaFoto);
    await fs.access(pastaDaFoto);
    await chamar(editor + '/' + rascunho._id, 401, { metodo: 'DELETE' });
    await chamar(editor + '/' + rascunho._id, 204, { metodo: 'DELETE', token });
    await chamar(editor + '/' + rascunho._id, 404, { token });
    await chamar(fotoDescartavel, 404);
    await assert.rejects(fs.access(pastaDaFoto), { code: 'ENOENT' });

    const previaFoto = await enviar(album._id, jpeg);
    const foto = previaFoto.split('?')[0];
    await chamar(previaFoto, 200);
    await chamar(foto, 404);
    await publicar(album._id, 'publicado');
    await chamar(editor + '/' + album._id, 409, { metodo: 'DELETE', token });
    for (const sala of salas) {
      const { itens } = await chamar(galeria + '?tipo=foto&assunto=danca&sala=' + sala, 200);
      assert(itens.some(item => item._id === album._id));
      const colecoes = await chamar(galeria + '/colecoes?sala=' + sala, 200);
      assert(colecoes.some(item => item.assunto === 'danca' && item.total === 1));
    }
    await enviar(colaboracao._id, jpeg);
    await publicar(colaboracao._id, 'publicado');
    const fotoExtra = await enviar(colaboracao._id, segundaFoto);
    const itensDoGrupo = sala => chamar(galeria + '?' + new URLSearchParams({
      modalidade: futsal._id, formato, sala, tipo: 'foto'
    }), 200);
    for (const sala of salas.slice(0, 2)) {
      const { itens } = await itensDoGrupo(sala);
      assert.equal(itens[0]._id, colaboracao._id);
      assert.equal(itens[0].midias.length, 2);
    }
    assert.equal((await itensDoGrupo(salas[2])).itens.length, 0);
    const midiaExtra = fotoExtra.split('/').at(-2);
    await chamar(editor + '/' + colaboracao._id + '/arquivos/' + midiaExtra, 204, { metodo: 'DELETE', token });
    await chamar(fotoExtra, 404);
    const principal = (await itensDoGrupo(salas[1])).itens[0].midias[0];
    await chamar(editor + '/' + colaboracao._id + '/arquivos/' + principal._id, 409, { metodo: 'DELETE', token });
    await chamar(editor + '/' + colaboracao._id, 200, { metodo: 'PATCH', token,
      dados: { ...colaboracao, salas: salas.slice(1) } });
    assert.equal((await itensDoGrupo(salas[0])).itens.length, 0);
    for (const sala of salas.slice(1)) assert.equal((await itensDoGrupo(sala)).itens[0].midias.length, 1);

    const doc = await criar({ tipo: 'video', titulo: 'Lance sintético', assunto: 'modalidade', modalidade: futsal._id,
      formato, salas: salas.slice(0, 2), lance: true });
    const previaVideo = await enviar(doc._id, mov);
    await publicar(doc._id, 'publicado');
    const parte = await chamar(previaVideo.split('?')[0], 206, { intervalo: 'bytes=0-255' });
    assert.equal(parte.length, 256);
    const lances = await chamar(galeria + '?tipo=video&lance=1', 200);
    assert(lances.itens.some(item => item._id === doc._id && item.midias[0].largura < item.midias[0].altura));
    const outro = await criar({ tipo: 'video', titulo: 'Lance horizontal sintético', assunto: 'modalidade',
      modalidade: futsal._id, formato, salas: salas.slice(0, 2), lance: true });
    await enviar(outro._id, horizontal);
    await publicar(outro._id, 'publicado');
    const paisagem = await chamar(galeria + '/' + outro._id, 200);
    assert(paisagem.midias[0].largura > paisagem.midias[0].altura);
    for (const sala of salas.slice(0, 2)) {
      const colecoes = await chamar(galeria + '/colecoes?sala=' + sala, 200);
      assert(colecoes.some(item => item.modalidade === futsal._id && item.formato === formato && item.tipo === 'video' && item.total >= 2));
    }

    await publicar(album._id, 'retirado');
    await chamar(foto, 404);
    await Monitor.updateOne({ _id: agr._id }, { $set: { agrTv: false } });
    await chamar(editor, 403, { token });
  } finally { await fs.rm(pasta, { recursive: true, force: true }); }
  console.log('AGR TV, trechos retomáveis, processamento, fotos e vídeos separados, filtros, autorização e entrega parcial verificados.');
}

testar().catch(erro => { console.error(erro); process.exitCode = 1; }).finally(() => mongoose.disconnect());
