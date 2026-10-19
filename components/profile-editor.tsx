"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";

type Props={name:string;email:string;phone:string};
export function ProfileEditor({name:initialName,email,phone:initialPhone}:Props){
 const router=useRouter();
 const [saved,setSaved]=useState({name:initialName,phone:initialPhone});
 const [name,setName]=useState(initialName);
 const [phone,setPhone]=useState(initialPhone);
 const [editing,setEditing]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");

 // Keep customer profile in sync after navigation/server refresh.
 useEffect(()=>{
  setSaved({name:initialName,phone:initialPhone});
  setName(initialName);setPhone(initialPhone);
 },[initialName,initialPhone]);

 function cancel(){
  setName(saved.name);setPhone(saved.phone);setEditing(false);setError("");
 }
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const res=await fetch("/api/account/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name.trim(),phone}),cache:"no-store"});
   const data=await res.json().catch(()=>null) as {error?:string;profile?:{name:string;phone:string|null}}|null;
   if(!res.ok||!data?.profile)throw new Error(data?.error||"Could not update profile");
   const next={name:data.profile.name,phone:data.profile.phone??""};
   setSaved(next);setName(next.name);setPhone(next.phone);
   setEditing(false);setNotice("Your profile was updated successfully.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Update failed");}
  finally{setBusy(false);}
 }
 return <section className="account-panel" id="profile">
  <div className="panel-heading"><div><span className="eyebrow">YOUR PERSONAL INFORMATION</span><h2>MY PROFILE</h2></div>
   <button type="button" className="account-outline-btn" disabled={busy} onClick={()=>{if(editing)cancel();else{setNotice("");setEditing(true);}}}>{editing?"Cancel":"✎ Edit Profile"}</button>
  </div>
  {editing?
   <form className="account-edit-form" onSubmit={save}>
    <label>Full name<input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Mobile number (+91)<input type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national" placeholder="10-digit mobile" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))}/></label>
    <label>Email address<input type="email" value={email} disabled readOnly/></label>
    <p className="profile-note">Email address is read-only for account security. Mobile number is optional.</p>
    {error&&<p role="alert" className="error">{error}</p>}
    <button type="submit" className="btn dark" disabled={busy}>{busy?"SAVING...":"SAVE PROFILE"}</button>
   </form>:
   <div className="profile-details">
    <div><small>FULL NAME</small><strong>{saved.name}</strong></div>
    <div><small>EMAIL ADDRESS</small><strong>{email}</strong></div>
    <div><small>PHONE NUMBER</small><strong>{saved.phone?"+91 "+saved.phone:"Not added"}</strong></div>
   </div>}
  {notice&&<p role="status" className="admin-notice">{notice}</p>}
 </section>;
}
