export default function VillagerPortrait({id='farmer'}:{id?:string}) {
  const hair=id==='narin'?'#844a37':id==='lale'?'#493b32':'#795637';
  const coat=id==='narin'?'#c58569':id==='torin'?'#a98659':'#639d94';
  return <svg className="villager-portrait" viewBox="0 0 96 108" role="img" aria-label={id==='farmer'?'Gezgin portresi':`${id==='narin'?'Narin':id==='torin'?'Torin':'Lale'} portresi`}>
    <rect x="1" y="1" width="94" height="106" rx="22" fill="#8a9e70"/>
    <circle cx="48" cy="42" r="33" fill="#c4cd99" opacity=".6"/>
    <path d="M14 106c-1-32 18-36 34-36s35 4 34 36" fill={coat}/>
    <path d="M24 51C17 7 80 6 73 56l-1 25H22Z" fill={hair}/>
    <path d="M41 68h14v18c-4 5-10 5-14 0" fill="#dfad80"/>
    <ellipse cx="24" cy="51" rx="6" ry="8" fill="#e3ad82"/><ellipse cx="72" cy="51" rx="6" ry="8" fill="#e3ad82"/>
    <path d="M25 38c7-4 12-10 14-15 7 11 19 7 32 15v18c0 29-46 29-46 0Z" fill="#f0c499"/>
    <path d="m33 44 8-1m14 0 8 1" stroke={hair} strokeWidth="3" strokeLinecap="round"/>
    <ellipse cx="37" cy="51" rx="3.2" ry="4.4" fill="#3f3b2e"/><ellipse cx="59" cy="51" rx="3.2" ry="4.4" fill="#3f3b2e"/>
    <circle cx="36" cy="49.5" r="1" fill="#fff2d2"/><circle cx="58" cy="49.5" r="1" fill="#fff2d2"/>
    <ellipse cx="32" cy="60" rx="5" ry="3" fill="#df9780" opacity=".6"/><ellipse cx="64" cy="60" rx="5" ry="3" fill="#df9780" opacity=".6"/>
    <path d="m46 55-1 4 5 1m-8 6q6 5 12 0" fill="none" stroke="#b87659" strokeWidth="2" strokeLinecap="round"/>
    {id==='farmer'?<><path d="m26 25 4-16q18-9 36 0l4 16" fill="#ddbd79"/><ellipse cx="48" cy="28" rx="39" ry="7" fill="#e9cd8a"/><path d="M29 18q20 7 38 0v7H28Z" fill="#a56c48"/><path d="m26 81 17 10 22-11v8l-20 10-19-9" fill="#d2945b"/></>:id==='torin'?<><path d="M26 65q7 22 22 18 21 0 22-20l-13 8-9-5-8 5Z" fill={hair}/><path d="M26 30c0-27 45-27 45 0Z" fill="#b59a67"/><path d="M34 81v27h28V81l-8 9H42Z" fill="#725740"/></>:<><path d="M29 83v25h38V82L48 93Z" fill={id==='narin'?'#edd2a0':'#a9c6b1'}/>{id==='narin'?<><path d="M25 28q23-10 47 0" fill="none" stroke="#d7b371" strokeWidth="5"/><circle cx="72" cy="30" r="6" fill="#e8c878"/></>:<path d="m68 75 6 19 8-3-5-19" fill="#507c70"/>}</>}
    <rect x="1" y="1" width="94" height="106" rx="22" fill="none" stroke="#e7d4a5" strokeOpacity=".45" strokeWidth="2"/>
  </svg>;
}
