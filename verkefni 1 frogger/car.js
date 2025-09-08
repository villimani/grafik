// === Car setup ===
var carBuffers = [];
var carVertices = [];
var carPositions = [];
var carSpeeds = [];
var carLanes = [];
var carColors = [];
var secondCarCount = 0;

// 4 preset car colors (as arrays, not vec4 objects)
const carPalette = [
    [0.0, 0.0, 1.0, 1.0],   // blue
    [1.0, 0.0, 0.0, 1.0],   // red
    [1.0, 0.84, 0.0, 1.0],  // yellow
    [0.0, 0.6, 0.0, 1.0]    // green
];

function initCars(gl) {
    carBuffers = [];
    carVertices = [];
    carPositions = [];
    carSpeeds = [];
    carLanes = [];
    carColors = [];
    secondCarCount = 0;

    const laneSpeeds = [];
    for (let i = 1; i < roadRows - 1; i++) {
        laneSpeeds[i] = (Math.random() < 0.5 ? -1 : 1) * (0.005 + Math.random() * 0.008);
    }

    for (let i = 1; i < roadRows - 1; i++) {
        const y0 = -1.0 + i * rowHeight + 0.05;
        const y1 = y0 + rowHeight - lineHeight - 0.05;

        let lastColorIndex = -1;

        function getRandomColor() {
            let index;
            do { index = Math.floor(Math.random() * carPalette.length); }
            while (index === lastColorIndex);
            lastColorIndex = index;
            return carPalette[index];
        }

        // Right/left moving car
        const verts1 = [
            vec2(0.5, y0), vec2(1.0, y0), vec2(1.0, y1-0.05),
            vec2(0.5, y0), vec2(1.0, y1-0.05), vec2(0.5, y1-0.05)
        ];
        carVertices.push(verts1);
        carLanes.push(i);
        carPositions.push([0.0, 0.0]);
        carSpeeds.push(laneSpeeds[i]);
        carColors.push(getRandomColor());

        const buf1 = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(verts1), gl.STATIC_DRAW);
        carBuffers.push(buf1);

        // Optional second car
        if (secondCarCount < 2 && Math.random() < 0.5) {
            const verts2 = [
                vec2(-1.0, y0), vec2(-0.5, y0), vec2(-0.5, y1-0.05),
                vec2(-1.0, y0), vec2(-0.5, y1-0.05), vec2(-1.0, y1-0.05)
            ];
            carVertices.push(verts2);
            carLanes.push(i);
            carPositions.push([0.0, 0.0]);
            carSpeeds.push(laneSpeeds[i]);
            carColors.push(getRandomColor());

            const buf2 = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf2);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(verts2), gl.STATIC_DRAW);
            carBuffers.push(buf2);
            secondCarCount++;
        }
    }
}

// Draw and move cars
function drawCars(gl, vPosition, locColor, locOffset, locAngle) {
    gl.uniform1f(locAngle, 0.0);

    for (let i = 0; i < carBuffers.length; i++) {
        carPositions[i][0] += carSpeeds[i];

        if (carPositions[i][0] > 2) carPositions[i][0] = -2;
        if (carPositions[i][0] < -2) carPositions[i][0] = 2;

        gl.bindBuffer(gl.ARRAY_BUFFER, carBuffers[i]);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.uniform2fv(locOffset, flatten(carPositions[i]));
        gl.uniform4fv(locColor, flatten(carColors[i]));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

// Get bounding rectangle for a car
function getCarBounds(i) {
    const verts = carVertices[i];
    const offset = carPositions[i];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (let v of verts) {
        minX = Math.min(minX, v[0] + offset[0]);
        maxX = Math.max(maxX, v[0] + offset[0]);
        minY = Math.min(minY, v[1] + offset[1]);
        maxY = Math.max(maxY, v[1] + offset[1]);
    }

    return { left: minX, right: maxX, bottom: minY, top: maxY };
}
