import util from './util';

export default class Qubit {

    constructor(){
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }

    /**
     * Take a Z measurement
     * Because game needs this function to be synchronous,
     * z measurements are pre-computed during gate applications.
     * Read functions return a random measurement from the 
     * precomputed set.
     * @returns {number} measurement
     */
    zRead(){
        return this.z;
    }
    
    /**
     * Apply an X-Gate to the qubit
     * @param {function} cb 
     * @returns {object} JSON response
     */
    xGate(cb){
        return fetch('/q/XGate')
            .then(response => response.json())
            .then(json => this.z=util.jobCountWinner(json)) // TODO: assumes Z measurement
            .then(cb);
    }
}
