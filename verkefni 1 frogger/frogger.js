var gl;
var locColor, locOffset, locAngle;
var vPosition;

window.onload = function init() {
    const canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) alert("WebGL isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vPosition = gl.getAttribLocation(program, "vPosition");
    locColor = gl.getUniformLocation(program, "rcolor");
    locOffset = gl.getUniformLocation(program, "uOffset");
    locAngle = gl.getUniformLocation(program, "uAngle");

    initFrog(gl);
    initRoad(gl);
    initCars(gl);

    // Controls
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

// === Collision helpers (SAT) ===
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

function checkCollision() {
    const frogVerts = getFrogVerticesWorld();
    for (let i = 0; i < carVertices.length; i++) {
        const carBounds = getCarBounds(i);
        if (triangleRectSAT(frogVerts, carBounds)) return true;
    }
    return false;
}

// === Render Loop ===
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawRoad(gl, locColor, vPosition, locOffset, locAngle);
    drawCars(gl, vPosition, locColor, locOffset, locAngle);

    // Update points system
    updatePoints(currentOffset[1]);

    // Draw bars
    drawPoints(gl, locColor, vPosition);


    // Animate frog movement
    if (isMoving) {
        let t = (Date.now() - moveStartTime) / moveDuration;
        if (t >= 1.0) { t = 1.0; isMoving = false; }
        currentOffset[0] += (targetOffset[0] - currentOffset[0]) * t;
        currentOffset[1] += (targetOffset[1] - currentOffset[1]) * t;
    }


    if (checkCollision()) {
        alert("Game Over!");

        // Reset frog
        currentOffset = vec2(0.0, -0.85);
        targetOffset = vec2(0.0, -0.85);
        angle = 0.0;

        // Reset points bars
        topBarCount = topBarMax;    // refill top bar
        bottomBarCount = 0;         // empty bottom bar
        lastRow = 0;                // reset frog row tracker
    }


    drawFrog(gl, vPosition, locColor, locOffset, locAngle);

    window.requestAnimFrame(render);
}
