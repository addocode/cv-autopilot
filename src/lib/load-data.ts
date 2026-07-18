import {readFileSync} from 'node:fs';import type{CvData,Variant}from'../types/cv.js';
export function loadCvData():CvData{return JSON.parse(readFileSync('data/private/cv.master.json','utf8'))}
export function loadVariant(id='general'):Variant{return JSON.parse(readFileSync(`data/public/variants/${id}.json`,'utf8'))}
