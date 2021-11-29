import fragmentShader  from '../shaders/raymarching2.js';
import { GUI } from '../libs/lil-gui/dist/lil-gui.esm.js';
const canvas = document.querySelector('#c');
const uniforms = {
  iTime: {value: 0},
  iResolution: { value: new THREE.Vector3()},
  iMouse:{ value: new THREE.Vector2()} ,
};

const renderer = new THREE.WebGLRenderer({ canvas });

const scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera();
var mouse = new THREE.Vector2()
document.addEventListener('mousemove', onDocumentMouseMove, false);


const gui = new GUI();
function init() {
        renderer.autoClearColor = false;
        camera = new THREE.OrthographicCamera(
              -1, // left
              1, // right
              1, // top
              -1, // bottom
              -1, // near,
              1, // far
        );

        const plane = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({fragmentShader,uniforms});
        const mesh = new THREE.Mesh(plane, material)
        scene.add(mesh);
}
var obj = {
        MyNumber: canvas.width,
        Start: function() {
                alert("sdf");
        },
        
      }   
      gui.add( canvas, 'width' ).onChange(value=>{
              canvas.width = value;
      });
      
      //gui.add(obj,'MyNumber');

//---------------------------------------------------------------------
function onDocumentMouseMove(event) {
            event.preventDefault();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
          
}

function resizeRendererToDisplaySize(renderer){
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
}


function render(time) {
        resizeRendererToDisplaySize(renderer);
        time *= 0.001;  // convert to seconds

        uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
        uniforms.iTime.value = time;
        uniforms.iMouse.value.set(mouse.x,mouse.y);
        renderer.render(scene, camera);
       //console.log( uniforms.iTime.value)
        requestAnimationFrame(render);
}
requestAnimationFrame(render);

init();