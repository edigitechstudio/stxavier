'use client';
import Script from 'next/script';
import { useConsent } from '@/lib/consent';

type Ids = { ga4: string; metaPixel: string; clarity: string };

/** Loads GA4, Meta Pixel and Microsoft Clarity only after the visitor accepts analytics cookies. */
export function Analytics({ ids }: { ids: Ids }) {
  const allowed = useConsent() === 'all';

  if (!allowed) return null;
  return (
    <>
      {ids.ga4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ids.ga4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ids.ga4}');`}
          </Script>
        </>
      )}
      {ids.metaPixel && (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${ids.metaPixel}');fbq('track','PageView');`}
        </Script>
      )}
      {ids.clarity && (
        <Script id="clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${ids.clarity}");`}
        </Script>
      )}
    </>
  );
}
