var topBarCount = 0;   
var topBarMax   = 10;
var lastRow     = 0;

function updatePoints(frogY) {
    const rowHeight = 2.0 / roadRows;
    const rowIndex = Math.floor((frogY + 1.0) / rowHeight);

    if (rowIndex >= roadRows - 1 && lastRow < roadRows - 1) {
        if (topBarCount < topBarMax) {
            topBarCount++;  

            setTimeout(() => {
                currentOffset = vec2(0.0, -0.85);
                targetOffset  = vec2(0.0, -0.85);
                angle = 0.0;
                isMoving = false;
            }, 200); 
        }
        lastRow = rowIndex;

        if (topBarCount === topBarMax) {
            alert("You win!");
            topBarCount = 0;   
            lastRow = 0;
        }
    }

    if (rowIndex !== lastRow) {
        lastRow = rowIndex;
    }
}

function drawPoints(gl, locColor, vPosition) {
    const barHeight = 0.05;
    const barWidth  = 0.18;
    const startX    = -0.95;
    const startY    = 0.95;

    for (let i = 0; i < topBarCount; i++) {
        drawBarSegment(
            gl,
            locColor,
            vPosition,
            startX + i * (barWidth + 0.01),
            startY,
            barWidth,
            barHeight,
            vec4(0.6, 1.0, 0.6, 1.0)
        );
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

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.uniform2fv(locOffset, flatten(vec2(0.0, 0.0))); 
    gl.uniform4fv(locColor, flatten(color));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
