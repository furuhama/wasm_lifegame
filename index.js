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

// main function
const renderLoop = () => {
    universe.tick();

    drawGrid();
    drawCells();

    requestAnimationFrame(renderLoop);
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

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const index = getIndex(row, col);

            context.fillStyle = cells[index] === DEAD ? DEAD_COLOR : ALIVE_COLOR;

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

// run main function
requestAnimationFrame(renderLoop);
