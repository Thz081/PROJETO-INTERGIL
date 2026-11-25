const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Monitor = require('../models/monitor.model');
const Modalidade = require('../models/modalidade.model');

(async () => {
  const [matricula, ...slugs] = process.argv.slice(2);
  if (!matricula || slugs.length > 3 || new Set(slugs).size !== slugs.length)
    throw new Error('Use atribuir-monitor.js matrícula [até três slugs distintos].');
  await connectDB({ dbName: 'intergil2026' });
  const modalidades = await Modalidade.find({ slug: { $in: slugs } }).select('_id slug nome').lean();
  if (modalidades.length !== slugs.length) throw new Error('Uma modalidade informada não existe.');
  const resultado = await Monitor.updateOne({ matricula },
    { $set: { modalidadesIds: modalidades.map(modalidade => modalidade._id) }, $unset: { modalidadeId: 1 } },
    { runValidators: true });
  if (!resultado.matchedCount) throw new Error('Monitor não encontrado.');
  console.log(modalidades.length ? modalidades.map(modalidade => modalidade.nome).join(' · ') : 'Atribuições removidas.');
})().catch(erro => { console.error(erro.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
