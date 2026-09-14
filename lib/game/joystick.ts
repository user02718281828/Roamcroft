export type StickVector = {x:number;y:number};
export class JoystickInput {
  pointer:number|null=null;
  x=0;y=0;centerX=0;centerY=0;
  begin(pointer:number,x:number,y:number){
    if(this.pointer!==null)return false;
    this.pointer=pointer;this.centerX=x;this.centerY=y;return true;
  }
  move(pointer:number,x:number,y:number,radius=42):StickVector|null {
    if(pointer!==this.pointer||!Number.isFinite(x+y)||radius<=0)return null;
    const dx=x-this.centerX,dy=y-this.centerY,distance=Math.hypot(dx,dy),ratio=Math.min(1,distance/radius);
    const strength=ratio<.12?0:(ratio-.12)/.88;
    this.x=distance?dx/distance*strength:0;this.y=distance?dy/distance*strength:0;
    return {x:this.x,y:this.y};
  }
  end(pointer:number){if(pointer!==this.pointer)return false;this.reset();return true;}
  reset(){this.pointer=null;this.x=0;this.y=0;}
}
