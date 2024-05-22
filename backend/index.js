const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const morgan = require("morgan");
const path = require('path');
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware per il parsing del corpo delle richieste
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurazione della sessione
app.use(
  session({
    secret: "sanremo",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 3600000 },
  })
);

// Middleware per il CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Importare e utilizzare i router
const adminRoutes = require("../backend/admin/admin");
app.use('/api/admin', adminRoutes);

const farmaciaRoutes = require("../backend/farmacia/farmacia");
app.use('/api', farmaciaRoutes);

const contattaciRouter = require("./form_request/contattaci");
app.use('/api', contattaciRouter);

const drugRoutes = require("./order/order_cart");
app.use("/api", drugRoutes);

// Middleware per i log delle richieste
app.use(morgan("dev"));

// Connessione al database
const DbURI = "mongodb+srv://adminuser:adminuser@justmedsdata.d6avjw7.mongodb.net/Data?retryWrites=true&w=majority&appName=JustMedsData";
mongoose
  .connect(DbURI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

const clientRouter = require("./client_account/client");
app.use('/api',clientRouter);

const checkoutRouter = require("./order/checkout");
app.use('/api',checkoutRouter);

// Modelli
const User = require("./models/User");
const Carrello = require("./models/Carrello");
const UserFarmacia = require("./models/UserFarmacia");

// Middleware di autenticazione
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send({ success: false, message: "Not authenticated" });
  }
}

// Middleware di autorizzazione
function checkUserRole(role) {
  return (req, res, next) => {
    const userRole = req.session.user && req.session.user.type;
    if (userRole === 'admin' || role.includes(userRole)) {
      next();
    } else {
      res.status(403).send("Accesso negato: non hai i permessi per accedere a questa pagina");
    }
  };
}

// Rotte per le pagine statiche
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotte protette per le pagine HTML
app.get('/farmacia/farmacia.html', isAuthenticated, checkUserRole(['farmacia']), (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/farmacia/farmacia.html'));
});

app.get('/admin/admin.html', isAuthenticated, checkUserRole(['admin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/admin.html'));
});



// Rotte per la registrazione e il login
app.post("/sign_up", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    console.log("Record inserted successfully");

    if (user.type === "ricevente") {
      const cart = new Carrello({
        clienteId: user._id,
        prodotti: [],
        totale: 0
      });
      await cart.save();
      console.log("Cart created successfully");
    }

    res.redirect("../auth/SignupSuccess.html");
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `${field} già esistente. Per favore, usa un altro ${field}.`;
      res.status(409).send({ success: false, message });
    } else {
      res.status(500).send({ success: false, message: err.message });
    }
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (password !== user.password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  req.session.user = {
    id: user._id,
    email: user.email,
    type: user.type,
    farmaciaID: user.type === 'farmacia' ? user._id : undefined
  };

  req.session.save(err => {
    if (err) {
      console.error('Error saving session:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    console.log('User logged in:', req.session.user);
    res.json({ success: true, message: 'Logged in successfully', role: user.type });
  });
});

// Rotte di logout e verifica login
app.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Failed to log out.");
      } else {
        return res.redirect("/"); // or your login page
      }
    });
  } else {
    res.end();
  }
});



app.get("/", (req, res) => {
  try {
    res.redirect("../frontend/index.html");
  } catch (error) {
    console.error("Error handling root route:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Rotte per il carrello
app.post('/api/cart/add', isAuthenticated, async (req, res) => {
  const { productId, quantity, price } = req.body;
  const clienteId = req.session.user.id;
  console.log("productId:", productId, "quantity:", quantity, "clienteId:", clienteId);
  try {
    const cart = await Carrello.findOne({ _id: clienteId });
    console.log("Carrello:", cart);
    if (!cart) {
      return res.status(404).json({ message: 'Carrello non trovato' });
    }

    const productIndex = cart.prodotti.findIndex(p => p._id.toString() === productId);
    let priceCorrect = price.replace(',', '.');
    let priceNumber = parseFloat(priceCorrect);
    console.log("priceNumber:", priceNumber);

    if (productIndex !== -1) {
      cart.prodotti[productIndex].quantita += quantity;
      cart.prodotti[productIndex].prezzo = priceNumber * quantity;
      console.log("Prodotto esiste, aggiorna la quantità");
    } else {
      cart.prodotti.push({ productId, quantita: quantity, prezzo: priceNumber });
      console.log("Prodotto non esiste, aggiungilo");
    }
  } catch (error) {
    console.error("Errore nell'aggiunta al carrello:", error);
    res.status(500).json({ message: "Errore nell'aggiunta al carrello" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

