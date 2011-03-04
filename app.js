
/**
 * Module dependencies.
 */

var express = require('express'),
	DemoServer = require('./servers').DemoServer;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    locals: {
      title: 'Express'
    }
  });
});

app.get('/remoteCircles', function(req, res){
  res.render('remoteCircles', {
    locals: {
      title: 'Remote Circles'
    }
  });
});

app.get('/remotePhysics', function(req, res){
  res.render('remotePhysics', {
    locals: {
      title: 'Remote Physics'
    }
  });
});

var demoServer = new DemoServer(app);


// Only listen on $ node app.js

if (!module.parent) {
  app.listen(8085);
  console.log("Express server listening on port %d", app.address().port)
}
