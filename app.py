from flask import Flask, render_template, request, jsonify, session, redirect
from models.rocket import Rocket
from models.engine import Engine
from models.physics import PhysicsSimulation
import json

app = Flask(__name__)
app.secret_key = 'rocket_game_secret_key'

# Предопределенные двигатели с увеличенной тягой
engines = {
    'basic': Engine(name="Базовый", thrust=50000, specific_impulse=250, fuel_consumption=20),  # Увеличиваем тягу в 5 раз
    'advanced': Engine(name="Продвинутый", thrust=100000, specific_impulse=300, fuel_consumption=30),  # Увеличиваем тягу в 5 раз
    'super': Engine(name="Супер", thrust=200000, specific_impulse=350, fuel_consumption=40)  # Увеличиваем тягу в 6.7 раз
}

@app.route('/')
def index():
    return render_template('index.html', engines=engines)

@app.route('/start_flight', methods=['POST'])
def start_flight():
    engine_type = request.form.get('engine')
    engine = engines[engine_type]
    
    # Создаем ракету с выбранным двигателем и увеличенным запасом топлива
    rocket = Rocket(engine=engine, mass=500, fuel=20000)  # Увеличиваем запас топлива в 4 раза
    
    # Сохраняем данные ракеты в сессии
    session['rocket'] = rocket.to_dict()
    session['simulation_state'] = {
        'time': 0,
        'status': 'ВЗЛЕТ',  # Сразу устанавливаем статус ВЗЛЕТ
        'altitude': 10,     # Начинаем с небольшой высоты
        'velocity': 20.0,   # Увеличиваем начальную скорость
        'fuel': rocket.fuel,
        'max_altitude': 10,
        'max_velocity': 20.0,
        'angle': 90,
        'flight_ended': False
    }
    
    return render_template('flight.html')

@app.route('/flight_data')
def flight_data():
    if 'simulation_state' not in session:
        return jsonify({'error': 'No active flight'})
    
    return jsonify(session['simulation_state'])

@app.route('/update_flight', methods=['POST'])
def update_flight():
    if 'rocket' not in session or 'simulation_state' not in session:
        return jsonify({'error': 'No active flight'})
    
    # Получаем текущее состояние
    rocket_data = session['rocket']
    sim_state = session['simulation_state']
    
    # Восстанавливаем объекты
    rocket = Rocket.from_dict(rocket_data)
    
    # Получаем команду управления
    command = request.json.get('command', 'none')  # 'left', 'right', 'none'
    
    # Создаем симуляцию и обновляем состояние
    simulation = PhysicsSimulation(rocket)
    new_state = simulation.update(sim_state, command, time_step=0.1)
    
    # Сохраняем обновленное состояние
    session['simulation_state'] = new_state
    session['rocket'] = rocket.to_dict()
    
    # Проверяем, закончился ли полет
    # Полет завершается только если:
    # 1. Ракета приземлилась после полета (время > 30 секунд)
    # 2. Ракета на орбите и прошло достаточно времени (минимум 30 секунд)
    # 3. Ракета в открытом космосе, топливо кончилось и прошло достаточно времени
    flight_ended = False
    
    if new_state['status'] == 'ПРИЗЕМЛЕН' and new_state['time'] > 30:
        flight_ended = True
    elif new_state['status'] == 'ПОЛЕТ ПО ОРБИТЕ' and new_state['time'] > 30:
        flight_ended = True
    elif new_state['status'] == 'ОТКРЫТЫЙ КОСМОС' and rocket.fuel <= 0 and new_state['time'] > 30:
        flight_ended = True
    
    new_state['flight_ended'] = flight_ended
    
    return jsonify(new_state)

@app.route('/flight_results')
def flight_results():
    if 'simulation_state' not in session:
        return redirect('/')
    
    return render_template('results.html', results=session['simulation_state'])

if __name__ == '__main__':
    app.run(debug=True) 