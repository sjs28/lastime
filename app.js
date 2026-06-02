//Main Imports
let express = require("express");
let path = require("path");
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

//Module Imports
require('./modules/ts-log')();

//Router Imports
let dashboard = require('./routes/dashboard');
let api = require('./routes/api')

let app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.disable('x-powered-by');

app.use(function (req, res, next) {
  req.user = {
    username: req.headers['remote-user'],
    displayName: req.headers['remote-name'],
    groups: req.headers['remote-groups'],
    email: req.headers['remote-email']
  };
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Content-Security-Policy": "default-src *; script-src * 'unsafe-inline'; style-src * 'unsafe-inline'; font-src 'self' data: * "
  })
  next();
});



app.use('/dashboard', dashboard.router);
app.use('/api', api.router);

app.get('/', function (req, res, next) {
  res.redirect('/dashboard');
})

app.listen(process.env.PORT || 8635);
console.log('App started');

//Run init scripts
api.runBgUpdate();
//Run update every hour
setInterval(api.runBgUpdate, 1 * 60 * 60 * 1000);
