var linePoints;
var bezierPoints;

var lineMaterial, bezierMaterial, bezierDotMaterial, bezierControlPointMaterial;
var lineObject, bezierObject, bezierDotsObject, bezierControlPointsObject;
var bezierDotGeometry, bezierControlPointGeometry;
var canvas, renderer, scene, camera, controls;
var linePointsInput = document.getElementById('linePointsInput');
var bezierPointsInput = document.getElementById('bezierPointsInput');
var canvasContainer = document.getElementById('canvasContainer');
var showBezierDotsCheckbox = document.getElementById('showBezierDotsCheckbox');
var showBezierControlPointsCheckbox = document.getElementById('showBezierControlPointsCheckbox');

var canvas = document.getElementById('canvas');

function toggleGrabCursor(evt) {
  evt.target.classList.toggle('grabbing');
}

function handleResize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  // console.log(canvasContainer);
  // let width = canvasContainer.clientWidth;
  // let height = canvasContainer.clientHeight;
  // camera.aspect = width / height;
  // console.log(width, height);
  // renderer.setSize(width, height);
}

function init() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  window.addEventListener('resize', handleResize, false);
  renderer = new THREE.WebGLRenderer({canvas, alpha: true});
  // document.body.appendChild( renderer.domElement );


  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 35, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000 );
  camera.position.set( 100, 100, 100 );
  controls = new THREE.TrackballControls( camera, canvas );
  handleResize();


  // TODO: register listeners

  // Create Materials for both line and bezier curve with different colors
  lineMaterial = new THREE.LineBasicMaterial( { color: 0x000000} );

  bezierMaterial = new THREE.LineBasicMaterial( {color: 0xee0000 } );
  bezierDotMaterial = new THREE.MeshBasicMaterial( {color: 0xff8200} );
  bezierControlPointMaterial = new THREE.MeshBasicMaterial( {color: 0x66cc66} );
  bezierControlLineMaterial = new THREE.LineBasicMaterial( {color: 0x66cc66} );

  bezierDotGeometry = new THREE.SphereBufferGeometry( 0.75, 16, 16 );
  bezierControlPointGeometry = new THREE.SphereGeometry( 0.6, 16, 16 );

  bezierDotsObject = new THREE.Object3D();
  bezierControlPointsObject = new THREE.Object3D();

  animate();

  updateInputs()

}

function updateInputs() {
  console.log('update inputs');
  updateLine();
  updateBezier();
}


function updateLine(points) {
  try {
    linePoints = JSON.parse(linePointsInput.value);
  } catch (e) {
    linePointsInput.classList.add('error');
    return;
  }
  linePointsInput.classList.remove('error');

  if (lineObject !== undefined) scene.remove(lineObject);

  // Get new points from TextArea
  let lineGeometry = new THREE.BufferGeometry();
  // add flattened array of points to vertices
  let vertices = new Float32Array( [].concat.apply([], linePoints));

  lineGeometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
  lineObject = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(lineObject);
}


function updateBezier() {

  try {
    bezierPoints = JSON.parse(bezierPointsInput.value);
  } catch (e) {
    bezierPointsInput.classList.add('error');
    return;
  }
  bezierPointsInput.classList.remove('error');

  if (bezierObject !== undefined) scene.remove(bezierObject);
  if (bezierDotsObject !== undefined) scene.remove(bezierDotsObject);
  if (bezierControlPointsObject !== undefined) scene.remove(bezierControlPointsObject);

  bezierDotsObject = new THREE.Object3D();
  scene.add(bezierDotsObject);

  bezierControlPointsObject = new THREE.Object3D();
  scene.add(bezierControlPointsObject);

  let bezierSegmentPoints = [];


  for (let bezierSegment of bezierPoints) {
    let curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3().fromArray(bezierSegment[0]),
      new THREE.Vector3().fromArray(bezierSegment[1]),
      new THREE.Vector3().fromArray(bezierSegment[2]),
      new THREE.Vector3().fromArray(bezierSegment[3])
    );
    bezierSegmentPoints = bezierSegmentPoints.concat(curve.getPoints(25 * curve.getLength()));

    if(showBezierDotsCheckbox.checked === true) {
      let startDot = new THREE.Mesh( bezierDotGeometry, bezierDotMaterial );
      let endDot = new THREE.Mesh( bezierDotGeometry, bezierDotMaterial );
      startDot.position.fromArray(bezierSegment[0]);
      endDot.position.fromArray(bezierSegment[3]);
      bezierDotsObject.add(startDot, endDot);
    }

    if(showBezierControlPointsCheckbox.checked === true) {
      let controlPointA = new THREE.Mesh( bezierControlPointGeometry, bezierControlPointMaterial );
      let controlPointB = new THREE.Mesh( bezierControlPointGeometry, bezierControlPointMaterial );
      controlPointA.position.fromArray(bezierSegment[1]);
      controlPointB.position.fromArray(bezierSegment[2]);

      let ControlLineGeometryA = new THREE.Geometry();
      let ControlLineGeometryB = new THREE.Geometry();
      ControlLineGeometryA.vertices = [
        new THREE.Vector3().fromArray(bezierSegment[0]),
        new THREE.Vector3().fromArray(bezierSegment[1])
      ];
      ControlLineGeometryB.vertices = [
        new THREE.Vector3().fromArray(bezierSegment[2]),
        new THREE.Vector3().fromArray(bezierSegment[3])
      ];
      let controlLineA = new THREE.Line(ControlLineGeometryA, bezierControlLineMaterial);
      let controlLineB = new THREE.Line(ControlLineGeometryB, bezierControlLineMaterial);
      bezierControlPointsObject.add(controlPointA, controlLineA, controlPointB, controlLineB);
    }

  }
  let geometry = new THREE.BufferGeometry().setFromPoints( bezierSegmentPoints );
  bezierObject = new THREE.Line(geometry, bezierMaterial);
  scene.add(bezierObject);

}


function animate() {
	requestAnimationFrame( animate );
  controls.update();
	renderer.render( scene, camera );
}


init();
