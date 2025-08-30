/////////////////////////////////////////////////////////////////
// Click-to-draw triangles
// Hjálmtýr Hafsteinsson, ágúst 2025
/////////////////////////////////////////////////////////////////

var canvas;
var gl;

// Maximum number of vertices (3 per triangle)
var maxNumPoints = 600;
var index = 0;

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 1.0, 1.0, 1.0);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumPoints, gl.DYNAMIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    canvas.addEventListener("mousedown", function(e){

        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        
        // Click position in clip space
        var t = vec2(2*e.offsetX/canvas.width - 1, 
                     2*(canvas.height - e.offsetY)/canvas.height - 1);
        
        // Small triangle size
        var s = 0.02;
        
        // Triangle vertices
        var triangleVertices = [
            vec2(t[0], t[1] + s),       // top
            vec2(t[0] - s, t[1] - s),   // bottom left
            vec2(t[0] + s, t[1] - s)    // bottom right
        ];
        
        // Add all 3 vertices to buffer
        for (var i = 0; i < 3; i++) {
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(triangleVertices[i]));
            index++;
        }
    });

    render();
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, index);
    window.requestAnimFrame(render);
}
