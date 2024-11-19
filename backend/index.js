const cors = require('cors');
const express = require('express');
const multer = require('multer');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Set up multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Configure MySQL database connection
const dbConfig = {
  host: 'database-1.c9qy26ca8k3g.us-east-1.rds.amazonaws.com',
  user: 'abeuerle',
  password: '461RDSpassword',
  database: '461Database',
};

app.use(cors({
  origin: 'https://main.d2tvs6fkjnwhu6.amplifyapp.com',  // Frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));


// Route to get all modules or search modules by name
app.get('/modules', async (req, res) => {
  const { name } = req.query;
  console.log("Received a GET request to '/modules'");
  console.log("Search query:", name ? `Searching for modules with name: ${name}` : "Fetching all modules");

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Database connection established");

    const [rows] = name
      ? await connection.execute('SELECT * FROM modules WHERE name LIKE ?', [`%${name}%`])
      : await connection.execute('SELECT * FROM modules');
    
    console.log("Query executed successfully. Number of modules found:", rows.length);
    await connection.end();
    console.log("Database connection closed");

    res.json(rows);
  } catch (err) {
    console.error("Database error in '/modules':", err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Upload route
app.post('/upload', upload.single('module'), async (req, res) => {
  const file = req.file;
  const { name, score } = req.body;

  console.log("Received a POST request to '/upload'");
  console.log("File details:", file);
  console.log("Module name:", name, "Score:", score);

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Database connection established");

    await connection.execute(
      'INSERT INTO modules (name, score, filepath) VALUES (?, ?, ?)',
      [name, parseInt(score), file.path]
    );
    console.log(`Module uploaded and saved in database. Name: ${name}, Score: ${score}, Path: ${file.path}`);
    await connection.end();
    console.log("Database connection closed");

    res.status(200).json({ id: file.filename, name, score });
  } catch (err) {
    console.error("Database error in '/upload':", err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Download route
app.get('/download/:id', async (req, res) => {
  const { id } = req.params;
  console.log("Received a GET request to '/download' with module ID:", id);

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Database connection established");

    const [rows] = await connection.execute('SELECT * FROM modules WHERE id = ?', [id]);
    console.log("Query executed. Module found:", rows.length > 0);
    await connection.end();
    console.log("Database connection closed");

    if (rows.length === 0) {
      console.error("Module not found with ID:", id);
      return res.status(404).json({ error: 'Module not found' });
    }

    const module = rows[0];
    console.log(`Downloading module: ${module.name} at path: ${module.filepath}`);
    res.download(path.resolve(module.filepath), `${module.name}.zip`);
  } catch (err) {
    console.error("Database error in '/download':", err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

