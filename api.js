import {DemoStore,dateKey} from './model.js';

export class GoogleBridge {
 constructor(endpoint){
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(endpoint))throw Error('La dirección de Google no es válida.');
  this.endpoint=endpoint;this.channel=crypto.randomUUID();this.pending=new Map();this.ready=null;this.source=null;
  window.addEventListener('message',event=>{
   if(!/^https:\/\/([a-z0-9-]+-)?script\.googleusercontent\.com$/.test(event.origin)||event.data?.channel!==this.channel)return;
   if(event.data.type==='aura-ready'&&!this.source){this.source=event.source;this.targetOrigin=event.origin;this.ready?.();return;}
   if(event.source!==this.source||event.data.type!=='aura-result')return;
   const request=this.pending.get(event.data.id);if(!request)return;
   clearTimeout(request.timer);this.pending.delete(event.data.id);
   if(event.data.result?.ok)request.resolve(event.data.result.data);else request.reject(Error(event.data.result?.error||'No se pudo completar la operación.'));
  });
 }
 async connect(){
  if(this.source)return;
  if(!this.connection)this.connection=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.connection=null;this.frame?.remove();reject(Error('Google no respondió. Revisa el despliegue y WEB_ORIGIN.'));},30000);
   this.ready=()=>{clearTimeout(timer);resolve();};
   const frame=document.createElement('iframe');frame.hidden=true;frame.title='Conexión segura con Google';frame.src=`${this.endpoint}?bridge=${encodeURIComponent(this.channel)}`;document.body.append(frame);this.frame=frame;
  });
  return this.connection;
 }
 async call(body){await this.connect();const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Google está tardando. Actualiza tu agenda antes de repetir una reserva.'));},45000);this.pending.set(id,{resolve,reject,timer});this.source.postMessage({type:'aura-request',channel:this.channel,id,body},this.targetOrigin);});}
}
export class SalonApi {
 constructor(storage=localStorage,endpoint=globalThis.SALON_CONFIG?.apiUrl||''){
  this.demo=!endpoint;this.token=null;this.role=null;
  if(this.demo)this.store=new DemoStore(storage);else this.bridge=new GoogleBridge(endpoint);
 }
 async call(action,b={}){
  if(!this.demo){const result=await this.bridge.call({action,token:this.token,...b});if(action==='verifyOtp'){this.token=result.token;this.role=result.user.role;}if(action==='logout'||action==='deleteAccount'){this.token=null;this.role=null;}return result;}
  const invoke=()=>{this.store.load();return this.local(action,b);};
  if(globalThis.navigator?.locks)return navigator.locks.request('aura-bloom-demo',invoke);
  return invoke();
 }
 local(action,b){
  const store=this.store,u=store.user(this.role),state=store.state;
  switch(action){
   case 'bootstrap':{const result=store.bootstrap(this.role);result.services=result.services.filter(s=>s.active!==false);result.professionals=result.professionals.filter(p=>p.active!==false);return result;}
   case 'availability':return store.available(b.serviceId,b.professionalId,b.date,b.ignoreId);
   case 'book':return store.book(this.role,b);
   case 'reschedule':store.reschedule(this.role,b.id,b.start);return true;
   case 'cancel':store.cancel(this.role,b.id);return true;
   case 'status':store.status(this.role,b.id,b.status);return true;
   case 'block':store.block(this.role,b);return true;
   case 'unblock':state.blocks=state.blocks.filter(v=>v.id!==b.id);store.log('Bloqueo eliminado',b.id);return true;
   case 'saveService':{
    if(this.role!=='admin')throw Error('Solo administración puede gestionar servicios.');
    const s=b.service;if(s.name.trim().length<3||!Number.isFinite(s.price)||s.price<0||s.duration<15||s.duration>480)throw Error('Revisa nombre, precio y duración.');
    s.id ||= crypto.randomUUID();state.services=state.services.filter(v=>v.id!==s.id);state.services.push(s);store.log('Servicio actualizado',s.id);return s;
   }
   case 'saveProfessional':{
    if(this.role!=='admin')throw Error('Solo administración puede gestionar profesionales.');
    const p=b.professional;if(p.name.trim().length<2||!p.serviceIds)throw Error('Completa nombre y servicios.');
    p.id ||= crypto.randomUUID();state.professionals=state.professionals.filter(v=>v.id!==p.id);state.professionals.push(p);store.log('Profesional actualizado',p.id);return p;
   }
   case 'saveSettings':{
    if(this.role!=='admin')throw Error('Sin permiso.');const s={...state.settings,...b.settings};
    if(s.openHour<0||s.closeHour>23||s.openHour>=s.closeHour||s.cancelHours<0||s.minLeadHours<0)throw Error('Revisa los horarios y las políticas.');state.settings=s;store.log('Políticas actualizadas','settings');return s;
   }
   case 'maintenance':state.settings.maintenance=b.enabled;store.log('Modo mantenimiento','settings');return true;
   case 'diagnostics':case 'retrySync':return {sheets:false,calendars:[],pending:0,audit:state.audit,emailQuota:0,demo:true};
   case 'reset':store.reset();return true;
   case 'logout':this.role=null;return true;
   case 'deleteAccount':state.appointments=state.appointments.map(a=>a.clientId===u.id?{...a,status:'cancelada'}:a);store.log('Perfil de prueba eliminado','demo-client');this.role=null;return true;
   default:throw Error('Operación no disponible en la demostración.');
  }
 }
}
