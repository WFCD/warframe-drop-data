const express = require('express');
const serveStatic = require('serve-static');

const app = express();
// app.use(serveStatic('./site', {'index': ['./site/index.html']}))
app.use(express.static('site'))
app.listen(process.env.PORT || 3000);
