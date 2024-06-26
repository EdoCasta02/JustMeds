const express = require("express");
const router = express.Router();
const moongose = require("mongoose");

const User = require("../models/User");
const Ordine = require("../models/Ordine");
const Form = require("../models/Form");
const ListaFarmacie = require("../models/ListaFarmacie");
const { isAuthenticated } = require("../middlewares/tokenChecker");


router.get('/profile', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }
        res.json({
            name: user.nome,
            surname: user.cognome,
            email: user.email,
            password: user.password,
            address: user.via,
            cap: user.cap,
            province: user.provincia,
            city: user.città,
        });
    } catch (error) {
        console.error('Errore nel recuperare i dati utente:', error);
        res.status(500).json({ message: 'Errore interno del server', error });
    }
  });
  
router.get('/ordini', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    try {
      const ordini = await Ordine.find({ utenteID: userId })
        .populate('prodotti._id', 'Farmaco');
  
      const ordiniConFarmacie = await Promise.all(ordini.map(async (ordine) => {
        const farmacia = await ListaFarmacie.findById(ordine.farmaciaID).select('FARMACIA');
        return {
          ...ordine.toObject(),
          farmaciaNome: farmacia ? farmacia.FARMACIA : 'N/A'
        };
      }));
  
      res.json(ordiniConFarmacie);
    } catch (error) {
      console.error('Errore nel recuperare gli ordini:', error);
      res.status(500).json({ message: 'Errore interno del server', error });
    }
  });
  
router.put('/editprofile', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const { city, cap, province,address } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }
      user.città = city;
      user.cap = cap;
      user.provincia = province;
      user.via = address;
      await user.save();
      res.json({ message: 'Profilo aggiornato con successo' });
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del profilo:', error);
      res.status(500).json({ message: 'Errore interno del server', error });
    }
  });

  router.put('/editpassword', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const { oldPassword, newPassword } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utente non trovato' });
      }
      if (oldPassword !== user.password) {
        return res.status(401).json({ message: 'Password attuale non corretta' });
      }
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password aggiornata con successo' });
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della password:', error);
      res.status(500).json({ message: 'Errore interno del server', error });
    }
  }
  );

router.get('/forms', isAuthenticated, async (req, res) => {
    const userEmail = req.session.user.email;
    try {
        const forms = await Form.find
        ({ email: userEmail }).sort({ createdAt: -1 });
        res.json(forms);
    } catch (error) {
        console.error('Errore nel recuperare i moduli:', error);
        res.status(500).json({ message: 'Errore interno del server', error });
    }

});
  
module.exports = router;
