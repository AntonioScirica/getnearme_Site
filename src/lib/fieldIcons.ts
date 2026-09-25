import { Accessibility, Armchair, ArrowUpDown, Bath, BedDouble, Building, Building2, CalendarClock, Car, ConciergeBell, DoorOpen, Euro, FileSignature, Flame, Hash, Home, KeyRound, Layers, Leaf, MapPin, Maximize2, PlayCircle, Snowflake, Sprout, SquareStack, Thermometer, Trees, UtensilsCrossed, Warehouse, Wind, Zap, type LucideIcon } from 'lucide-react'

// Un'icona per ogni dato della scheda (tabella dei dettagli nei siti e nella piattaforma)
export const FIELD_ICONS: Record<string, LucideIcon> = {
  riferimento: Hash, tipologia: Home, contratto: FileSignature, indirizzo: MapPin, superficie: Maximize2, locali: DoorOpen,
  camere: BedDouble, bagni: Bath, piano: Layers, stato: Sprout, anno: CalendarClock, piani_edificio: Building2, ascensore: ArrowUpDown,
  proprieta: KeyRound, classe_energetica: Leaf, ipe: Zap, riscaldamento: Flame, alimentazione: Flame, emissione: Thermometer,
  climatizzazione: Snowflake, infissi: SquareStack, materiale_infissi: SquareStack, cucina: UtensilsCrossed, arredato: Armchair,
  esposizione: Wind, superficie_esterna: Trees, posto_auto: Car, cantina: Warehouse, spese_condominiali: Euro, portineria: ConciergeBell,
  accesso_disabili: Accessibility, disponibilita: CalendarClock, contratto_affitto: FileSignature, cauzione: Euro, spese_incluse: Euro,
  virtual_tour: PlayCircle,
}
export const iconFor = (key: string): LucideIcon => FIELD_ICONS[key] ?? Building
