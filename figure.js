'use strict'

let canvas, gl, program
var numPositions = 36;
var texSize = 256;
var numChecks = 8;

var texture1, texture2;
var t1, t2;

var c;

var flag = true;


let projectionMatrix, modelViewMatrix, instanceMatrix
let modelViewMatrixLoc
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = xAxis;
var thetaLoc;


var image1 = new Uint8Array(4*texSize*texSize);

    for (var i = 0; i < texSize; i++) {
        for (var j = 0; j <texSize; j++) {
            var patchx = Math.floor(i/(texSize/numChecks));
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchx%2 ^ patchy%2) c = 255;
            else c = 0;
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image1[4*i*texSize+4*j] = c;
            image1[4*i*texSize+4*j+1] = c;
            image1[4*i*texSize+4*j+2] = c;
            image1[4*i*texSize+4*j+3] = 255;
        }
    }

var image2 = new Uint8Array(4*texSize*texSize);

    // Create a checkerboard pattern
    for (var i = 0; i < texSize; i++) {
        for (var j = 0; j <texSize; j++) {
            image2[4*i*texSize+4*j] = 127+127*Math.sin(0.1*i*j);
            image2[4*i*texSize+4*j+1] = 127+127*Math.sin(0.1*i*j);
            image2[4*i*texSize+4*j+2] = 127+127*Math.sin(0.1*i*j);
            image2[4*i*texSize+4*j+3] = 255;
           }
    }

var positionsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

// constant  position of the  vertices defined for each triangle
const vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0)
]
//define varianles for the colors used in the figure 
var vertexColors = [
  vec4(0.0, 0.0, 0.0, 1.0),  // black
  vec4(1.0, 0.0, 0.0, 1.0),  // red
  vec4(1.0, 1.0, 0.0, 1.0),  // yellow
  vec4(0.0, 1.0, 0.0, 1.0),  // green
  vec4(0.0, 0.0, 1.0, 1.0),  // blue
  vec4(1.0, 0.0, 1.0, 1.0),  // magenta
  vec4(0.0, 1.0, 1.0, 1.0),  // white
  vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];


//defininig the constants for parts of the figure
const torsoId = 0
const headId = 1
const head1Id = 1
const head2Id = 10
const leftUpperArmId = 2
const leftLowerArmId = 3
const rightUpperArmId = 4
const rightLowerArmId = 5
const leftUpperLegId = 6
const leftLowerLegId = 7
const rightUpperLegId = 8
const rightLowerLegId = 9

const torsoHeight = 5.0
const torsoWidth = 1.0
const upperArmHeight = 3.0
const lowerArmHeight = 2.0
const upperArmWidth = 0.5
const lowerArmWidth = 0.5
const upperLegWidth = 0.5
const lowerLegWidth = 0.5
const lowerLegHeight = 2.0
const upperLegHeight = 3.0
const headHeight = 1.5
const headWidth = 1.0

const numNodes = 10
// const numAngles = 11
// const angle = 0

let theta = [0, 0, 0, 0, 0, 0, 180, 0, 180, 0, 0]
var thetaLoc;
// const numVertices = 24

const stack = []

const figure = []

const pointsArray = []

//createing the texture map for a 2D element 
function configureTexture() {
  texture1 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                    gl.NEAREST_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  texture2 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture2);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
  gl.generateMipmap(gl.TEXTURE_2D );
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                    gl.NEAREST_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}




window.onload = function init () {
  canvas = document.getElementById('gl-canvas')
  gl = canvas.getContext('webgl2')
  if (!gl) {
    alert('WebGL 2.0 is not available')
  }
  //this represents the viewport on the window. 
  gl.viewport(0, 0, canvas.width, canvas.height)
  // clear the color to give you deseired color RGBA
  gl.clearColor(0.9, 0.9, 0.9, 1.0)
  //  Load shaders and initialize attribute buffers
  program = initShaders(gl, 'vertex-shader', 'fragment-shader')
  gl.useProgram(program)

  instanceMatrix = mat4()
  projectionMatrix = ortho(-10.0, 10.0, -10.0, 10.0, -10.0, 10.0)
  modelViewMatrix = mat4()

  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelViewMatrix'), false, flatten(modelViewMatrix))
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), false, flatten(projectionMatrix))

  modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix')

  for (let i = 0; i < numNodes; i++) {
    figure[i] = createNode(null, null, null, null)
  }

  cube()
  //create a buffer for color
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  var colorLoc = gl.getAttribLocation( program, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc );

//creates a vertex buffer 
  const vBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW)

  const positionLoc = gl.getAttribLocation(program, 'aPosition')
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(positionLoc)

// create a buffer for texture 
var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);


    // call the configure texture function defined above 
    configureTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(gl.getUniformLocation( program, "uTex0"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(gl.getUniformLocation( program, "uTex1"), 1);



    thetaLoc = gl.getUniformLocation(program, "uTheta");
// call the html slider elements from the html file using  document.getELementByID for each figure part
  document.getElementById('slider0').onchange = function (event) {
    theta[torsoId] = event.target.value
    initNodes(torsoId)
  }
  document.getElementById('slider1').onchange = function (event) {
    theta[head1Id] = event.target.value
    initNodes(head1Id)
  }
  document.getElementById('slider2').onchange = function (event) {
    theta[leftUpperArmId] = event.target.value
    initNodes(leftUpperArmId)
  }
  document.getElementById('slider3').onchange = function (event) {
    theta[leftLowerArmId] = event.target.value
    initNodes(leftLowerArmId)
  }
  document.getElementById('slider4').onchange = function (event) {
    theta[rightUpperArmId] = event.target.value
    initNodes(rightUpperArmId)
  }
  document.getElementById('slider5').onchange = function (event) {
    theta[rightLowerArmId] = event.target.value
    initNodes(rightLowerArmId)
  }
  document.getElementById('slider6').onchange = function (event) {
    theta[leftUpperLegId] = event.target.value
    initNodes(leftUpperLegId)
  }
  document.getElementById('slider7').onchange = function (event) {
    theta[leftLowerLegId] = event.target.value
    initNodes(leftLowerLegId)
  }
  document.getElementById('slider8').onchange = function (event) {
    theta[rightUpperLegId] = event.target.value
    initNodes(rightUpperLegId)
  }
  document.getElementById('slider9').onchange = function (event) {
    theta[rightLowerLegId] = event.target.value
    initNodes(rightLowerLegId)
  }
  document.getElementById('slider10').onchange = function (event) {
    theta[head2Id] = event.target.value
    initNodes(head2Id)
  }





  for (let i = 0; i < numNodes; i++) {
    initNodes(i)
  }
  render()
}


//initnode function allows the movement of each part of the figure using the slider 
function initNodes (Id) {
  let m = mat4()
  switch (Id) {
    case torsoId:
      m = rotate(theta[torsoId], vec3(0, 1, 0))
      figure[torsoId] = createNode(m, torso, null, headId)
      break
    case headId:
    case head1Id:
    case head2Id:
      m = translate(0.0, torsoHeight + 0.5 * headHeight, 0.0)
      m = mult(m, rotate(theta[head1Id], vec3(1, 0, 0)))
      m = mult(m, rotate(theta[head2Id], vec3(0, 1, 0)))
      m = mult(m, translate(0.0, -0.5 * headHeight, 0.0))
      figure[headId] = createNode(m, head, leftUpperArmId, null)
      break
    case leftUpperArmId:
      m = translate(-(torsoWidth + upperArmWidth), 0.9 * torsoHeight, 0.0)
      m = mult(m, rotate(theta[leftUpperArmId], vec3(1, 0, 0)))
      figure[leftUpperArmId] = createNode(m, leftUpperArm, rightUpperArmId, leftLowerArmId)
      break
    case rightUpperArmId:
      m = translate(torsoWidth + upperArmWidth, 0.9 * torsoHeight, 0.0)
      m = mult(m, rotate(theta[rightUpperArmId], vec3(1, 0, 0)))
      figure[rightUpperArmId] = createNode(m, rightUpperArm, leftUpperLegId, rightLowerArmId)
      break
    case leftUpperLegId:
      m = translate(-(torsoWidth + upperLegWidth), 0.1 * upperLegHeight, 0.0)
      m = mult(m, rotate(theta[leftUpperLegId], vec3(1, 0, 0)))
      figure[leftUpperLegId] = createNode(m, leftUpperLeg, rightUpperLegId, leftLowerLegId)
      break
    case rightUpperLegId:
      m = translate(torsoWidth + upperLegWidth, 0.1 * upperLegHeight, 0.0)
      m = mult(m, rotate(theta[rightUpperLegId], vec3(1, 0, 0)))
      figure[rightUpperLegId] = createNode(m, rightUpperLeg, null, rightLowerLegId)
      break
    case leftLowerArmId:
      m = translate(0.0, upperArmHeight, 0.0)
      m = mult(m, rotate(theta[leftLowerArmId], vec3(1, 0, 0)))
      figure[leftLowerArmId] = createNode(m, leftLowerArm, null, null)
      break
    case rightLowerArmId:
      m = translate(0.0, upperArmHeight, 0.0)
      m = mult(m, rotate(theta[rightLowerArmId], vec3(1, 0, 0)))
      figure[rightLowerArmId] = createNode(m, rightLowerArm, null, null)
      break
    case leftLowerLegId:
      m = translate(0.0, upperLegHeight, 0.0)
      m = mult(m, rotate(theta[leftLowerLegId], vec3(1, 0, 0)))
      figure[leftLowerLegId] = createNode(m, leftLowerLeg, null, null)
      break
    case rightLowerLegId:
      m = translate(0.0, upperLegHeight, 0.0)
      m = mult(m, rotate(theta[rightLowerLegId], vec3(1, 0, 0)))
      figure[rightLowerLegId] = createNode(m, rightLowerLeg, null, null)
      break
  }
}

function createNode (transform, render, sibling, child) {
  const node = { transform, render, sibling, child }
  return node
}

function traverse (Id) {
  if (Id == null) {
    return
  }
  stack.push(modelViewMatrix)
  modelViewMatrix = mult(modelViewMatrix, figure[Id].transform)
  figure[Id].render()
  if (figure[Id].child != null) {
    traverse(figure[Id].child)
  }
  modelViewMatrix = stack.pop()
  if (figure[Id].sibling != null) {
    traverse(figure[Id].sibling)
  }
}

function torso () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(torsoWidth, torsoHeight, torsoWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function head () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, headWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function leftUpperArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function leftLowerArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function rightUpperArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function rightLowerArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function leftUpperLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function leftLowerLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function rightUpperLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function rightLowerLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}
// the cube funtion used to create a cube from triangles
function cube () {
  quad(1, 0, 3, 2)
  quad(2, 3, 7, 6)
  quad(3, 0, 4, 7)
  quad(6, 5, 1, 2)
  quad(4, 5, 6, 7)
  quad(5, 4, 0, 1)
}

// this function pushes the color, position and the texture into the figure element 
function quad(a, b, c, d) {
  positionsArray.push(vertices[a]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[0]);

  positionsArray.push(vertices[b]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[1]);

  positionsArray.push(vertices[c]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[2]);

  positionsArray.push(vertices[a]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[0]);

  positionsArray.push(vertices[c]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[2]);

  positionsArray.push(vertices[d]);
  colorsArray.push(vertexColors[a]);
  texCoordsArray.push(texCoord[3]);
}


//without this function your code will not display on the browser.
function render () {
 
  gl.clear(gl.COLOR_BUFFER_BIT);
 
  traverse(torsoId)
  window.requestAnimationFrame(render)
}