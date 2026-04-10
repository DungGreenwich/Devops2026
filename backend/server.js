const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Fix: Default pass now matches docker-compose
const pool = new Pool({
   user: process.env.DB_USER || 'postgres',
   host: process.env.DB_HOST || 'localhost',
   database: process.env.DB_NAME || 'mydb',
   password: process.env.DB_PASSWORD || 'mypass',
   port: process.env.DB_PORT || 5432,
});

app.get('/health', (req, res) => {
   res.json({ status: 'healthy', version: '1.0.0' });
});

// GET todos
app.get('/api/todos', async (req, res) => {
   try {
      const result = await pool.query('SELECT * FROM todos ORDER BY id');
      res.json(result.rows);
   } catch (err) {
      res.status(500).json({ error: err.message });
      console.error(err);
   }
});

app.post('/api/todos', async (req, res) => {
   try {
      const { title, completed = false } = req.body;

      // Fix: Return 400 status with error message if title is empty or undefined
      if (title === undefined || title === "") {
         return res.status(400).send("Title is empty");
      }

      const result = await pool.query(
         'INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING *',
         [title, completed]
      );
      res.status(201).json(result.rows[0]);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

// Fix: implemented the delete endpoint
app.delete('/api/todos/:id', async (req, res) => {
   const id = req.params.id;

  try {
    const result = await client.query(
      "DELETE FROM todos WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({
      message: "Entry deleted",
      user: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fix: PUT endpoint (update todos)
app.put("/api/todos/:id", async (req, res) => {
  const id = req.params.id;
  const { title, completed, created_at } = req.body;

  // Validate input
  if (!title || !completed || !created_at) {
    return res.status(400).json({ error: "Title, completed and created_at required" });
  }

  try {
    const result = await client.query(
      "UPDATE todos SET title = $1, completed = $2, created_at = $3 WHERE id = $3 RETURNING *",
      [title, completed, created_at, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({
      message: "Todos updated",
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 8080;

// Fix: Only start server if NOT in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Fix: App exported
module.exports = app;