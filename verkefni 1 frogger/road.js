// Road settings
var roadRows = 7;          // now 7 rows
var rowHeight = 2.0 / roadRows;  // evenly divide screen height
var lineHeight = 0.02;     // height of the white lane marking
var dashWidth = 0.1;       // width of each dash
var dashGap = 0.05;        // gap between dashes

var rowBuffers = [];
var rowColors = [];
var lineBuffers = [];
var lineCounts = []; 

function initRoad(gl) {
    rowBuffers = [];
    rowColors = [];
    lineBuffers = [];
    lineCounts = [];

    for (var i = 0; i < roadRows; i++) {
        var y0 = -1.0 + i * rowHeight;
        var y1 = y0 + rowHeight;

        var verts = [
            vec2(-1.0, y0), vec2(1.0, y0), vec2(1.0, y1 - lineHeight),
            vec2(-1.0, y0), vec2(1.0, y1 - lineHeight), vec2(-1.0, y1 - lineHeight)
        ];
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(verts), gl.STATIC_DRAW);
        rowBuffers.push(buf);

        var color = (i === 0 || i === roadRows - 1)
            ? vec4(0.55, 0.27, 0.07, 1.0)  // brown for edges
            : vec4(0.6, 0.6, 0.6, 1.0);   // gray for road lanes
        rowColors.push(color);

        if (i > 0 && i < roadRows - 1) {
            var ly0 = y1 - lineHeight;
            var ly1 = y1;
            var dashes = [];
            var count = Math.floor(2.0 / (dashWidth + dashGap)); 
            lineCounts.push(count);

            for (var j = 0; j < count; j++) {
                var xStart = -1.0 + j * (dashWidth + dashGap);
                var xEnd = xStart + dashWidth;
                dashes.push(
                    vec2(xStart, ly0), vec2(xEnd, ly0),
                    vec2(xStart, ly1), vec2(xEnd, ly1)
                );
            }

            var lbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, lbuf);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(dashes), gl.STATIC_DRAW);
            lineBuffers.push(lbuf);
        } else {
            lineBuffers.push(null); 
            lineCounts.push(0);
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawRoad(gl, locColor, vPosition, locOffset, locAngle) {
    gl.uniform2fv(locOffset, flatten(vec2(0.0, 0.0)));
    gl.uniform1f(locAngle, 0.0);

    for (var i = 0; i < roadRows; i++) {

        gl.bindBuffer(gl.ARRAY_BUFFER, rowBuffers[i]);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.uniform4fv(locColor, flatten(rowColors[i]));
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (lineBuffers[i]) {
            gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffers[i]);
            gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);
            gl.uniform4fv(locColor, flatten(vec4(1.0, 1.0, 1.0, 1.0)));
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, lineCounts[i]*4); // each dash = 4 vertices
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
