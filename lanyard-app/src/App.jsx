import React, { useState, useEffect } from 'react'
import Lanyard from './Lanyard'
import idCard from './id_card.png'
import backCard from './back_card.png'
import bandCb from './band_cb.png'

export default function App() {
  const [cameraZ, setCameraZ] = useState(17);

  useEffect(() => {
    const handleResize = () => {
      // Adjust camera distance based on screen width
      if (window.innerWidth < 900) {
        setCameraZ(22); // Zoom out for iPad/small screens
      } else if (window.innerWidth < 1200) {
        setCameraZ(19); // Medium zoom
      } else {
        setCameraZ(17); // Zoomed in for large desktop
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, background: 'transparent' }}>
      <Lanyard
        position={[0, 0, cameraZ]}
        gravity={[0, -40, 0]}
        frontImage={idCard}
        backImage={backCard}
        lanyardImage={bandCb}
        imageFit="cover"
        lanyardWidth={1}
      />
    </div>
  )
}
