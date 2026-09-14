// ==========================================
// 1. AUDIO SYNTHESIZER (TANPA FILE EXTERNAL)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'jump') {
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'oof') { // Sound Reset / Dead
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'build') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start(); osc.stop(audioCtx.currentTime + 0.08);
    }
}

// ==========================================
// 2. SCENE, CAMERA, LIGHTING & DAY/NIGHT
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6eb1ff);
scene.fog = new THREE.FogExp2(0x6eb1ff, 0.008);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.01;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffed, 1.2);
sun.position.set(50, 80, 40);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
scene.add(sun);

// Siklus Siang-Malam
let dayTime = 0;
function updateSun() {
    dayTime += 0.0003;
    const x = Math.cos(dayTime) * 100;
    const y = Math.sin(dayTime) * 100;
    sun.position.set(x, y, 40);

    if (y < 0) {
        scene.background.setHex(0x0a0a1a);
        scene.fog.color.setHex(0x0a0a1a);
        ambientLight.intensity = 0.2;
    } else {
        scene.background.setHex(0x6eb1ff);
        scene.fog.color.setHex(0x6eb1ff);
        ambientLight.intensity = 0.6;
    }
}

// ==========================================
// 3. MAP, STUDS & OBSTACLES (KILL BLOCK)
// ==========================================
const objectsGroup = []; // Tempat objek yang bisa di-build / di-destroy

const baseplateGeo = new THREE.BoxGeometry(120, 2, 120);
const baseplateMat = new THREE.MeshStandardMaterial({ color: 0xa3a2a5, roughness: 0.8 });
const baseplate = new THREE.Mesh(baseplateGeo, baseplateMat);
baseplate.position.y = -1;
baseplate.receiveShadow = true;
scene.add(baseplate);

// SpawnLocation Disc
const spawnGeo = new THREE.CylinderGeometry(3, 3, 0.1, 32);
const spawnMat = new THREE.MeshStandardMaterial({ color: 0x00a2ff });
const spawnLocation = new THREE.Mesh(spawnGeo, spawnMat);
spawnLocation.position.set(0, 0.05, 0);
scene.add(spawnLocation);

// Lava Block (Laser Merah Pembunuh)
const lavaGeo = new THREE.BoxGeometry(10, 1, 10);
const lavaMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const lavaBlock = new THREE.Mesh(lavaGeo, lavaMat);
lavaBlock.position.set(20, 0.5, 0);
scene.add(lavaBlock);

// ==========================================
// 4. KARAKTER R6 & HP SYSTEM
// ==========================================
const player = new THREE.Group();
let health = 100;
let blocksPlaced = 0;

const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5cd30 });
const torsoMat = new THREE.MeshStandardMaterial({ color: 0x0d69ac });
const limbMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), skinMat);
head.position.y = 4.5; head.castShadow = true; player.add(head);

const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), torsoMat);
torso.position.y = 2.9; torso.castShadow = true; player.add(torso);

const leftArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), skinMat);
leftArm.position.set(-1.5, 2.9, 0); player.add(leftArm);
const rightArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), skinMat);
rightArm.position.set(1.5, 2.9, 0); player.add(rightArm);

const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), limbMat);
leftLeg.position.set(-0.5, 0.9, 0); player.add(leftLeg);
const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), limbMat);
rightLeg.position.set(0.5, 0.9, 0); player.add(rightLeg);

scene.add(player);

function resetPlayer() {
    playSound('oof');
    player.position.set(0, 5, 0);
    health = 100;
    document.getElementById('health-bar-fill').style.width = '100%';
}

document.getElementById('btn-reset').addEventListener('click', resetPlayer);

// ==========================================
// 5. BUILDING SYSTEM (BUILD / DELETE TOOL)
// ==========================================
let currentMode = 'view'; // 'view', 'build', 'delete'
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const toolView = document.getElementById('tool-view');
const toolBuild = document.getElementById('tool-build');
const toolDelete = document.getElementById('tool-delete');
const crosshair = document.getElementById('crosshair');

function setTool(mode) {
    currentMode = mode;
    [toolView, toolBuild, toolDelete].forEach(b => b.classList.remove('active'));
    if(mode === 'view') toolView.classList.add('active');
    if(mode === 'build') toolBuild.classList.add('active');
    if(mode === 'delete') toolDelete.classList.add('active');

    crosshair.style.display = mode !== 'view' ? 'block' : 'none';
}

toolView.onclick = () => setTool('view');
toolBuild.onclick = () => setTool('build');
toolDelete.onclick = () => setTool('delete');

window.addEventListener('pointerdown', (e) => {
    if (currentMode === 'view' || e.clientY < 50) return; // Abaikan jika klik UI Topbar

    mouse.x = (window.innerWidth / 2 / window.innerWidth) * 2 - 1;
    mouse.y = -(window.innerHeight / 2 / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([baseplate, ...objectsGroup]);

    if (intersects.length > 0) {
        const intersect = intersects[0];

        if (currentMode === 'build') {
            const blockGeo = new THREE.BoxGeometry(2, 2, 2);
            const blockMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
            const newBlock = new THREE.Mesh(blockGeo, blockMat);
            
            // Posisikan pas di permukaan tempat di-klik (Grid Snapping)
            const normal = intersect.face.normal;
            newBlock.position.copy(intersect.point).add(normal);
            newBlock.position.x = Math.floor(newBlock.position.x / 2) * 2 + 1;
            newBlock.position.y = Math.floor(newBlock.position.y / 2) * 2 + 1;
            newBlock.position.z = Math.floor(newBlock.position.z / 2) * 2 + 1;

            newBlock.castShadow = true;
            newBlock.receiveShadow = true;
            scene.add(newBlock);
            objectsGroup.push(newBlock);

            playSound('build');
            blocksPlaced++;
            document.getElementById('stat-blocks').innerText = blocksPlaced;
        } 
        else if (currentMode === 'delete' && intersect.object !== baseplate) {
            scene.remove(intersect.object);
            const idx = objectsGroup.indexOf(intersect.object);
            if(idx > -1) objectsGroup.splice(idx, 1);
            playSound('build');
        }
    }
});

// ==========================================
// 6. FISIKA & CONTROLLER Karakter
// ==========================================
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyR') resetPlayer();
});
document.addEventListener('keyup', (e) => keys[e.code] = false);

let velY = 0;
let isGrounded = true;
let animTime = 0;

function updatePlayer() {
    let moveX = 0, moveZ = 0;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();
    const right = new THREE.Vector3().crossVectors(camera.up, dir).negate();

    if (keys['KeyW']) { moveX += dir.x; moveZ += dir.z; }
    if (keys['KeyS']) { moveX -= dir.x; moveZ -= dir.z; }
    if (keys['KeyA']) { moveX -= right.x; moveZ -= right.z; }
    if (keys['KeyD']) { moveX += right.x; moveZ += right.z; }

    if (moveX !== 0 || moveZ !== 0) {
        player.position.x += moveX * 0.16;
        player.position.z += moveZ * 0.16;
        player.rotation.y = Math.atan2(moveX, moveZ);

        animTime += 0.2;
        leftArm.rotation.x = Math.sin(animTime) * 0.7;
        rightArm.rotation.x = -Math.sin(animTime) * 0.7;
        leftLeg.rotation.x = -Math.sin(animTime) * 0.7;
        rightLeg.rotation.x = Math.sin(animTime) * 0.7;
    }

    // Melompat
    if (keys['Space'] && isGrounded) {
        velY = 0.35;
        isGrounded = false;
        playSound('jump');
    }

    // Gravitasi
    velY -= 0.016;
    player.position.y += velY;

    if (player.position.y <= 0) {
        player.position.y = 0;
        velY = 0;
        isGrounded = true;
    }

    // Cek jika Kena Lava / Jatuh dari Void
    const distToLava = player.position.distanceTo(lavaBlock.position);
    if (distToLava < 5.5 && player.position.y < 1.5) {
        health -= 2;
        document.getElementById('health-bar-fill').style.width = health + '%';
        if (health <= 0) resetPlayer();
    }

    if (player.position.y < -30) resetPlayer();

    // Update Leaderstats Jarak (Studs)
    const studs = Math.floor(player.position.distanceTo(new THREE.Vector3(0,0,0)));
    document.getElementById('stat-studs').innerText = studs;

    controls.target.copy(player.position).add(new THREE.Vector3(0, 3, 0));
    controls.update();
}

// LOOP RENDER UTAMA
function animate() {
    requestAnimationFrame(animate);
    updatePlayer();
    updateSun();
    renderer.render(scene, camera);
}

camera.position.set(0, 8, 16);
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
