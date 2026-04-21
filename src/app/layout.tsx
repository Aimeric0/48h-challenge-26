import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ColorThemeProvider } from "@/components/providers/color-theme-provider";
import { CookieConsent } from "@/components/providers/cookie-consent";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Plateforme de gestion de projet gamifiée",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('color-theme');if(t&&t!=='default')document.documentElement.setAttribute('data-color-theme',t);if(t==='custom'){var raw=localStorage.getItem('custom-theme-colors');if(raw){var c=JSON.parse(raw);function h(hex){var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;var max=Math.max(r,g,b),min=Math.min(r,g,b),h,s,l=(max+min)/2;if(max===min){h=s=0;}else{var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;default:h=((r-g)/d+4)/6;}}return Math.round(h*360)+' '+Math.round(s*100)+'% '+Math.round(l*100)+'%';}function fg(hex){var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;var f=function(v){return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return(0.2126*f(r)+0.7152*f(g)+0.0722*f(b))>0.179?'0 0% 0%':'0 0% 100%';}function tl(hex){return h(hex).split(' ')[0]+' 12% 95%';}function td(hex){return h(hex).split(' ')[0]+' 10% 16%';}var css='[data-color-theme="custom"]{--primary:'+h(c.primary)+';--primary-foreground:'+fg(c.primary)+';--secondary:'+tl(c.secondary)+';--secondary-foreground:'+fg(c.secondary)+';--muted:'+tl(c.secondary)+';--muted-foreground:'+h(c.secondary).split(' ')[0]+' 10% 44%;--accent:'+tl(c.accent)+';--accent-foreground:'+fg(c.accent)+';--border:'+h(c.primary).split(' ')[0]+' 12% 88%;--input:'+h(c.primary).split(' ')[0]+' 12% 88%;--ring:'+h(c.primary)+'}''+'.dark[data-color-theme="custom"]{--primary:'+h(c.primary)+';--primary-foreground:'+fg(c.primary)+';--secondary:'+td(c.secondary)+';--secondary-foreground:0 0% 98%;--muted:'+td(c.secondary)+';--muted-foreground:'+h(c.secondary).split(' ')[0]+' 12% 64%;--accent:'+td(c.accent)+';--accent-foreground:0 0% 98%;--border:'+h(c.primary).split(' ')[0]+' 10% 18%;--input:'+h(c.primary).split(' ')[0]+' 10% 18%;--ring:'+h(c.primary)+'}';var el=document.createElement('style');el.id='custom-theme-style';el.textContent=css;document.head.appendChild(el);}}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
            {children}
            <CookieConsent />
            <Toaster richColors position="bottom-right" />
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
