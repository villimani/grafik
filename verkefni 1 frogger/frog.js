var color = vec4(0.07, 0.63, 0.19, 1.0); 
var frogBuffer, eyeBuffer;

var currentOffset = vec2(0.0, -0.85);
var targetOffset = vec2(0.0, -0.85);
var angle = 0.0;

var vertices = [
    vec2(-0.08, -0.10),  
    vec2(0.0, 0.10),     
    vec2(0.08, -0.10)    
];

var eyeVertices = [
    vec2(-0.03, 0.03),
    vec2(0.03, 0.03)
];

var minX = -0.08, maxX = 0.08, minY = -0.10, maxY = 0.10;

var gridStepY = 2.0 / 7;
var gridStepX = 0.2;     
var moveDuration = 150;
var moveStartTime = 0;
var isMoving = false;

function initFrog(gl) {
    frogBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, frogBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    eyeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(eyeVertices), gl.STATIC_DRAW);
}

function getFrogVerticesWorld() {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return vertices.map(v => vec2(
        v[0]*cosA - v[1]*sinA + currentOffset[0],
        v[0]*sinA + v[1]*cosA + currentOffset[1]
    ));
}

function drawFrog(gl, vPosition, locColor, locOffset, locAngle) {
    gl.bindBuffer(gl.ARRAY_BUFFER, frogBuffer);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.uniform2fv(locOffset, flatten(currentOffset));
    gl.uniform1f(locAngle, angle);
    gl.uniform4fv(locColor, flatten(color));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Eyes
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeBuffer);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.uniform4fv(locColor, flatten(vec4(0,0,0,1)));
    gl.drawArrays(gl.POINTS, 0, 2);
}
