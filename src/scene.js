import * as THREE from 'three';

/* three.js floating-objects background, loaded lazily so the hero
   text animation isn't blocked by this (large) chunk downloading */
export function initScene({ lenis, gsap }) {
  const canvas = document.getElementById('bg');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 9;

  const ambient = new THREE.AmbientLight(0xffffff, 1.1);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 1.6);
  dir.position.set(4, 6, 8);
  scene.add(dir);
  const pinkLight = new THREE.PointLight(0xff4d8d, 0, 40);
  pinkLight.position.set(-4, 2, 5);
  scene.add(pinkLight);

  const COLORS = { pink: 0xff4d8d, yellow: 0xffc93c, blue: 0x4d79ff, green: 0x2edb84, ink: 0x1d1a2b };

  /* ----- object builders (all primitives, no external assets) ----- */
  function makeChip(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.14, 40),
      new THREE.MeshStandardMaterial({ color, roughness: 0.35 })
    );
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.145, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    g.add(body, inner);
    // edge stripes
    for (let i = 0; i < 6; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.145, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
      );
      const a = (i / 6) * Math.PI * 2;
      stripe.position.set(Math.cos(a) * 0.53, 0, Math.sin(a) * 0.53);
      stripe.rotation.y = -a;
      g.add(stripe);
    }
    return g;
  }

  function cardTexture(suit, label, color) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 366;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, 256, 366);
    x.strokeStyle = '#dddddd';
    x.lineWidth = 8;
    x.strokeRect(4, 4, 248, 358);
    x.fillStyle = color;
    x.font = 'bold 64px sans-serif';
    x.fillText(label, 20, 72);
    x.font = '150px sans-serif';
    x.textAlign = 'center';
    x.fillText(suit, 128, 235);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function makeCard(suit, label, color) {
    const tex = cardTexture(suit, label, color);
    const side = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
    const back = new THREE.MeshStandardMaterial({ color: COLORS.pink, roughness: 0.5 });
    return new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.2, 0.02),
      [side, side, side, side, face, back]
    );
  }

  function dieFace(n) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#1d1a2b';
    const pos = {
      1: [[64, 64]],
      2: [[38, 38], [90, 90]],
      3: [[34, 34], [64, 64], [94, 94]],
      4: [[38, 38], [90, 38], [38, 90], [90, 90]],
      5: [[36, 36], [92, 36], [64, 64], [36, 92], [92, 92]],
      6: [[38, 32], [90, 32], [38, 64], [90, 64], [38, 96], [90, 96]],
    }[n];
    for (const [px, py] of pos) {
      x.beginPath();
      x.arc(px, py, 11, 0, Math.PI * 2);
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.35 });
  }

  function makeDie() {
    return new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      [1, 6, 2, 5, 3, 4].map(dieFace)
    );
  }

  function makeCup(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.3, 0.62, 36),
      new THREE.MeshStandardMaterial({ color, roughness: 0.35 })
    );
    const coffee = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 36),
      new THREE.MeshStandardMaterial({ color: 0x5b3a1e, roughness: 0.8 })
    );
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.312;
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.05, 16, 32),
      new THREE.MeshStandardMaterial({ color, roughness: 0.35 })
    );
    handle.position.x = 0.42;
    g.add(body, coffee, handle);
    return g;
  }

  function makeStar(color) {
    const shape = new THREE.Shape();
    const R = 0.55, r = 0.24;
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
      i === 0 ? shape.moveTo(px, py) : shape.lineTo(px, py);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.3 }));
  }

  /* ----- scatter objects with parallax speeds ----- */
  const group = new THREE.Group();
  scene.add(group);

  const makers = [
    () => makeChip(COLORS.pink),
    () => makeCard('♥', 'A', '#ff4d8d'),
    () => makeDie(),
    () => makeCup(COLORS.yellow),
    () => makeChip(COLORS.blue),
    () => makeCard('♠', 'K', '#1d1a2b'),
    () => makeStar(COLORS.yellow),
    () => makeChip(COLORS.green),
    () => makeDie(),
    () => makeCard('♦', 'Q', '#ff4d8d'),
    () => makeCup(COLORS.pink),
    () => makeStar(COLORS.blue),
  ];

  const floaters = makers.map((make, i) => {
    const obj = make();
    const spreadX = (i % 2 === 0 ? 1 : -1) * (2.2 + ((i * 37) % 30) / 10); // 2.2..5.2, alternating sides
    const baseY = ((i * 53) % 14) - 7;
    const z = -1 - ((i * 29) % 40) / 10; // -1 .. -5
    const scale = 0.8 + ((i * 17) % 10) / 12;
    obj.scale.setScalar(scale);
    obj.position.set(spreadX, baseY, z);
    obj.rotation.set(i * 0.7, i * 1.3, i * 0.4);
    group.add(obj);
    return {
      obj,
      baseY,
      x: spreadX,
      speed: 0.4 + ((i * 41) % 10) / 12,
      rot: { x: 0.003 + (i % 3) * 0.002, y: 0.004 + (i % 4) * 0.002 },
    };
  });
  for (const f of floaters) f.obj.userData.s = f.obj.scale.x;

  /* ----- scroll + mouse ----- */
  let scrollY = 0;
  lenis.on('scroll', (e) => { scrollY = e.scroll; });

  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    for (const f of floaters) {
      const range = 16;
      let y = f.baseY + (scrollY * 0.004 * f.speed);
      y = ((y % range) + range) % range - range / 2; // wrap into [-8, 8]
      f.obj.position.y = y + Math.sin(t * 0.8 + f.baseY) * 0.15;
      f.obj.rotation.x += f.rot.x;
      f.obj.rotation.y += f.rot.y;
    }
    camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ----- API for main.js ----- */
  function setNight(night, immediate = false) {
    const duration = immediate ? 0 : 0.8;
    gsap.to(ambient, { intensity: night ? 0.35 : 1.1, duration });
    gsap.to(dir, { intensity: night ? 0.5 : 1.6, duration });
    gsap.to(pinkLight, { intensity: night ? 60 : 0, duration });
  }

  /* raycast: shoot the floating 3D objects */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function shootFloater(cx, cy) {
    ndc.x = (cx / window.innerWidth) * 2 - 1;
    ndc.y = -(cy / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(group.children, true);
    if (!hits.length) return false;
    let o = hits[0].object;
    while (o.parent && o.parent !== group) o = o.parent;
    const f = floaters.find((fl) => fl.obj === o);
    if (!f || f.knocked) return false;
    f.knocked = true;
    const dir = ndc.x > 0 ? 1 : -1;
    gsap.to(o.position, { x: o.position.x + dir * 16, duration: 0.8, ease: 'power2.in' });
    gsap.to(o.rotation, { z: o.rotation.z + dir * 12, duration: 0.8, ease: 'power1.in' });
    gsap.delayedCall(1.0, () => {
      o.position.x = f.x;
      gsap.fromTo(o.scale, { x: 0.01, y: 0.01, z: 0.01 }, {
        x: o.userData.s, y: o.userData.s, z: o.userData.s,
        duration: 0.6, ease: 'back.out(2.5)',
        onComplete: () => { f.knocked = false; },
      });
    });
    return true;
  }

  return { setNight, shootFloater };
}
