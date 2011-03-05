var EventEmitter = require('events').EventEmitter,
	b2d = require("../lib/box2dnode/box2dnode.js");

var PWCONST = {
	world: {
		width: 740,
		height: 620
	},
	time: {
		tickInterval: 1.0/60.0,
		tickIterations: 10,
		clientEventFrequency: 1.0/20.0
	},
	ground: {
		height: 20
	},
	gravity: {
		x: 0,
		y: 10.0
	},
	baloon: {
		density: 1.0,
		friction: 0.8,
		rest: 1.0
	},
	objects: {
		movementThreshold: 1.0
	}
}

var __object_id = 1;

var ObjectModel = function ObjectModel(x,y,type,id) {
	this.state = {
		x: x,
		y: y,
		type: type,
		id: id
	}
	
	this.internalState = {
		dirty: false
	}
	
	this.body = undefined;
}

/**
 * createPhysicalObject - Creates the physics bodies for this object and adds them to the world, returns the main body object
 */
ObjectModel.prototype.createPhysicalObject = function createPhysicalObject(world) {
	return undefined;
}

/**
 * syncPhysical - Updates model coordinates to reflect physics coordinates, returns true if the object has moved more than the movement threshold
 */
ObjectModel.prototype.syncPhysical = function syncPhysical() {
	return false;
}

ObjectModel.prototype.setDirty = function setDirty() {
	this.internalState.dirty = true;
}

ObjectModel.prototype.setClean = function setClean() {
	this.internalState.dirty = false;
}

ObjectModel.prototype.getDirty = function getDirty() {
	return this.internalState.dirty;
}

var BaloonModel = function BaloonModel(x,y,size) {
	ObjectModel.call(this, x,y,'baloon',__object_id++);
	
	this.state['size'] = size;
}

BaloonModel.prototype = new ObjectModel();
BaloonModel.prototype.constructor = BaloonModel;

BaloonModel.prototype.createPhysicalObject = function createPhysicalObject(world) {
	var bodyDef = new b2d.b2BodyDef(),
		shapeDef = new b2d.b2CircleDef(),
		body;
	
	bodyDef.position.Set(this.state.x, this.state.y);
	
	body = world.CreateBody(bodyDef);
	
	shapeDef.density = PWCONST.baloon.density;
	shapeDef.friction = PWCONST.baloon.friction;
	shapeDef.restitution = PWCONST.baloon.rest;
	
	body.CreateShape(shapeDef);
	body.SetMassFromShapes();
	
	this.body = body;
	
	return body;
}

BaloonModel.prototype.syncPhysical = function syncPhysical() {
	var bodyPos = this.body.GetPosition();
	
	if(Math.abs(this.state.x - bodyPos.x) > PWCONST.objects.movementThreshold ||
		Math.abs(this.state.y - bodyPos.y) > PWCONST.objects.movementThreshold) {
	//	console.log("Object has moved from " + this.state.x + "," + this.state.y + " to " + bodyPos.x + "," + bodyPos.y);
		
		this.state.x = bodyPos.x;
		this.state.y = bodyPos.y;	
		
		return true;
	}
	
	return false;
}

var WorldModel = function WorldModel() {
	var _self = this,
		_worldAABB,
		_world,
		_worldTime = 0.0;
		
	this.objects = [];
	this.dirtyList = [];
	this.dirtyListStates = [];
	
	this.init = function init() {
		_worldAABB = new b2d.b2AABB();
		_worldAABB.lowerBound.Set(0, 0);
		_worldAABB.upperBound.Set(PWCONST.world.width, PWCONST.world.height);
		
		_world = new b2d.b2World(_worldAABB, new b2d.b2Vec2(PWCONST.gravity.x, PWCONST.gravity.y), true);
		
		setInterval(function() { _self.tick(); }, PWCONST.time.tickInterval*1000);
	}
	
	this.createGround = function createGround() {
		var groundBodyDef = new b2d.b2BodyDef(),
			groundShapeDef = new b2d.b2PolygonDef(),
			groundBody;
			
		groundBodyDef.position.set(PWCONST.world.width>>1, PWCONST.world.height+PWCONST.ground.height>>1);
		
		groundBody = _world.CreateBody(groundBodyDef);
		
		groundShapeDef.SetAsBox(PWCONST.world.width, PWCONST.ground.height>>1);
		
		groundBody.createShape(groundShapeDef);
	}
	
	this.addObject = function addObject(object) {
		var body = object.createPhysicalObject(_world);
		
		body.SetUserData({'object': object});
		
		this.objects.push(object);
	}
	
	this.cleanDirty = function cleanDirty() {
		for(var i = 0, max = this.dirtyList.length; i < max; i++) {
			this.dirtyList[i].setClean();
		}
		
		this.dirtyList = [];
		this.dirtyListStates = [];
	}
	
	this.tick = function tick() {
		_worldTime += PWCONST.time.tickInterval;
		
		_world.Step(PWCONST.time.tickInterval, PWCONST.time.tickIterations);
		
		//console.log("Tick");
		
		for(var i = 0, max = this.objects.length; i < max; i++) {
			var object = this.objects[i];
				
			/*
			 * Sync the physical world with the model world, if the object has moved (enough)
			 * add it to our list of objects to notify clients of
			 */
			if(object.syncPhysical()) {
				if(!object.getDirty()) {
					this.dirtyList.push(object);
					this.dirtyListStates.push(object.state);
					
					object.setDirty();
				}
			}
		}
	}
}

exports.PhysicsWorld = PhysicsWorld = function PhysicsWorld() {
	this.expose = {
		'join': {
			'function': '__api__join'
		},
		'createBaloon': {
			'function': '__api__createBaloon'
		}
	};
	
	this.world = new WorldModel();
	
	this.clients = [];
	
	this.init();
}

PhysicsWorld.prototype.__proto__ = EventEmitter.prototype;


PhysicsWorld.prototype.init = function init() {
	var self = this;
	
	this.world.init();
	
	setInterval(function() { self.notifyClients(); }, PWCONST.time.clientEventFrequency*1000);
}

PhysicsWorld.prototype.__api__join = function __api__join(comInstance, args, callback) {
	var objectsArray = [],
		object,
		selectedId;
		
	for(var i = 0, max = this.world.objects.length; i < max; i++) {
		object = this.world.objects[i];
		
		objectsArray.push(object.state);
	}
	
	this.clients.push(comInstance);
		
	comInstance.subscribeObject(this, 'newObject');
	comInstance.subscribeObject(this, 'updateObjects');
	
	console.log("Joined");
	callback(null, {'objects': objectsArray});
}


PhysicsWorld.prototype.__api__createBaloon = function __api__createBaloon(comInstance, args, callback) {
	var baloon = new BaloonModel(Math.random() * PWCONST.world.width, Math.random() * PWCONST.world.height, Math.random() * 50);
	
	callback(null, {});
	
	this.world.addObject(baloon);
	
	this.emit('newObject', 'physicsWorld', baloon.state);
}

PhysicsWorld.prototype.notifyClients = function notifyClients() {
	if(this.world.dirtyListStates.length > 0) {
		this.emit('updateObjects', 'physicsWorld', this.world.dirtyListStates);
		
		//console.log("Notified clients of " + this.world.dirtyListStates.length + " dirty objects");
	
		this.world.cleanDirty();
	}
}
