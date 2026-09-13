import * as T from 'three';
export const WATER_SURFACE_Y=-.08;
export const WORLD_BASE_TOP=-.25;
export function addWind(material:T.MeshStandardMaterial,time:{value:number}){
 material.onBeforeCompile=shader=>{
  shader.uniforms.windTime=time;
  shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING_COLOR
    vec3 worldPositionWind=(instanceMatrix*vec4(position,1.0)).xyz;
    float leaf=step(instanceColor.r*1.03,instanceColor.g)*step(instanceColor.b*1.05,instanceColor.g);
    transformed.x+=sin(windTime*1.4+worldPositionWind.x*.7+worldPositionWind.z*.6)*leaf*min(0.035,max(0.0,worldPositionWind.y)*0.012);
  #endif`);
 };
 material.customProgramCacheKey=()=> 'roamcroft-wind-v1';
}
