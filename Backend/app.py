from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import cv2
import numpy as np
import re
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pytz

app = Flask(__name__)
CORS(app)

# Inicializa EasyOCR
reader = easyocr.Reader(['en'])

# Configuración de SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vehiculos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar base de datos
db = SQLAlchemy(app)

# Zona horaria local
zona_colombia = pytz.timezone('America/Bogota')

# Expresión regular para placas de carros y motos
patron_placa = re.compile(r"^[A-Z]{3}[- ]?\d{3}$|^[A-Z]{3}[- ]?\d{2}[A-Z]$")

# Modelo de base de datos
class RegistroPlaca(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(10), nullable=False)
    tipo = db.Column(db.String(10), nullable=False)
    hora = db.Column(db.DateTime, default=lambda: datetime.now(zona_colombia))

with app.app_context():
    db.create_all()

@app.route('/registros', methods=['GET'])
def obtener_registros():
    try:
        registros = RegistroPlaca.query.order_by(RegistroPlaca.hora.desc()).all()
        lista = [{
            'id': r.id,
            'placa': r.placa,
            'tipo': r.tipo,
            'hora': r.hora.isoformat()
        } for r in registros]
        return jsonify(lista), 200
    except Exception as e:
        print("Error al obtener registros:", e)
        return jsonify({'error': 'Error al obtener los registros'}), 500

def clasificar_vehiculo(texto):
    if re.match(r"^[A-Z]{3}\d{3}$", texto):
        return "Carro"
    elif re.match(r"^[A-Z]{3}\d{2}[A-Z]$", texto):
        return "Moto"
    else:
        return "Desconocido"

def formatear_placa(texto):
    return re.sub(r"[- ]", "", texto)

@app.route('/placa', methods=['POST'])
def detectar_placa():
    if 'imagen' not in request.files:
        return jsonify({'error': 'No se envió imagen'}), 400

    archivo = request.files['imagen']
    img_np = np.frombuffer(archivo.read(), np.uint8)
    img = cv2.imdecode(img_np, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({'error': 'Imagen inválida'}), 400

    results = reader.readtext(img)
    placas_detectadas = []

    for (_, text, prob) in results:
        texto_limpio = re.sub(r'[^A-Z0-9- ]', '', text.upper())

        if len(texto_limpio) >= 7 and texto_limpio.startswith('I') and texto_limpio[1:4].isalpha():
            texto_limpio = texto_limpio[1:]

        if prob > 0.3 and len(texto_limpio) >= 6:
            if patron_placa.match(texto_limpio):
                texto_formateado = formatear_placa(texto_limpio)
                tipo = clasificar_vehiculo(texto_formateado)
                placas_detectadas.append({
                    'texto': texto_formateado,
                    'confianza': round(prob, 2),
                    'tipo': tipo
                })

    return jsonify({'placas': placas_detectadas})

@app.route('/guardar_placa', methods=['POST'])
def guardar_placa():
    data = request.get_json()
    texto = data.get('texto')
    tipo = data.get('tipo')

    if not (texto and tipo):
        return jsonify({'error': 'Faltan datos'}), 400

    try:
        nuevo = RegistroPlaca(placa=texto.upper(), tipo=tipo)
        db.session.add(nuevo)
        db.session.commit()
        return jsonify({'mensaje': 'Placa guardada exitosamente'}), 200
    except Exception as e:
        print("Error:", e)
        return jsonify({'error': 'Error al guardar'}), 500

@app.route('/salida/<int:id>', methods=['DELETE'])
def registrar_salida(id):
    try:
        registro = RegistroPlaca.query.get(id)
        if not registro:
            return jsonify({'error': 'Registro no encontrado'}), 404

        hora_salida = datetime.now(zona_colombia)

        # Convertir hora almacenada (posiblemente naive) a aware con zona Colombia
        if registro.hora.tzinfo is None:
            hora_entrada_aware = zona_colombia.localize(registro.hora)
        else:
            hora_entrada_aware = registro.hora

        minutos = int((hora_salida - hora_entrada_aware).total_seconds() / 60)
        tarifa = 100 if registro.tipo.lower() == 'carro' else 50
        total = minutos * tarifa

        factura = {
            'placa': registro.placa,
            'tipo': registro.tipo,
            'hora_entrada': hora_entrada_aware.isoformat(),
            'hora_salida': hora_salida.isoformat(),
            'minutos': minutos,
            'valor_por_minuto': tarifa,
            'total_pagar': total
        }

        db.session.delete(registro)
        db.session.commit()

        return jsonify({'mensaje': 'Salida registrada', 'factura': factura}), 200

    except Exception as e:
        print("Error al registrar salida:", e)
        return jsonify({'error': f'Error al registrar salida: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
