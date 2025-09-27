/////////////////////////////////////////////////////////////////
// Newton's cradle simulation with 2 cubes
// Perfect elastic collisions, continuous swing
/////////////////////////////////////////////////////////////////

var canvas;
var gl;

var numVertices = 36;
var points = [];
var colors = [];

var matrixLoc;

// Visual parameters
var massSize = 0.15;        // smaller cube
var stringThickness = 0.03; // thinner string
var pivotSep = massSize;     // cubes just touching
var length = 0.8;            // string length
var thetaMax = 45;           // swing amplitude in degrees
var swingSpeed = 60;         // degrees per second

// Pendulum state
var movingCube = 0;           // 0 = left, 1 = right
var theta = [-thetaMax, 0];   // left cube pulled left, right at rest
var direction = [1, 0];       // left cube swings right-down first

var lastTime = null;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    colorCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    matrixLoc = gl.getUniformLocation(program, "transform");

    lastTime = performance.now();
    render();
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function colorCube() {
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], // front - red
        [0.0, 1.0, 0.0, 1.0], // back - green
        [0.0, 0.0, 1.0, 1.0], // top - blue
        [1.0, 1.0, 0.0, 1.0], // bottom - yellow
        [1.0, 0.0, 1.0, 1.0], // right - magenta
        [0.0, 1.0, 1.0, 1.0]  // left - cyan
    ];

    // Each call draws a face with a different color
    quad(1, 0, 3, 2, faceColors[0]); // front
    quad(2, 3, 7, 6, faceColors[1]); // back
    quad(3, 0, 4, 7, faceColors[2]); // top
    quad(6, 5, 1, 2, faceColors[3]); // bottom
    quad(4, 5, 6, 7, faceColors[4]); // right
    quad(5, 4, 0, 1, faceColors[5]); // left
}

function quad(a, b, c, d, faceColor) {
    var vertices = [
        vec3(-0.5, -0.5,  0.5),
        vec3(-0.5,  0.5,  0.5),
        vec3( 0.5,  0.5,  0.5),
        vec3( 0.5, -0.5,  0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5,  0.5, -0.5),
        vec3( 0.5,  0.5, -0.5),
        vec3( 0.5, -0.5, -0.5)
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        colors.push(faceColor); // use the specific color for this face
    }
}


function physicsStep(dt) {
    var i = movingCube;
    var prevTheta = theta[i];

    // Update moving cube
    theta[i] += swingSpeed * dt * direction[i];

    // Check if cube crossed zero (center)
    if ((prevTheta < 0 && theta[i] >= 0) || (prevTheta > 0 && theta[i] <= 0)) {
        theta[i] = 0;
        direction[i] = 0;

        // Switch moving cube
        movingCube = 1 - i;

        // Start other cube moving in correct direction
        direction[movingCube] = (movingCube === 0) ? -1 : 1;
    }

    // Reverse direction at maximum amplitude with overshoot correction
    for (var j = 0; j < 2; j++) {
        if (Math.abs(theta[j]) > thetaMax && direction[j] !== 0) {
            theta[j] = thetaMax * Math.sign(theta[j]) - (theta[j] - thetaMax * Math.sign(theta[j]));
            direction[j] *= -1;
        }
    }
}

function render() {
    var now = performance.now();
    var dt = (now - lastTime) / 1000.0;
    if (dt > 0.05) dt = 0.05;
    lastTime = now;

    physicsStep(dt);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- Perspective projection ---
    var proj = perspective(60, canvas.width / canvas.height, 0.1, 10.0);

    // --- Camera: centered, slightly above ---
    var camera = mult(
        translate(0, 0.15, -2.5), // move scene slightly up and back
        rotateX(15)                // look slightly downward
    );

    var strLen = length;
    var strCenter = -strLen / 2;

    // LEFT cube string & mass
    var pivotLeftX = -pivotSep/2;
    var localLeft = mult(translate(pivotLeftX, 0.9, 0.0), rotateZ(theta[0]));

    var stringMat = mult(proj, mult(camera, mult(localLeft, translate(0.0, strCenter, 0.0))));
    stringMat = mult(stringMat, scalem(stringThickness, strLen, stringThickness));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(stringMat));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    var massMat = mult(proj, mult(camera, mult(localLeft, translate(0.0, -strLen, 0.0))));
    massMat = mult(massMat, scalem(massSize, massSize, massSize));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(massMat));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    // RIGHT cube string & mass
    var pivotRightX = pivotSep/2;
    var localRight = mult(translate(pivotRightX, 0.9, 0.0), rotateZ(theta[1]));

    stringMat = mult(proj, mult(camera, mult(localRight, translate(0.0, strCenter, 0.0))));
    stringMat = mult(stringMat, scalem(stringThickness, strLen, stringThickness));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(stringMat));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    massMat = mult(proj, mult(camera, mult(localRight, translate(0.0, -strLen, 0.0))));
    massMat = mult(massMat, scalem(massSize, massSize, massSize));
    gl.uniformMatrix4fv(matrixLoc, false, flatten(massMat));
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);

    requestAnimFrame(render);
}
