/**
 * TODO:
 * 1. Makan [DONE]
 *   - Circle Collider 
 *   - Membesar
 * 2. Belah Diri [Work in Progress...]
 *    Note: vpOffset[XY] harus diganti, 
 *          karena cam ngebug kalo di pinggir dan 'agar'nya lebih dari satu
 *   - Upil Pemecah
 *   - Tembak Pecahan
 *   - Kontrol Pecahan
 */
$(function() {
	const DEBUG = true;

	const MAX_X = 3000;
	const MAX_Y = 3000;

	const MAX_SPEED = 32;
	const SPEED_CONST = 1;
	const MAX_ASTRAY_DISTANCE = 100;

	const INIT_SIZE = 6;
	const MIN_SIZE = 3;
	const MAX_SIZE_INCREASE = 5;

	const MAX_LADA = 1000;
	const MAX_LADA_SIZE = 2;

	var currentAgar;
	var agars = [];
	var ladas = [];

	function randInt(min, max)
	{
		return Math.round(Math.random()*(max-min)+min);
	}

/**
 * AGAR CLASS
 */
	function Agar(x, y, size)
	{
		this.x = x;
		this.y = y;
		this.speedX = 0;
		this.speedY = 0;
		this.speedDivisor = 50;
		this.size = size;
	}

	Agar.prototype.render = function(g, offsetX, offsetY) {
		g.beginPath();
		g.arc(this.x - offsetX, this.y - offsetY, this.size*2, 0, Math.PI*2);
		g.strokeStyle = "black";
		g.stroke();
		g.fillStyle = "blue";
		g.fill();
		g.closePath();
	};

	Agar.prototype.update = function() {
		this.speedDivisor = (this.size * 2) / SPEED_CONST;
		var astrayDistance = (Math.sqrt(Math.pow((this.x - currentAgar.x), 2) + Math.pow((this.y - currentAgar.y), 2)));
		this.x += this.speedX / this.speedDivisor;
		this.y += this.speedY / this.speedDivisor;


		if(this.x-this.size < 0)
			this.x = this.size;
		else if(this.x+this.size >= MAX_X)
			this.x = MAX_X-this.size;

		if(this.y-this.size < 0)
			this.y = this.size;
		else if(this.y+this.size < 0)
			this.y = MAX_Y-this.size;
	};

	Agar.prototype.split = function() {
		if (this.size <= MIN_SIZE)
			return;
		var newSize = Math.round(this.size / 2);
		var newX = (Math.random() < 0.5 ? -1 : 1) * (newSize) * 2;
		var newY = (Math.random() < 0.5 ? -1 : 1) * (newSize) * 2;
		agars.push(new Agar(currentAgar.x - newX, currentAgar.y - newY, newSize));
		this.size -= newSize;
		this.x += newX;
		this.y += newY;
	};

	Agar.prototype.checkCollide = function() {
		for (var i = 0; i < ladas.length; i++) {
			var distance = (Math.sqrt(Math.pow((this.x - ladas[i].x), 2) + Math.pow((this.y - ladas[i].y), 2)));
			if (distance <= this.size*2 + ladas[i].size*2) {
				if (DEBUG) {
					console.log("Agar - Size: " + this.size*2 + ", X: " + Math.round(this.x) + ", Y: " + Math.floor(this.y));
					console.log("Lada - Size: " + ladas[i].size*2 + ", X: " + ladas[i].x + ", Y: " + ladas[i].y);
					console.log("Eucledian distance: " + distance);
				}
				if (this.size >= ladas[i].size) {
					var divisor = this.size - ladas[i].size;
					divisor = (divisor <= 0 ? 1 : divisor);
					for (var j = 0; j < agars.length; j++)
						agars[j].size += (MAX_SIZE_INCREASE / divisor) / agars.length;
					ladas.splice(i, 1);
				}
			}
		}
		for (var i = 0; i < agars.length; i++) {
			if (this == agars[i] || agars[i] == currentAgar) continue;
			var distance = (Math.sqrt(Math.pow((this.x - agars[i].x), 2) + Math.pow((this.y - agars[i].y), 2)));
			if (distance <= this.size + (this.size - ladas[i].size)) {
				if (DEBUG) {
					console.log("Agar - Size: " + this.size*2 + ", X: " + Math.round(this.x) + ", Y: " + Math.floor(this.y));
					console.log("Agar - Size: " + ladas[i].size*2 + ", X: " + ladas[i].x + ", Y: " + ladas[i].y);
					console.log("Eucledian distance: " + distance);
				}
				this.size += agars[i].size;
				agars.splice(i, 1);
			}
		}
	}

/**
 * LADA
 */
	function Lada(x, y)
	{
		this.x = x;
		this.y = y;
		this.size = randInt(1, MAX_LADA_SIZE);
		this.r = Math.round(Math.random() * 255);
		this.g = Math.round(Math.random() * 255);
		this.b = Math.round(Math.random() * 255);
	}

	Lada.prototype.render = function(g, offsetX, offsetY) {
		g.beginPath();
		g.arc(this.x - offsetX, this.y - offsetY, this.size*2, 0, Math.PI*2);
		g.fillStyle = "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
		g.fill();
		g.closePath();
	};

/**
 * CANVAS HANDLING
 */
	var canvas = $('#game');
	var graphics = canvas[0].getContext('2d');

	var mouseX, mouseY;
	var vpOffsetX, vpOffsetY;
	var mouseInside = false;

	var startX = randInt(0, MAX_X);
	var startY = randInt(0, MAX_Y);

	vpOffsetX = startX > canvas.width()/2 ? startX-canvas.width()/2 : 0;
	vpOffsetY = startY > canvas.height()/2 ? startY-canvas.height()/2 : 0;

	currentAgar = new Agar(startX, startY, INIT_SIZE);
	agars.push(currentAgar);

	function generate()
	{
		for(var i = ladas.length; i < MAX_LADA; i++)
			ladas.push(new Lada(randInt(0, MAX_X), randInt(0, MAX_Y)));
	}

	function updateAll()
	{
		requestAnimationFrame(updateAll);
		graphics.clearRect(0, 0, canvas.width(), canvas.height());
		
		generate();
		
		for(var i=0; i<ladas.length; i++)
			ladas[i].render(graphics, vpOffsetX, vpOffsetY);

		for(var i=0; i<agars.length; i++)
		{
			agars[i].render(graphics, vpOffsetX, vpOffsetY);
			agars[i].update();
			if(mouseInside)
			{
				agars[i].speedX = Math.min(Math.max((mouseX + vpOffsetX) - currentAgar.x , -MAX_SPEED), MAX_SPEED);
				agars[i].speedY = Math.min(Math.max((mouseY + vpOffsetY) - currentAgar.y , -MAX_SPEED), MAX_SPEED);
			} else
			{
				agars[i].speedX = 0;
				agars[i].speedY = 0;
			}
			agars[i].checkCollide();

		}

		vpOffsetX = currentAgar.x - canvas.width()/2;
		vpOffsetY = currentAgar.y - canvas.height()/2;
		if(vpOffsetX < 0)
			vpOffsetX = 0;
		else if(vpOffsetX > MAX_X-canvas.width())
			vpOffsetX = MAX_X-canvas.width();

		 if(vpOffsetY < 0)
			vpOffsetY = 0;
		else if(vpOffsetY > MAX_Y-canvas.height())
			vpOffsetY = MAX_Y-canvas.height();   

	};

	canvas.keypress(function(event) {
		var length = agars.length;
		if (event.keyCode == 32)
			for (var i = 0; i < length; i++)
				agars[i].split();
	});
	
	canvas.mousemove(function(e) {
		mouseX = e.offsetX;
		mouseY = e.offsetY;
	});

	canvas.mouseenter(function(e) {
		mouseInside = true;
	});

	canvas.mouseleave(function(e) {
		mouseInside = false;
	});

	requestAnimationFrame(updateAll);
	canvas.focus();
});