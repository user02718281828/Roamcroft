export class PointerDrag {
  active: { id: number; x: number; y: number; startX: number; startY: number; button: number } | null = null;
  dragged = false;
  begin(id: number, x: number, y: number, button: number) {
    if (this.active || ![0,1,2].includes(button)) return false;
    this.active={id,x,y,startX:x,startY:y,button}; this.dragged=false; return true;
  }
  move(id:number,x:number,y:number,buttons:number) {
    const a=this.active;
    if (!a || a.id!==id) return null;
    const mask=a.button===0 ? 1 : a.button===1 ? 4 : 2;
    if (!(buttons & mask)) {this.cancel(); return null;}
    const dx=x-a.x,dy=y-a.y;
    if (!this.dragged && Math.hypot(x-a.startX,y-a.startY)<=5) return null;
    this.dragged=true; a.x=x; a.y=y;
    return {dx,dy};
  }
  end(id:number) {
    if (!this.active || this.active.id!==id) return false;
    const click=!this.dragged && this.active.button===0;
    this.cancel(); return click;
  }
  cancel() { this.active=null; this.dragged=false; }
}

export class FrameBudget {
  tier=0;
  average=16.7;
  slow=0;
  healthy=0;
  reset() {this.tier=0;this.average=16.7;this.slow=0;this.healthy=0;}
  sample(milliseconds:number, eligible=true) {
    // Loading, menu timers and background tabs are not rendering pressure.
    if (!eligible) {this.average=16.7;this.slow=0;this.healthy=0;return false;}
    if (!Number.isFinite(milliseconds) || milliseconds<=0 || milliseconds>250) return false;
    this.average=this.average*.9+milliseconds*.1;
    this.slow=this.average>25 ? this.slow+milliseconds : 0;
    this.healthy=this.average<19 ? this.healthy+milliseconds : 0;
    if (this.slow>500 && this.tier<4) {
      this.tier++; this.slow=0; this.healthy=0; return true;
    }
    if (this.healthy>12000 && this.tier>0) {
      this.tier--; this.healthy=0; return true;
    }
    return false;
  }
}
