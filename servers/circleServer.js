var MessageServer = require('../lib/message.socket.io').Server,
	EventEmitter = require('events').EventEmitter;

var Circle = function Circle(x,y,radius,id) {
	this.spec = {
		x: x,
		y: y,
		radius: radius,
		id: id
	}
}

var __objectId = 1;

var CircleWorld = function CircleWorld() {
	this.expose = {
		'join': {
			'function': '__api__join'
		},
		'addCircle': {
			'function': '__api__addCircle'
		}
	};
	
	this.metrics = {
		width: 740,
		height: 620,
		circles: {
			maxRadius: 50
		}
	}
	
	this.circles = [];
	
	this.clients = [];
}

CircleWorld.prototype.__proto__ = EventEmitter.prototype;

CircleWorld.prototype.__api__join = function __api__join(comInstance, args, callback) {
	var circlesArray = [],
		circle;
		
	for(var i = 0, max = this.circles.length; i < max; i++) {
		circle = this.circles[i];
		
		circlesArray.push(circle.spec);
	}
	
	this.clients.push(comInstance);
		
	comInstance.subscribeObject(this, 'newCircle');
	
	callback(null, circlesArray);
}

CircleWorld.prototype.__api__addCircle = function __api__addCircle(comInstance, args, callback) {
	var circle;
	
	callback(null, {});
	
	circle = this.newCircle();
	
	this.emit('newCircle', 'world', {'circle': circle.spec});
}

CircleWorld.prototype.newCircle = function newCircle() {
	var circle = new Circle(Math.random() * this.metrics.width, Math.random() * this.metrics.height, 
								Math.random() * this.metrics.circles.maxRadius, __objectId++);
							
	/*this.subscribeClients(circle, 'move');
	this.subscribeClients(circle, 'destroy');*/
	
	this.circles.push(circle);
	
	return circle;
}

CircleWorld.prototype.subscribeClients = function subscribeClients(object, event) {
	var client;
	
	for(var i = 0, max = this.clients.length; i < max; i++) {
		client = this.clients[i];
		
		client.subscribeObject(this, event);		
	}
}

exports.CircleServer = function CircleServer(httpServer) {
	var _server = new MessageServer(httpServer),
		_world= new CircleWorld();
	
	_server.addQueryObject('world', _world);

}