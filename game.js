// 1. SETUP SCENE, CAMERA, & RENDERER
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Warna langit biru

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Mengaktifkan bayangan
document.body.appendChild(renderer.domElement);

// 2. PENCAHAYAAN (LIGHTING)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = true;
scene.add(dirLight);

// 3. MEMBUAT MAP / BASEPLATE (Mirip Baseplate Roblox)
const gridHelper = new THREE.GridHelper(200, 50, 0x000000, 0x444444);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

const floorGeometry = new THREE.PlaneGeometry(200, 200);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Warna dasar abu-abu
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Menambahkan rintangan (Balok / Part ala Roblox)
const createBlock = (x, y, z, color) => {
    const geo = new THREE.BoxGeometry(4, 4, 4);
    const mat = new THREE.MeshStandardMaterial({ color: color });
    const block = new THREE.Mesh(geo, mat);
    block.position.set(x, y, z);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
};

// Buat beberapa rintangan/obyek
createBlock(0, 2, -10, 0xff0000); // Balok Merah
createBlock(5, 2, -15, 0x00ff00); // Balok Hijau
createBlock(-5, 2, -15, 0x0000ff); // Balok Biru

// 4. MEMBUAT KARAKTER (Karakter Kotak Ala Roblox / Blocky)
const playerGroup = new THREE.Group();

// Kepala
const headGeo = new THREE.BoxGeometry(1, 1, 1);
const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 }); // Warna kulit kuning
const head = new THREE.Mesh(headGeo, headMat);
head.position.y = 2.5;
head.castShadow = true;
playerGroup.add(head);

// Badan
const bodyGeo = new THREE.BoxGeometry(1.5, 2, 0.8);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00a2ff }); // Baju Biru
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 1;
body.castShadow = true;
playerGroup.add(body);

scene.add(playerGroup);

// Posisi Awal Kamera
camera.position.set(0, 5, 10);

// 5. KONTROL PERGERAKAN (WASD)
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

const speed = 0.15;

function updatePlayer() {
    if (keys['w']) playerGroup.position.z -= speed;
    if (keys['s']) playerGroup.position.z += speed;
    if (keys['a']) playerGroup.position.x -= speed;
    if (keys['d']) playerGroup.position.x += speed;

    // Kamera mengikuti Karakter (Kamera Tipe Third Person)
    camera.position.x = playerGroup.position.x;
    camera.position.z = playerGroup.position.z + 10;
    camera.position.y = playerGroup.position.y + 5;
    camera.lookAt(playerGroup.position);
}

// 6. GAME LOOP (RENDER UTAMA)
function animate() {
    requestAnimationFrame(animate);
    updatePlayer();
    renderer.render(scene, camera);
}

animate();

// Responsif saat ukuran jendela browser diubah
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
