const express = require('express');

const app = express();
app.use(express.static('site'))
app.listen(process.env.PORT || 3000);
