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
		_circles = [],
		_socket;
		
	this.expose = {
		'newCircle': {
			'eventHandler': '__api__newCircle'
		}
	};
	
	this.init = function init() {
		_socket = new MSIOClient(null, 8085);
		
		_socket.connect(function() {
			_socket.addQueryObject('world', _self);
			
			_socket.query('world.join', {}, function(data) {
				console.dir(data);
				
				for(var i = 0, max = data.length; i < max; i++) {
					var circleSpec = data[i];
					
					console.dir(circleSpec);
					_self.addCircle(circleSpec);
				}
				
				console.log("Connected");
				
				_self.initInput();
				setInterval(function() { _self.redraw(); }, 1000/30);
			});
		});
	}
	
	this.initInput = function initInput() {
		$(window).jkey('c',function(){
			_socket.query('world.addCircle', {}, function(data) {
				console.log("New circle");
			});
		});
	}
	
	this.__api__newCircle = function __api__newCircle(comInstance, args) {
		var circleSpec = args.circle;
		
		this.addCircle(circleSpec);
	}
	
	this.addCircle = function addCircle(circleSpec) {
		var circle = new Circle(circleSpec.x, circleSpec.y, circleSpec.radius, circleSpec.id);
		
		_circles.push(circle);
	}
	
	this.redraw = function redraw() {
		var graphics = _canvas.getContext('2d'),
			circle;
		
		graphics.clearRect(0, 0, _canvas.width, _canvas.height);
		
		for(var i = 0, max = _circles.length; i < max; i++) {
			circle = _circles[i];
			
			graphics.beginPath();
			graphics.arc(circle.x, circle.y, circle.radius, 0, Math.PI*2, false);
			graphics.closePath();
			graphics.stroke();			
		}
		
		_stats.update();
	}
}

function main() {
	var container = document.createElement('div'),
		canvas = document.createElement('canvas'),
		stats = new Stats(),
		threeBox;
	
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
