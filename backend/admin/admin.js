const express = require("express");
const router = express.Router();
const Form = require("../models/Form");
const User = require("../models/User");
const ListaFarmacie = require("../models/ListaFarmacie");
const ListaFarmaci = require("../models/Drug");
const Carrello = require("../models/Carrello");
const Ordini = require("../models/Ordine");

// Endpoint per ottenere le richieste di assistenza
router.get('/form_requests', async (req, res) => {
  try {
    const requests = await Form.find();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint per eliminare una richiesta di assistenza
router.delete('/form_requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Form.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Richiesta eliminata con successo' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint per creare un account farmacia
router.post('/create_pharmacy', async (req, res) => {
  try {
    const pharmacyData = {
      _id: req.body._id,
      nomeFarmacia: req.body.nomeFarmacia,
      email: req.body.email,
      password: req.body.password,
      indirizzo: {
        paese: req.body["indirizzo.paese"],
        città: req.body["indirizzo.città"],
        via: req.body["indirizzo.via"]
      },
      type: 'farmacia',
      numeroTelefono: req.body.numeroTelefono,
      responsabile: {
        nome: req.body["responsabile.nome"],
        cognome: req.body["responsabile.cognome"]
      }
    };

    const pharmacy = new User(pharmacyData);
    await pharmacy.save();
    res.status(201).json({ success: true, message: 'Account farmacia creato con successo' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Email o ID già esistente' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// Endpoint per ottenere la lista delle farmacie
router.get('/pharmacies', async (req, res) => {
  try {
    const pharmacies = await ListaFarmacie.find();
    res.json(pharmacies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint per ottenere le statistiche delle collezioni
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      form_requests: await Form.countDocuments(),
      users: await User.countDocuments(),
      ListaFarmacie: await ListaFarmacie.countDocuments(),
      ListaFarmaci: await ListaFarmaci.countDocuments(),
      carrello: await Carrello.countDocuments(),
      ordini: await Ordini.countDocuments()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;