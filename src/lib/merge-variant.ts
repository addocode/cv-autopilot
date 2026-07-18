import type{CvData,Variant}from'../types/cv.js';
const score=(tags:string[],prio:string[])=>tags.reduce((n,t)=>n+(prio.includes(t)?1:0),0);
export function mergeVariant(data:CvData,variant:Variant):CvData{return{...data,competencies:[...data.competencies].sort((a,b)=>score(b.tags,variant.priorityTags)-score(a.tags,variant.priorityTags)),experiences:[...data.experiences].sort((a,b)=>score(b.tags,variant.priorityTags)-score(a.tags,variant.priorityTags))}}
