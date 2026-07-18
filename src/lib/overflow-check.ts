import type{CvData}from'../types/cv.js';
export function overflowWarnings(data:CvData){const warnings:string[]=[]; if(data.summary.length>430)warnings.push('Summary exceeds 430 characters.'); if(data.tools.length>14)warnings.push('Tool list exceeds 14 entries.'); return warnings}
