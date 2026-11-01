 'use client';
import {useEffect,useState} from 'react';
type Theme='ivory'|'navy';
export default function ThemeSwitch(){
 const [theme,setTheme]=useState<Theme>('ivory');
 useEffect(()=>{try{const saved=localStorage.getItem('estera.homeTheme.v1');if(saved==='navy'){setTheme('navy');document.documentElement.dataset.homeTheme='navy';}else document.documentElement.dataset.homeTheme='ivory';}catch{document.documentElement.dataset.homeTheme='ivory';}},[]);
 function choose(next:Theme){setTheme(next);document.documentElement.dataset.homeTheme=next;try{localStorage.setItem('estera.homeTheme.v1',next);}catch{}}
 return <div className="home-theme-switch site-theme-switch" role="group" aria-label="Kolor strony"><button type="button" aria-pressed={theme==='ivory'} onClick={()=>choose('ivory')}><span className="theme-dot ivory" aria-hidden="true"/>Kość słoniowa</button><button type="button" aria-pressed={theme==='navy'} onClick={()=>choose('navy')}><span className="theme-dot navy" aria-hidden="true"/>Granat</button></div>;
}
