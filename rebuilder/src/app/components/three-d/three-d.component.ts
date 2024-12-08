import { Component, ElementRef, input, viewChild } from '@angular/core';
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';


@Component({
  selector: 'app-three-d',
  standalone: true,
  imports: [],
  templateUrl: './three-d.component.html',
  styleUrl: './three-d.component.css'
})
export class ThreeDComponent  {
  // URL of a LEGO LDraw file
  src = input.required<string>();
  // Track load progress of the LDraw file
  loadProgress: number = 0;
  loadComplete: boolean = false;

  // The general outline of the code below was adapted from: 
  // https://medium.com/geekculture/hello-cube-your-first-three-js-scene-in-angular-176c44b9c6c0
  modelCanvas = viewChild<ElementRef>("canvas");

  // THREE.js rendering components
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private controls!: OrbitControls;
  private camera!: THREE.PerspectiveCamera;

  private createScene() {
    this.scene = new THREE.Scene();
    
    this.renderer = new THREE.WebGLRenderer(
      { canvas: this.modelCanvas()?.nativeElement }
    );
    this.renderer.setPixelRatio(5); // Set resolution

    
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      16/9 * 1.1, // Aspect ratio
      0.1, // Near plane render cutoff
      100000, // Far plane render cutoff
    )
    this.camera.lookAt(0, 0, 0); // Look to the center where the model is
    
    // Camera controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;

    // Handle window resize; a suggestion from GitHub Copilot
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    this.onWindowResize();

    // Baseline "brightness"
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    // Additional light sources, at opposite corners
    const directionalLight1 = new THREE.DirectionalLight
    (0xffffff, 1);
    directionalLight1.position.set(50, 100, 75);
    this.scene.add(directionalLight1);
    const directionalLight2 = new THREE.DirectionalLight
    (0xffffff, 1);
    directionalLight2.position.set(-50, -100, -75);
    this.scene.add(directionalLight2);

    // Load model from the provided URL and add to the center of the render
    // Some code derived from:
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_ldraw.html
    const loader = new LDrawLoader();
    loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);

    // Fetch LEGO file from provided src
    fetch(this.src()).then(response => {
      if (!response.ok) {
        throw new Error;
      }
    }).then(() => {
      // Load into the 3D environment
      loader.load(this.src(),
      (group) => {
        // Shrink the model to a reasonable scale
        group.scale.set(0.1, 0.1, 0.1);

        // Compute the bounding box of the model
        const box = new THREE.Box3().setFromObject(group);
        
        // Calculate the center of the bounding box
        const center = box.getCenter(new THREE.Vector3());
        
        // Reposition the model to center it
        group.position.x = -center.x;
        group.position.y = center.y;
        group.position.z = center.z;

        // Fix inverted default rotation
        group.rotation.x = Math.PI;

        this.scene.add(group);

        // Position the camera at a scaled distance ("zoom") from the model
        // Generated by GitHub Copilot using the prompt:
        // "How do I reasonably scale the camera position to the size of the model?"
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));

        this.camera.position.set(0, 0, cameraZ * 1.5);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();

        this.loadComplete = true;
      },

      // Log load progress
      (xhr) => {
        // Update load progress on % scale
        this.loadProgress = xhr.loaded / xhr.total * 100;
      },

      function ( error ) {
        console.log(error);
      }
    )
    });
  }

  // Function to start up rendering loop
  private startAnimation() {
    let component: ThreeDComponent = this;
    (function animate() {
      requestAnimationFrame(animate); // Play the next frame
      component.controls.update();
      component.renderer.render(component.scene, component.camera);
    }());
  }

  // Rescale render and environment based on window size
  // Generated by GitHub Copilot with the prompt:
  // "How do I set the aspect ratio of the THREE.js canvas"
  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Initialize 3D environment and render animation
  ngAfterViewInit() {
    this.createScene();
    this.startAnimation();
  }
}
