const mongoose = require('mongoose');
const configSchema = new mongoose.Schema({
  siteName: { type: String, default: "Intergil 2026" },
  logoUrl: { type: String, default: "/images/armoriar.png" },
  headerLogoUrl: String,
  rankingVisivel: { type: Boolean, default: true },
  manutencao: { type: Boolean, default: false }
});
module.exports = mongoose.model('Config', configSchema);
