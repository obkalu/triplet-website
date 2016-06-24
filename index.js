"use strict";

let ghost = require('ghost'),
    express = require('express'),
    hbs  = require('express-hbs'),
    path = require('path'),
    parentApp = express(),
    env = process.env.NODE_ENV || 'development';

const viewsPath = path.join(__dirname, 'views');
const layoutsPath = path.join(viewsPath, 'layouts');

function processBuffer(buffer, app) {
  while( buffer.length ){
    var request = buffer.pop();
    app(request[0], request[1]);
  }
}

function makeGhostMiddleware(options, cb) {
  var requestBuffer = [];
  var app = false;

  ghost(options).then(ghost => {
    app = ghost.rootApp;
    processBuffer(requestBuffer, app);
    cb(ghost);
  });

  return (req, res) =>{
    if(!app) {
      requestBuffer.unshift([req, res]);
    } else {
      app(req, res);
    }
  };
}

const forceSsl = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
};

parentApp.set('port', (process.env.PORT || 5000));

var defaultLayout = path.join(layoutsPath, 'main.hbs');
console.log(defaultLayout);
parentApp.engine('hbs', hbs.express4({ defaultLayout: defaultLayout }));
parentApp.set('view engine', 'hbs');
parentApp.use(express.static(path.join(__dirname, 'public')));

if (env === 'production') {
  parentApp.use(forceSsl);
}

parentApp.get('/', (req, res) => {
  var description = 'TripleT Softworks - Web Development Consulting';
  res.render('home', {
    description: description,
    title: description
  });
});

parentApp.get('/styleguide', (req, res) => {
  res.render('styleguide', {
    layout: false
  });
});

parentApp.get('/thanks', (req, res) => {
  var thanks = 'TripleT Softworks - Thank you for subscribing';
  res.render('thanks', {
    description: thanks,
    title: thanks
  });
});

parentApp.use('/blog', makeGhostMiddleware({
  config: path.join(__dirname, 'config.js')
}, ghostServer => {
  require('./helpers')();
}));

parentApp.listen(parentApp.get('port'), () => {
  console.log('Node app is running on port', parentApp.get('port'));
});