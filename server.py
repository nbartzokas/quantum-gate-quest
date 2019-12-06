# server.py
from flask import Flask, render_template, request
app = Flask(__name__, static_url_path="/", static_folder="./public", template_folder="./templates")

import json
import numpy as np
from qiskit import *

circuit = QuantumCircuit(1,1)
circuit.x(0)

backend = Aer.get_backend('qasm_simulator')

@app.route("/")
def index():
  return app.send_static_file("index.html")

@app.route('/q/<action>')
def query(action):
  circuit.measure([0],[0])
  result = execute(circuit, backend = backend, shots = 1024).result()
  return json.dumps(result)

if __name__ == "__main__":
  app.run()
