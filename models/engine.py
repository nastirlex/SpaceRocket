class Engine:
    def __init__(self, name, thrust, specific_impulse, fuel_consumption):
        self.name = name                          # Название двигателя
        self.thrust = thrust                      # Тяга двигателя (Н)
        self.specific_impulse = specific_impulse  # Удельный импульс (с)
        self.fuel_consumption = fuel_consumption  # Расход топлива (кг/с) 