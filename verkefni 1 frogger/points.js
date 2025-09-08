// Points system
var topBarCount = 10;    // total segments in top bar
var bottomBarCount = 0;  // filled segments in bottom bar
var topBarMax = 10;
var bottomBarMax = 10;
var lastRow = 0;         // track the frog's last row

function updatePoints(frogY) {
    // Determine which row frog is in
    const rowHeight = 2.0 / roadRows;
    const rowIndex = Math.floor((frogY + 1.0) / rowHeight);

    // Check if frog moved to top row
    if (rowIndex >= roadRows - 1 && lastRow < roadRows - 1) {
        if (topBarCount > 0) topBarCount--;
        lastRow = rowIndex;
    }

    // Check if frog moved back to bottom row
    if (rowIndex <= 0 && lastRow > 0) {
        if (bottomBarCount < bottomBarMax) bottomBarCount++;
        lastRow = rowIndex;
    }

    // Check for win condition
    if (topBarCount === 0 && bottomBarCount === bottomBarMax) {
        alert("You win!");
        // reset bars for next round
        topBarCount = topBarMax;
        bottomBarCount = 0;
        lastRow = 0;
    }
}

function drawPoints(gl, locColor, vPosition) {
    const barHeight = 0.05;
    const barWidth = 0.18;

    // Top bar (light green)
    for (let i = 0; i < topBarCount; i++) {
        drawBarSegment(gl, locColor, vPosition, -0.9 + i * (barWidth + 0.01), 0.95, barWidth, barHeight, vec4(0.6, 1.0, 0.6, 1.0));
    }

    // Bottom bar (light red)
    for (let i = 0; i < bottomBarCount; i++) {
        drawBarSegment(gl, locColor, vPosition, -0.9 + i * (barWidth + 0.01), -1.0 + 0.01, barWidth, barHeight, vec4(1.0, 0.6, 0.6, 1.0));
    }
}

function drawBarSegment(gl, locColor, vPosition, x, y, width, height, color) {
    const verts = [
        vec2(x, y),
        vec2(x + width, y),
        vec2(x + width, y + height),
        vec2(x, y),
        vec2(x + width, y + height),
        vec2(x, y + height)
    ];

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(verts), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.uniform2fv(locOffset, flatten(vec2(0.0, 0.0))); // bar stays fixed
    gl.uniform4fv(locColor, flatten(color));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
