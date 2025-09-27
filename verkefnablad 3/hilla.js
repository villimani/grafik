
var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];

var movement = false;     
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var matrixLoc;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "transform" );

    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  
        [ 1.0, 0.0, 0.0, 1.0 ],  
        [ 1.0, 1.0, 0.0, 1.0 ],  
        [ 0.0, 1.0, 0.0, 1.0 ],  
        [ 0.0, 0.0, 1.0, 1.0 ],  
        [ 1.0, 0.0, 1.0, 1.0 ],  
        [ 0.0, 1.0, 1.0, 1.0 ],  
        [ 1.0, 1.0, 1.0, 1.0 ]   
    ];

    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = mat4();
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );


    mv1 = mult( mv, translate(-0.45, 0.0, 0.0) );
    mv1 = mult( mv1, scalem(0.1, 1.0, 0.5) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    mv1 = mult( mv, translate(0.45, 0.0, 0.0) );
    mv1 = mult( mv1, scalem(0.1, 1.0, 0.5) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    mv1 = mult( mv, translate(0.0, 0.45, 0.0) );
    mv1 = mult( mv1, scalem(1.0, 0.1, 0.5) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    mv1 = mult( mv, translate(0.0, -0.45, 0.0) );
    mv1 = mult( mv1, scalem(1.0, 0.1, 0.5) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );


    mv1 = mult( mv, translate(0.0, 0.0, 0.0) );
    mv1 = mult( mv1, scalem(0.1, 1.0, 0.5) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );


    mv1 = mult( mv, translate(0.0, 0.0, 0.0) );
    mv1 = mult( mv1, scalem(1.0, 0.1, 0.5) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    requestAnimFrame( render );
}
