// ========================================
// KONFIGURASI TARGET
// ========================================
const TARGET_NAME = "Naila Syifa Ur-Rahmah";
const TARGET_AGE = 20; 
const TARGET_IMAGE = "./images/target.jpg";

// Model AI
const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
const MATCH_THRESHOLD = 0.48;

// ========================================
// ELEMEN HTML
// ========================================
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const statusText = document.getElementById("status");
const startButton = document.getElementById("start-button");

const birthdayMessage = document.getElementById("birthday-message");
const messagePlaceholder = document.querySelector(".message-placeholder");
const targetNameText = document.getElementById("target-name");
const targetAgeText = document.getElementById("target-age");

const birthdayMusic = document.getElementById("birthday-music");
const replayButton = document.getElementById("replay-button");

// ========================================
// VARIABEL KONTROL
// ========================================
let targetDescriptor = null;
let cameraStream = null;
let isProcessing = false;
let birthdayShown = false;

// ========================================
// 1. MEMUAT MODEL AI & FOTO TARGET
// ========================================
async function loadModels() {
    try {
        statusText.textContent = "Memuat model AI...";

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        statusText.textContent = "Mengekstrak data foto target...";
        await loadTargetImage();

    } catch (error) {
        console.error(error);
        statusText.textContent = "Gagal memuat AI / foto target.";
    }
}

async function loadTargetImage() {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = TARGET_IMAGE;

    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("Foto target.jpg tidak ditemukan di folder /images!"));
    });

    const result = await faceapi
        .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!result) {
        statusText.textContent = "Wajah di target.jpg tidak terdeteksi!";
        throw new Error("Wajah target tidak terdeteksi");
    }

    targetDescriptor = result.descriptor;
    statusText.textContent = "🟢 Kamera Siap!";
    startButton.disabled = false;
}

// ========================================
// 2. MEMBUKA WEBCAM
// ========================================
async function startCamera() {
    if (!targetDescriptor || cameraStream) return;

    try {
        statusText.textContent = "Membuka kamera...";

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false
        });

        video.srcObject = cameraStream;

        await new Promise((resolve) => video.onloadedmetadata = resolve);
        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        statusText.textContent = "Sedang mencocokkan wajah...";
        detectFace();

    } catch (error) {
        console.error(error);
        statusText.textContent = "Gagal mengakses kamera.";
    }
}

// ========================================
// 3. DETEKSI & MATCHING WAJAH REAL-TIME
// ========================================
async function detectFace() {
    if (!cameraStream || birthdayShown) return;

    if (isProcessing) {
        requestAnimationFrame(detectFace);
        return;
    }

    isProcessing = true;

    try {
        const result = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (!result) {
            statusText.textContent = "Hadapkan wajah ke kamera...";
        } else {
            // Gambar kotak pendeteksi
            const box = result.detection.box;
            context.strokeStyle = "#00ff88";
            context.lineWidth = 3;
            context.strokeRect(box.x, box.y, box.width, box.height);

            // Hitung kemiripan
            const distance = faceapi.euclideanDistance(targetDescriptor, result.descriptor);

            if (distance < MATCH_THRESHOLD) {
                statusText.textContent = "Wajah Cocok! 🎉";
                showBirthdaySurprise();
            } else {
                statusText.textContent = "Wajah belum cocok...";
            }
        }
    } catch (error) {
        console.error("Error deteksi:", error);
    } finally {
        isProcessing = false;
        if (!birthdayShown) {
            setTimeout(detectFace, 150);
        }
    }
}

// ========================================
// 4. EKSEKUSI KEJUTAN
// ========================================
function showBirthdaySurprise() {
    if (birthdayShown) return;
    birthdayShown = true;

    // Set Data Target
    targetAgeText.textContent = TARGET_AGE;
    targetNameText.textContent = `Happy Birthday, ${TARGET_NAME}! 🎉`;

    // Tampilkan pesan & sembunyikan placeholder
    if (messagePlaceholder) messagePlaceholder.classList.add("hidden");
    birthdayMessage.classList.remove("hidden");

    stopCamera();
    playBirthdayMusic();
    createConfetti();
}

function playBirthdayMusic() {
    if (birthdayMusic && birthdayMusic.src) {
        birthdayMusic.currentTime = 0;
        birthdayMusic.play().catch(e => console.log("Autoplay musik diblokir browser."));
    }
}

function createConfetti() {
    const symbols = ["🎉", "🎊", "✨", "💖", "🎈"];
    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement("span");
        confetti.className = "confetti";
        confetti.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.fontSize = 16 + Math.random() * 20 + "px";
        confetti.style.animationDuration = 3 + Math.random() * 4 + "s";
        confetti.style.animationDelay = Math.random() * 1.5 + "s";
        
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 8000);
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    video.srcObject = null;
}

// ========================================
// INISIALISASI
// ========================================
startButton.addEventListener("click", startCamera);
replayButton.addEventListener("click", () => {
    playBirthdayMusic();
    createConfetti();
});

// Jalankan sistem
loadModels();