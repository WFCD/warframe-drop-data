const express = require('express');
const serveStatic = require('serve-static');

const app = express();
app.use(serveStatic('.', {'index': ['index.html']}))
app.listen(process.env.PORT || 3000);
