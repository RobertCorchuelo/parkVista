from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import cv2
import numpy as np
import re
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Inicializa EasyOCR
reader = easyocr.Reader(['en'])

# Configuración de SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vehiculos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Expresión regular para placas de carros y motos (con guion o espacio opcional)
patron_placa = re.compile(r"^[A-Z]{3}[- ]?\d{3}$|^[A-Z]{3}[- ]?\d{2}[A-Z]$")

# Modelo de base de datos
class RegistroPlaca(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(10), nullable=False)
    tipo = db.Column(db.String(10), nullable=False)
    hora = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

# Función para clasificar el tipo de vehículo
def clasificar_vehiculo(texto):
    if re.match(r"^[A-Z]{3}\d{3}$", texto):
        return "Carro"
    elif re.match(r"^[A-Z]{3}\d{2}[A-Z]$", texto):
        return "Moto"
    else:
        return "Desconocido"

# Función para formatear placa (eliminar guiones o espacios innecesarios)
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
        print(f"Texto detectado: '{text}' con confianza: {round(prob, 2)}")

        # Permitir letras mayúsculas, números, guion y espacio para detectar correctamente
        texto_limpio = re.sub(r'[^A-Z0-9- ]', '', text.upper())

        # Elimina 'I' inicial si parece un error común
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
                print(f"Placa válida: {texto_formateado} (tipo: {tipo})")

    return jsonify({'placas': placas_detectadas})


@app.route('/guardar', methods=['POST'])
def guardar_placa():
    data = request.get_json()

    placa = data.get('placa')
    tipo = data.get('tipo')
    hora_str = data.get('hora')  # Se espera una string tipo ISO 8601

    if not (placa and tipo and hora_str):
        return jsonify({'error': 'Faltan datos'}), 400

    try:
        hora = datetime.fromisoformat(hora_str)
        nuevo_registro = RegistroPlaca(placa=placa.upper(), tipo=tipo, hora=hora)
        db.session.add(nuevo_registro)
        db.session.commit()
        return jsonify({'mensaje': 'Placa guardada exitosamente'}), 200
    except Exception as e:
        print("Error al guardar en base de datos:", e)
        return jsonify({'error': 'Error al guardar en base de datos'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
