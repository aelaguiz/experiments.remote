var MessageServer = require('../lib/message.socket.io').Server,
	CircleWorld = require('./circleWorld.js').CircleWorld,
	PhysicsWorld = require('./physicsWorld.js').PhysicsWorld;

exports.DemoServer = function CircleServer(httpServer) {
	var _server = new MessageServer(httpServer),
		_circleWorld= new CircleWorld(),
		_physicsWorld = new PhysicsWorld();
	
	_server.addQueryObject('circleWorld', _circleWorld);
	_server.addQueryObject('physicsWorld', _physicsWorld);

}