const path = require('path');
const express = require('express');
const methodOverride = require('method-override');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./docs/swagger.json');
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');
const basicRoutes = require('./routes/basic');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

/* ---------- view engine (the V of MVC) ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ---------- body parsers ---------- */
app.use(express.json());                          // Postman, Content-Type: application/json
app.use(express.urlencoded({ extended: true }));  // HTML forms
app.use(methodOverride('_method'));               // forms can send PATCH / DELETE
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- Swagger: a page that lists and tries the API ---------- */
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Alumni Tracking System — API',
}));

/* ---------- routes: method + path -> a controller function ---------- */
app.use('/', basicRoutes);  // week 02 exercises
app.use('/api', apiRoutes); // JSON, for programs
app.use('/', webRoutes);    // HTML, for people

/* ---------- 404 and 500 ---------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
