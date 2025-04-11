class Rocket:
    def __init__(self, engine, mass=1000, fuel=20000):
        self.engine = engine
        self.dry_mass = mass  # Масса ракеты без топлива (кг)
        self.fuel = fuel      # Количество топлива (кг)
        self.angle = 90       # Угол наклона ракеты (градусы), 90 - вертикально вверх
    
    @property
    def total_mass(self):
        """Общая масса ракеты с топливом"""
        return self.dry_mass + self.fuel
    
    def rotate(self, direction):
        """Поворот ракеты"""
        if direction == 'left':
            # Увеличиваем угол для поворота влево (против часовой стрелки)
            self.angle = min(180, self.angle + 2)
        elif direction == 'right':
            # Уменьшаем угол для поворота вправо (по часовой стрелке)
            self.angle = max(0, self.angle - 2)
    
    def consume_fuel(self, time_step):
        """Расход топлива за временной шаг"""
        fuel_consumed = self.engine.fuel_consumption * time_step
        if self.fuel >= fuel_consumed:
            self.fuel -= fuel_consumed
            return fuel_consumed
        else:
            consumed = self.fuel
            self.fuel = 0
            return consumed
    
    def to_dict(self):
        """Преобразование объекта в словарь для хранения в сессии"""
        return {
            'dry_mass': self.dry_mass,
            'fuel': self.fuel,
            'angle': self.angle,
            'engine': {
                'name': self.engine.name,
                'thrust': self.engine.thrust,
                'specific_impulse': self.engine.specific_impulse,
                'fuel_consumption': self.engine.fuel_consumption
            }
        }
    
    @classmethod
    def from_dict(cls, data):
        """Создание объекта из словаря"""
        from models.engine import Engine
        engine = Engine(
            name=data['engine']['name'],
            thrust=data['engine']['thrust'],
            specific_impulse=data['engine']['specific_impulse'],
            fuel_consumption=data['engine']['fuel_consumption']
        )
        rocket = cls(engine=engine, mass=data['dry_mass'], fuel=data['fuel'])
        rocket.angle = data['angle']
        return rocket 