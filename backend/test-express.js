const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use((req, res, next) => {
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.post('/', (req, res) => {
  res.json({ body: req.body });
});
app.listen(5001, () => console.log('Test server on 5001'));
