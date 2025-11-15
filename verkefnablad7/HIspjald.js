/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Einföld útgáfa af mynsturvörpun.  Tvívítt spjald
//     skilgreint og varpað á það mynd sem er lesin inn.
//     Hægt að snúa spjaldinu og færa til.
//
//    Búið að bæta við:
//     - r/g/b + mús upp/niður til að breyta lit (uColor)
//     - aðeins einn lykill í einu
//     - litur fer aftur í upprunalegt gildi þegar lykli er sleppt
//
//    Hjálmtýr Hafsteinsson, október 2025
//    Breytingar fyrir heimadæmi (dæmi 2)
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var numVertices  = 6;

var program;

var texture;

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = 5.0;

var proLoc;
var mvLoc;
var colorLoc;

var baseColor    = [1.0, 1.0, 1.0];
var currentColor = [1.0, 1.0, 1.0];

var activeKey = null;

var lastMouseY = null;

//    4-------3  2
//    |     /  / |
//    |   /  /   |       
//    | /  /     |
//    5  0-------1
//
// Tveir þríhyrningar sem mynda spjald í z=0 planinu
var vertices = [
    vec4( -1.0, -1.0, 0.0, 1.0 ),      
    vec4(  1.0, -1.0, 0.0, 1.0 ),      
    vec4(  1.0,  1.0, 0.0, 1.0 ),      
    vec4(  1.0,  1.0, 0.0, 1.0 ),
    vec4( -1.0,  1.0, 0.0, 1.0 ),
    vec4( -1.0, -1.0, 0.0, 1.0 )
];

var texCoords = [
    vec2( 0.0, 0.0 ),
    vec2( 1.0, 0.0 ),
    vec2( 1.0, 1.0 ),
    vec2( 1.0, 1.0 ),
    vec2( 0.0, 1.0 ),
    vec2( 0.0, 0.0 )
];


function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                   gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    var image = document.getElementById("texImage");
    configureTexture( image );

    proLoc   = gl.getUniformLocation( program, "projection" );
    mvLoc    = gl.getUniformLocation( program, "modelview" );
    colorLoc = gl.getUniformLocation( program, "uColor" );

    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    gl.uniform3f(colorLoc, baseColor[0], baseColor[1], baseColor[2]);
    

    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
        e.preventDefault();         
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if (movement) {
            spinY = ( spinY + (e.clientX - origX) ) % 360;
            spinX = ( spinX + (origY - e.clientY) ) % 360;
            origX = e.clientX;
            origY = e.clientY;
        }


        if (activeKey !== null && lastMouseY !== null) {
            var dy = e.clientY - lastMouseY; 
            var delta = dy * 0.005;           

            if (activeKey === 'r') {
                currentColor[0] += delta;
            } else if (activeKey === 'g') {
                currentColor[1] += delta;
            } else if (activeKey === 'b') {
                currentColor[2] += delta;
            }

            for (var i = 0; i < 3; i++) {
                if (currentColor[i] < 0.0) currentColor[i] = 0.0;
                if (currentColor[i] > 1.0) currentColor[i] = 1.0;
            }

            gl.uniform3f(colorLoc,
                         currentColor[0],
                         currentColor[1],
                         currentColor[2]);
        }

        lastMouseY = e.clientY;
    } );
    
    window.addEventListener("keydown", function(e){
        if (e.key === 'r' || e.key === 'g' || e.key === 'b') {

            if (activeKey === null) {
                activeKey = e.key;
                lastMouseY = null;  
            }
        } else {
            switch( e.keyCode ) {
                case 38:	
                    zDist += 0.1;
                    break;
                case 40:	
                    zDist -= 0.1;
                    break;
            }
        }
    }  );  

    window.addEventListener("keyup", function(e){
        if (e.key === activeKey) {
            activeKey = null;
            currentColor[0] = baseColor[0];
            currentColor[1] = baseColor[1];
            currentColor[2] = baseColor[2];
            gl.uniform3f(colorLoc,
                         currentColor[0],
                         currentColor[1],
                         currentColor[2]);
            lastMouseY = null;
        }
    });

    window.addEventListener("wheel", function(e){
        if( e.deltaY > 0.0 ) {
            zDist += 0.2;
        } else {
            zDist -= 0.2;
        }
    }  );  
       
    render();
 
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = lookAt( vec3(0.0, 0.0, zDist),
                     vec3(0.0, 0.0, 0.0),
                     vec3(0.0, 1.0, 0.0) );
    mv = mult( mv, rotateX( spinX ) );
    mv = mult( mv, rotateY( spinY ) );
    
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    requestAnimFrame(render);
}
