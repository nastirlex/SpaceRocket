/**
 * Ракетный симулятор (лицензия MIT).
 * © 2023 Ваше Имя/Компания. Код открыт для использования с указанием авторства.
 */

// Константы
const G = 6.67430e-11;
const EARTH_MASS = 5.972e24;
const EARTH_RADIUS = 6371000; // в метрах
const ORBIT_HEIGHT = 100000; // 100 км для орбиты
const ORBIT_SPEED = 7800; // м/с для орбиты

// Конфигурация двигателей
const ENGINES = {
    1: { thrust: 500000, fuelRate: 0.5, mass: 1000, name: "Фобос" },
    2: { thrust: 800000, fuelRate: 0.7, mass: 1500, name: "Деймос" },
    3: { thrust: 1200000, fuelRate: 1.0, mass: 2000, name: "Арес" },
    4: { thrust: 1500000, fuelRate: 1.2, mass: 2500, name: "Атлант" }
};

class Rocket {
    constructor(engineConfig) {
        this.engine = engineConfig;
        this.position = { x: 0, y: EARTH_RADIUS + 10000 }; // Старт чуть выше поверхности
        this.velocity = { x: 0, y: 0 }; // Начальная скорость вверх
        this.fuel = 100;
        this.isParachuteOpen = false;
        this.maxSpeed = 0;
        this.maxAltitude = 0;
        this.angle = 0;
        this.thrusting = false;
        this.flightStatus = "ПОДГОТОВКА";
    }

    update(dt) {
        // Управление
        if (this.thrusting && this.fuel > 0) {
            const thrustForce = this.engine.thrust * dt;
            this.velocity.x += Math.sin(this.angle) * thrustForce / this.engine.mass;
            this.velocity.y -= Math.cos(this.angle) * thrustForce / this.engine.mass;
            this.fuel = Math.max(0, this.fuel - this.engine.fuelRate * dt);
        }

        // Гравитация
        const distance = Math.sqrt(this.position.x**2 + this.position.y**2);
        const gravity = G * EARTH_MASS / (distance**2);
        
        this.velocity.x -= (gravity * this.position.x / distance) * dt;
        this.velocity.y -= (gravity * this.position.y / distance) * dt;

        // Обновление позиции
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        // Обновление рекордов
        const speed = Math.sqrt(this.velocity.x**2 + this.velocity.y**2);
        if (speed > this.maxSpeed) this.maxSpeed = speed;
        
        const altitude = distance - EARTH_RADIUS;
        if (altitude > this.maxAltitude) this.maxAltitude = altitude;

        // Обновление статуса
        this.updateFlightStatus(distance, speed, altitude);
    }

    updateFlightStatus(distance, speed, altitude) {
        if (altitude < 0) {
            this.flightStatus = "КРУШЕНИЕ";
        } else if (altitude > ORBIT_HEIGHT && speed > ORBIT_SPEED) {
            this.flightStatus = "НА ОРБИТЕ";
        } else if (altitude > ORBIT_HEIGHT) {
            this.flightStatus = "ОТКРЫТЫЙ КОСМОС";
        } else if (this.fuel <= 0 && altitude > 0) {
            this.flightStatus = "ПАДЕНИЕ";
        } else if (this.flightStatus === "ПОДГОТОВКА") {
            this.flightStatus = "ВЗЛЕТ";
        }
    }
}

// Инициализация игры
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let rocket;
let gameStatus = "РЕДАКТОР";
let selectedEngine = null;
let lastTimestamp = 0;
let keys = { left: false, right: false };

// Обработчики событий
document.querySelectorAll('.engine').forEach(engine => {
    engine.addEventListener('click', function() {
        document.querySelectorAll('.engine').forEach(el => {
            el.classList.remove('selected');
        });
        this.classList.add('selected');
        selectedEngine = parseInt(this.getAttribute('data-engine'));
        document.getElementById('start-btn').classList.remove('hidden');
    });
});

document.getElementById('start-btn').addEventListener('click', startFlight);
document.getElementById('left').addEventListener('mousedown', () => keys.left = true);
document.getElementById('left').addEventListener('mouseup', () => keys.left = false);
document.getElementById('right').addEventListener('mousedown', () => keys.right = true);
document.getElementById('right').addEventListener('mouseup', () => keys.right = false);
document.getElementById('back').addEventListener('click', backToEditor);
document.getElementById('restart').addEventListener('click', restartGame);

function startFlight() {
    if (!selectedEngine) return;
    
    rocket = new Rocket(ENGINES[selectedEngine]);
    gameStatus = "ПОЛЕТ";
    document.getElementById('editor').classList.add('hidden');
    document.getElementById('flight').classList.remove('hidden');
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
}

function backToEditor() {
    gameStatus = "РЕДАКТОР";
    document.getElementById('flight').classList.add('hidden');
    document.getElementById('editor').classList.remove('hidden');
}

function restartGame() {
    document.getElementById('result').classList.add('hidden');
    document.getElementById('editor').classList.remove('hidden');
    selectedEngine = null;
    document.querySelectorAll('.engine').forEach(el => {
        el.classList.remove('selected');
    });
    document.getElementById('start-btn').classList.add('hidden');
}

function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    // Очистка экрана
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Управление
    if (keys.left) rocket.angle -= 0.05;
    if (keys.right) rocket.angle += 0.05;
    rocket.thrusting = true;

    // Обновление физики
    rocket.update(deltaTime || 0.016);

    // Рендеринг
    renderEarth();
    renderRocket();
    updateUI();

    // Проверка завершения полёта
    if (rocket.flightStatus === "КРУШЕНИЕ" || 
        rocket.flightStatus === "НА ОРБИТЕ" ||
        (rocket.flightStatus === "ОТКРЫТЫЙ КОСМОС" && rocket.fuel <= 0)) {
        endFlight(rocket.flightStatus);
        return;
    }

    if (gameStatus === "ПОЛЕТ") {
        requestAnimationFrame(gameLoop);
    }
}

function renderEarth() {
    const earthRadius = Math.min(150, EARTH_RADIUS/10000); // Увеличим Землю
    ctx.fillStyle = '#0d47a1';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height, earthRadius, 0, Math.PI*2);
    ctx.fill();
}

function renderRocket() {
    const centerX = canvas.width/2;
    const centerY = canvas.height;
    const scale = 5000; // Уменьшим масштаб для лучшей видимости
    const posX = centerX + rocket.position.x/scale;
    const posY = centerY - rocket.position.y/scale;

    // Проверка видимости ракеты
    if (posX < -50 || posX > canvas.width + 50 || posY < -50 || posY > canvas.height + 50) {
        return;
    }

    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(rocket.angle);

    // Корпус ракеты (увеличим размер)
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(-15, -40, 30, 80);

    // Огонь двигателя
    if (rocket.thrusting && rocket.fuel > 0) {
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.moveTo(-12, 40);
        ctx.lineTo(12, 40);
        ctx.lineTo(0, 70);
        ctx.fill();
    }

    ctx.restore();
}

function updateUI() {
    if (!rocket) return;

    const distance = Math.sqrt(rocket.position.x**2 + rocket.position.y**2);
    const altitude = (distance - EARTH_RADIUS) / 1000;
    const speed = Math.sqrt(rocket.velocity.x**2 + rocket.velocity.y**2);

    document.getElementById('altitude').textContent = altitude.toFixed(2);
    document.getElementById('speed').textContent = speed.toFixed(2);
    document.getElementById('fuel').textContent = Math.max(0, rocket.fuel).toFixed(0);
    document.getElementById('status').textContent = rocket.flightStatus;
}

function endFlight(status) {
    gameStatus = "РЕЗУЛЬТАТ";
    document.getElementById('flight').classList.add('hidden');
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('result-status').textContent = status;
    document.getElementById('max-speed').textContent = rocket.maxSpeed.toFixed(2);
    document.getElementById('max-altitude').textContent = (rocket.maxAltitude/1000).toFixed(2);
}