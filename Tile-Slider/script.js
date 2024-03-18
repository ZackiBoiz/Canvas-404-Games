

/*
Todo:

[x] - Resize images to fit 

*/


Math.clamp = (min, num, max) => {
	return Math.min(Math.max(num, min), max);
};
Math.rand = (min, max, round = false) => {
	var rand = Math.random() * (max - min) + min;
	if (round) {
		rand = Math.round(rand);
	}
	return rand;
};
Math.randBool = () => {
	return Math.random() >= 0.5;
};

function shuffle(array) {
	// O(n^2)
	let flattened = array.flat();
	for (var i = flattened.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		[flattened[i], flattened[j]] = [flattened[j], flattened[i]];
	}
	var empty1d = flattened.indexOf(0);
	empty_at = {
		row: Math.floor(empty1d / array.length),
		col: empty1d % array.length,
	};

	// Now, we'll restructure the 1D array back into a 2D array
	let result = [];
	for (var i = 0; i < array.length; i++) {
		var row = flattened.splice(0, array.length);
		result.push(row);
	}

	return isSolvable(result) ? result : shuffle(array);
}

function isSolvable(tiles) {
	// O(n^2)
	var arr1d = [].concat(...tiles);
	var arr = arr1d.map(tile => {
		return tile.num ?? 0;
	});

	var length = tiles.length;
	var invCount = 0;
	for (let i = 0; i < arr.length - 1; i++) {
		for (let j = i + 1; j < arr.length; j++) {
			if (arr[j] && arr[i] && arr[i] > arr[j]) {
				invCount++;
			}
		}
	}

	var blank = 0;
	for (var i = length - 1; i >= 0; i--) {
		for (var j = length - 1; j >= 0; j--) {
			if (tiles[i][j] === 0) {
				blank = length - i;
			}
		}
	}

	var possible = false;
	if (length % 2 === 1) {
		// For odd grid width, solvable if inversions are even
		possible = invCount % 2 === 0;
	} else {
		// For even grid width, check the position of the blank tile
		if (blank % 2 === 1) {
			// If blank is on an odd row from the bottom, inversions should be even
			possible = invCount % 2 === 0;
		} else {
			// If blank is on an even row from the bottom, inversions should be odd
			possible = invCount % 2 === 1;
		}
	}

	return possible;
}

function updateTiles(tile_divs) {
	// O(n^2)
	for (var i = 0; i < tile_divs.length; i++) {
		for (var j = 0; j < tile_divs[0].length; j++) {
			var instance = tile_divs[i][j];
			if (instance?.num) {
				var elem = document.querySelector(`#tile-${instance.num}`);
				elem.style.left = `${j * instance.width}px`;
				elem.style.top = `${i * instance.height}px`;
			}
		}
	}
	move_counter.innerHTML = moves;
}

function initializeTiles(tile_container, tile_divs) {
	// O(n^2)
	tile_divs.push([]);
	var row = 0;
	var col = 0;
	for (var i = 0; i < (tiles_per_row ** 2); i++) {
		if (i % tiles_per_row == 0 && i != 0) {
			col = 0;
			row++;
			tile_divs.push([]);
		}

		var tile_div = {
			num: i + 1,
			width: tile_width,
			height: tile_height,
			cut_x: -col * tile_width,
			cut_y: -row * tile_height,
			row: row,
			col: col,
		};

		col++;

		tile_divs[row].push(tile_div);
	}
	tile_divs[tile_divs.length - 1][tile_divs[0].length - 1] = 0;

	var tile_div = "";
	for (var i = 0; i < tile_divs.length; i++) {
		for (var j = 0; j < tile_divs[0].length; j++) {
			var instance = tile_divs[i][j];
			if (instance?.num) {
				tile_div += `
					<div class="tile" id="tile-${instance.num}" style="width: ${instance.width}px; height: ${instance.height}px; background: url(${background}) ${instance.cut_x}px ${instance.cut_y}px; font-size: ${tile_width / 4}px;">
						${instance.num}
					</div>
				`;
			}
		}
	}
	tile_container.innerHTML = tile_div;

	return tile_divs;
}

function evaluatePress(row, col) {
	// O(1)
	var from_row = empty_at.row - row;
	var from_col = empty_at.col - col
	var tile_to = tile_divs[empty_at.row][empty_at.col];
	var tile_from = tile_divs[from_row][from_col];
	if (tile_from) {
		[tile_divs[empty_at.row][empty_at.col], tile_divs[from_row][from_col]] = [tile_divs[from_row][from_col], tile_divs[empty_at.row][empty_at.col]]; // swap tiles
		empty_at = {
			row: empty_at.row - row,
			col: empty_at.col - col
		};

		moves++;
		updateTiles(tile_divs);
	}
}

function startGame(tiles_per_row) {
	// O(1)
	moves = 0;
	if (tile_divs.length != tiles_per_row || new_upload) {
		tile_width = bounds.width / tiles_per_row * 0.99;
		tile_height = bounds.height / tiles_per_row * 0.99;
		tile_divs = [];

		tile_divs = shuffle(initializeTiles(tile_container, tile_divs));
		grid_size.value = tiles_per_row;
		new_upload = false;
		upload_text.innerHTML = "Waiting for new image...";	
	} else {
		tile_divs = shuffle(tile_divs);
	}

	updateTiles(tile_divs);
}

const tile_container = document.querySelector("#tiles");
const move_counter = document.querySelector("#moves");
const grid_size = document.querySelector("#size");
const apply_changes = document.querySelector("#apply");
const solve = document.querySelector("#solve");
const upload_trigger = document.querySelector("#upload-trigger");
const upload = document.querySelector("#upload");
const upload_text = document.querySelector("#upload-text");
const bounds = tile_container.getBoundingClientRect();


var background = "./solution.png";
var new_upload = false;
var solving = false;
var tiles_per_row = 4;
var tile_width = bounds.width / tiles_per_row * 0.99; // overflow protection
var tile_height = bounds.height / tiles_per_row * 0.99;
var tile_divs = [];
var empty_at = {};
var moves = 0;

startGame(tiles_per_row);

grid_size.addEventListener("change", e => {
	tiles_per_row = grid_size.value;
});
apply_changes.addEventListener("click", e => {
	startGame(tiles_per_row);
});
solve.addEventListener("click", e => {
	return alert("nope");
	
	var valid_moves = [];
	var move = 1;
	var first = Math.randBool();
	evaluatePress(first ? move : 0, first ? 0 : move);
});
upload_trigger.addEventListener("click", e => {
	upload.click();
});
upload.addEventListener("change", e => {
	if (upload.files && upload.files[0]) {
		background = URL.createObjectURL(upload.files[0]);
		upload_text.innerHTML = "Uploaded file.";	
		new_upload = true;
	}
});

var keys = [];
document.addEventListener("keydown", e => {
	if (!keys[e.key] && document.activeElement == document.body) { // make sure not focused on inputs
		keys[e.key] = true;

		switch (e.key) {
			case "ArrowUp":
				evaluatePress(-1, 0);
				break;
			case "ArrowDown":
				evaluatePress(1, 0);
				break;
			case "ArrowLeft":
				evaluatePress(0, -1);
				break;
			case "ArrowRight":
				evaluatePress(0, 1);
				break;
		}
	}
});
document.addEventListener("keyup", e => {
	keys[e.key] = false;
});