import * as THREE from "three";

export class Stage {
  constructor(params, bool) {
    this.params = params;
    this.bool = bool;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.stats = null;

    this.init();
  }

  init() {
    this.setRenderer();
    this.setScene();
    this.setCamera();
  }

  updateRenderer() {
    this.renderer.setSize(this.params.w, this.params.h);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  }

  setRendererLight() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.shadowMap.autoUpdate = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // this.renderer.toneMapping = THREE.CineonToneMapping;
    // this.renderer.shadowMap.type = THREE.BasicShadowMap
    // this.renderer.shadowMap.type = THREE.PCFShadowMap
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // this.renderer.shadowMap.type = THREE.VSMShadowMap
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1; // 1.75
    // this.renderer.physicallyCorrectLights = true;
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.setRendererLight();
    this.updateRenderer();

    const wrap = document.getElementById("world");
    wrap.appendChild(this.renderer.domElement);
  }

  setScene() {
    this.scene = new THREE.Scene();

    // helper
    if (MODE) {
      this.scene.add(new THREE.GridHelper(1000, 100));
      this.scene.add(new THREE.AxesHelper(100));
    }
  }

  updateCamera() {
    this.camera.aspect = this.params.aspect;
    this.camera.updateProjectionMatrix();
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(60, this.params.aspect, 0.1, 100);
    this.camera.position.z = this.bool.isMatchMediaWidth ? 4 : 2.75;
    this.updateCamera();
  }

  raf() {
    // this.renderer.render(this.scene, this.camera);
  }

  resize(props) {
    this.bool.isMatchMediaWidth = props.isMatchMediaWidth;
    this.params.w = props.w;
    this.params.h = props.h;
    this.params.aspect = props.aspect;
    this.params.shorter = props.shorter;
    this.params.longer = props.longer;

    this.updateRenderer();
    this.updateCamera();
  }
}
