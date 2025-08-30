"use strict";

var canvas;
var gl;
var points = [];
var NumTimesToSubdivide = 3; 

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    var vertices = [
        vec2(-1,  1),  
        vec2( 1,  1), 
        vec2( 1, -1), 
        vec2(-1, -1)   
    ];

    divideSquare(vertices[0], vertices[1], vertices[2], vertices[3], NumTimesToSubdivide);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
};

function square(a, b, c, d) {
    points.push(a, b, d);
    points.push(b, c, d);
}

function divideSquare(a, b, c, d, count) {
    if (count === 0) {
        square(a, b, c, d);
    } else {
        var dx = (b[0] - a[0]) / 3.0;
        var dy = (a[1] - d[1]) / 3.0;

        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                if (i === 1 && j === 1) continue; 
                var newA = vec2(a[0] + i*dx, a[1] - j*dy);
                var newB = vec2(a[0] + (i+1)*dx, a[1] - j*dy);
                var newC = vec2(a[0] + (i+1)*dx, a[1] - (j+1)*dy);
                var newD = vec2(a[0] + i*dx, a[1] - (j+1)*dy);
                divideSquare(newA, newB, newC, newD, count - 1);
            }
        }
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}
