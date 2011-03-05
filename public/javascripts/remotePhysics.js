var ObjectView = function ObjectView() {
	this.state = undefined;
}

ObjectView.prototype.init = function init(spec) {
	this.state = {
		x: spec.x,
		y: spec.y,
		type: spec.type,
		id: spec.id
	}
}

ObjectView.prototype.render = function render(graphics) {
	
}

ObjectView.prototype.updateView = function updateView(model) {
	this.state.x = model.x;
	this.state.y = model.y;
}

var BaloonView = function BaloonView() {
	ObjectView.call(this);
}

BaloonView.prototype = new ObjectView();
BaloonView.prototype.constructor = BaloonView;

BaloonView.prototype.init = function init(spec) {
	ObjectView.prototype.init.call(this, spec);
	
	this.state['size'] = spec.size;
}


BaloonView.prototype.render = function render(graphics) {
	graphics.beginPath();
	graphics.arc(this.state.x, this.state.y, this.state.size, 0, Math.PI*2, false);
	graphics.closePath();
	graphics.stroke();
}

var RemotePhysics = function RemotePhysics(canvas, stats) {
	var _self = this,
		_canvas = canvas,
		_stats = stats,
		_objectList = [],
		_objectMap = {},
		_socket,
		_selected = undefined;
		
	this.expose = {
		'newObject': {
			'eventHandler': '__api__newObject'
		},
		'updateObjects': {
			'eventHandler': '__api__updateObjects'
		},
	};
	
	this.init = function init() {
		_socket = new MSIOClient(null, 8085);
		
		_socket.connect(function() {
			_socket.addQueryObject('physicsWorld', _self);
			
			_socket.query('physicsWorld.join', {}, function(data) {
				console.dir(data);
				
				
				for(var i = 0, max = data.objects.length; i < max; i++) {
					var objectSpec = data.objects[i];
					
					console.dir(objectSpec);
					_self.addObject(objectSpec);
				}
				
				_self.initInput();
				setInterval(function() { _self.redraw(); }, 1000/30);
			});
		});
	}
	
	this.initInput = function initInput() {
		$(window).jkey('c',function(){
			_socket.query('physicsWorld.createBaloon', {}, function(data) {
				console.log("New object");
			});
		});
		
		window.onmousemove = function(event){
		};
		window.onmousedown = function(event){

		};
		window.onmouseup = function(event){
			var x = event.offsetX,
				y = event.offsetY;

		};
		window.onmousewheel = function(event){
			
		};
	}
	
	this.__api__newObject = function __api__newCircle(comInstance, args) {
		var spec = args;
		
		this.addObject(spec);
	}
	
	this.__api__updateObjects = function __api__updateObjects(comInstance, args) {
		var list = args,
			object,
			viewObject;
		
		for(var i = 0, max = list.length; i < max; i++) {
			object = list[i];
			
			viewObject = _objectMap[object.id];
			
			viewObject.updateView(object); 
		}
	}
	
	this.addObject = function addObject(spec) {
		var object;
		
		if('baloon' == spec.type) {
		 	object = new BaloonView();
		}
		else {
			throw new Error("Unknown object type: " + spec.type);
		}
		
		object.init(spec);
		
		_objectList.push(object);
		
		_objectMap[object.state.id] = object;
	}
	
	this.redraw = function redraw() {
		var graphics = _canvas.getContext('2d'),
			object;
		
		graphics.clearRect(0, 0, _canvas.width, _canvas.height);
		
		for(var i = 0, max = _objectList.length; i < max; i++) {
			object = _objectList[i];
			
			object.render(graphics);
		}
		
		_stats.update();
	}
}

function main() {
	var container = document.createElement('div'),
		canvas = document.createElement('canvas'),
		stats = new Stats(),
		remotePhysics;
	
	document.body.appendChild(container);
	
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	
	canvas.width = 740;
	canvas.height = 620;
	
	container.appendChild(stats.domElement);
	container.appendChild(canvas);
	
	remotePhysics = new RemotePhysics(canvas, stats);
	
	remotePhysics.init();
	
}

$(document).ready(function(){
	main();
});
