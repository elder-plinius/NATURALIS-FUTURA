/** Original procedural harbour tones. No samples, network or audio-dependent game rules. */
export class HarborSound {
 private context:AudioContext|null=null;private gain:GainNode|null=null;private muted=false;private lastBell=-1;private lastDelivery=-1;
 start(){if(!this.context){this.context=new AudioContext();this.gain=this.context.createGain();this.gain.gain.value=.18;this.gain.connect(this.context.destination);}void this.context.resume();}
 setMuted(value:boolean){this.muted=value;if(this.gain)this.gain.gain.setTargetAtTime(value?0:.18,this.context!.currentTime,.05);}
 private tone(freq:number,duration:number,volume:number,delay=0){if(!this.context||!this.gain||this.muted)return;const t=this.context.currentTime+delay;const o=this.context.createOscillator(),g=this.context.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+duration+.1);}
 update(bell:number,delivery:number,damped:boolean){if(bell>0&&bell!==this.lastBell){this.lastBell=bell;if(!damped){this.tone(659.25,1.5,.25);this.tone(1318.5,.65,.06);}}if(delivery>0&&delivery!==this.lastDelivery){this.lastDelivery=delivery;[293.66,369.99,440].forEach((f,i)=>this.tone(f,1.2,.18,i*.1));}}
 close(){void this.context?.close();}
}
