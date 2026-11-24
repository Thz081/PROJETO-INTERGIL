const mongoose = require('mongoose');
const configSchema = new mongoose.Schema({
  siteName: { type: String, default: "Intergil 2026" },
  logoUrl: { type: String, default: "/images/armoriar.png" } // Caminho da logo atual
});
module.exports = mongoose.model('Config', configSchema);