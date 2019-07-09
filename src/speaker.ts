export class Speaker {
    ctx: AudioContext = new AudioContext();
    gain: GainNode = this.ctx.createGain();
    oscillator?: OscillatorNode;

    constructor() {
        this.gain.connect(this.ctx.destination);
    }

    play(frequency: number = 440) {
        const oscillator = this.oscillator = this.ctx.createOscillator();

        oscillator.frequency.value = frequency;
        oscillator.type = 'triangle';
        oscillator.connect(this.gain);
        oscillator.start();
    }

    stop() {
        if(this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect(0);
            delete this.oscillator;
        }
    }
}
