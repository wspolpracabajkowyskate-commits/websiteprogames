// Studio: renderer, neutral photo-studio lighting, soft + contact shadows, camera & limits.
import * as THREE from '/creator/vendor/three/three.module.min.js';
import { OrbitControls } from '/creator/vendor/three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from '/creator/vendor/three/addons/environments/RoomEnvironment.js';

export function detectQuality() {
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua) || window.matchMedia('(pointer: coarse)').matches;
  // iOS Safari hides real core / memory counts, but every supported iPhone/iPad GPU handles this scene;
  // only clearly weak Android / old devices get the reduced profile.
  const apple = /iPhone|iPad|iPod|Macintosh/i.test(ua);
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const low = !apple && (mem <= 2 || cores <= 4);
  return {
    mobile,
    low,
    dpr: Math.min(window.devicePixelRatio || 1, low ? 1.3 : 2),
    shadows: true,                       // soft key-light shadow behind the machine on every device
    softShadows: !low,
    shadowMap: low ? 1024 : mobile ? 1536 : 2048,
  };
}

export class Studio {
  constructor(container, quality) {
    this.container = container;
    this.quality = quality;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    r.setPixelRatio(quality.dpr);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = quality.shadows;
    r.shadowMap.type = quality.softShadows ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    r.setClearColor(0x000000, 0);
    container.appendChild(r.domElement);
    r.domElement.setAttribute('aria-label', '3D view of the machine');

    const scene = this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(r);
    const env = new RoomEnvironment();
    scene.environment = pmrem.fromScene(env, 0.035).texture;
    scene.environmentIntensity = 0.8;
    env.dispose?.();

    // key light (soft shadow) + gentle fill from the opposite side
    const key = this.key = new THREE.DirectionalLight(0xffffff, 1.55);
    key.position.set(2.2, 5.2, 3.6);
    key.castShadow = quality.shadows;
    key.shadow.mapSize.set(quality.shadowMap, quality.shadowMap);
    Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 2.6, bottom: -0.6, near: 1, far: 12 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = this.fill = new THREE.DirectionalLight(0xdfe8ff, 0.35);
    fill.position.set(-4, 2.5, -1.5);
    scene.add(fill);

    // shadow catcher for the directional light
    const catcher = this.catcher = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.16 }));
    catcher.rotation.x = -Math.PI / 2; catcher.position.y = 0.0005; catcher.receiveShadow = true;
    scene.add(catcher);

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.05, 60);
    this.camera.position.set(3.3, 1.75, 4.6);
    const c = this.controls = new OrbitControls(this.camera, r.domElement);
    c.enableDamping = true; c.dampingFactor = 0.08;
    c.minDistance = 1.15; c.maxDistance = 8.5;
    c.minPolarAngle = 0.12; c.maxPolarAngle = Math.PI / 2 - 0.03;
    c.screenSpacePanning = true; c.panSpeed = 0.6; c.rotateSpeed = 0.75; c.zoomSpeed = 0.9;
    c.target.set(0, 1.05, 0.15);
    c.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.targetBounds = new THREE.Box3(new THREE.Vector3(-0.9, 0.15, -0.7), new THREE.Vector3(0.9, 2.15, 1.1));
    this.keepOut = [];
    this.tween = null;
    this.resize();
    new ResizeObserver(() => this.resize()).observe(container);
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h || this.renderer.xr.isPresenting) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the whole machine in frame on narrow (portrait) viewports
    this.camera.fov = w / h < 0.8 ? 30 : w / h < 1.1 ? 29 : 28;
    this.camera.updateProjectionMatrix();
  }

  /** contact shadow: depth of the model rendered from below, blurred, projected on the floor */
  buildContactShadow(object, size = 3.2, res = 512, darkness = 1.15, blur = 2.6, opacity = 0.62) {
    const rt = new THREE.WebGLRenderTarget(res, res); rt.texture.generateMipmaps = false;
    const rtBlur = new THREE.WebGLRenderTarget(res, res); rtBlur.texture.generateMipmaps = false;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
    plane.position.y = 0.001; plane.renderOrder = -1;
    this.contactPlane = plane;
    plane.scale.z = -1; // render target v axis runs towards +Z
    this.scene.add(plane);
    const cam = new THREE.OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, 0, 0.9);
    cam.position.y = 0.0;
    cam.rotation.x = Math.PI / 2;
    this.scene.add(cam);
    const depthMat = new THREE.MeshDepthMaterial();
    depthMat.onBeforeCompile = (sh) => {
      sh.uniforms.darkness = { value: darkness };
      sh.fragmentShader = 'uniform float darkness;\n' + sh.fragmentShader.replace(
        'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );');
    };
    depthMat.depthTest = false; depthMat.depthWrite = false;
    const blurMat = (dir) => new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, h: { value: 1 / res }, dir: { value: dir } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float h; uniform vec2 dir; varying vec2 vUv;
        void main(){ vec4 s=vec4(0.0);
          s+=texture2D(tDiffuse,vUv-4.0*h*dir)*0.051; s+=texture2D(tDiffuse,vUv-3.0*h*dir)*0.0918;
          s+=texture2D(tDiffuse,vUv-2.0*h*dir)*0.12245; s+=texture2D(tDiffuse,vUv-1.0*h*dir)*0.1531;
          s+=texture2D(tDiffuse,vUv)*0.1633; s+=texture2D(tDiffuse,vUv+1.0*h*dir)*0.1531;
          s+=texture2D(tDiffuse,vUv+2.0*h*dir)*0.12245; s+=texture2D(tDiffuse,vUv+3.0*h*dir)*0.0918;
          s+=texture2D(tDiffuse,vUv+4.0*h*dir)*0.051; gl_FragColor=s; }`,
      depthTest: false, depthWrite: false,
    });
    const bh = blurMat(new THREE.Vector2(1, 0)), bv = blurMat(new THREE.Vector2(0, 1));
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    const qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const r = this.renderer;
    const blurPass = (amount) => {
      bh.uniforms.tDiffuse.value = rt.texture; bh.uniforms.h.value = amount / res; quad.material = bh;
      r.setRenderTarget(rtBlur); r.render(quad, qcam);
      bv.uniforms.tDiffuse.value = rtBlur.texture; bv.uniforms.h.value = amount / res; quad.material = bv;
      r.setRenderTarget(rt); r.render(quad, qcam);
    };
    this.renderContactShadow = () => {
      const bg = this.scene.background; this.scene.background = null;
      const ov = this.scene.overrideMaterial; this.scene.overrideMaterial = depthMat;
      const vis = []; this.scene.traverse((o) => { if ((o.isMesh && (o.material?.transparent && !o.userData.castsContact)) || o === plane || o === this.catcher) { vis.push([o, o.visible]); o.visible = false; } });
      const clear = r.getClearAlpha(); r.setClearAlpha(0);
      r.setRenderTarget(rt); r.clear(); r.render(this.scene, cam);
      blurPass(blur); blurPass(blur * 0.45);
      r.setRenderTarget(null); r.setClearAlpha(clear);
      this.scene.overrideMaterial = ov; this.scene.background = bg;
      vis.forEach(([o, v]) => { o.visible = v; });
    };
    this.renderContactShadow();
    return plane;
  }

  /** objects (Box3) the camera may not enter */
  setKeepOut(boxes) { this.keepOut = boxes; }

  flyTo(pos, target, ms = 950) {
    const from = { p: this.camera.position.clone(), t: this.controls.target.clone() };
    this.tween = { from, to: { p: new THREE.Vector3(...pos), t: new THREE.Vector3(...target) }, start: performance.now(), ms };
  }

  update(now) {
    if (this.tween) {
      const k = Math.min((now - this.tween.start) / this.tween.ms, 1);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      // arc slightly around the target instead of cutting through the machine
      const t = this.tween;
      const ft = t.from.t.clone().lerp(t.to.t, e);
      const a = t.from.p.clone().sub(t.from.t), b = t.to.p.clone().sub(t.to.t);
      const sa = new THREE.Spherical().setFromVector3(a), sb = new THREE.Spherical().setFromVector3(b);
      let dth = sb.theta - sa.theta; if (dth > Math.PI) dth -= 2 * Math.PI; if (dth < -Math.PI) dth += 2 * Math.PI;
      const s = new THREE.Spherical(sa.radius + (sb.radius - sa.radius) * e, sa.phi + (sb.phi - sa.phi) * e, sa.theta + dth * e);
      this.camera.position.copy(ft).add(new THREE.Vector3().setFromSpherical(s));
      this.controls.target.copy(ft);
      if (k >= 1) this.tween = null;
    }
    this.controls.update();
    // limits: target stays near the machine, camera never inside it, never under the floor
    this.targetBounds.clampPoint(this.controls.target, this.controls.target);
    const cam = this.camera.position;
    if (cam.y < 0.08) cam.y = 0.08;
    for (const b of this.keepOut) {
      if (b.containsPoint(cam)) {
        const dir = cam.clone().sub(this.controls.target).normalize();
        const ray = new THREE.Ray(this.controls.target.clone(), dir);
        const hit = new THREE.Vector3();
        // move the camera to where the ray leaves the box
        const far = this.controls.target.clone().add(dir.clone().multiplyScalar(20));
        const back = new THREE.Ray(far, dir.clone().negate());
        if (back.intersectBox(b, hit)) cam.copy(hit.add(dir.multiplyScalar(0.02)));
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}
