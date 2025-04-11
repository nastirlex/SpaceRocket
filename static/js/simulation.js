document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const flightTimeEl = document.getElementById('flight-time');
    const flightStatusEl = document.getElementById('flight-status');
    const altitudeEl = document.getElementById('altitude');
    const velocityEl = document.getElementById('velocity');
    const fuelEl = document.getElementById('fuel');
    const angleEl = document.getElementById('angle');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const resultsModal = document.getElementById('results-modal');
    const resultStatus = document.getElementById('result-status');
    const resultMaxAltitude = document.getElementById('result-max-altitude');
    const resultMaxVelocity = document.getElementById('result-max-velocity');
    const canvas = document.getElementById('rocket-canvas');
    const ctx = canvas.getContext('2d');
    
    // Состояние симуляции
    let simulationRunning = true;
    let currentCommand = 'none';
    
    // Обработчики кнопок управления
    leftBtn.addEventListener('mousedown', () => { currentCommand = 'left'; });
    rightBtn.addEventListener('mousedown', () => { currentCommand = 'right'; });
    document.addEventListener('mouseup', () => { currentCommand = 'none'; });
    
    // Вспомогательная функция для преобразования градусов в радианы
    Math.radians = function(degrees) {
        return degrees * Math.PI / 180;
    };
    
    // Массивы для хранения звезд и галактик
    const smallStars = [];
    const mediumStars = [];
    const brightStars = [];
    const galaxies = [];
    
    // Инициализация звезд и галактик
    function initializeStarsAndGalaxies() {
        // Маленькие звезды
        for (let i = 0; i < 200; i++) {
            smallStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5
            });
        }
        
        // Средние звезды
        for (let i = 0; i < 100; i++) {
            mediumStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1
            });
        }
        
        // Яркие звезды
        for (let i = 0; i < 50; i++) {
            brightStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1.5
            });
        }
        
        // Галактики и туманности
        galaxies.push({
            x: canvas.width * 0.8,
            y: canvas.height * 0.2,
            radius: 100,
            color1: 'rgba(138, 43, 226, 0.3)',
            color2: 'rgba(138, 43, 226, 0.1)',
            color3: 'rgba(138, 43, 226, 0)'
        });
        
        galaxies.push({
            x: canvas.width * 0.2,
            y: canvas.height * 0.8,
            radius: 120,
            color1: 'rgba(0, 191, 255, 0.2)',
            color2: 'rgba(0, 191, 255, 0.1)',
            color3: 'rgba(0, 191, 255, 0)'
        });
    }
    
    // Инициализируем звезды и галактики при загрузке
    initializeStarsAndGalaxies();
    
    // Добавляем переменные для планет
    let planetsInitialized = false;
    const planets = [];
    
    // Функция для инициализации планет
    function initializePlanets() {
        // Создаем несколько планет с разными характеристиками
        planets.push({
            x: canvas.width * 0.3,
            y: canvas.height * 0.2,
            radius: 15 + Math.random() * 10,
            color: '#ff9e7a', // Оранжевая планета
            rings: true,
            ringsColor: 'rgba(255, 158, 122, 0.5)',
            speed: 0.2
        });
        
        planets.push({
            x: canvas.width * 0.7,
            y: canvas.height * 0.3,
            radius: 20 + Math.random() * 15,
            color: '#7aecff', // Голубая планета
            rings: false,
            speed: 0.3,
            moons: [{
                distance: 30,
                radius: 5,
                color: '#d1d1d1',
                angle: 0,
                speed: 0.05
            }]
        });
        
        planets.push({
            x: canvas.width * 0.2,
            y: canvas.height * 0.6,
            radius: 25 + Math.random() * 10,
            color: '#a17aff', // Фиолетовая планета
            rings: false,
            speed: 0.15,
            moons: [{
                distance: 40,
                radius: 6,
                color: '#f0f0f0',
                angle: 0,
                speed: 0.03
            }, {
                distance: 55,
                radius: 4,
                color: '#d1d1d1',
                angle: Math.PI,
                speed: 0.04
            }]
        });
        
        planetsInitialized = true;
    }
    
    // Инициализируем планеты при загрузке
    initializePlanets();
    
    // Функция отрисовки полета ракеты
    function drawRocketFlight(data) {
        // Очищаем холст
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем космический фон
        drawSpace();
        
        // Рисуем планеты, которые движутся в противоположном направлении от ракеты
        drawPlanets(data.horizontal_position);
        
        // Рисуем Землю
        drawEarth(data.altitude);
        
        // Рисуем ракету
        drawRocket(data.altitude, data.angle, data.status, data.fuel > 0);
    }
    
    // Функция отрисовки космического пространства
    function drawSpace() {
        // Создаем градиент для космоса
        const spaceGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        spaceGradient.addColorStop(0, '#000000');
        spaceGradient.addColorStop(0.3, '#0c164f');
        spaceGradient.addColorStop(0.7, '#0c0c2b');
        spaceGradient.addColorStop(1, '#000000');
        
        // Заполняем фон градиентом
        ctx.fillStyle = spaceGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем звезды разных размеров
        drawStars();
        
        // Рисуем далекие галактики и туманности
        drawGalaxies();
    }
    
    // Функция отрисовки звезд
    function drawStars() {
        // Маленькие звезды
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const star of smallStars) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Средние звезды
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (const star of mediumStars) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Яркие звезды с сиянием
        for (const star of brightStars) {
            // Сияние
            const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Звезда
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Функция отрисовки галактик и туманностей
    function drawGalaxies() {
        for (const galaxy of galaxies) {
            const nebula = ctx.createRadialGradient(
                galaxy.x, galaxy.y, 0,
                galaxy.x, galaxy.y, galaxy.radius
            );
            nebula.addColorStop(0, galaxy.color1);
            nebula.addColorStop(0.5, galaxy.color2);
            nebula.addColorStop(1, galaxy.color3);
            
            ctx.fillStyle = nebula;
            ctx.beginPath();
            ctx.arc(galaxy.x, galaxy.y, galaxy.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Функция отрисовки планет
    function drawPlanets(horizontalPosition) {
        // Смещение планет в противоположную сторону от движения ракеты
        const offset = horizontalPosition || 0;
        
        planets.forEach(planet => {
            // Обновляем положение планеты (движение в противоположную сторону)
            const planetX = (planet.x - offset * planet.speed) % canvas.width;
            
            // Если планета вышла за пределы экрана, перемещаем ее на другую сторону
            const adjustedX = planetX < 0 ? canvas.width + planetX : planetX;
            
            // Рисуем планету
            ctx.fillStyle = planet.color;
            ctx.beginPath();
            ctx.arc(adjustedX, planet.y, planet.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Если у планеты есть кольца, рисуем их
            if (planet.rings) {
                ctx.strokeStyle = planet.ringsColor;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(adjustedX, planet.y, planet.radius * 1.5, planet.radius * 0.5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Если у планеты есть спутники, рисуем их
            if (planet.moons) {
                planet.moons.forEach(moon => {
                    // Обновляем угол спутника
                    moon.angle += moon.speed;
                    
                    // Вычисляем позицию спутника
                    const moonX = adjustedX + Math.cos(moon.angle) * moon.distance;
                    const moonY = planet.y + Math.sin(moon.angle) * moon.distance * 0.3; // Сплющиваем орбиту
                    
                    // Рисуем спутник
                    ctx.fillStyle = moon.color;
                    ctx.beginPath();
                    ctx.arc(moonX, moonY, moon.radius, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        });
    }
    
    // Функция отрисовки Земли
    function drawEarth(altitude) {
        // Определяем размер и положение Земли в зависимости от высоты
        const maxAltitude = 200000; // Максимальная высота для масштабирования
        const baseEarthRadius = canvas.height * 2; // Базовый радиус Земли
        const minEarthRadius = canvas.height * 0.3; // Минимальный радиус Земли при максимальной высоте
        
        // Вычисляем радиус Земли в зависимости от высоты
        let earthRadius = baseEarthRadius;
        if (altitude > 0) {
            const scale = 1 - Math.min(altitude / maxAltitude, 0.9);
            earthRadius = minEarthRadius + (baseEarthRadius - minEarthRadius) * scale;
        }
        
        // Центр Земли всегда ниже нижней границы холста
        const earthCenterY = canvas.height + earthRadius - 100;
        const earthCenterX = canvas.width / 2;
        
        // Создаем градиент для Земли
        const earthGradient = ctx.createRadialGradient(
            earthCenterX, earthCenterY, 0,
            earthCenterX, earthCenterY, earthRadius
        );
        
        // Добавляем цвета для градиента Земли
        earthGradient.addColorStop(0, '#1e5799'); // Темно-синий (океаны)
        earthGradient.addColorStop(0.85, '#207cca'); // Синий (океаны)
        earthGradient.addColorStop(0.87, '#2989d8'); // Светло-синий (мелководье)
        earthGradient.addColorStop(0.89, '#2ecc71'); // Зеленый (леса)
        earthGradient.addColorStop(0.93, '#f1c40f'); // Желтый (пустыни)
        earthGradient.addColorStop(0.95, '#ffffff'); // Белый (полярные шапки)
        
        // Рисуем Землю
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Добавляем атмосферу
        const atmosphereGradient = ctx.createRadialGradient(
            earthCenterX, earthCenterY, earthRadius,
            earthCenterX, earthCenterY, earthRadius * 1.05
        );
        atmosphereGradient.addColorStop(0, 'rgba(135, 206, 250, 0.3)');
        atmosphereGradient.addColorStop(1, 'rgba(135, 206, 250, 0)');
        
        ctx.fillStyle = atmosphereGradient;
        ctx.beginPath();
        ctx.arc(earthCenterX, earthCenterY, earthRadius * 1.05, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Функция отрисовки ракеты
    function drawRocket(altitude, angle, status, hasThrust) {
        // Определяем положение ракеты
        const rocketX = canvas.width / 2;
        const rocketY = canvas.height / 2;
        
        // Сохраняем текущее состояние контекста
        ctx.save();
        
        // Перемещаем контекст в позицию ракеты
        ctx.translate(rocketX, rocketY);
        
        // Поворачиваем контекст на угол наклона ракеты
        ctx.rotate(Math.radians(90 - angle));
        
        // Определяем цвет ракеты в зависимости от выбранного типа
        let rocketColor = '#ff6b6b'; // Цвет по умолчанию
        
        // Рисуем корпус ракеты
        ctx.fillStyle = rocketColor;
        ctx.beginPath();
        ctx.moveTo(0, -30); // Нос ракеты
        ctx.lineTo(15, 0); // Правый борт
        ctx.lineTo(15, 30); // Правый нижний угол
        ctx.lineTo(-15, 30); // Левый нижний угол
        ctx.lineTo(-15, 0); // Левый борт
        ctx.closePath();
        ctx.fill();
        
        // Рисуем нос ракеты
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(15, 0);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.fill();
        
        // Рисуем окно
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, -10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Добавляем блик на окне
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(1, -11, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Рисуем стабилизаторы
        ctx.fillStyle = '#e74c3c';
        
        // Левый стабилизатор
        ctx.beginPath();
        ctx.moveTo(-15, 15);
        ctx.lineTo(-25, 30);
        ctx.lineTo(-15, 30);
        ctx.closePath();
        ctx.fill();
        
        // Правый стабилизатор
        ctx.beginPath();
        ctx.moveTo(15, 15);
        ctx.lineTo(25, 30);
        ctx.lineTo(15, 30);
        ctx.closePath();
        ctx.fill();
        
        // Рисуем огонь из двигателя, если есть тяга
        if (hasThrust && (status === 'ВЗЛЕТ' || status === 'ПОЛЕТ')) {
            // Внешний огонь
            const fireGradient = ctx.createLinearGradient(0, 30, 0, 70);
            fireGradient.addColorStop(0, '#ff9500');
            fireGradient.addColorStop(0.5, '#ff5e3a');
            fireGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = fireGradient;
            ctx.beginPath();
            
            // Случайные колебания пламени
            const flameWidth = 12 + Math.random() * 4;
            const flameHeight = 40 + Math.random() * 10;
            
            ctx.moveTo(-flameWidth, 30);
            ctx.quadraticCurveTo(-flameWidth/2, 30 + flameHeight/2, 0, 30 + flameHeight);
            ctx.quadraticCurveTo(flameWidth/2, 30 + flameHeight/2, flameWidth, 30);
            ctx.closePath();
            ctx.fill();
            
            // Внутренний огонь
            const innerFireGradient = ctx.createLinearGradient(0, 30, 0, 60);
            innerFireGradient.addColorStop(0, '#ffcc00');
            innerFireGradient.addColorStop(0.7, '#ff9500');
            innerFireGradient.addColorStop(1, 'rgba(255, 149, 0, 0)');
            
            ctx.fillStyle = innerFireGradient;
            ctx.beginPath();
            
            const innerFlameWidth = 6 + Math.random() * 2;
            const innerFlameHeight = 25 + Math.random() * 5;
            
            ctx.moveTo(-innerFlameWidth, 30);
            ctx.quadraticCurveTo(-innerFlameWidth/2, 30 + innerFlameHeight/2, 0, 30 + innerFlameHeight);
            ctx.quadraticCurveTo(innerFlameWidth/2, 30 + innerFlameHeight/2, innerFlameWidth, 30);
            ctx.closePath();
            ctx.fill();
        }
        
        // Восстанавливаем контекст
        ctx.restore();
    }
    
    // Форматирование высоты (м или км)
    function formatAltitude(altitude) {
        if (altitude >= 1000) {
            return (altitude / 1000).toFixed(2) + ' км';
        } else {
            return altitude.toFixed(0) + ' м';
        }
    }
    
    // Форматирование скорости с указанием направления
    function formatVelocity(velocity) {
        const absVelocity = Math.abs(velocity);
        const direction = velocity < 0 ? '↓' : '↑';
        return `${absVelocity.toFixed(1)} м/с ${direction}`;
    }
    
    // Функция обновления данных полета
    async function updateFlightData() {
        try {
            const response = await fetch('/update_flight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command: currentCommand }),
            });
            
            const data = await response.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }
            
            // Обновляем интерфейс
            flightTimeEl.textContent = data.time.toFixed(1) + ' с';
            flightStatusEl.textContent = data.status;
            altitudeEl.textContent = formatAltitude(data.altitude);
            velocityEl.textContent = formatVelocity(data.velocity);
            fuelEl.textContent = data.fuel.toFixed(1) + ' кг';
            angleEl.textContent = data.angle + '°';
            
            // Отрисовка визуализации
            drawRocketFlight(data);
            
            // Проверка на завершение полета
            if (data.flight_ended) {
                simulationRunning = false;
                showResults(data);
            }
            
        } catch (error) {
            console.error('Ошибка при обновлении данных полета:', error);
        }
    }
    
    // Показать результаты полета
    function showResults(data) {
        resultStatus.textContent = `Статус: ${data.status}`;
        resultMaxAltitude.textContent = `Максимальная высота: ${formatAltitude(data.max_altitude)}`;
        resultMaxVelocity.textContent = `Максимальная скорость: ${Math.abs(data.max_velocity).toFixed(1)} м/с`;
        
        resultsModal.style.display = 'flex';
    }
    
    // Запуск симуляции
    function startSimulation() {
        if (simulationRunning) {
            updateFlightData();
            requestAnimationFrame(startSimulation); // Используем requestAnimationFrame для более плавной анимации
        }
    }
    
    // Инициализация начальных данных
    async function initializeFlightData() {
        try {
            const response = await fetch('/flight_data');
            const data = await response.json();
            
            if (data.error) {
                console.error(data.error);
                return;
            }
            
            // Обновляем интерфейс
            flightTimeEl.textContent = data.time.toFixed(1) + ' с';
            flightStatusEl.textContent = data.status;
            altitudeEl.textContent = formatAltitude(data.altitude);
            velocityEl.textContent = formatVelocity(data.velocity);
            fuelEl.textContent = data.fuel.toFixed(1) + ' кг';
            angleEl.textContent = data.angle + '°';
            
            // Отрисовываем начальное состояние
            drawRocketFlight(data);
            
            // Начинаем симуляцию
            startSimulation();
            
        } catch (error) {
            console.error('Ошибка при инициализации данных полета:', error);
            
            // Если не удалось получить данные, все равно рисуем фон и начинаем симуляцию
            drawSpace();
            drawEarth(0);
            startSimulation();
        }
    }
    
    // Начинаем с инициализации данных
    initializeFlightData();
}); 