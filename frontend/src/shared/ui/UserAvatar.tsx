import {useState} from 'react'
import {initials} from '../lib/initials'
export function UserAvatar({name,source}:{name:string;source?:string|null}){
 const [failed,setFailed]=useState<string|null>(null)
 return source&&failed!==source?<img className="user-avatar-image" src={source} alt="" onError={()=>setFailed(source)} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit'}}/>:<>{initials(name)}</>
}
