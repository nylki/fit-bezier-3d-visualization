let line, bezierCurve;
let linePoints = [
  [0, 0, 0], [2-5,4,-1], [5,5,0],  [1,-5,6], [-15,0.5,0], [-20,0,0], [-21,-0.5,0.5]
];
let bezierPoints = [[1,1,1]];

var lineMaterial, bezierCurveMaterial;
var lineObject, bezierCurveObject;
var canvas, renderer, scene, camera, controls;
var linePointsInput = document.getElementById('linePointsInput');
var bezierPointsInput = document.getElementById('bezierPointsInput');
var canvasContainer = document.getElementById('canvasContainer');
var canvas = document.getElementById('canvas');


function handleResize() {
  // console.log(canvasContainer);
  // let width = canvasContainer.clientWidth;
  // let height = canvasContainer.clientHeight;
  // camera.aspect = width / height;
  // console.log(width, height);
  // renderer.setSize(width, height);
}

function init() {
  linePointsInput.value = JSON.stringify(linePoints);
  bezierPointsInput.value = JSON.stringify(bezierPoints);
  window.addEventListener('resize', handleResize);
  renderer = new THREE.WebGLRenderer({canvas});
  // document.body.appendChild( renderer.domElement );

  renderer.setSize(800, 800);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, 800 / 800, 0.1, 1000 );
  camera.position.set( - 40, 0, 60 );
  controls = new THREE.OrbitControls( camera );
  handleResize();


  // TODO: register listeners

  // Create Materials for both line and bezier curve with different colors
  lineMaterial = new THREE.LineDashedMaterial( {
    scale: 2,
    dashSize: 1,
    gapSize: 1,
    color: 0xffffff,
    linewidth: 5
  } );

  bezierCurveMaterial = new THREE.LineDashedMaterial( {
    color: 0x00ff00,
    linewidth: 50
  } );

  animate();
  updateLine(defaultLinePoints);
  // updateBezierCurve(defaultBezierPoints);
  console.log(lineObject);
  scene.add(lineObject);
  // scene.add(bezierCurveObject);
}

// Gets line points from textarea and evaluates it (is it a proper array?)
function fetchAndEvaluateLinePoints() {
  let points;
  try {
    points = JSON.parse(linePointsInput.value);
  } catch (e) {
    alert('Invalid array for line points. Please check your input', e);
    return;
  }



}


function updateLine() {
  // Get new points from TextArea
  let lineGeometry = new THREE.BufferGeometry();
  // add flattened array of points to vertices
  let vertices = new Float32Array( [].concat.apply([], linePoints));
  console.log(vertices);


  lineGeometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
  lineObject = new THREE.Line(lineGeometry, lineMaterial);

  // if (lineObject !== undefined)
}

function updateBezierCurve(points) {

}

function animate() {
	requestAnimationFrame( animate );
  controls.update();
	renderer.render( scene, camera );
}


init();
