"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";

export function ProfileEditor({name:initialName,email,phone:initialPhone}:{name:string;email:string;phone:string}){
 const router=useRouter();
 const [name,setName]=useState(initialName);
 const [phone,setPhone]=useState(initialPhone);
 const [editing,setEditing]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function save(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");setNotice("");
  try{
   const res=await fetch("/api/account/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,phone})});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data.error||"Could not update profile");
   setEditing(false);setNotice("Profile updated successfully.");router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Update failed");}
  finally{setBusy(false);}
 }
 return <section className="account-panel" id="profile">
  <div className="panel-heading"><div><span className="eyebrow">YOUR PERSONAL INFORMATION</span><h2>MY PROFILE</h2></div>
   <button type="button" className="account-outline-btn" onClick={()=>{setEditing(v=>!v);setError("");}}>{editing?"Cancel":"✎ Edit Profile"}</button>
  </div>
  {editing?
   <form className="account-edit-form" onSubmit={save}>
    <label>Full name<input required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Mobile number (+91)<input type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="10-digit mobile" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,""))}/></label>
    <label>Email address<input type="email" value={email} disabled readOnly/></label>
    <p className="profile-note">Email address is read-only for account security.</p>
    {error&&<p role="alert" className="error">{error}</p>}
    <button className="btn dark" disabled={busy}>{busy?"SAVING...":"SAVE PROFILE"}</button>
   </form>:
   <div className="profile-details">
    <div><small>FULL NAME</small><strong>{initialName}</strong></div>
    <div><small>EMAIL ADDRESS</small><strong>{email}</strong></div>
    <div><small>PHONE NUMBER</small><strong>{initialPhone?"+91 "+initialPhone:"Not added"}</strong></div>
   </div>}
  {notice&&<p role="status" className="admin-notice">{notice}</p>}
 </section>;
}
