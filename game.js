// 1. SETUP SCENE & CAMERA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6eb1ff); // Skyblue khas Roblox
scene.fog = new THREE.Fog(0x6eb1ff, 50, 150);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

// 2. PENCAHAYAAN ALA ROBLOX STUDIO
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
scene.add(sun);

// 3. BASEPLATE KLASIK ROBLOX DENGAN STUDS
const baseplateGeo = new THREE.BoxGeometry(100, 2, 100);
const baseplateMat = new THREE.MeshStandardMaterial({ color: 0xa3a2a5, roughness: 0.9 });
const baseplate = new THREE.Mesh(baseplateGeo, baseplateMat);
baseplate.position.y = -1;
baseplate.receiveShadow = true;
scene.add(baseplate);

// Menambahkan Studs (Tonjolan Bulat di atas Baseplate)
const studGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12);
const studMat = new THREE.MeshStandardMaterial({ color: 0x939295 });
const studGroup = new THREE.InstancedMesh(studGeo, studMat, 2500);

let studIndex = 0;
const dummy = new THREE.Object3D();
for (let x = -49; x <= 49; x += 2) {
    for (let z = -49; z <= 49; z += 2) {
        dummy.position.set(x, 0.05, z);
        dummy.updateMatrix();
        studGroup.setMatrixAt(studIndex++, dummy.matrix);
    }
}
scene.add(studGroup);

// 4. KARAKTER R6 PROPORSIONAL ROBLOX
const player = new THREE.Group();

const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5cd30 }); // Kuning Roblox
const torsoMat = new THREE.MeshStandardMaterial({ color: 0x0d69ac }); // Biru Tua
const limbMat = new THREE.MeshStandardMaterial({ color: 0xa3a2a5 });  // Abu-abu

// Head (1x1x1)
const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), skinMat);
head.position.y = 4.5;
head.castShadow = true;
player.add(head);

// Torso (2x2x1)
const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), torsoMat);
torso.position.y = 2.9;
torso.castShadow = true;
player.add(torso);

// Left & Right Arm (1x2x1)
const armGeo = new THREE.BoxGeometry(1, 2, 1);
const leftArm = new THREE.Mesh(armGeo, skinMat);
leftArm.position.set(-1.5, 2.9, 0);
leftArm.castShadow = true;
player.add(leftArm);

const rightArm = new THREE.Mesh(armGeo, skinMat);
rightArm.position.set(1.5, 2.9, 0);
rightArm.castShadow = true;
player.add(rightArm);

// Left & Right Leg (1x2x1)
const legGeo = new THREE.BoxGeometry(1, 2, 1);
const leftLeg = new THREE.Mesh(legGeo, limbMat);
leftLeg.position.set(-0.5, 0.9, 0);
leftLeg.castShadow = true;
player.add(leftLeg);

const rightLeg = new THREE.Mesh(legGeo, limbMat);
rightLeg.position.set(0.5, 0.9, 0);
rightLeg.castShadow = true;
player.add(rightLeg);

scene.add(player);

// 5. FISIKA & LOGIKA GERAK
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

let velY = 0;
let isGrounded = true;
let animTime = 0;

function update() {
    let moveX = 0, moveZ = 0;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();

    const right = new THREE.Vector3().crossVectors(camera.up, dir).negate();

    if (keys['KeyW']) { moveX += dir.x; moveZ += dir.z; }
    if (keys['KeyS']) { moveX -= dir.x; moveZ -= dir.z; }
    if (keys['KeyA']) { moveX -= right.x; moveZ -= right.z; }
    if (keys['KeyD']) { moveX += right.x; moveZ += right.z; }

    const moving = moveX !== 0 || moveZ !== 0;

    if (moving) {
        player.position.x += moveX * 0.15;
        player.position.z += moveZ * 0.15;
        player.rotation.y = Math.atan2(moveX, moveZ);

        // Animasi Jalan R6 Khas Roblox
        animTime += 0.2;
        leftArm.rotation.x = Math.sin(animTime) * 0.7;
        rightArm.rotation.x = -Math.sin(animTime) * 0.7;
        leftLeg.rotation.x = -Math.sin(animTime) * 0.7;
        rightLeg.rotation.x = Math.sin(animTime) * 0.7;
    } else {
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
    }

    // Lompat & Gravitasi
    if (keys['Space'] && isGrounded) {
        velY = 0.32;
        isGrounded = false;
    }

    velY -= 0.015;
    player.position.y += velY;

    if (player.position.y <= 0) {
        player.position.y = 0;
        velY = 0;
        isGrounded = true;
    }

    // Kamera Ikut Karakter
    controls.target.copy(player.position).add(new THREE.Vector3(0, 3, 0));
    controls.update();
}

// LOOP RENDER
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

camera.position.set(0, 8, 14);
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
