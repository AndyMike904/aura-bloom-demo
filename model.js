export const servicesSeed = [
 {id:'s1',name:'Corte de Autor & Styling',category:'Cabello',duration:45,price:75000,description:'Diagnóstico capilar, lavado relajante y acabado personalizado.',photo:'s1.jpg'},
 {id:'s2',name:'Balayage Premium & Tonalización',category:'Color',duration:180,price:260000,description:'Técnicas de aclarado suave y matiz personalizado con protección.',photo:'s2.jpg'},
 {id:'s3',name:'Tratamiento Olaplex / Hidratación',category:'Terapia capilar',duration:60,price:110000,description:'Reconstrucción capilar intensiva y nutrición profunda.',photo:'s3.jpg'},
 {id:'s4',name:'Manicura Rusa Combinada',category:'Nail spa',duration:75,price:65000,description:'Cuidado de cutícula y esmaltado semipermanente.',photo:'s4.jpg'}
];
export const professionalsSeed = [
 {id:'p1',name:'Valentina',specialty:'Corte y color',serviceIds:'s1,s2,s3'},
 {id:'p2',name:'Camila',specialty:'Especialista en uñas',serviceIds:'s4'}
];
export const roles = {client:'Cliente',professional:'Profesional',admin:'Administración',tech:'Soporte técnico'};
export const dateKey = (date=new Date()) => {
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const val=k=>p.find(x=>x.type===k).value;return `${val('year')}-${val('month')}-${val('day')}`;
};
export const timeLabel = iso=>new Intl.DateTimeFormat('es-CO',{timeZone:'America/Bogota',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(iso));
export const dateLabel = iso=>new Intl.DateTimeFormat('es-CO',{timeZone:'America/Bogota',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(iso));
export const money = n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
export const overlap = (start,end,s,e)=>new Date(start)<new Date(e)&&new Date(end)>new Date(s);
export function nextBusinessDay(now=new Date()){
 const d=new Date(`${dateKey(now)}T12:00:00-05:00`);d.setUTCDate(d.getUTCDate()+1);if(d.getUTCDay()===0)d.setUTCDate(d.getUTCDate()+1);return dateKey(d);
}
export class DemoStore {
 constructor(storage,now=()=>new Date()){this.storage=storage;this.now=now;this.load();}
 load(){
  let saved;try{saved=JSON.parse(this.storage.getItem('aura-bloom-demo-v1'));}catch{saved=null;}
  this.state=saved?.version===1?saved:{version:1,services:structuredClone(servicesSeed),professionals:structuredClone(professionalsSeed),appointments:[],blocks:[],audit:[],settings:{openHour:9,closeHour:18,minLeadHours:2,cancelHours:4,slotMinutes:15,maintenance:false}};
 }
 save(){this.storage.setItem('aura-bloom-demo-v1',JSON.stringify(this.state));}
 user(role){return {id:role==='client'?'demo-client':`demo-${role}`,name:role==='client'?'Mariana':'Equipo Aura',role,professionalId:role==='professional'?'p1':''};}
 bootstrap(role){const u=this.user(role);return {...this.state,user:u,appointments:this.state.appointments.filter(a=>role==='admin'||(role==='professional'?a.professionalId===u.professionalId:role==='client'&&a.clientId===u.id)),blocks:this.state.blocks.filter(b=>role==='admin'||role==='professional'&&b.professionalId===u.professionalId),users:role==='admin'?[this.user('client')]:[]};}
 available(serviceId,professionalId,date,ignoreId){
  const service=this.state.services.find(s=>s.id===serviceId&&s.active!==false),p=this.state.professionals.find(p=>p.id===professionalId&&p.active!==false);
  if(!service||!p||!p.serviceIds.split(',').includes(serviceId))return [];
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return [];
  const day=new Date(`${date}T12:00:00-05:00`);if(!Number.isFinite(+day)||day.getUTCDay()===0)return [];
  const cfg=this.state.settings,result=[];
  for(let m=cfg.openHour*60;m+service.duration<=cfg.closeHour*60;m+=cfg.slotMinutes){
   const start=new Date(`${date}T${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:00-05:00`),end=new Date(+start+service.duration*60000);
   if(+start<+this.now()+cfg.minLeadHours*3600000)continue;
   if(this.state.appointments.some(a=>a.id!==ignoreId&&a.professionalId===professionalId&&a.status!=='cancelada'&&overlap(start,end,a.start,a.end)))continue;
   if(this.state.blocks.some(b=>b.professionalId===professionalId&&overlap(start,end,b.start,b.end)))continue;
   result.push(start.toISOString());
  }return result;
 }
 log(action,id){this.state.audit.push({at:this.now().toISOString(),action,entityId:id});this.state.audit=this.state.audit.slice(-100);this.save();}
 book(role,b){
  if(!['client','professional','admin'].includes(role))throw Error('Este perfil no puede crear citas.');
  const prior=this.state.appointments.find(a=>a.requestId===b.requestId);if(prior)return prior;
  if(role==='professional'&&b.professionalId!=='p1')throw Error('Solo puedes reservar en tu agenda.');
  if(!this.available(b.serviceId,b.professionalId,dateKey(new Date(b.start))).includes(b.start))throw Error('Ese horario ya no está disponible. Elige otro.');
  const s=this.state.services.find(s=>s.id===b.serviceId),id=b.requestId;
  const a={id,requestId:id,serviceId:s.id,serviceName:s.name,professionalId:b.professionalId,clientId:'demo-client',clientName:'Mariana',start:b.start,end:new Date(+new Date(b.start)+s.duration*60000).toISOString(),status:'confirmada',price:s.price};
  this.state.appointments.push(a);this.log('Reserva creada',id);return a;
 }
 editable(role,id){const a=this.state.appointments.find(a=>a.id===id);if(!a||role==='tech'||role==='professional'&&a.professionalId!=='p1')throw Error('Sin permiso para modificar esta cita.');if(!['confirmada','pendiente'].includes(a.status))throw Error('Esta cita ya no admite cambios.');if(role==='client'&&+new Date(a.start)-+this.now()<this.state.settings.cancelHours*3600000)throw Error('El plazo para cambiar esta cita terminó. Contacta al negocio.');return a;}
 cancel(role,id){const a=this.editable(role,id);a.status='cancelada';this.log('Cita cancelada',id);}
 reschedule(role,id,start){const a=this.editable(role,id);if(!this.available(a.serviceId,a.professionalId,dateKey(new Date(start)),id).includes(start))throw Error('El nuevo horario ya no está disponible.');a.start=start;const s=this.state.services.find(s=>s.id===a.serviceId);a.end=new Date(+new Date(start)+s.duration*60000).toISOString();this.log('Cita reprogramada',id);}
 status(role,id,status){const a=this.state.appointments.find(a=>a.id===id);if(!a||!['admin','professional'].includes(role)||role==='professional'&&a.professionalId!=='p1')throw Error('Sin permiso.');const next={confirmada:['en_curso','no_asistio'],en_curso:['completada']};if(!next[a.status]?.includes(status))throw Error('Cambio de estado inválido.');if(this.now()<new Date(a.start))throw Error('La cita aún no comienza.');a.status=status;this.log('Estado: '+status,id);}
 block(role,b){if(!['admin','professional'].includes(role)||role==='professional'&&b.professionalId!=='p1')throw Error('Sin permiso.');if(!(new Date(b.start)>this.now()&&new Date(b.end)>new Date(b.start)))throw Error('Selecciona un intervalo futuro válido.');if(this.state.appointments.some(a=>a.professionalId===b.professionalId&&a.status!=='cancelada'&&overlap(b.start,b.end,a.start,a.end)))throw Error('Ya hay una cita en ese horario.');this.state.blocks.push(b);this.log('Horario bloqueado',b.id);}
 reset(){this.storage.removeItem('aura-bloom-demo-v1');this.load();}
}
