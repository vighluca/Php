const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const socketIo = require('socket.io');
const multer = require('multer');

const app = express();
const http = require('http').createServer(app);
const io = socketIo(http);

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydatabase',
});

const upload = multer({ dest: 'uploads/' }); // A feltöltött fájlok itt lesznek eltárolva

db.connect((err) => {
  if (err) {
    console.error('Could not connect to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

app.use(bodyParser.json());

// Regisztráció
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (error, results) => {
    if (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      res.json({ message: 'Registration successful' });
    }
  });
});

// Bejelentkezés
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (error, results) => {
    if (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      if (results.length > 0) {
        res.json({ message: 'Login successful' });
      } else {
        res.status(401).json({ message: 'Invalid username or password' });
      }
    }
  });
});

// Adatlap lekérdezése
app.get('/user/:username', (req, res) => {
  const username = req.params.username;
  db.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
    if (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    }
  });
});

// Vélemények lekérdezése
app.get('/comments', (req, res) => {
  db.query('SELECT * FROM comments', (error, results) => {
    if (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

// Vélemény mentése
app.post('/comments', (req, res) => {
  const { username, comment } = req.body;
  db.query('INSERT INTO comments (username, comment) VALUES (?, ?)', [username, comment], (error, results) => {
    if (error) {
      console.error('Error saving comment:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    } else {
      res.json({ message: 'Comment saved successfully' });
      io.emit('newComment', { username, comment }); // Socket.io-val valósítható meg valós idejű frissítés
    }
  });
});

// Fájl feltöltése (kép vagy videó)
app.post('/upload', upload.single('file'), (req, res) => {
  const { username, type } = req.body;
  const filename = req.file.filename;

  // További kód a feltöltött fájl adatainak elmentéséhez az adatbázisban

  res.json({ message: 'Feltöltés sikeres' });
});

// Socket.io kezelése
io.on('connection', (socket) => {
  console.log('A user connected');

  // Valós idejű vélemények küldése a csatlakozott klienseknek
  socket.on('newComment', (data) => {
    io.emit('newComment', data);
  });
});

const PORT = process.env.PORT || 8080;
http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
