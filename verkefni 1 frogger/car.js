// === Car setup ===
var carBuffers = [];
var carVertices = [];
var carPositions = [];
var carSpeeds = [];
var carLanes = [];
var carColor = vec4(0.0, 0.0, 1.0, 1.0); // Blue cars
var secondCarCount = 0;

function initCars(gl) {
    carBuffers = [];
    carVertices = [];
    carPositions = [];
    carSpeeds = [];
    carLanes = [];
    secondCarCount = 0;

    // Assign a speed per lane first
    const laneSpeeds = [];
    const laneDirections = [];
    for (let i = 1; i < roadRows - 1; i++) {
        laneSpeeds[i] = 0.006 + Math.random() * 0.01; // speed
        laneDirections[i] = (i % 2 === 0) ? 1 : -1; // even lanes → right, odd → left
    }

    for (let i = 1; i < roadRows - 1; i++) {
        const y0 = -1.0 + i * rowHeight + 0.05;
        const y1 = y0 + rowHeight - lineHeight - 0.05;

        const dir = laneDirections[i];

        // Main car
        let vertsMain;
        if (dir === 1) { // right
            vertsMain = [
                vec2(0.5, y0), vec2(1.0, y0), vec2(1.0, y1-0.05),
                vec2(0.5, y0), vec2(1.0, y1-0.05), vec2(0.5, y1-0.05)
            ];
        } else { // left
            vertsMain = [
                vec2(-1.0, y0), vec2(-0.5, y0), vec2(-0.5, y1-0.05),
                vec2(-1.0, y0), vec2(-0.5, y1-0.05), vec2(-1.0, y1-0.05)
            ];
        }

        carVertices.push(vertsMain);
        carLanes.push(i);
        carPositions.push([0.0, 0.0]);
        carSpeeds.push(laneSpeeds[i] * dir);

        const bufMain = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufMain);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertsMain), gl.STATIC_DRAW);
        carBuffers.push(bufMain);

        // Optional second car (max 2)
        if (secondCarCount < 2 && Math.random() < 0.5) {
            let vertsSecond;
            if (dir === 1) { // right
                vertsSecond = [
                    vec2(-1.0, y0), vec2(-0.5, y0), vec2(-0.5, y1-0.05),
                    vec2(-1.0, y0), vec2(-0.5, y1-0.05), vec2(-1.0, y1-0.05)
                ];
            } else { // left
                vertsSecond = [
                    vec2(0.5, y0), vec2(1.0, y0), vec2(1.0, y1-0.05),
                    vec2(0.5, y0), vec2(1.0, y1-0.05), vec2(0.5, y1-0.05)
                ];
            }

            carVertices.push(vertsSecond);
            carLanes.push(i);
            carPositions.push([0.0, 0.0]);
            carSpeeds.push(laneSpeeds[i] * dir);

            const bufSecond = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, bufSecond);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(vertsSecond), gl.STATIC_DRAW);
            carBuffers.push(bufSecond);

            secondCarCount++;
        }
    }
}

// Draw and move cars
function drawCars(gl, vPosition, locColor, locOffset, locAngle) {
    gl.uniform1f(locAngle, 0.0); // cars do not rotate

    for (let i = 0; i < carBuffers.length; i++) {
        carPositions[i][0] += carSpeeds[i];

        // Loop cars
        if (carSpeeds[i] > 0 && carPositions[i][0] > 2) carPositions[i][0] = -2;
        if (carSpeeds[i] < 0 && carPositions[i][0] < -2) carPositions[i][0] = 2;

        gl.bindBuffer(gl.ARRAY_BUFFER, carBuffers[i]);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.uniform2fv(locOffset, flatten(carPositions[i]));
        gl.uniform4fv(locColor, flatten(carColor));
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
