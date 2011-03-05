var EventEmitter = require('events').EventEmitter;

var Circle = function Circle(x,y,radius,id) {
	this.spec = {
		x: x,
		y: y,
		radius: radius,
		id: id
	}

	this.contains = function contains(x,y) {
		if(Math.sqrt((x-this.spec.x)*(x-this.spec.x)+(y-this.spec.y)*(y-this.spec.y)) < this.spec.radius) {
			return true;
		}
		
		return false;
	}
}

var __objectId = 1;

exports.CircleWorld =  CircleWorld = function CircleWorld() {
	this.expose = {
		'join': {
			'function': '__api__join'
		},
		'addCircle': {
			'function': '__api__addCircle'
		},
		'click': {
			'function': '__api__click'
		}
	};
	
	this.metrics = {
		width: 740,
		height: 620,
		circles: {
			maxRadius: 50
		}
	}
	
	this.selected = undefined;
	
	this.circles = [];
	
	this.clients = [];
}

CircleWorld.prototype.__proto__ = EventEmitter.prototype;

CircleWorld.prototype.__api__join = function __api__join(comInstance, args, callback) {
	var circlesArray = [],
		circle,
		selectedId;
		
	for(var i = 0, max = this.circles.length; i < max; i++) {
		circle = this.circles[i];
		
		circlesArray.push(circle.spec);
	}
	
	this.clients.push(comInstance);
		
	comInstance.subscribeObject(this, 'newCircle');
	comInstance.subscribeObject(this, 'selectCircle');
	comInstance.subscribeObject(this, 'deselectCircle');
	
	if(undefined !== this.selected) {
		selectedId = this.selected.spec.id;
	}
	
	callback(null, {'circles': circlesArray, 'selectedCircleId': selectedId});
}

CircleWorld.prototype.__api__addCircle = function __api__addCircle(comInstance, args, callback) {
	var circle;
	
	callback(null, {});
	
	circle = this.newCircle();
	
	this.emit('newCircle', 'circleWorld', {'circle': circle.spec});
}

CircleWorld.prototype.__api__click = function __api__click(comInstance, args, callback) {
	var x = args.x,
		y = args.y,
		circle,
		clickedCircle = undefined;
	
	callback(null, {});
		
	for(var i = 0, max = this.circles.length; i < max && undefined === clickedCircle; i++) {
		circle = this.circles[i];
		
		if(circle.contains(x,y)) {
			clickedCircle = circle;
		}		
	}
	
	if(clickedCircle != this.selected) {
		if(undefined !== this.selected) {
			this.emit('deselectCircle', 'circleWorld', {'circleId': this.selected.spec.id});
			
			this.selected.spec.selected = false;
			delete this.selected;
		}
		
		if(undefined !== clickedCircle) {
			this.selected = clickedCircle;
			
			this.selected.spec.selected = true;
			this.emit('selectCircle', 'circleWorld', {'circleId': this.selected.spec.id});
			
			console.log("Selected circle " + clickedCircle.spec.id);
		}
	}
}

CircleWorld.prototype.newCircle = function newCircle() {
	var circle = new Circle(Math.random() * this.metrics.width, Math.random() * this.metrics.height, 
								Math.random() * this.metrics.circles.maxRadius, __objectId++),
		inserted = false;
							
	/*this.subscribeClients(circle, 'move');
	this.subscribeClients(circle, 'destroy');*/

	/*
	 * Insert the circle in the list in ascending size of radius for easy click detection
	 */
	for(var i = 0, max = this.circles.length; i < max && !inserted; i++) {
		if(circle.spec.radius < this.circles[i].spec.radius) {
			this.circles.splice(i, 0, circle);
			inserted = true;
		}		
	}
	
	if(!inserted) {
		this.circles.push(circle);
	}
	
	return circle;
}

CircleWorld.prototype.subscribeClients = function subscribeClients(object, event) {
	var client;
	
	for(var i = 0, max = this.clients.length; i < max; i++) {
		client = this.clients[i];
		
		client.subscribeObject(this, event);		
	}
}