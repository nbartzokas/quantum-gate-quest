export default class Qubit {

    constructor(){
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }

    /**
     * Clear qubit circuit
     * @param {function} cb 
     * @returns {object} JSON response
     */
    clear(cb){
        return fetch('/q/clear')
            .then(cb);
    }

    /**
     * Take a X/Y/Z measurement
     * Because game needs this function to be synchronous,
     * X/Y/Z measurements are pre-computed during gate applications.
     * @returns {number} measurement
     */
    xRead(){ return this.x; }
    yRead(){ return this.y; }
    zRead(){ return this.z; }
    
    /**
     * Apply a gate to the qubit
     * @param {string} type type of gate to apply see https://qiskit.org/documentation/apidoc/extensions/standard.html
     * @param {function} cb 
     * @returns {object} JSON response in the form {x:#,y:#,z:#}
     */
    gate(type,cb){
        return fetch('/q/'+type)
            .then(response => response.json())
            .then(json => Object.assign(this,json))
            .then(cb);
    }
}
