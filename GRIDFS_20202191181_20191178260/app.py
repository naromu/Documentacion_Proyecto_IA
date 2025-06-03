from flask import Flask, request, jsonify, send_file
from pymongo import MongoClient
import gridfs
from bson.objectid import ObjectId
from io import BytesIO
import datetime

app = Flask(__name__)

# Conexión a la base de datos
client = MongoClient("mongodb://localhost:27017/")
db = client["imgsdb"] #Base de datos de imágenes
fs = gridfs.GridFS(db)

db_temps = client["tempsdb"]  #Base de datos de temperaturas
temps_collection = db_temps["temperatures"]

# Subir imagen + datos asociados (JSON)
@app.route("/upload", methods=["POST"])
def upload_image():
    if "image" not in request.files or "temperature" not in request.form:
        return jsonify({"error": "Faltan campos requeridos"}), 400

    image = request.files["image"]
    temperature = float(request.form["temperature"])
    image_data = image.read()

    try:
        # Guardar imagen en imgsdb con GridFS
        image_id = fs.put(
            image_data,
            filename=image.filename,
            metadata={
                "timestamp": datetime.datetime.utcnow()
            }
        )

        # Guardar temperatura en tempsdb
        temps_collection.insert_one({
            "temperature": temperature,
        })

        return jsonify({
            "message": "Imagen y temperatura almacenadas exitosamente",
            "file_id": str(image_id)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Fallo al guardar: {e}"}), 500

# Obtener imagen por ID
@app.route('/image/<file_id>', methods=['GET'])
def get_image(file_id):
    try:
        file = fs.get(ObjectId(file_id))
        return send_file(BytesIO(file.read()), mimetype='image/jpeg')
    except:
        return jsonify({"error": "No se encontró la imagen"}), 404

# Listar todas las imágenes y sus metadatos
@app.route('/images', methods=['GET'])
def list_images():
    files = fs.find().sort("uploadDate", -1)
    data = []
    for file in files:
        data.append({
            "file_id": str(file._id),
            "filename": file.filename,
            "temperature": file.metadata.get("temperature"),
            "timestamp": file.metadata.get("timestamp")
        })
    return jsonify(data), 200

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
