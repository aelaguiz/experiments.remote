var Circle = function World (x,y,radius, id) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.id = id;
}

var RemoteCircles = function RemoteCircles(canvas, stats) {
	var _self = this,
		_canvas = canvas,
		_stats = stats,
		_circleList = [],
		_circleMap = {},
		_socket,
		_selected = undefined;
		
	this.expose = {
		'newCircle': {
			'eventHandler': '__api__newCircle'
		},
		'selectCircle': {
			'eventHandler': '__api__selectCircle'
		},
		'deselectCircle': {
			'eventHandler': '__api__deselectCircle'
		}
	};
	
	this.init = function init() {
		_socket = new MSIOClient(null, 8085);
		
		_socket.connect(function() {
			_socket.addQueryObject('circleWorld', _self);
			
			_socket.query('circleWorld.join', {}, function(data) {
				console.dir(data);
				
				for(var i = 0, max = data.circles.length; i < max; i++) {
					var circleSpec = data.circles[i];
					
					console.dir(circleSpec);
					_self.addCircle(circleSpec);
				}
				
				if(undefined !== data.selectedCircleId) {
					_selected = _circleMap[data.selectedCircleId];
				}
				
				_self.initInput();
				setInterval(function() { _self.redraw(); }, 1000/30);
			});
		});
	}
	
	this.initInput = function initInput() {
		$(window).jkey('c',function(){
			_socket.query('circleWorld.addCircle', {}, function(data) {
				console.log("New circle");
			});
		});
		
		window.onmousemove = function(event){
		};
		window.onmousedown = function(event){

		};
		window.onmouseup = function(event){
			var x = event.offsetX,
				y = event.offsetY;
				
			_socket.query('circleWorld.click', {'x': x, 'y': y}, function(data) {
			});
		};
		window.onmousewheel = function(event){
			
		};
	}
	
	this.__api__newCircle = function __api__newCircle(comInstance, args) {
		var circleSpec = args.circle;
		
		this.addCircle(circleSpec);
	}
	
	this.__api__selectCircle = function __api__selectCircle(comInstance, args) {
		var id = args.circleId;
		
		console.log("Selected circle: " + id);
		
		_selected = _circleMap[id];
	}
	
	this.__api__deselectCircle = function __api__deselectCircle(comInstance, args) {
		delete _selected;		
	}
	
	this.addCircle = function addCircle(circleSpec) {
		var circle = new Circle(circleSpec.x, circleSpec.y, circleSpec.radius, circleSpec.id);
		
		_circleList.push(circle);
		
		_circleMap[circle.id] = circle;
	}
	
	this.redraw = function redraw() {
		var graphics = _canvas.getContext('2d'),
			circle;
		
		graphics.clearRect(0, 0, _canvas.width, _canvas.height);
		
		for(var i = 0, max = _circleList.length; i < max; i++) {
			circle = _circleList[i];
			
			graphics.beginPath();
			graphics.arc(circle.x, circle.y, circle.radius, 0, Math.PI*2, false);
			graphics.closePath();
			graphics.stroke();
			
			if(circle === _selected) {
				graphics.fillStyle = 'rgba(255,0,0,0.2)';
				graphics.fill();
			}			
		}
		
		_stats.update();
	}
}

function main() {
	var container = document.createElement('div'),
		canvas = document.createElement('canvas'),
		stats = new Stats(),
		remoteCircles;
	
	document.body.appendChild(container);
	
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	
	canvas.width = 740;
	canvas.height = 620;
	
	container.appendChild(stats.domElement);
	container.appendChild(canvas);
	
	remoteCircles = new RemoteCircles(canvas, stats);
	
	remoteCircles.init();
	
}

$(document).ready(function(){
	main();
});
