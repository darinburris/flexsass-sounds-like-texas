const path = require('path');
const express = require('express');
const app = express();
const staticPath = path.join(__dirname, '/release');
const PORT = 4000;

app.use(express.static(staticPath));

let message = `
listening on port: ${PORT}
http://localhost:${PORT}
Enjoy!
`;

app.listen(PORT, function() {
  console.log(message);
});