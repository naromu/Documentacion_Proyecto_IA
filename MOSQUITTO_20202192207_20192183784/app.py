from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/mensaje', methods=['POST'])
def recibir_mensaje():
    data = request.json
    print("📥 Mensaje recibido en el backend:", data)
    return jsonify({"status": "OK", "mensaje": data}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
