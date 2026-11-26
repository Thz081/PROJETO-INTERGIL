const mongoose = require('mongoose');
const { unlink } = require('node:fs/promises');
const Modalidade = require('../models/modalidade.model');
const Inscricao = require('../models/inscricao.model');
const Podio = require('../models/podio.model');
const { Controle } = require('../edicao/iniciar');
const { formatosDePodio } = require('../edicao/pontuacao');
const { categoriasModalidades } = require('../edicao/catalogo');

function erro(status, message) {
  throw Object.assign(new Error(message), { status });
}

function inteiro(valor, rotulo, livre = false) {
  if (livre && (valor == null || valor === '')) return null;
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < 1) erro(400, rotulo + ' deve ser um inteiro positivo.');
  return numero;
}

function campos(body, atual) {
  const dados = {};
  if (!atual || body.nome !== undefined) {
    dados.nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    if (!dados.nome) erro(400, 'Informe o nome da modalidade.');
  }
  if (body.categoria !== undefined) {
    if (!categoriasModalidades.includes(body.categoria)) erro(400, 'Selecione uma categoria válida.');
    dados.categoria = body.categoria;
  } else if (!atual) {
    dados.categoria = 'Outras modalidades';
  }
  if (body.max_inscritos !== undefined || !atual) {
    dados.max_inscritos = inteiro(body.max_inscritos, 'O limite geral', true);
  }
  if (!atual && body.tipo !== undefined) dados.isAvulsoSimples = body.tipo === 'individual';

  if (body.formatos !== undefined) {
    let formatos;
    try { formatos = JSON.parse(body.formatos); }
    catch { erro(400, 'Confira os formatos de participação.'); }
    if (!Array.isArray(formatos)) erro(400, 'Confira os formatos de participação.');

    const nomes = new Set();
    dados.submodalidades = formatos.map((opcao, indice) => {
      const nome = typeof opcao?.nome === 'string' ? opcao.nome.trim() : '';
      const chave = nome.toLocaleLowerCase('pt-BR');
      if (!nome || chave === 'geral' || nomes.has(chave) || !['X', 'M', 'F'].includes(opcao.genero))
        erro(400, 'Use nomes distintos e uma categoria válida em cada formato.');
      nomes.add(chave);
      return {
        ...atual?.submodalidades[indice],
        nome, genero: opcao.genero, max_inscritos: inteiro(opcao.limite, 'As vagas do formato', true)
      };
    });
  } else if (!atual && body.subcategorias) {
    // Compatibilidade com o formulário anterior na criação.
    const valor = String(body.subcategorias);
    let nomes;
    try { nomes = valor.startsWith('[') ? JSON.parse(valor) : valor.split(','); }
    catch { erro(400, 'Confira os formatos de participação.'); }
    if (!Array.isArray(nomes)) erro(400, 'Confira os formatos de participação.');
    dados.submodalidades = nomes.filter(nome => typeof nome === 'string' && nome.trim())
      .map(nome => ({ nome: nome.trim(), genero: 'X', inscricao: true }));
  }

  if (body.maxEscolhas !== undefined) {
    const maximo = inteiro(body.maxEscolhas, 'O máximo de formatos');
    if (maximo > Math.max(1, (dados.submodalidades || atual?.submodalidades || []).length))
      erro(400, 'O máximo de formatos não pode exceder os cadastrados.');
    dados.maxEscolhas = maximo;
  }

  return dados;
}

function imagens(files) {
  const dados = {};
  if (files?.imgCarrossel) dados.imgCarrossel = dados.imageUrl = '/arquivos/' + files.imgCarrossel[0].filename;
  if (files?.imgDetalhe) dados.imgDetalhe = '/arquivos/' + files.imgDetalhe[0].filename;
  return dados;
}

async function alterarCatalogo(fn) {
  return mongoose.connection.transaction(async session => {
    // Usa a mesma escrita que serializa inscrições para evitar remover uma opção em uso.
    await Controle.updateOne({ _id: 'vagas' }, { $inc: { versao: 1 } }, { session });
    return fn(session);
  });
}

function rota(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (err) {
      await Promise.allSettled(Object.values(req.files || {}).flat().map(file => unlink(file.path)));
      const status = err.status || (err.code === 11000 ? 409 : 500);
      if (status === 500) console.error('Falha no catálogo:', err.message);
      res.status(status).json({ message: err.status ? err.message :
        status === 409 ? 'Já existe uma modalidade com esse nome.' : 'Não foi possível salvar a modalidade.' });
    }
  };
}

function idDaModalidade(valor) {
  return inteiro(valor, 'Identificador da modalidade');
}

exports.categorias = (_req, res) => res.json(categoriasModalidades);

exports.createModalidade = rota(async (req, res) => {
  const dados = campos(req.body);
  const slug = dados.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) erro(400, 'Informe um nome com letras ou números.');
  const novo = await alterarCatalogo(async session => {
    const ultimo = await Modalidade.findOne().sort({ _id: -1 }).select('_id').session(session).lean();
    await Controle.updateOne({ _id: 'ids-modalidades' }, { $max: { versao: ultimo?._id || 0 } }, { upsert: true, session });
    const contador = await Controle.findByIdAndUpdate('ids-modalidades', { $inc: { versao: 1 } }, { new: true, session });
    const [criado] = await Modalidade.create([{
      _id: contador.versao, slug,
      imgCarrossel: '/images/armoriar.png', imgDetalhe: '/images/armoriar.png',
      ...dados, ...imagens(req.files)
    }], { session });
    return criado;
  });
  res.status(201).json(novo);
});

exports.updateModalidade = rota(async (req, res) => {
  const id = idDaModalidade(req.params.id);
  const atualizado = await alterarCatalogo(async session => {
    const atual = await Modalidade.findById(id).session(session).lean();
    if (!atual) erro(404, 'Modalidade não encontrada.');
    const dados = campos(req.body, atual);
    if (dados.submodalidades) {
      const formatos = new Set(formatosDePodio(dados).map(item => item.chave));
      const podios = await Podio.find({ modalidadeId: id, formato: { $nin: [...formatos] } }).select('posicoes').session(session).lean();
      if (podios.some(podio => podio.posicoes.some(Boolean)))
        erro(409, 'Mantenha os formatos que têm um pódio publicado.');
      const removidos = atual.submodalidades.slice(dados.submodalidades.length)
        .map((_, indice) => `${id}-${dados.submodalidades.length + indice}`);
      if (!atual.submodalidades.length && dados.submodalidades.length) removidos.push(String(id));
      atual.submodalidades.slice(0, dados.submodalidades.length).forEach((opcao, indice) => {
        const novo = dados.submodalidades[indice];
        if (opcao.genero !== novo.genero || opcao.nome !== novo.nome) removidos.push(`${id}-${indice}`);
      });
      if (removidos.length && await Inscricao.exists({ modalidades: { $in: removidos } }).session(session))
        erro(409, 'Há inscrições que usam os formatos alterados. Mantenha o formato e a categoria de participação.');
    }
    return Modalidade.findByIdAndUpdate(id, { $set: { ...dados, ...imagens(req.files) } },
      { new: true, runValidators: true, session });
  });
  res.json({ message: 'Modalidade atualizada.', data: atualizado });
});

exports.deleteModalidade = rota(async (req, res) => {
  const id = idDaModalidade(req.params.id);
  await alterarCatalogo(async session => {
    if (await Inscricao.exists({ modalidades: new RegExp(`^${id}(?:-|$)`) }).session(session))
      erro(409, 'Esta modalidade tem inscrições e não pode ser excluída.');
    const podios = await Podio.find({ modalidadeId: id }).select('posicoes').session(session).lean();
    if (podios.some(podio => podio.posicoes.some(Boolean))) erro(409, 'Esta modalidade tem um pódio publicado.');
    const resultado = await Modalidade.deleteOne({ _id: id }, { session });
    if (!resultado.deletedCount) erro(404, 'Modalidade não encontrada.');
  });
  res.json({ message: 'Modalidade removida.' });
});
