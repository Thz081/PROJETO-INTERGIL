require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { iniciar } = require('./iniciar');
connectDB({ dbName: 'intergil2026' }).then(iniciar)
  .catch(err => { console.error(err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
