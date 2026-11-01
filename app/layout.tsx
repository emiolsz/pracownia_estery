import type {Metadata} from 'next';
import './globals.css';
import ThemeSwitch from './theme-switch';
export const metadata:Metadata={title:'Pracownia Estery — Sny i synchroniczność',description:'Interpretator snów, osobisty dziennik i symboliczny język liczb.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pl"><head><link rel="stylesheet" href="/brand.css"/></head><body><ThemeSwitch/>{children}</body></html>}
