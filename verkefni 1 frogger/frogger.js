var gl;
var color = vec4(0.07, 0.63, 0.19, 1.0); // frog green
var locColor, locOffset, locAngle;
var vPosition;

var frogBuffer, eyeBuffer;
var currentOffset = vec2(0.0, -0.8);
var targetOffset = vec2(0.0, -0.8);
var angle = 0.0;

var vertices = [
    vec2(-0.16, -0.16),
    vec2(0.0, 0.16),
    vec2(0.16, -0.16)
];

var eyeVertices = [
    vec2(-0.06, 0.05),
    vec2(0.06, 0.05)
];

var minX = -0.16, maxX = 0.16, minY = -0.16, maxY = 0.16;
var gridStepY = 0.4;
var gridStepX = 0.2;
var moveDuration = 200;
var moveStartTime = 0;
var isMoving = false;

window.onload = function init() {
    const canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) alert("WebGL isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vPosition = gl.getAttribLocation(program, "vPosition");

    // Frog buffer
    frogBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, frogBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Eyes
    eyeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(eyeVertices), gl.STATIC_DRAW);

    locColor = gl.getUniformLocation(program, "rcolor");
    locOffset = gl.getUniformLocation(program, "uOffset");
    locAngle = gl.getUniformLocation(program, "uAngle");

    gl.uniform4fv(locColor, flatten(color));
    gl.uniform2fv(locOffset, flatten(currentOffset));
    gl.uniform1f(locAngle, angle);

    initRoad(gl);
    initCars(gl);

    window.addEventListener("keydown", function(e) {
        if (isMoving) return;

        switch(e.key) {
            case "ArrowUp":
                if(targetOffset[1] + gridStepY + maxY <= 1.0) targetOffset[1] += gridStepY;
                angle = 0.0;
                break;
            case "ArrowDown":
                if(targetOffset[1] - gridStepY + minY >= -1.0) targetOffset[1] -= gridStepY;
                angle = Math.PI;
                break;
            case "ArrowLeft":
                if(targetOffset[0] - gridStepX + minX >= -1.0) targetOffset[0] -= gridStepX;
                angle = Math.PI/2;
                break;
            case "ArrowRight":
                if(targetOffset[0] + gridStepX + maxX <= 1.0) targetOffset[0] += gridStepX;
                angle = -Math.PI/2;
                break;
            default:
                return;
        }

        moveStartTime = Date.now();
        isMoving = true;
    });

    render();
};

// SAT-based collision detection helpers
function getAxes(vertices) {
    const axes = [];
    for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i];
        const p2 = vertices[(i + 1) % vertices.length];
        const edge = vec2(p2[0]-p1[0], p2[1]-p1[1]);
        const normal = vec2(-edge[1], edge[0]);
        const length = Math.hypot(normal[0], normal[1]);
        axes.push(vec2(normal[0]/length, normal[1]/length));
    }
    return axes;
}

function projectPolygon(vertices, axis) {
    let min = Infinity, max = -Infinity;
    for (let v of vertices) {
        const proj = v[0]*axis[0] + v[1]*axis[1];
        min = Math.min(min, proj);
        max = Math.max(max, proj);
    }
    return { min, max };
}

function overlap(proj1, proj2) {
    return proj1.max >= proj2.min && proj2.max >= proj1.min;
}

function getRectVertices(rect) {
    return [
        vec2(rect.left, rect.bottom),
        vec2(rect.right, rect.bottom),
        vec2(rect.right, rect.top),
        vec2(rect.left, rect.top)
    ];
}

function triangleRectSAT(triangleVerts, rect) {
    const rectVerts = getRectVertices(rect);
    const axes = getAxes(triangleVerts).concat(getAxes(rectVerts));
    for (let axis of axes) {
        const proj1 = projectPolygon(triangleVerts, axis);
        const proj2 = projectPolygon(rectVerts, axis);
        if (!overlap(proj1, proj2)) return false;
    }
    return true;
}

function getFrogVerticesWorld() {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return vertices.map(v => vec2(
        v[0]*cosA - v[1]*sinA + currentOffset[0],
        v[0]*sinA + v[1]*cosA + currentOffset[1]
    ));
}

function checkCollision() {
    const frogVerts = getFrogVerticesWorld();
    for (let i = 0; i < carVertices.length; i++) {
        const carBounds = getCarBounds(i);
        if (triangleRectSAT(frogVerts, carBounds)) return true;
    }
    return false;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawRoad(gl, locColor, vPosition, locOffset, locAngle);
    drawCars(gl, vPosition, locColor, locOffset, locAngle);

    // Animate frog
    if (isMoving) {
        let t = (Date.now() - moveStartTime) / moveDuration;
        if (t >= 1.0) { t = 1.0; isMoving = false; }
        currentOffset[0] += (targetOffset[0] - currentOffset[0]) * t;
        currentOffset[1] += (targetOffset[1] - currentOffset[1]) * t;
    }

    // Collision detection with SAT
    if (checkCollision()) {
        alert("Game Over!");
        currentOffset = vec2(0.0, -0.8);
        targetOffset = vec2(0.0, -0.8);
        angle = 0.0;
    }

    // Draw frog
    gl.bindBuffer(gl.ARRAY_BUFFER, frogBuffer);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.uniform2fv(locOffset, flatten(currentOffset));
    gl.uniform1f(locAngle, angle);
    gl.uniform4fv(locColor, flatten(color));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Draw eyes
    gl.bindBuffer(gl.ARRAY_BUFFER, eyeBuffer);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.uniform4fv(locColor, flatten(vec4(0,0,0,1)));
    gl.drawArrays(gl.POINTS, 0, 2);

    window.requestAnimFrame(render);
}
