# server.py
from flask import Flask, render_template, request, send_file
app = Flask(__name__, static_url_path="/", static_folder="./public", template_folder="./templates")

import json
from io import BytesIO
import numpy as np
from qiskit import *

circuit = QuantumCircuit(1,1)
backend_qasm = Aer.get_backend('qasm_simulator')
backend_statevector = BasicAer.get_backend('statevector_simulator')

def send_figure(image,format='png'):
  imageIO = BytesIO()
  image.savefig(imageIO, format=format)
  imageIO.seek(0)
  return send_file(imageIO, mimetype='image/{}'.format(format))

@app.route("/")
def index():
  return app.send_static_file("index.html")

@app.route('/q/<action>')
def query(action):
  circuit.x(0)
  circuit.measure([0],[0])
  result = execute(circuit, backend = backend_qasm, shots = 1024).result()
  counts = result.get_counts(circuit)
  return json.dumps(counts)

@app.route('/draw')
def draw():
  fig = circuit.draw(output='mpl')
  return send_figure(fig)

@app.route('/bloch')
def bloch():
  job = execute(circuit, backend_statevector)
  fig = visualization.plot_bloch_multivector(job.result().get_statevector(circuit))
  return send_figure(fig)

if __name__ == "__main__":
  app.run()
