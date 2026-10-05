import { Composition } from 'remotion'
import { Annuncio } from './annuncio/Annuncio'
import { Venduto } from './venduto/Venduto'
import { loadFonts } from './lib/fonts'
import { FPS, H, VENDUTO, W, annuncioTiming } from './lib/timing'
import { annuncioSchema, vendutoSchema, type AnnuncioProps, type VendutoProps } from './schema'

loadFonts()

const agent = {
  name: 'Giulia Rossi',
  agency: 'Rossi Immobiliare',
  phone: '+39 333 123 4567',
  site: 'rossimmobiliare.it',
  color: '#537eec',
  logoUrl: 'demo/logo-rossi.svg',
}

const annuncioDefaults: AnnuncioProps = {
  style: 'vivace',
  contract: 'vendita',
  photos: [
    { src: 'demo/daynight2_day.jpg', staged: false },
    { src: 'demo/slider_v1_after.jpg', staged: true },
    { src: 'demo/slider_v4_after.jpg', staged: true },
    { src: 'demo/slider_v6_after.jpg', staged: false },
    { src: 'demo/sm_room_furnished.jpg', staged: true },
  ],
  title: 'Casale in pietra con giardino e vista colline',
  place: 'Greve in Chianti, Firenze',
  price: '340000',
  mq: '160',
  rooms: '5',
  agent,
}

const vendutoDefaults: VendutoProps = {
  style: 'vivace',
  contract: 'vendita',
  photo: { src: 'demo/villa1_finished.jpg', staged: false },
  place: 'Vomero, Napoli',
  days: '23',
  agent,
}

export const RemotionRoot = () => (
  <>
    <Composition
      id="Annuncio"
      component={Annuncio}
      schema={annuncioSchema}
      defaultProps={annuncioDefaults}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={annuncioTiming(annuncioDefaults.photos.length, 'vivace').total}
      calculateMetadata={({ props }) => ({ durationInFrames: annuncioTiming(props.photos.length, props.style).total })}
    />
    <Composition id="Venduto" component={Venduto} schema={vendutoSchema} defaultProps={vendutoDefaults} width={W} height={H} fps={FPS} durationInFrames={VENDUTO.total} />
  </>
)
