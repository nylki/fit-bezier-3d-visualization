var linePoints, maxError, showBezierDots, showBezierControlPoints, bezierPoints;

var lineMaterial, bezierMaterial, bezierDotMaterial, bezierControlPointMaterial;
var lineObject, bezierObject, bezierDotsObject, bezierControlPointsObject;
var bezierDotGeometry, bezierControlPointGeometry;
var canvas, renderer, scene, camera, controls;
var linePointsInput = document.getElementById('linePointsInput');
var bezierPointsInput = document.getElementById('bezierPointsInput');
var canvasContainer = document.getElementById('canvasContainer');
var showBezierDotsCheckbox = document.getElementById('showBezierDotsCheckbox');
var showBezierControlPointsCheckbox = document.getElementById('showBezierControlPointsCheckbox');
var maxErrorSlider = document.getElementById('maxErrorSlider');
var maxErrorText = document.getElementById('maxErrorText');
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
  bezierControlPointMaterial = new THREE.MeshBasicMaterial( {color: 0x22cc22} );
  bezierControlLineMaterial = new THREE.LineBasicMaterial( {color: 0x22cc22} );

  bezierDotGeometry = new THREE.SphereBufferGeometry( 0.55, 16, 16 );
  bezierControlPointGeometry = new THREE.SphereGeometry( 0.40, 16, 16 );

  bezierDotsObject = new THREE.Object3D();
  bezierControlPointsObject = new THREE.Object3D();

  animate();

  updateInputs();

}

function updateInputs(evt) {
  // update values for maxError.
  if(evt && (evt.target.id === 'maxErrorText')) {
    if (maxErrorText.value.length !== 0 && !isNaN(maxErrorText.value)) {
      maxError = maxErrorText.value;
      maxErrorSlider.value = maxError;
    }
  } else {
    maxError = maxErrorSlider.value;
    maxErrorText.value = maxError;
  }

  // Update checkbox values for bezier dot visualization and dont do any more work
  // if only checkboxes clicked
  showBezierDots = showBezierDotsCheckbox.checked;
  showBezierControlPoints = showBezierControlPointsCheckbox.checked;


  // update linePoints array from textarea
  if (evt === undefined || evt.target.id === 'linePointsInput') {
    try {
      linePoints = JSON.parse(linePointsInput.value);
    } catch (e) {
      linePointsInput.classList.add('error');
      return;
    }
    linePointsInput.classList.remove('error');
  }

  // Update bezierPoints by applying fitting algorithm
  // from https://github.com/Yay295/fitCurves/blob/master/fitCurves3D.js
  // and saves the array to bezierPoints.
  try {
    bezierPoints = fitCurve(linePoints, maxErrorSlider.value);
    bezierPointsInput.value = JSON.stringify(bezierPoints);
  } catch (e) {
    console.log('Could not fit lines to bezier curve.', e);
    alert('Could not fit lines to bezier curve.', e);
  }

  // Update the actual visualizations
  drawLine();
  drawBezier();
}



function drawLine() {

  if (lineObject !== undefined) scene.remove(lineObject);

  // Get new points from TextArea
  let lineGeometry = new THREE.BufferGeometry();
  // add flattened array of points to vertices
  let vertices = new Float32Array( [].concat.apply([], linePoints));

  lineGeometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
  lineObject = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(lineObject);
}




function drawBezier() {

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

    if(showBezierDots === true) {
      let startDot = new THREE.Mesh( bezierDotGeometry, bezierDotMaterial );
      let endDot = new THREE.Mesh( bezierDotGeometry, bezierDotMaterial );
      startDot.position.fromArray(bezierSegment[0]);
      endDot.position.fromArray(bezierSegment[3]);
      bezierDotsObject.add(startDot, endDot);
    }

    if(showBezierControlPoints === true) {
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
