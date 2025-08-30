//////////////////////////////////////////////////////////////////////
//    Example program in Computer Graphics
//    T-shape drawn with TRIANGLE_STRIP (with degenerate triangles)
//
//    Based on Hjálmtýr Hafsteinsson’s TRIANGLE_FAN example
//    Modified for TRIANGLE_STRIP, August 2025
//////////////////////////////////////////////////////////////////////

var gl;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    var vertices = new Float32Array([
        
        -0.8,  0.4,  
        -0.8,  0.8,  
         0.8,  0.4,   
         0.8,  0.8,   
         0.8,  0.8,
        -0.2,  0.4,
        -0.2,  0.4,   
        -0.2, -0.8,   
         0.2,  0.4,   
         0.2, -0.8    
    ]);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 10);
}
