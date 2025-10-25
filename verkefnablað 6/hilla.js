var canvas;
var gl;

var numVertices  = 36;
var points = [];
var normals = [];

var movement = false;
var spinX = 0;
var spinY = 0;
var origX, origY;

var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var modelViewMatrix, projectionMatrix, normalMatrix;

var zDist = -6.0;
var fovy = 50.0;
var near = 0.2;
var far = 100.0;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2,0.2,0.2,1.0);
var lightDiffuse = vec4(1.0,1.0,1.0,1.0);
var lightSpecular = vec4(1.0,1.0,1.0,1.0);

var materialAmbient = vec4( 1.0, 0.6, 0.2, 1.0 );
var materialDiffuse = vec4( 1.0, 0.6, 0.2, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 50.0;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) alert("WebGL isn't available");

    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(1.0,1.0,1.0,1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    // Buffers
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Ljósun
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
    });

    canvas.addEventListener("mouseup", function(){ movement=false; });

    canvas.addEventListener("mousemove", function(e){
        if(movement){
            spinY += e.clientX - origX;
            spinX += origY - e.clientY;
            origX = e.clientX;
            origY = e.clientY;
        }
    });

    render();
};

// --- Teiknar 1 tening
function quad(a,b,c,d,n){
    var vertices = [
        vec4(-0.5,-0.5,0.5,1.0),
        vec4(-0.5,0.5,0.5,1.0),
        vec4(0.5,0.5,0.5,1.0),
        vec4(0.5,-0.5,0.5,1.0),
        vec4(-0.5,-0.5,-0.5,1.0),
        vec4(-0.5,0.5,-0.5,1.0),
        vec4(0.5,0.5,-0.5,1.0),
        vec4(0.5,-0.5,-0.5,1.0)
    ];

    var faceNormals = [
        vec3(0,0,1), vec3(1,0,0), vec3(0,-1,0),
        vec3(0,1,0), vec3(0,0,-1), vec3(-1,0,0)
    ];

    var indices = [a,b,c,a,c,d];
    for(var i=0;i<indices.length;i++){
        points.push(vertices[indices[i]]);
        normals.push(faceNormals[n]);
    }
}

// --- Hillueining
function colorCube(){
    quad(1,0,3,2,0);
    quad(2,3,7,6,1);
    quad(3,0,4,7,2);
    quad(6,5,1,2,3);
    quad(4,5,6,7,4);
    quad(5,4,0,1,5);
}

// --- Render
function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    projectionMatrix = perspective(fovy,1.0,near,far);
    modelViewMatrix = lookAt(vec3(0,0,zDist),vec3(0,0,0),vec3(0,1,0));
    modelViewMatrix = mult(modelViewMatrix, rotateX(spinX));
    modelViewMatrix = mult(modelViewMatrix, rotateY(spinY));

    normalMatrix = [
        vec3(modelViewMatrix[0][0],modelViewMatrix[0][1],modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0],modelViewMatrix[1][1],modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0],modelViewMatrix[2][1],modelViewMatrix[2][2])
    ];

    gl.uniformMatrix4fv(modelViewMatrixLoc,false,flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc,false,flatten(projectionMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc,false,flatten(normalMatrix));

    drawShelf();

    requestAnimFrame(render);
}

// --- Teiknar 2x2 KALLAX hillueining
function drawShelf(){
    let mv1;
    const boardThickness = 0.2;
    const shelfDepth = 1;
    const shelfSize = 2.0;

    // Vinstri hlið
    mv1 = mult(modelViewMatrix, translate(-shelfSize/2+0.1, 0, 0));
    mv1 = mult(mv1, scalem(boardThickness, shelfSize, shelfDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc,false,flatten(mv1));
    gl.drawArrays(gl.TRIANGLES,0,numVertices);

    // Hægri hlið
    mv1 = mult(modelViewMatrix, translate(shelfSize/2-0.1, 0, 0));
    mv1 = mult(mv1, scalem(boardThickness, shelfSize, shelfDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc,false,flatten(mv1));
    gl.drawArrays(gl.TRIANGLES,0,numVertices);

    // Efst
    mv1 = mult(modelViewMatrix, translate(0, shelfSize/2-0.1, 0));
    mv1 = mult(mv1, scalem(shelfSize, boardThickness, shelfDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc,false,flatten(mv1));
    gl.drawArrays(gl.TRIANGLES,0,numVertices);

    // Neðst
    mv1 = mult(modelViewMatrix, translate(0, -shelfSize/2+0.1, 0));
    mv1 = mult(mv1, scalem(shelfSize, boardThickness, shelfDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc,false,flatten(mv1));
    gl.drawArrays(gl.TRIANGLES,0,numVertices);

    // Miðhlutarnir
    // Lárétt miðja
    mv1 = mult(modelViewMatrix, translate(0, 0, 0));
    mv1 = mult(mv1, scalem(shelfSize, boardThickness, shelfDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc,false,flatten(mv1));
    gl.drawArrays(gl.TRIANGLES,0,numVertices);

    // Lóðrétt miðja
    mv1 = mult(modelViewMatrix, translate(0, 0, 0));
    mv1 = mult(mv1, scalem(boardThickness, shelfSize, shelfDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc,false,flatten(mv1));
    gl.drawArrays(gl.TRIANGLES,0,numVertices);
}
