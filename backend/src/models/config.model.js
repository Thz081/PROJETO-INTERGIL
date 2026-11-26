const mongoose = require('mongoose');
const configSchema = new mongoose.Schema({
  siteName: { type: String, default: "Intergil 2026" },
  logoUrl: { type: String, default: "/images/armoriar.png" },
  headerLogoUrl: String,
  rankingVisivel: { type: Boolean, default: true }
});
module.exports = mongoose.model('Config', configSchema);
