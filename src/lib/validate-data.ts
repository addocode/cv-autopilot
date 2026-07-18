import type{CvData}from'../types/cv.js';
export function validateData(data:CvData){const errors:string[]=[]; if(!data.person.name)errors.push('person.name missing'); if(!data.experiences.length)errors.push('experiences missing'); for(const e of data.experiences){if(e.bullets.length>4)errors.push(`${e.id} has too many bullets`)} return errors}
