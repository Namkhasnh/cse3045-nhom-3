export const notificationZone='Asia/Ho_Chi_Minh'
const day=(date:Date)=>date.toLocaleDateString('en-CA',{timeZone:notificationZone})
export function noticeGroup(created:string,now=new Date()){
 const date=new Date(created),yesterday=new Date(now.getTime()-86400000)
 return day(date)===day(now)?'Hôm nay':day(date)===day(yesterday)?'Hôm qua':'Trước đó'
}
export function noticeTime(created:string,now=new Date()){
 const date=new Date(created),minutes=Math.max(0,Math.floor((now.getTime()-date.getTime())/60000))
 if(minutes<1)return 'Vừa xong'
 if(minutes<60)return minutes+' phút trước'
 if(minutes<1440)return Math.floor(minutes/60)+' giờ trước'
 return date.toLocaleString('vi-VN',{timeZone:notificationZone,dateStyle:'short',timeStyle:'short'})
}
