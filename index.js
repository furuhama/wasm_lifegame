import { Universe } from "./wasm_lifegame";
import { memory } from "./wasm_lifegame_bg";

const CELL_SIZE = 5;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

// these should be the same number as it defined in Rust
const DEAD = 0;
const ALIVE = 1;

// construct Universe, and get its width & height
const universe = Universe.new();
const width = universe.width();
const height = universe.height();

// Add 1px border around each of all cells
const canvas = document.getElementById("lifegame-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;
const context = canvas.getContext('2d');

let animationId = null;

const fps = new class {
    constructor() {
        this.fps = document.getElementById("fps");
        this.frames = [];
        this.lastFrameTimeStamp = performance.now();
    }

    render() {
        const now = performance.now();
        const delta = now - this.lastFrameTimeStamp;
        this.lastFrameTimeStamp = now;
        const fps = 1 / delta * 1000;

        this.frames.push(fps);
        if (this.frames.length > 100) {
            this.frames.shift();
        }

        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        for (let i = 0; i < this.frames.length; i++) {
            sum += this.frames[i];
            min = Math.min(this.frames[i], min);
            max = Math.max(this.frames[i], max);
        }
        let mean = sum / this.frames.length;

        this.fps.textContent = `
Frames per Second:
         latest = ${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(max)}
`.trim();
    }
};

// main function
const renderLoop = () => {
    // profiling codes
    // if you do not want to profile,
    // just run `universe.tick()` (don't need fps instance & for loop)
    // fps.render();

    // for (let i = 0; i < 9; i++) {
    //     universe.tick();
    // }

    universe.tick();

    drawGrid();
    drawCells();

    animationId = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
    context.beginPath();
    context.lineWidth = 1 / window.devicePixelRatio;
    context.strokeStyle = GRID_COLOR;

    for (let i = 0; i <= width; i++) {
        context.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        context.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    for (let j = 0; j <= height; j++) {
        context.moveTo(0, j * (CELL_SIZE + 1) + 1);
        context.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    context.stroke();
};

const drawCells = () => {
    const cellPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellPtr, width * height);

    context.beginPath();

    // for (let row = 0; row < height; row++) {
    //     for (let col = 0; col < width; col++) {
    //         const index = getIndex(row, col);

    //         context.fillStyle = cells[index] === DEAD ? DEAD_COLOR : ALIVE_COLOR;

    //         context.fillRect(
    //             col * (CELL_SIZE + 1) + 1,
    //             row * (CELL_SIZE + 1) + 1,
    //             CELL_SIZE,
    //             CELL_SIZE
    //         );
    //     }
    // }

    // fillStyle() is expensive process, so try to improve performance

    context.fillStyle = ALIVE_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const index = getIndex(row, col);
            if (cells[index] !== ALIVE) {
                continue;
            }

            context.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    context.fillStyle = DEAD_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const index = getIndex(row, col);
            if (cells[index] !== DEAD) {
                continue;
            }

            context.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    context.stroke();
};

const getIndex = (row, column) => {
    return row * width + column;
};

// functions for play-pause button
const playPauseButton = document.getElementById("play-pause");

const play = () => {
    playPauseButton.textContent = "⏸";
    renderLoop();
};

const pause = () => {
    playPauseButton.textContent = "▶️";
    cancelAnimationFrame(animationId);
    animationId = null;
};

playPauseButton.addEventListener("click", event => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
});

const isPaused = () => {
    return animationId === null;
};

// toggle cell status by clicking on browser
canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    universe.toggle_cell(row, col);

    drawGrid();
    drawCells();
});

// run main function
// requestAnimationFrame(renderLoop);
play();
