window.onload = function init() {

    var canvas = document.getElementById("gl-canvas");
    var gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL ekki í boði"); }

    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0.9,1.0,1.0,1.0);
    gl.enable(gl.DEPTH_TEST);

    var myTeapot = teapot(15);
    myTeapot.scale(0.5,0.5,0.5);
    var points = myTeapot.TriangleVertices;
    var normals = myTeapot.Normals;

    var program = initShaders(gl,"vertex-shader","fragment-shader");
    gl.useProgram(program);

    var lightPosition = vec4(1.0,5.0,1.0,1.0);
    var lightAmbient = vec4(1.0,1.0,1.0,1.0);
    var lightDiffuse = vec4(1.0,1.0,1.0,1.0);
    var lightSpecular = vec4(1.0,1.0,1.0,1.0);

    var materialAmbient = vec4(0.2,0.0,0.2,1.0);
    var materialDiffuse = vec4(1.0,0.8,0.0,1.0);
    var materialSpecular = vec4(1.0,1.0,1.0,1.0);
    var materialShininess = 50.0;

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program,"ambientProduct"),flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,"diffuseProduct"),flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,"specularProduct"),flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,"lightPosition"),flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program,"shininess"),materialShininess);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(normals),gl.STATIC_DRAW);
    var vNormal = gl.getAttribLocation(program,"vNormal");
    gl.vertexAttribPointer(vNormal,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(points),gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program,"vPosition");
    gl.vertexAttribPointer(vPosition,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vPosition);

    var modelViewMatrixLoc = gl.getUniformLocation(program,"modelViewMatrix");
    var projectionMatrixLoc = gl.getUniformLocation(program,"projectionMatrix");
    var normalMatrixLoc = gl.getUniformLocation(program,"normalMatrix");

    var fovy = 60.0;
    var near = 0.2;
    var far = 100.0;
    var projectionMatrix = perspective(fovy,1.0,near,far);
    gl.uniformMatrix4fv(projectionMatrixLoc,false,flatten(projectionMatrix));

    var useBlinnLoc = gl.getUniformLocation(program,"useBlinn");
    var modelSwitch = document.getElementById("modelSwitch");
    gl.uniform1i(useBlinnLoc,parseInt(modelSwitch.value));
    modelSwitch.addEventListener("change",function(){
        gl.uniform1i(useBlinnLoc,parseInt(modelSwitch.value));
    });

    var spinX=0, spinY=0, movement=false, origX, origY;
    var zDist=-4.0;
    var at = vec3(0.0,0.0,0.0);
    var up = vec3(0.0,1.0,0.0);

    canvas.addEventListener("mousedown", function(e){
        movement = true; origX=e.clientX; origY=e.clientY; e.preventDefault();
    });
    canvas.addEventListener("mouseup", function(){ movement=false; });
    canvas.addEventListener("mousemove", function(e){
        if(movement){
            spinY = (spinY + (origX - e.clientX)) % 360;
            spinX = (spinX + (origY - e.clientY)) % 360;
            origX = e.clientX; origY = e.clientY;
        }
    });
    window.addEventListener("wheel", function(e){
        zDist += (e.deltaY>0?0.2:-0.2);
    });

    function render(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var modelViewMatrix = lookAt(vec3(0,0,zDist),at,up);
        modelViewMatrix = mult(modelViewMatrix,rotateY(-spinY));
        modelViewMatrix = mult(modelViewMatrix,rotateX(spinX));

        var normalMatrix = [
            vec3(modelViewMatrix[0][0],modelViewMatrix[0][1],modelViewMatrix[0][2]),
            vec3(modelViewMatrix[1][0],modelViewMatrix[1][1],modelViewMatrix[1][2]),
            vec3(modelViewMatrix[2][0],modelViewMatrix[2][1],modelViewMatrix[2][2])
        ];
        normalMatrix.matrix = true;

        gl.uniformMatrix4fv(modelViewMatrixLoc,false,flatten(modelViewMatrix));
        gl.uniformMatrix3fv(normalMatrixLoc,false,flatten(normalMatrix));

        gl.drawArrays(gl.TRIANGLES,0,points.length);
        window.requestAnimFrame(render);
    }

    render();
};
