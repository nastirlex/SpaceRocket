import math

class PhysicsSimulation:
    def __init__(self, rocket):
        self.rocket = rocket
        self.earth_radius = 6371000  # Радиус Земли в метрах
        self.earth_mass = 5.972e24   # Масса Земли в кг
        self.G = 6.67430e-11         # Гравитационная постоянная
        self.orbit_altitude = 100000  # Высота орбиты в метрах
        self.space_altitude = 200000  # Высота космоса в метрах
        # Добавляем горизонтальную позицию и скорость
        self.horizontal_position = 0
        self.horizontal_velocity = 0
    
    def update(self, state, command, time_step):
        """Обновление состояния полета за один временной шаг"""
        # Текущие параметры
        time = state['time']
        altitude = state['altitude']
        velocity = state['velocity']
        status = state['status']
        max_altitude = state['max_altitude']
        max_velocity = state['max_velocity']
        
        # Получаем горизонтальную позицию и скорость из состояния или используем значения по умолчанию
        horizontal_position = state.get('horizontal_position', 0)
        horizontal_velocity = state.get('horizontal_velocity', 0)
        
        # Обработка команды управления
        if command in ['left', 'right']:
            self.rocket.rotate(command)
        
        # Всегда начинаем со статуса ВЗЛЕТ
        if status == 'НА СТАРТЕ':
            status = 'ВЗЛЕТ'
            # Добавляем начальную скорость для гарантированного взлета
            velocity = 20.0  # Увеличиваем начальную скорость
        
        # Расчет гравитационной силы
        distance_to_center = self.earth_radius + altitude
        gravity_force = self.G * self.earth_mass * self.rocket.total_mass / (distance_to_center ** 2)
        
        # Расчет силы тяги с увеличенным коэффициентом
        thrust_force = 0
        if status in ['ВЗЛЕТ', 'ПОЛЕТ'] and self.rocket.fuel > 0:
            fuel_consumed = self.rocket.consume_fuel(time_step)
            if fuel_consumed > 0:
                thrust_force = self.rocket.engine.thrust * 1.5  # Увеличиваем тягу на 50%
                # Если время < 5 секунд, дополнительно увеличиваем тягу для быстрого взлета
                if time < 5.0:
                    thrust_force *= 1.5  # Еще +50% в первые 5 секунд
        
        # Расчет вертикальной и горизонтальной составляющих тяги
        angle_rad = math.radians(self.rocket.angle)
        thrust_vertical = thrust_force * math.sin(angle_rad)
        thrust_horizontal = thrust_force * math.cos(angle_rad)
        
        # Корректируем направление горизонтальной тяги в зависимости от угла
        # Если угол < 90, то движемся вправо, если > 90, то влево
        if self.rocket.angle > 90:
            thrust_horizontal = -abs(thrust_horizontal)  # Движение влево
        elif self.rocket.angle < 90:
            thrust_horizontal = abs(thrust_horizontal)   # Движение вправо
        else:
            thrust_horizontal = 0  # Вертикально вверх
        
        # Расчет ускорения (F = m*a => a = F/m)
        acceleration_vertical = (thrust_vertical - gravity_force) / self.rocket.total_mass
        acceleration_horizontal = thrust_horizontal / self.rocket.total_mass
        
        # Обновление скорости
        velocity += acceleration_vertical * time_step
        horizontal_velocity += acceleration_horizontal * time_step
        
        # Обновление высоты и горизонтальной позиции
        altitude += velocity * time_step
        horizontal_position += horizontal_velocity * time_step
        
        # Если ракета достигла земли
        if altitude <= 0:
            altitude = 0
            velocity = 0
            horizontal_velocity = 0
            status = 'ПРИЗЕМЛЕН'
        
        # Обновление максимальных значений
        max_altitude = max(max_altitude, altitude)
        max_velocity = max(max_velocity, abs(velocity))
        
        # Обновление статуса полета
        if status == 'ВЗЛЕТ' and altitude > 1000:
            status = 'ПОЛЕТ'
        
        if altitude >= self.space_altitude:
            status = 'ОТКРЫТЫЙ КОСМОС'
        elif altitude >= self.orbit_altitude:
            status = 'ПОЛЕТ ПО ОРБИТЕ'
        elif self.rocket.fuel <= 0 and altitude > 0 and velocity < 0:
            status = 'ПАДЕНИЕ'
        
        # Обновляем время
        time += time_step
        
        # Возвращаем обновленное состояние
        return {
            'time': time,
            'status': status,
            'altitude': altitude,
            'velocity': velocity,
            'fuel': self.rocket.fuel,
            'max_altitude': max_altitude,
            'max_velocity': max_velocity,
            'angle': self.rocket.angle,
            'horizontal_position': horizontal_position,
            'horizontal_velocity': horizontal_velocity
        }