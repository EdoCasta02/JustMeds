const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true, alias: 'CF' }, 
  nome: String,
  cognome: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  dataDiNascita: Date,
  città: String,
  cap: String,
  provincia: String,
  via: String,
  type: String,
  guadagni: Number
}, { id: false, versionKey: false  }); 

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;