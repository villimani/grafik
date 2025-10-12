//////////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//    Byggt á sýnisforriti í C fyrir OpenGL, höfundur óþekktur.
//
//    Bíll sem keyrir í hringi í umhverfi með húsum. Hægt að
//    breyta sjónarhorni áhorfanda með því að slá á 0, 1, 2, ..., 8.
//    View 0: notandi gengur á jörðinni með W-A-S-D og mús
//
//    Hjálmtýr Hafsteinsson, október 2025
////////////////////////////////////////////////////////////////////

var canvas;
var gl;

var TRACK_RADIUS = 100.0;
var TRACK_INNER = 90.0;
var TRACK_OUTER = 110.0;
var TRACK_PTS = 100;

var TRACK_RADIUS_CAR1 = 105.0;
var TRACK_RADIUS_CAR2 = 95.0;
var CAR_SPEED = 0.5;

var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var GRAY = vec4(0.4, 0.4, 0.4, 1.0);

var numCubeVertices = 36;
var numTrackVertices = 2 * TRACK_PTS + 2;

var carDirection = 0.0;
var carXPos = 100.0;
var carYPos = 0.0;
var height = 0.0;

var car2Direction = 180.0;
var car2XPos = -100.0;
var car2YPos = 0.0;

var view = 1;

var playerX = 0.0;
var playerY = 0.0;
var playerAngle = 0.0; 
var moveSpeed = 2.0;   

var colorLoc;
var mvLoc;
var pLoc;
var proj;

var cubeBuffer;
var trackBuffer;
var vPosition;

var HOUSE_SIZES = [5.0, 7.0, 9.0, 11.0];
var ROOF_TYPES = ["pyramid", "gable"];
var houses = [];

var tunnelCubes = [];
var TUNNEL_LENGTH = 10;
var TUNNEL_WIDTH = 20;
var TUNNEL_HEIGHT = 10;
var TUNNEL_CUBE_SIZE = 2.0;
var TUNNEL_START_ANGLE = 90;

var planeX = 0, planeY = 0, planeZ = 50;
var planeAngle = 0;
var planeSpeed = 0.5;
var planeSize = 30.0;
var planeTime = 0;

var cVertices = [
    vec3(-0.5,  0.5,  0.5), vec3(-0.5, -0.5,  0.5), vec3(0.5, -0.5,  0.5),
    vec3(0.5, -0.5,  0.5), vec3(0.5,  0.5,  0.5), vec3(-0.5,  0.5,  0.5),
    vec3(0.5,  0.5,  0.5), vec3(0.5, -0.5,  0.5), vec3(0.5, -0.5, -0.5),
    vec3(0.5, -0.5, -0.5), vec3(0.5,  0.5, -0.5), vec3(0.5,  0.5,  0.5),
    vec3(0.5, -0.5,  0.5), vec3(-0.5, -0.5,  0.5), vec3(-0.5, -0.5, -0.5),
    vec3(-0.5, -0.5, -0.5), vec3(0.5, -0.5, -0.5), vec3(0.5, -0.5,  0.5),
    vec3(0.5,  0.5, -0.5), vec3(-0.5,  0.5, -0.5), vec3(-0.5,  0.5,  0.5),
    vec3(-0.5,  0.5,  0.5), vec3(0.5,  0.5,  0.5), vec3(0.5,  0.5, -0.5),
    vec3(-0.5, -0.5, -0.5), vec3(-0.5,  0.5, -0.5), vec3(0.5,  0.5, -0.5),
    vec3(0.5,  0.5, -0.5), vec3(0.5, -0.5, -0.5), vec3(-0.5, -0.5, -0.5),
    vec3(-0.5,  0.5, -0.5), vec3(-0.5, -0.5, -0.5), vec3(-0.5, -0.5,  0.5),
    vec3(-0.5, -0.5,  0.5), vec3(-0.5,  0.5,  0.5), vec3(-0.5,  0.5, -0.5)
];

var HOUSE_COLORS = [
    vec4(0.8, 0.3, 0.3, 1.0),
    vec4(0.3, 0.8, 0.3, 1.0),
    vec4(0.3, 0.3, 0.8, 1.0),
    vec4(0.8, 0.8, 0.3, 1.0),
    vec4(0.8, 0.3, 0.8, 1.0)
];

var ROOF_COLORS = [
    vec4(0.5, 0.2, 0.2, 1.0),
    vec4(0.6, 0.3, 0.1, 1.0),
    vec4(0.3, 0.3, 0.3, 1.0)
];

var tVertices = [];

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) alert("WebGL not available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 1.0, 0.7, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    createTrack();
    createHouses();
    createTunnel();

    trackBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trackBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tVertices), gl.STATIC_DRAW);

    cubeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cVertices), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    colorLoc = gl.getUniformLocation(program, "fColor");
    mvLoc = gl.getUniformLocation(program, "modelview");
    pLoc = gl.getUniformLocation(program, "projection");
    proj = perspective(50.0, 1.0, 1.0, 500.0);
    gl.uniformMatrix4fv(pLoc, false, flatten(proj));

    document.getElementById("Viewpoint").innerHTML = "1: Fjarlægt sjónarhorn";
    document.getElementById("Height").innerHTML = "Viðbótarhæð: " + height;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handlePlayerMovement);

    window.addEventListener("mousemove", function(e) {
        if(view === 0) {
            var deltaX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
            playerAngle += deltaX * 0.2;
        }
    });

    render();
};


function handleKeyDown(e) {
    switch (e.keyCode) {
        case 48: view = 0; document.getElementById("Viewpoint").innerHTML = "0: Notandi á jörðinni"; break;
        case 49: view = 1; document.getElementById("Viewpoint").innerHTML = "1: Fjarlægt sjónarhorn"; break;
        case 50: view = 2; document.getElementById("Viewpoint").innerHTML = "2: Horfa á bílinn innan úr hringnum"; break;
        case 51: view = 3; document.getElementById("Viewpoint").innerHTML = "3: Horfa á bílinn fyrir utan hringinn"; break;
        case 52: view = 4; document.getElementById("Viewpoint").innerHTML = "4: Sjónarhorn ökumanns"; break;
        case 53: view = 5; document.getElementById("Viewpoint").innerHTML = "5: Horfa alltaf á eitt hús"; break;
        case 54: view = 6; document.getElementById("Viewpoint").innerHTML = "6: Fyrir aftan og ofan bílinn"; break;
        case 55: view = 7; document.getElementById("Viewpoint").innerHTML = "7: Horft aftur úr bíl fyrir framan"; break;
        case 56: view = 8; document.getElementById("Viewpoint").innerHTML = "8: Til hliðar við bílinn"; break;

        case 38: // Up arrow
            if (view === 1) {
                height += 2.0;
                document.getElementById("Height").innerHTML = "Viðbótarhæð: " + height;
            }
            break;
        case 40: // Down arrow
            if (view === 1) {
                height -= 2.0;
                document.getElementById("Height").innerHTML = "Viðbótarhæð: " + height;
            }
            break;
    }
}

function handlePlayerMovement(e) {
    if(view !== 0) return;

    var rad = radians(playerAngle);
    switch(e.keyCode) {
        case 87: // W
            playerX += moveSpeed * Math.cos(rad);
            playerY += moveSpeed * Math.sin(rad);
            break;
        case 83: // S
            playerX -= moveSpeed * Math.cos(rad);
            playerY -= moveSpeed * Math.sin(rad);
            break;
        case 65: // A
            playerX += moveSpeed * Math.cos(rad + Math.PI/2);
            playerY += moveSpeed * Math.sin(rad + Math.PI/2);
            break;
        case 68: // D
            playerX += moveSpeed * Math.cos(rad - Math.PI/2);
            playerY += moveSpeed * Math.sin(rad - Math.PI/2);
            break;
    }
}



function createTrack() {
    var theta = 0.0;
    for (var i = 0; i <= TRACK_PTS; i++) {
        var p1 = vec3(TRACK_OUTER * Math.cos(radians(theta)), TRACK_OUTER * Math.sin(radians(theta)), 0.0);
        var p2 = vec3(TRACK_INNER * Math.cos(radians(theta)), TRACK_INNER * Math.sin(radians(theta)), 0.0);
        tVertices.push(p1, p2);
        theta += 360.0 / TRACK_PTS;
    }
}

function createHouses() {
    houses = [];
    var NUM_HOUSES = 20;
    var INNER_MIN = 40.0;
    var INNER_MAX = TRACK_INNER - 10;
    var OUTER_MIN = TRACK_OUTER + 5;
    var OUTER_MAX = TRACK_OUTER + 25;
    var MIN_DIST = 10; 

    for (var i = 0; i < NUM_HOUSES; i++) {
        var attempts = 0;
        while (attempts < 100) { 
            attempts++;
            var theta = Math.random() * 2 * Math.PI;
            var isInside = Math.random() < 0.8;
            var r = isInside ? INNER_MIN + Math.random() * (INNER_MAX - INNER_MIN)
                             : OUTER_MIN + Math.random() * (OUTER_MAX - OUTER_MIN);
            var x = r * Math.cos(theta);
            var y = r * Math.sin(theta);

            var tooClose = false;
            for (var j = 0; j < houses.length; j++) {
                var dx = x - houses[j].x;
                var dy = y - houses[j].y;
                var dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < MIN_DIST) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                var size = HOUSE_SIZES[Math.floor(Math.random() * HOUSE_SIZES.length)];
                var roof = ROOF_TYPES[Math.floor(Math.random() * ROOF_TYPES.length)];
                var houseColor = HOUSE_COLORS[Math.floor(Math.random() * HOUSE_COLORS.length)];
                var roofColor = ROOF_COLORS[Math.floor(Math.random() * ROOF_COLORS.length)];
                houses.push({ x: x, y: y, size: size, roof: roof, color: houseColor, roofColor: roofColor });
                break; 
            }
        }
    }
}


function house(x, y, size, roofType, mv, color, roofColor) {
    gl.uniform4fv(colorLoc, color);
    var mvHouse = mult(mv, translate(x, y, size / 2));
    mvHouse = mult(mvHouse, scalem(size, size, size));
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvHouse));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

    if (roofType === "pyramid") roofPyramid(size, mvHouse, roofColor);
    else roofGable(size, mvHouse, roofColor);
}


function roofPyramid(size, mvHouse, roofColor) {
    gl.uniform4fv(colorLoc, roofColor);
    var verts = [
        vec3(-0.5, -0.5, 0.0), vec3(0.5, -0.5, 0.0), vec3(0.5, 0.5, 0.0),
        vec3(-0.5, 0.5, 0.0), vec3(0.0, 0.0, 0.7)
    ];
    var faces = [verts[0], verts[1], verts[4], verts[1], verts[2], verts[4], verts[2], verts[3], verts[4], verts[3], verts[0], verts[4]];
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(faces), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    var mvRoof = mult(mvHouse, translate(0, 0, 0.5));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvRoof));
    gl.drawArrays(gl.TRIANGLES, 0, faces.length);
}

function roofGable(size, mvHouse, roofColor) {
    gl.uniform4fv(colorLoc, roofColor);

    var v0 = vec3(-0.5, -0.5, 0.0);
    var v1 = vec3( 0.5, -0.5, 0.0);
    var v2 = vec3( 0.5,  0.5, 0.0);
    var v3 = vec3(-0.5,  0.5, 0.0);

    var v4 = vec3(0.0, -0.5, 0.5);
    var v5 = vec3(0.0,  0.5, 0.5);

    var faces = [
        v0, v1, v4,   v4, v1, v5, 
        v3, v2, v5,   v3, v5, v4, 

        v0, v3, v4,   
        v1, v2, v5    
    ];

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(faces), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var mvRoof = mult(mvHouse, translate(0, 0, 0.5));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvRoof));
    gl.drawArrays(gl.TRIANGLES, 0, faces.length);
}


function drawScenery(mv) {
    gl.uniform4fv(colorLoc, GRAY);
    gl.bindBuffer(gl.ARRAY_BUFFER, trackBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, numTrackVertices);

    for (var i = 0; i < houses.length; i++) {
        var h = houses[i];
        house(h.x, h.y, h.size, h.roof, mv, h.color, h.roofColor);
    }

}

function drawCar(mv) {
    gl.uniform4fv(colorLoc, BLUE);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    var mvBody = mult(mv, scalem(10.0, 3.0, 2.0));
    mvBody = mult(mvBody, translate(0, 0, 0.5));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvBody));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

    var mvTop = mult(mv, scalem(4.0, 3.0, 2.0));
    mvTop = mult(mvTop, translate(-0.2, 0, 1.5));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvTop));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}

function createTunnel() {
    tunnelCubes = [];
    var angleStep = 1;
    for (var i = 0; i < TUNNEL_LENGTH; i++) {
        var theta = TUNNEL_START_ANGLE + i * angleStep;
        var rad = radians(theta);
        var centerX = (TRACK_RADIUS_CAR1 + TRACK_RADIUS_CAR2) / 2 * Math.sin(rad);
        var centerY = (TRACK_RADIUS_CAR1 + TRACK_RADIUS_CAR2) / 2 * Math.cos(rad);

        for (var dx = -TUNNEL_WIDTH / 2; dx <= TUNNEL_WIDTH / 2; dx += TUNNEL_CUBE_SIZE) {
            for (var dz = 0; dz <= TUNNEL_HEIGHT; dz += TUNNEL_CUBE_SIZE) {
                if (dx === -TUNNEL_WIDTH / 2 || dx === TUNNEL_WIDTH / 2 || dz === TUNNEL_HEIGHT) {
                    tunnelCubes.push({ x: centerX + dx, y: centerY, z: dz + 1 });
                }
            }
        }
    }
}

function drawTunnel(mv) {
    gl.uniform4fv(colorLoc, vec4(0.7, 0.7, 0.7, 1.0));
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    for (var i = 0; i < tunnelCubes.length; i++) {
        var c = tunnelCubes[i];
        var mvCube = mult(mv, translate(c.x, c.y, c.z));
        mvCube = mult(mvCube, scalem(TUNNEL_CUBE_SIZE, TUNNEL_CUBE_SIZE, TUNNEL_CUBE_SIZE));
        gl.uniformMatrix4fv(mvLoc, false, flatten(mvCube));
        gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
    }
}

function figure8(t) {
    var a = 180, b = 90;
    return { x: a * Math.sin(t), y: b * Math.sin(t) * Math.cos(t) };
}

function drawAirplane(mv) {
    var pos = figure8(planeTime);
    planeX = pos.x;
    planeY = pos.y;
    planeZ = 50;

    var delta = 0.01;
    var nextPos = figure8(planeTime + delta);
    var dx = nextPos.x - planeX;
    var dy = nextPos.y - planeY;

    var angle = Math.atan2(dy, dx) * 180 / Math.PI;

    var mvPlane = mult(mv, translate(planeX, planeY, planeZ));
    mvPlane = mult(mvPlane, rotateZ(angle - 90));

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    var mvBody = mult(mvPlane, scalem(planeSize/3, planeSize , planeSize/4));
    gl.uniform4fv(colorLoc, vec4(0.9, 0.9, 0.1, 1.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvBody));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

    drawPlaneWing(mvPlane, -planeSize / 2.5, 0.0); 
    drawPlaneWing(mvPlane, planeSize / 2.5, 0.0);  

    var mvTail = mult(mvPlane, translate(0, -planeSize/2.5, planeSize / 5));
    mvTail = mult(mvTail, scalem(planeSize / 12, planeSize / 5, planeSize / 5));
    gl.uniform4fv(colorLoc, vec4(0.8, 0.2, 0.2, 1.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvTail));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}



function drawPlaneWing(mvPlane, offsetX, offsetZ) {
    var mvWing = mult(mvPlane, translate(offsetX, 0, offsetZ));
    mvWing = mult(mvWing, scalem(planeSize/2, planeSize/3 , planeSize/12)); 
    gl.uniform4fv(colorLoc, vec4(0.2, 0.2, 0.8, 1.0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mvWing));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    carDirection += CAR_SPEED;
    if (carDirection > 360.0) carDirection -= 360.0;
    carXPos = TRACK_RADIUS_CAR1 * Math.sin(radians(carDirection));
    carYPos = TRACK_RADIUS_CAR1 * Math.cos(radians(carDirection));

    car2Direction -= CAR_SPEED;
    if (car2Direction < 0.0) car2Direction += 360.0;
    car2XPos = TRACK_RADIUS_CAR2 * Math.sin(radians(car2Direction));
    car2YPos = TRACK_RADIUS_CAR2 * Math.cos(radians(car2Direction));

    var mv = mat4();
    switch(view) {
        case 0: 
            var rad = radians(playerAngle);
            var eye = vec3(playerX, playerY, 5.0);
            var at = vec3(playerX + Math.cos(rad), playerY + Math.sin(rad), 5.0);
            mv = lookAt(eye, at, vec3(0,0,1));
            break;
        case 1: 
            mv = lookAt(vec3(250.0, 0.0, 100.0 + height), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0)); 
            break;
        case 2: 
            mv = lookAt(vec3(75.0, 0.0, 5.0), vec3(carXPos, carYPos, 0.0), vec3(0.0, 0.0, 1.0)); 
            break;
        case 3: 
            mv = lookAt(vec3(125.0, 0.0, 5.0), vec3(carXPos, carYPos, 0.0), vec3(0.0, 0.0, 1.0)); 
            break;
        case 4: 
            mv = lookAt(vec3(-3.0, 0.0, 5.0), vec3(12.0, 0.0, 2.0), vec3(0.0, 0.0, 1.0)); 
            break;
        case 5: 
            mv = mult(rotateY(-carDirection), lookAt(vec3(3.0, 0.0, 5.0), vec3(40.0 - carXPos, 120.0 - carYPos, 0.0), vec3(0.0, 0.0, 1.0))); 
            break;
        case 6: 
            mv = lookAt(vec3(-12.0, 0.0, 6.0), vec3(15.0, 0.0, 4.0), vec3(0.0, 0.0, 1.0)); 
            break;
        case 7: 
            mv = lookAt(vec3(25.0, 5.0, 5.0), vec3(0.0, 0.0, 2.0), vec3(0.0, 0.0, 1.0)); 
            break;
        case 8: 
            mv = lookAt(vec3(2.0, 20.0, 5.0), vec3(2.0, 0.0, 2.0), vec3(0.0, 0.0, 1.0)); 
            break;
    }

    var mvScene = view >= 4 ? mult(mv, mult(rotateZ(carDirection), translate(-carXPos, -carYPos, 0.0))) : mv;

    drawScenery(mvScene);
    drawTunnel(mvScene);

    planeTime += 0.02 * planeSpeed;
    if (planeTime > 2 * Math.PI) planeTime -= 2 * Math.PI;
    drawAirplane(mvScene);

    var mv1 = mult(mvScene, translate(carXPos, carYPos, 0.0));
    mv1 = mult(mv1, rotateZ(-carDirection));
    drawCar(mv1);

    var mv2 = mult(mvScene, translate(car2XPos, car2YPos, 0.0));
    mv2 = mult(mv2, rotateZ(180 - car2Direction))
    drawCar(mv2);

    requestAnimFrame(render);
}