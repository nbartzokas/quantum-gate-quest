# server.py
from flask import Flask, render_template, request, send_file
app = Flask(__name__, static_url_path="/", static_folder="./public", template_folder="./templates")

import json
from io import BytesIO
import numpy as np
from qiskit import *

nshots = 1024
circuit = QuantumCircuit(1,1)
backend_qasm = Aer.get_backend('qasm_simulator')
backend_statevector = BasicAer.get_backend('statevector_simulator')

def send_figure(image,format='png'):
  imageIO = BytesIO()
  image.savefig(imageIO, format=format)
  imageIO.seek(0)
  return send_file(imageIO, mimetype='image/{}'.format(format))

def measureZ():
  # measure, then remove measurement
  circuit.measure([0],[0])
  result = execute(circuit, backend = backend_qasm, shots = nshots).result()
  counts = result.get_counts(circuit)
  circuit.data.pop()
  return counts

def measureX():
  # apply h, measure, then remove both
  circuit.h(0)
  counts = measureZ()
  circuit.data.pop()
  return counts

def measureY():
  # apply h, measure, then remove both
  circuit.sdg(0)
  counts = measureX()
  circuit.data.pop()
  return counts

@app.route("/")
def index():
  return app.send_static_file("index.html")

@app.route('/q/clear')
def clear():
  circuit.data.clear()
  return json.dumps({'success':True})

@app.route('/q/<instruction>')
def query(instruction):

  # get instruction class
  inst_class = getattr( qiskit.extensions.standard, instruction )

  # # apply gate, unless
  # if ( len(circuit.data) > 0 and isinstance( circuit.data[-1][0], inst_class ) ):
  #   # if last gate is same as this gate, remove last gate
  #   circuit.data.pop()
  # else:
  #   # apply gate
  #   # circuit.x(0)
  #   circuit.append(inst_class(),circuit.qubits)
    
  circuit.append(inst_class(),circuit.qubits)

  cx=measureX()
  cy=measureY()
  cz=measureZ()

  x0=cx['0'] if '0' in cx else 0
  x1=cx['1'] if '1' in cx else 0
  y0=cy['0'] if '0' in cy else 0
  y1=cy['1'] if '1' in cy else 0
  z0=cz['0'] if '0' in cz else 0
  z1=cz['1'] if '1' in cz else 0
  
  x=round((x0*0+x1*1)/nshots,1)
  y=round((y0*0+y1*1)/nshots,1)
  z=round((z0*0+z1*1)/nshots,1)

  print(f'{x},{y},{z}')

  return json.dumps({'x':x,'y':y,'z':z})

@app.route('/draw')
@app.route('/draw.<format>')
def draw(format='png'):
  fig = circuit.draw(output='mpl')
  return send_figure(fig,format)

@app.route('/bloch')
@app.route('/bloch.<format>')
def bloch(format='png'):
  job = execute(circuit, backend_statevector)
  fig = visualization.plot_bloch_multivector(job.result().get_statevector(circuit))
  return send_figure(fig,format)

if __name__ == "__main__":
  app.run()
