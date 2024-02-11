require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
var expressLayouts = require('express-ejs-layouts');
const app = express();

const port = process.env.SERVER_PORT || 4000;

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set('views', './views');
app.set('layout', 'layouts/main');

const routes = require('./server/routes/manage.routes.js');
app.use('/', routes);

app.listen(port, () => {
    console.log("App listening successfully on port", port);
});
