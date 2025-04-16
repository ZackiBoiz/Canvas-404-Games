Math.clamp = (min, num, max) => {
	return Math.min(Math.max(num, min), max);
};
Math.rand = (min, max) => {
	return Math.random() * (max - min) + min;
}
Math.randint = (min, max) => {
	return Math.floor(Math.rand(min, max));
};
Math.randBool = () => {
	return Math.random() >= 0.5;
};

function playAudio(track) {
	var audio = new Audio(track);
	audio.play();
}

function clear() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameOver() {
	clearInterval(game);
	walls = {};
	alive = false;
}

function updateConsole() {
	document.querySelector("#console").innerHTML = `
		Walls: ${Object.keys(walls).length}<br>
		Walls Spawned: ${walls_spawned}<br>
		Goals Hit: ${goals}<br>
		Score: ${score}<br>
		Deaths: ${deaths}<br>
		Player Coords: (${player.x}, ${player.y})<br>
		Goal Coords: (${goal.x}, ${goal.y})<br>
		Update Rate: ${ms}ms/frame<br>
		Wall Spawn Rate: ${spawn_frequency}pts/wall (${ms * spawn_frequency}ms)<br>
	`;
}

function createGoal() {
	var w = 30;
	var h = 30;
	goal = new Goal({
		x: Math.randint(0, WIDTH - w),
		y: 0,
		w: w,
		h: h,
		canvas: canvas,
		ctx: ctx,
		color: "#0b874b"
	});
	goal.draw();
}

function playGame() {
	score = 0;
	walls = {};
	alive = true;
	createGoal();

	player = new Player({
		x: player_x,
		y: player_y,
		w: player_width,
		h: player_width,
		max_speed: player_speed,
		canvas: canvas,
		ctx: ctx,
		color: "#0374b5" // canvas square player color
	});

	game = setInterval(() => {
		if (keys.ArrowUp || keys.w) {
			dy = -player.max_speed;
		}
		if (keys.ArrowDown || keys.s) {
			dy = player.max_speed;
		}
		if (keys.ArrowLeft || keys.a) {
			dx = -player.max_speed;
		}
		if (keys.ArrowRight || keys.d) {
			dx = player.max_speed;
		}

		clear();
		goal.draw();

		if (score % spawn_frequency == 0) {
			var negative = Math.randBool();
			var max_speed = Math.rand(min_wall_speed, max_wall_speed) * (negative ? -1 : 1);
			var wall = new Wall({
				x: max_speed > 0 ? Math.rand(-offset_x, offset_x) : Math.rand(WIDTH - offset_x, WIDTH + offset_x),
				y: Math.randint(-offset_y, HEIGHT + offset_y),
				w: 20,
				h: 20,
				max_speed: max_speed,
				canvas: canvas,
				ctx: ctx,
				color: "#6b7780"
			});
			walls[wall.id] = wall;
			walls_spawned++;
		}
		for (var wall of Object.values(walls)) {
			wall.move({
				dx: wall.max_speed,
				bounds: false
			});

			var near_x = Math.abs(player.x - wall.x);
			var near_y = Math.abs(player.y - wall.y);

			if (near_x < player.w - hitbox_free_x && near_y < player.h - hitbox_free_y) {
				gameOver();
			}

			if (wall.x < -offset_x || wall.x > WIDTH + offset_x) {
				delete walls[wall.id];
			}

			wall.draw();
		}

		player.move({
			dx: Math.round(dx),
			dy: Math.round(dy),
			bounds: true
		});
		dx *= drift;
		dy *= drift;

		var near_x = Math.abs(player.x - goal.x);
		var near_y = Math.abs(player.y - goal.y);
		if (near_x < player.w && near_y < player.h) {
			score += score_add;
			//playAudio("./yipee.mp3");
			goals++;
			createGoal();

			player.goTo({
				x: player_x,
				y: player_y
			});
		}

		player.draw();

		score++;
		document.querySelector("#score").textContent = score;
		updateConsole();

		if (!alive) {
			clear();
			//playAudio("./die.mp3");
			dx = 0;
			dy = 0;
			deaths++;
			updateConsole();
			return;
		}
	}, ms);
}

class Rect {
	constructor({...data}) {
		var { x, y, w, h, ctx, canvas, color } = data;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.color = color
		this.ctx = ctx;
		this.canvas = canvas;
	}

	goTo({...data}) {
		var { x, y } = data;
		this.x = x;
		this.y = y;
	}

	draw() {
		this.ctx.fillStyle = this.color;
		this.ctx.fillRect(this.x, this.y, this.w, this.h);
	}
}

class MovingObject extends Rect {
	constructor({...data}) {
		super(data);
		this.max_speed = data.max_speed;
	}

	move({...data}) {
		var { dx, dy, bounds } = data;
		if (dx) {
			if (bounds) {
				this.x = Math.clamp(-offset_x, this.x + dx, (WIDTH - this.w) + offset_x);
			} else {
				this.x += dx;
			}
		}
		if (dy) {
			if (bounds) {
				this.y = Math.clamp(-offset_y, this.y + dy, (HEIGHT - this.h) + offset_y);
			} else {
				this.y += dy;
			}
		}
	}
}

class Player extends MovingObject {
	constructor({...data}) {
		super(data);
	}
}

class Wall extends MovingObject {
	constructor({...data}) {
		super(data);
		this.id = Math.random().toString(36).slice(-8);
	}
}

class Goal extends Rect {
	constructor({...data}) {
		super(data);
	}
}

const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width = 180; //180
const HEIGHT = canvas.height = 600; //720
const bounds = canvas.getBoundingClientRect();
const offset_x = 10;
const offset_y = 10;
const hitbox_free_x = 5;
const hitbox_free_y = 5;
const max_wall_speed = 7;
const min_wall_speed = 1;
const spawn_frequency = 5; // x points per wall
const player_width = 30;
const player_x = (WIDTH / 2) - (player_width / 2);
const player_y = HEIGHT - player_width;
const player_speed = 7;
const score_add = 13100;
const ms = 25;
const drift = 0.4;

var keys = {};
var walls = {};
var score = 0;
var goals = 0;
var walls_spawned = 0;
var deaths = 0;

var player = null;
var goal = null;
var alive = false;
var game = null;

var dx = 0;
var dy = 0;


document.addEventListener("keydown", (e) => {
	keys[e.key] = true;
	if (e.key == " " && !alive) {
		playGame();
	}
});
document.addEventListener("keyup", (e) => {
	keys[e.key] = false;
});
