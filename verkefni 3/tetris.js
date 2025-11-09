"use strict";

let gl, program, transformLoc;

// Camera
let angleX = 20, angleY = -30;
let dragging = false, lastX, lastY;

// Cube dimensions
const WIDTH = 6, HEIGHT = 20, DEPTH = 6;
const areaScale = 1.9;
const SCALE = Math.max(WIDTH, HEIGHT, DEPTH);
const SCALE_X = (WIDTH / SCALE) * areaScale;
const SCALE_Y = (HEIGHT / SCALE) * areaScale;
const SCALE_Z = (DEPTH / SCALE) * areaScale;
const centerX = SCALE_X / 2, centerY = SCALE_Y / 2, centerZ = SCALE_Z / 2;

// Small cube
const CELL_WIDTH = SCALE_X / WIDTH;
const CELL_HEIGHT = SCALE_Y / HEIGHT;
const CELL_DEPTH = SCALE_Z / DEPTH;

// Grid to track landed cubes
const grid = Array.from({length:WIDTH},()=>Array.from({length:HEIGHT},()=>Array.from({length:DEPTH},()=>null)));

// Shapes
const shapes = [
    [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0}], // line
    [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:0,y:0,z:1}]  // L
];

// Colors
const colors = ["green","yellow","blue","red"];

// Falling piece
let fallingPiece = null;

// Rotation control
let lastRotateTime = 0;
const rotateCooldown = 100;

// Fall control
let lastFallTime = 0;
let fallInterval = 1000;

// Score
let score = 0;

// NEW: Pause state
let paused = false;

// Main cube edges
const vertices = [
    vec4(0-centerX,0-centerY,0-centerZ,1),
    vec4(SCALE_X-centerX,0-centerY,0-centerZ,1),
    vec4(SCALE_X-centerX,SCALE_Y-centerY,0-centerZ,1),
    vec4(0-centerX,SCALE_Y-centerY,0-centerZ,1),
    vec4(0-centerX,0-centerY,SCALE_Z-centerZ,1),
    vec4(SCALE_X-centerX,0-centerY,SCALE_Z-centerZ,1),
    vec4(SCALE_X-centerX,SCALE_Y-centerY,SCALE_Z-centerZ,1),
    vec4(0-centerX,SCALE_Y-centerY,SCALE_Z-centerZ,1)
];
const edges = [0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7];

// --------------------------------------------------
// INIT
// --------------------------------------------------
window.onload = function init() {
    const canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) alert("WebGL not available");

    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0,0,0,1);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl,"vertex-shader","fragment-shader");
    gl.useProgram(program);
    transformLoc = gl.getUniformLocation(program,"transform");

    setupControls();
    spawnPiece();

    requestAnimationFrame(animate);
};

// --------------------------------------------------
// Controls
// --------------------------------------------------
function setupControls(){
    const canvas = document.getElementById("gl-canvas");
    canvas.addEventListener("mousedown",e=>{dragging=true; lastX=e.clientX; lastY=e.clientY;});
    canvas.addEventListener("mouseup",()=>dragging=false);
    canvas.addEventListener("mousemove",e=>{
        if(dragging){
            angleY-= (e.clientX-lastX)*0.3;
            angleX+= (e.clientY-lastY)*0.3;
            angleX=Math.max(-85,Math.min(85,angleX));
            lastX=e.clientX; lastY=e.clientY;
            render();
        }
    });

    // -------------------------------
    // KEYBOARD (blocked when paused)
    // -------------------------------
    window.addEventListener("keydown", e=>{
        if (paused) return;  // NEW: Disable input when paused
        const now = Date.now();
        if(!fallingPiece) return;

        // Movement
        switch(e.key){
            case "ArrowLeft": movePiece(-1,0); break;
            case "ArrowRight": movePiece(1,0); break;
            case "ArrowUp": movePiece(0,-1); break;
            case "ArrowDown": movePiece(0,1); break;
            case " ": dropOneLevel(); break;
        }

        document.getElementById("gameOverRestart").onclick = () => {
            hideGameOver();
            restartGame();
        };


        // Rotation with cooldown
        if(now - lastRotateTime < rotateCooldown) return;
        switch(e.key){
            case "a": rotatePiece('x'); break;
            case "z": rotatePiece('x'); break;
            case "s": rotatePiece('y'); break;
            case "x": rotatePiece('y'); break;
            case "d": rotatePiece('z'); break;
            case "c": rotatePiece('z'); break;
        }
        lastRotateTime = now;
    });

    // -------------------------------
    // BUTTONS
    // -------------------------------
    document.getElementById("pauseBtn").onclick = () => {
        paused = !paused;
        document.getElementById("pauseBtn").innerText = paused ? "Resume" : "Pause";
    };

    document.getElementById("restartBtn").onclick = () => {
        restartGame();
    };

    // Difficulty slider
// Difficulty dropdown
    const diffSelect = document.getElementById("difficultySelect");
    diffSelect.addEventListener("change", () => {
        fallInterval = Number(diffSelect.value);
    });


}

// --------------------------------------------------
// Restart (NEW)
// --------------------------------------------------
function restartGame() {
    // Clear grid
    for (let x = 0; x < WIDTH; x++){
        for (let y = 0; y < HEIGHT; y++){
            for (let z = 0; z < DEPTH; z++){
                grid[x][y][z] = null;
            }
        }
    }

    fallingPiece = null;
    score = 0;
    paused = false;
    lastFallTime = 0;

    document.getElementById("pauseBtn").innerText = "Pause";
    document.getElementById("score").innerText = `Score: ${score}`;

    spawnPiece();
}

function showGameOver() {
    paused = true;
    document.getElementById("finalScore").innerText = "Your Score: " + score;
    document.getElementById("gameOverScreen").style.display = "block";
}

function hideGameOver() {
    document.getElementById("gameOverScreen").style.display = "none";
}

// --------------------------------------------------
// Spawn new piece
// --------------------------------------------------
function spawnPiece(){
    const shape = JSON.parse(JSON.stringify(shapes[Math.random()<0.5?0:1]));
    const color = colors[Math.floor(Math.random()*colors.length)];

    const maxX = Math.max(...shape.map(b=>b.x));
    const maxZ = Math.max(...shape.map(b=>b.z));
    const offsetX = Math.floor((WIDTH-maxX-1)/2);
    const offsetZ = Math.floor((DEPTH-maxZ-1)/2);

    shape.forEach(b=>{
        b.x+=offsetX;
        b.y=HEIGHT-1;
        b.z+=offsetZ;
    });

    const blocked = shape.some(b => grid[b.x][b.y][b.z]);
    if (blocked) {
        showGameOver();
        return;
    }


    fallingPiece={blocks:shape,color};
}

function dropOneLevel(){
    if(!fallingPiece || paused) return;
    let canFall = true;
    for(const b of fallingPiece.blocks){
        if(b.y===0 || grid[b.x][b.y-1][b.z]) { canFall=false; break; }
    }
    if(canFall){
        fallingPiece.blocks.forEach(b=>b.y--);
    } else {
        fallingPiece.blocks.forEach(b=>{
            grid[b.x][b.y][b.z]=fallingPiece.color;
        });
        clearFullLayers();
        fallingPiece = null;
        spawnPiece();
    }
}

// --------------------------------------------------
// Movement & rotation
// --------------------------------------------------
function movePiece(dx,dz){
    if(!fallingPiece || paused) return;
    if(fallingPiece.blocks.every(b=>{
        const nx=b.x+dx, nz=b.z+dz;
        return nx>=0 && nx<WIDTH && nz>=0 && nz<DEPTH && !grid[nx][b.y][nz];
    })){
        fallingPiece.blocks.forEach(b=>{b.x+=dx;b.z+=dz;});
    }
}

function rotatePiece(axis){
    if(!fallingPiece || paused) return;
    const blocks = fallingPiece.blocks;
    const origin = blocks[0];

    const newPositions = blocks.map(b => {
        const x = b.x - origin.x;
        const y = b.y - origin.y;
        const z = b.z - origin.z;
        let nx = x, ny = y, nz = z;
        switch(axis){
            case 'x': ny = -z; nz = y; break;
            case 'y': nx = z; nz = -x; break;
            case 'z': nx = -y; ny = x; break;
        }
        return {x: nx + origin.x, y: ny + origin.y, z: nz + origin.z};
    });

    const valid = newPositions.every(b =>
        b.x >= 0 && b.x < WIDTH &&
        b.y >= 0 && b.y < HEIGHT &&
        b.z >= 0 && b.z < DEPTH &&
        !grid[b.x][b.y][b.z]
    );

    if(valid){
        blocks.forEach((b, i) => {
            b.x = newPositions[i].x;
            b.y = newPositions[i].y;
            b.z = newPositions[i].z;
        });
    }
}

// --------------------------------------------------
// Falling logic
// --------------------------------------------------
let previousTime=0;
function animate(currentTime){
    currentTime=currentTime||0;
    const deltaTime=currentTime-previousTime;
    previousTime=currentTime;

    // NEW: Pause stops falling
    if (!paused) {
        updateFalling(deltaTime);
    }

    render();
    requestAnimationFrame(animate);
}

function updateFalling(deltaTime){
    if(!fallingPiece) return;

    lastFallTime+=deltaTime;
    if(lastFallTime>=fallInterval){
        lastFallTime=0;
        let canFall=true;
        for(const b of fallingPiece.blocks){
            if(b.y===0 || grid[b.x][b.y-1][b.z]) { canFall=false; break; }
        }
        if(canFall){
            fallingPiece.blocks.forEach(b=>b.y--);
        } else {
            fallingPiece.blocks.forEach(b=>{
                grid[b.x][b.y][b.z]=fallingPiece.color;
            });
            clearFullLayers();
            fallingPiece=null;
            spawnPiece();
        }
    }
}

function clearFullLayers(){
    for(let y=0; y<HEIGHT; y++){
        let full=true;
        for(let x=0; x<WIDTH; x++){
            for(let z=0; z<DEPTH; z++){
                if(!grid[x][y][z]){
                    full=false;
                    break;
                }
            }
            if(!full) break;
        }
        if(full){
            for(let x=0; x<WIDTH; x++){
                for(let z=0; z<DEPTH; z++){
                    grid[x][y][z]=null;
                }
            }
            for(let yy=y+1; yy<HEIGHT; yy++){
                for(let x=0; x<WIDTH; x++){
                    for(let z=0; z<DEPTH; z++){
                        grid[x][yy-1][z]=grid[x][yy][z];
                        grid[x][yy][z]=null;
                    }
                }
            }
            score+=1;
            document.getElementById("score").innerText = `Score: ${score}`;
            y--;
        }
    }
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------
function colorNameToRGB(name){
    switch(name){
        case "red": return [1,0,0];
        case "green": return [0,1,0];
        case "blue": return [0,0,1];
        case "yellow": return [1,1,0];
    }
    return [1,1,1];
}

// --------------------------------------------------
// Rendering (unchanged except for pause support)
// --------------------------------------------------
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.width / gl.canvas.height;
    const proj = perspective(45, aspect, 0.1, 100);
    const radius = 3, radX = radians(angleX), radY = radians(angleY);
    const camX = radius * Math.sin(radY) * Math.cos(radX);
    const camY = radius * Math.sin(radX);
    const camZ = radius * Math.cos(radY) * Math.cos(radX);
    const view = lookAt(vec3(camX, camY, camZ), vec3(0, 0, 0), vec3(0, 1, 0));
    const vp = mult(proj, view);
    gl.uniformMatrix4fv(transformLoc, false, flatten(vp));


    // TRIANGLES (landed cubes)
    const triVerts = [];
    const triColors = [];

    for (let x=0; x<WIDTH; x++){
        for (let y=0; y<HEIGHT; y++){
            for (let z=0; z<DEPTH; z++){
                const c = grid[x][y][z];
                if(!c) continue;
                const ox=-centerX+x*CELL_WIDTH;
                const oy=-centerY+y*CELL_HEIGHT;
                const oz=-centerZ+z*CELL_DEPTH;
                const verts=[
                    vec4(0,0,0,1), vec4(CELL_WIDTH,0,0,1), vec4(CELL_WIDTH,CELL_HEIGHT,0,1), vec4(0,CELL_HEIGHT,0,1),
                    vec4(0,0,CELL_DEPTH,1), vec4(CELL_WIDTH,0,CELL_DEPTH,1), vec4(CELL_WIDTH,CELL_HEIGHT,CELL_DEPTH,1), vec4(0,CELL_HEIGHT,CELL_DEPTH,1)
                ];
                for(let v=0; v<verts.length; v++) verts[v]=vec4(verts[v][0]+ox, verts[v][1]+oy, verts[v][2]+oz,1);
                const faces=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5]];
                for(const f of faces){
                    for(let i=1; i<f.length-1; i++){
                        triVerts.push(verts[f[0]], verts[f[i]], verts[f[i+1]]);
                        const colorVec = vec4(...colorNameToRGB(c),1);
                        triColors.push(colorVec,colorVec,colorVec);
                    }
                }
            }
        }
    }

    const triVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(triVerts), gl.STATIC_DRAW);
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    const triCBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triCBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(triColors), gl.STATIC_DRAW);
    const vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.drawArrays(gl.TRIANGLES, 0, triVerts.length);


    // LINES (everything else)
    const lineVerts = [];
    const lineColors = [];

    for(let i=0;i<edges.length;i+=2){
        lineVerts.push(vertices[edges[i]],vertices[edges[i+1]]);
        lineColors.push(vec4(1,1,1,1),vec4(1,1,1,1));
    }

    const N = WIDTH;
    const stepX = SCALE_X / N, stepZ = SCALE_Z / N;
    for(let i=1;i<N;i++){
        const z = -centerZ + i*stepZ;
        lineVerts.push(vec4(-centerX,-centerY,z,1),vec4(SCALE_X-centerX,-centerY,z,1));
        lineColors.push(vec4(1,1,1,1),vec4(1,1,1,1));
        const x = -centerX + i*stepX;
        lineVerts.push(vec4(x,-centerY,-centerZ,1),vec4(x,-centerY,SCALE_Z-centerZ,1));
        lineColors.push(vec4(1,1,1,1),vec4(1,1,1,1));
    }

    const outlineScale=1.05;
    for(let x=0;x<WIDTH;x++){
        for(let y=0;y<HEIGHT;y++){
            for(let z=0;z<DEPTH;z++){
                const c=grid[x][y][z];
                if(!c) continue;
                const ox=-centerX+x*CELL_WIDTH-(CELL_WIDTH*(outlineScale-1)/2);
                const oy=-centerY+y*CELL_HEIGHT-(CELL_HEIGHT*(outlineScale-1)/2);
                const oz=-centerZ+z*CELL_DEPTH-(CELL_DEPTH*(outlineScale-1)/2);
                const verts=[
                    vec4(0,0,0,1), vec4(CELL_WIDTH*outlineScale,0,0,1),
                    vec4(CELL_WIDTH*outlineScale,CELL_HEIGHT*outlineScale,0,1),
                    vec4(0,CELL_HEIGHT*outlineScale,0,1),

                    vec4(0,0,CELL_DEPTH*outlineScale,1),
                    vec4(CELL_WIDTH*outlineScale,0,CELL_DEPTH*outlineScale,1),
                    vec4(CELL_WIDTH*outlineScale,CELL_HEIGHT*outlineScale,CELL_DEPTH*outlineScale,1),
                    vec4(0,CELL_HEIGHT*outlineScale,CELL_DEPTH*outlineScale,1)
                ];
                const e=[0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7];
                for(let i=0;i<e.length;i+=2){
                    lineVerts.push(
                        vec4(verts[e[i]][0]+ox,verts[e[i]][1]+oy,verts[e[i]][2]+oz,1),
                        vec4(verts[e[i+1]][0]+ox,verts[e[i+1]][1]+oy,verts[e[i+1]][2]+oz,1)
                    );
                    lineColors.push(vec4(0,0,0,1),vec4(0,0,0,1));
                }
            }
        }
    }

    if(fallingPiece){
        fallingPiece.blocks.forEach(b=>{
            const ox=-centerX+b.x*CELL_WIDTH;
            const oy=-centerY+b.y*CELL_HEIGHT;
            const oz=-centerZ+b.z*CELL_DEPTH;
            const verts=[
                vec4(0,0,0,1), vec4(CELL_WIDTH,0,0,1),
                vec4(CELL_WIDTH,CELL_HEIGHT,0,1), vec4(0,CELL_HEIGHT,0,1),
                vec4(0,0,CELL_DEPTH,1), vec4(CELL_WIDTH,0,CELL_DEPTH,1),
                vec4(CELL_WIDTH,CELL_HEIGHT,CELL_DEPTH,1), vec4(0,CELL_HEIGHT,CELL_DEPTH,1)
            ];
            for(let v=0;v<verts.length;v++)
                verts[v]=vec4(verts[v][0]+ox,verts[v][1]+oy,verts[v][2]+oz,1);

            const e=[0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7];
            for(let i=0;i<e.length;i+=2){
                lineVerts.push(verts[e[i]],verts[e[i+1]]);
                lineColors.push(vec4(...colorNameToRGB(fallingPiece.color),1),
                                vec4(...colorNameToRGB(fallingPiece.color),1));
            }
        });
    }

    const lineVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,lineVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(lineVerts),gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vPosition);

    const lineCBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,lineCBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,flatten(lineColors),gl.STATIC_DRAW);
    gl.vertexAttribPointer(vColor,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vColor);

    gl.drawArrays(gl.LINES,0,lineVerts.length);
}
