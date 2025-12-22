const express = require('express');
const app = express();
const PORT = 3000;

// middleware
app.use(express.json());

// route test
app.get('/', (req, res) => {
  res.send('Hello ExpressJS 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
