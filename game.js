// ==========================================
// 1. ADVANCED AUDIO SYNTHESIZER V2
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'jump') {
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'oof') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'place') {
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'coin') {
        osc.frequency.setValueAtTime(987, now);
        osc.frequency.setValueAtTime(1318, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'thunder') {
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 150;
        noise.connect(filter); filter.connect(gain);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        noise.start(now); noise.stop(now + 0.5);
    }
}

// ==========================================
// 2. THREE.JS ENGINE & GRAPHICS
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6eb1ff);
scene.fog = new THREE.FogExp2(0x6eb1ff, 0.007);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.01;

// GLOBAL MATERIALS (DIDEKLARASIKAN AWAL AGAR TIDAK ERROR)
const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5cd30 });
const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0d69ac });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

// LIGHTING & DAY/NIGHT & WEATHER
const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xfffaed, 1.2);
sun.position.set(60, 90, 40);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
scene.add(sun);

// WEATHER ENGINE
let currentWeather = 'clear';
const rainCount = 1500;
const rainGeo = new THREE.BufferGeometry();
const rainPositions = new Float32Array(rainCount * 3);
for (let i = 0; i < rainCount * 3; i += 3) {
    rainPositions[i] = (Math.random() - 0.5) * 200;
    rainPositions[i+1] = Math.random() * 100;
    rainPositions[i+2] = (Math.random() - 0.5) * 200;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rainMat = new THREE.PointsMaterial({ color: 0xaaaaee, size: 0.3, transparent: true, opacity: 0.6 });
const rainParticles = new THREE.Points(rainGeo, rainMat);
rainParticles.visible = false;
scene.add(rainParticles);

function updateWeather() {
    if (Math.random() < 0.0003) {
        currentWeather = currentWeather === 'clear' ? 'rain' : 'clear';
        rainParticles.visible = currentWeather === 'rain';
        document.getElementById('weather-label').innerText = currentWeather === 'rain' ? '🌧️ Rainy' : '☀️ Clear';
        showNotif(currentWeather === 'rain' ? 'Hujan turun di Homblox!' : 'Cuaca cerah kembali!');
    }

    if (currentWeather === 'rain') {
        const positions = rainParticles.geometry.attributes.position.array;
        for (let i = 1; i < rainCount * 3; i += 3) {
            positions[i] -= 1.2;
            if (positions[i] < 0) positions[i] = 80;
        }
        rainParticles.geometry.attributes.position.needsUpdate = true;
        if (Math.random() < 0.002) playSound('thunder');
    }
}

// ==========================================
// 3. MAP GENERATOR & COINS
// ==========================================
const buildableObjects = [];
const coinsGroup = [];

const baseGeo = new THREE.BoxGeometry(160, 2, 160);
const baseMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 });
const baseplate = new THREE.Mesh(baseGeo, baseMat);
baseplate.position.y = -1;
baseplate.receiveShadow = true;
scene.add(baseplate);

const spawnPos = new THREE.Vector3(0, 0, 0);

const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.8, roughness: 0.2 });

function spawnCoins() {
    for (let i = 0; i < 20; i++) {
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.rotation.x = Math.PI / 2;
        coin.position.set((Math.random() - 0.5) * 120, 1.2, (Math.random() - 0.5) * 120);
        coin.castShadow = true;
        scene.add(coin);
        coinsGroup.push(coin);
    }
}
spawnCoins();

// ==========================================
// 4. VEHICLE SYSTEM
// ==========================================
const vehicles = [];
let currentVehicle = null;

function createCar(x, z) {
    const carGroup = new THREE.Group();
    const bodyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.2, 6),
        new THREE.MeshStandardMaterial({ color: 0xe74c3c, metalness: 0.5 })
    );
    bodyMesh.position.y = 1;
    carGroup.add(bodyMesh);

    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const wheelPositions = [[-2, 0.6, 2], [2, 0.6, 2], [-2, 0.6, -2], [2, 0.6, -2]];

    wheelPositions.forEach(p => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...p);
        carGroup.add(wheel);
    });

    carGroup.position.set(x, 0, z);
    scene.add(carGroup);
    vehicles.push(carGroup);
    return carGroup;
}

document.getElementById('btn-spawn-vehicle').onclick = () => {
    createCar(player.position.x + 5, player.position.z + 5);
    showNotif('Mobil baru berhasil di-spawn!');
};

// ==========================================
// 5. NPC AI SYSTEM
// ==========================================
const npcs = [];
function createNPC(x, z, name) {
    const npcGroup = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x9b59b6 });
    const npcBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2, 0.8), mat);
    npcBody.position.y = 1.8;
    npcGroup.add(npcBody);

    const npcHead = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
    npcHead.position.y = 3.3;
    npcGroup.add(npcHead);

    npcGroup.position.set(x, 0, z);
    scene.add(npcGroup);
    npcs.push({ mesh: npcGroup, target: new THREE.Vector3(x, 0, z) });
}

// ==========================================
// 6. PLAYER R6 & STATS
// ==========================================
const player = new THREE.Group();
let health = 100, stamina = 100, coins = 500, buildsCount = 0;
let speedMult = 1, jumpMult = 1;

const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), skinMat);
head.position.y = 4.5; player.add(head);

const crownMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.5, 0.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9 })
);
crownMesh.position.y = 5.3; crownMesh.visible = false; player.add(crownMesh);

const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), shirtMat);
torso.position.y = 2.9; player.add(torso);

const leftArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), skinMat);
leftArm.position.set(-1.5, 2.9, 0); player.add(leftArm);
const rightArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), skinMat);
rightArm.position.set(1.5, 2.9, 0); player.add(rightArm);

const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), pantsMat);
leftLeg.position.set(-0.5, 0.9, 0); player.add(leftLeg);
const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), pantsMat);
rightLeg.position.set(0.5, 0.9, 0); player.add(rightLeg);

scene.add(player);

// PANGGIL SPAWN NPC SETELAH PLAYER SIAP
createNPC(10, 10, "NoobBot");
createNPC(-15, -10, "Guest666");

function updateNPCs() {
    npcs.forEach(npc => {
        if (Math.random() < 0.01) {
            npc.target.set((Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60);
        }
        npc.mesh.position.lerp(npc.target, 0.008);
        npc.mesh.lookAt(npc.target);
    });
}

function showNotif(txt) {
    const el = document.getElementById('notification');
    el.innerText = txt; el.style.opacity = '1';
    setTimeout(() => el.style.opacity = '0', 2500);
}

document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.onclick = () => {
        const price = parseInt(btn.getAttribute('data-price'));
        const item = btn.getAttribute('data-item');

        if (coins >= price) {
            coins -= price;
            updateStats();
            playSound('coin');

            if (item === 'speed') { speedMult = 1.6; showNotif('Speed Boost Diaktifkan!'); }
            if (item === 'jump') { jumpMult = 1.7; showNotif('Super Jump Diaktifkan!'); }
            if (item === 'heal') { health = 100; updateHP(); showNotif('HP Dipulihkan!'); }
            if (item === 'crown') { crownMesh.visible = true; showNotif('Crown Dipakai!'); }
        } else {
            showNotif('Coins tidak cukup!');
        }
    };
});

function updateStats() {
    document.getElementById('val-coins').innerText = coins;
    document.getElementById('stat-coins').innerText = coins;
}
function updateHP() {
    document.getElementById('hp-fill').style.width = health + '%';
    document.getElementById('hp-text').innerText = `${health} / 100`;
}

// ==========================================
// 7. EXPANDED BUILDING ENGINE
// ==========================================
let activeTool = 'select';
const slots = document.querySelectorAll('.slot');
const crosshair = document.getElementById('crosshair');

slots.forEach(slot => {
    slot.onclick = () => {
        slots.forEach(s => s.classList.remove('active'));
        slot.classList.add('active');
        activeTool = slot.getAttribute('data-tool');
        crosshair.style.display = activeTool !== 'select' ? 'block' : 'none';
    };
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointerdown', (e) => {
    if (activeTool === 'select' || e.clientY < 60) return;

    mouse.x = (window.innerWidth / 2 / window.innerWidth) * 2 - 1;
    mouse.y = -(window.innerHeight / 2 / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([baseplate, ...buildableObjects]);

    if (intersects.length > 0) {
        const hit = intersects[0];

        if (activeTool.startsWith('build-')) {
            const type = activeTool.split('-')[1];
            let mat;
            
            if (type === 'wood') mat = new THREE.MeshStandardMaterial({ color: 0x8e5a2b });
            else if (type === 'brick') mat = new THREE.MeshStandardMaterial({ color: 0xb03a2e });
            else if (type === 'neon') mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            else if (type === 'glass') mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
            else if (type === 'metal') mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 });
            else if (type === 'gold') mat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.9, roughness: 0.2 });
            else if (type === 'water') mat = new THREE.MeshStandardMaterial({ color: 0x3498db, transparent: true, opacity: 0.6 });
            else if (type === 'lava') mat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

            const block = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat);
            const normal = hit.face.normal;
            block.position.copy(hit.point).add(normal);
            block.position.x = Math.floor(block.position.x / 2) * 2 + 1;
            block.position.y = Math.floor(block.position.y / 2) * 2 + 1;
            block.position.z = Math.floor(block.position.z / 2) * 2 + 1;

            block.castShadow = true; block.receiveShadow = true;
            scene.add(block);
            buildableObjects.push(block);

            playSound('place');
            buildsCount++;
            document.getElementById('stat-builds').innerText = buildsCount;
        } 
        else if (activeTool === 'delete' && hit.object !== baseplate) {
            scene.remove(hit.object);
            const idx = buildableObjects.indexOf(hit.object);
            if (idx > -1) buildableObjects.splice(idx, 1);
            playSound('place');
        }
    }
});

// UI TOGGLES & AVATAR COLOR BINDINGS
document.getElementById('col-skin').addEventListener('input', (e) => skinMat.color.set(e.target.value));
document.getElementById('col-shirt').addEventListener('input', (e) => shirtMat.color.set(e.target.value));
document.getElementById('col-pants').addEventListener('input', (e) => pantsMat.color.set(e.target.value));

document.getElementById('btn-chat-toggle').onclick = () => document.getElementById('chat-box').classList.toggle('hidden');
document.getElementById('btn-avatar-toggle').onclick = () => document.getElementById('avatar-panel').classList.toggle('hidden');
document.getElementById('btn-shop-toggle').onclick = () => document.getElementById('shop-panel').classList.toggle('hidden');
document.getElementById('btn-close-shop').onclick = () => document.getElementById('shop-panel').classList.add('hidden');
document.getElementById('btn-close-avatar').onclick = () => document.getElementById('avatar-panel').classList.add('hidden');
document.getElementById('btn-reset').onclick = () => { playSound('oof'); player.position.set(0, 4, 0); };

// ==========================================
// 8. GAME LOOP & CONTROLLER
// ==========================================
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyE') {
        if (currentVehicle) {
            currentVehicle = null;
            player.visible = true;
            showNotif('Keluar dari kendaraan');
        } else {
            vehicles.forEach(v => {
                if (player.position.distanceTo(v.position) < 5) {
                    currentVehicle = v;
                    player.visible = false;
                    showNotif('Mengendarai mobil!');
                }
            });
        }
    }
});
document.addEventListener('keyup', (e) => keys[e.code] = false);

let velY = 0, isGrounded = true, animTime = 0;

function updatePhysics() {
    let speed = 0.16 * speedMult;
    if (keys['ShiftLeft'] && stamina > 0) {
        speed *= 1.5;
        stamina = Math.max(0, stamina - 0.4);
    } else {
        stamina = Math.min(100, stamina + 0.2);
    }
    document.getElementById('stamina-fill').style.width = stamina + '%';

    if (currentVehicle) {
        if (keys['KeyW']) currentVehicle.translateZ(-0.4);
        if (keys['KeyS']) currentVehicle.translateZ(0.3);
        if (keys['KeyA']) currentVehicle.rotation.y += 0.04;
        if (keys['KeyD']) currentVehicle.rotation.y -= 0.04;
        player.position.copy(currentVehicle.position);
    } else {
        let moveX = 0, moveZ = 0;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
        const right = new THREE.Vector3().crossVectors(camera.up, dir).negate();

        if (keys['KeyW']) { moveX += dir.x; moveZ += dir.z; }
        if (keys['KeyS']) { moveX -= dir.x; moveZ -= dir.z; }
        if (keys['KeyA']) { moveX -= right.x; moveZ -= right.z; }
        if (keys['KeyD']) { moveX += right.x; moveZ += right.z; }

        if (moveX !== 0 || moveZ !== 0) {
            player.position.x += moveX * speed;
            player.position.z += moveZ * speed;
            player.rotation.y = Math.atan2(moveX, moveZ);

            animTime += 0.22;
            leftArm.rotation.x = Math.sin(animTime) * 0.75;
            rightArm.rotation.x = -Math.sin(animTime) * 0.75;
            leftLeg.rotation.x = -Math.sin(animTime) * 0.75;
            rightLeg.rotation.x = Math.sin(animTime) * 0.75;
        }

        if (keys['Space'] && isGrounded) {
            velY = 0.36 * jumpMult;
            isGrounded = false;
            playSound('jump');
        }

        velY -= 0.016;
        player.position.y += velY;

        if (player.position.y <= 0) {
            player.position.y = 0;
            velY = 0;
            isGrounded = true;
        }
    }

    coinsGroup.forEach(coin => {
        coin.rotation.z += 0.03;
        if (player.position.distanceTo(coin.position) < 2) {
            scene.remove(coin);
            coinsGroup.splice(coinsGroup.indexOf(coin), 1);
            coins += 50; updateStats();
            playSound('coin');
            showNotif('+50 Coins Didapatkan!');
        }
    });

    const studs = Math.floor(player.position.distanceTo(spawnPos));
    document.getElementById('stat-studs').innerText = studs;

    controls.target.copy(player.position).add(new THREE.Vector3(0, 3, 0));
    controls.update();
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    updateWeather();
    updateNPCs();
    renderer.render(scene, camera);
}

camera.position.set(0, 10, 18);
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
