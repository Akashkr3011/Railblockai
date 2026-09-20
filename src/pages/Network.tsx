import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polyline, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Radio,
  Layers,
  Train,
  Wrench,
  Navigation,
  MapPin,
  ShieldCheck,
  Zap,
  Globe2,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HardHat,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import L from 'leaflet'

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Helper component to change map viewport dynamically
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  map.setView(center, zoom, { animate: true })
  return null
}

// Major All-India National Railway Hubs & Junctions
interface StationNode {
  id: string
  code: string
  name: string
  zone: string
  coords: [number, number]
  type: 'TERMINUS' | 'MAJOR_JUNCTION' | 'DIVISION_HQ' | 'DFC_HUB'
  platforms: number
  kavach: boolean
  dailyTrains: number
  activeBlocks: number
  liveTrains: { number: string; name: string; status: string; delay: number }[]
}

const ALL_INDIA_STATIONS: StationNode[] = [
  // Northern Railway / NCR
  {
    id: 'NDLS',
    code: 'NDLS',
    name: 'New Delhi Railway Station',
    zone: 'NR',
    coords: [28.6143, 77.2090],
    type: 'TERMINUS',
    platforms: 16,
    kavach: true,
    dailyTrains: 340,
    activeBlocks: 1,
    liveTrains: [
      { number: '22436', name: 'Vande Bharat Express (NDLS-BSB)', status: 'DEPARTED_ON_TIME', delay: 0 },
      { number: '12302', name: 'Kolkata Rajdhani Express', status: 'BERTHED', delay: 0 },
      { number: '12952', name: 'Mumbai Rajdhani Express', status: 'PREPPING', delay: 0 },
    ],
  },
  {
    id: 'CNB',
    code: 'CNB',
    name: 'Kanpur Central Junction',
    zone: 'NCR',
    coords: [26.4547, 80.3507],
    type: 'MAJOR_JUNCTION',
    platforms: 10,
    kavach: true,
    dailyTrains: 280,
    activeBlocks: 1,
    liveTrains: [
      { number: '12301', name: 'Howrah Rajdhani', status: 'THROUGH', delay: 4 },
      { number: '12565', name: 'Bihar Sampark Kranti', status: 'HALTED_PF1', delay: 12 },
    ],
  },
  {
    id: 'PRYJ',
    code: 'PRYJ',
    name: 'Prayagraj Junction',
    zone: 'NCR',
    coords: [25.4358, 81.8463],
    type: 'DIVISION_HQ',
    platforms: 10,
    kavach: true,
    dailyTrains: 220,
    activeBlocks: 0,
    liveTrains: [
      { number: '22436', name: 'Vande Bharat Express', status: 'APPROACHING_OUTER', delay: 2 },
    ],
  },
  {
    id: 'BSB',
    code: 'BSB',
    name: 'Varanasi Junction (Cantonment)',
    zone: 'NR',
    coords: [25.3284, 82.9892],
    type: 'TERMINUS',
    platforms: 9,
    kavach: true,
    dailyTrains: 190,
    activeBlocks: 0,
    liveTrains: [
      { number: '22435', name: 'Vande Bharat (BSB-NDLS)', status: 'READY_PF1', delay: 0 },
    ],
  },
  {
    id: 'LKO',
    code: 'LKO',
    name: 'Lucknow Charbagh Junction',
    zone: 'NR',
    coords: [26.8322, 80.9220],
    type: 'DIVISION_HQ',
    platforms: 9,
    kavach: false,
    dailyTrains: 180,
    activeBlocks: 1,
    liveTrains: [
      { number: '12004', name: 'Lucknow Shatabdi', status: 'HALTED', delay: 0 },
    ],
  },

  // Western Railway / WCR
  {
    id: 'MMCT',
    code: 'MMCT',
    name: 'Mumbai Central Terminus',
    zone: 'WR',
    coords: [18.9696, 72.8193],
    type: 'TERMINUS',
    platforms: 9,
    kavach: true,
    dailyTrains: 210,
    activeBlocks: 0,
    liveTrains: [
      { number: '12951', name: 'Tejas Rajdhani Express', status: 'ARRIVED', delay: 0 },
      { number: '20901', name: 'Vande Bharat (MMCT-GIMB)', status: 'BERTHED_PF1', delay: 0 },
    ],
  },
  {
    id: 'ST',
    code: 'ST',
    name: 'Surat Junction',
    zone: 'WR',
    coords: [21.2050, 72.8407],
    type: 'MAJOR_JUNCTION',
    platforms: 6,
    kavach: true,
    dailyTrains: 260,
    activeBlocks: 1,
    liveTrains: [
      { number: '12952', name: 'Mumbai Rajdhani', status: 'IN_TRANSIT', delay: 3 },
    ],
  },
  {
    id: 'BRC',
    code: 'BRC',
    name: 'Vadodara Junction',
    zone: 'WR',
    coords: [22.3107, 73.1812],
    type: 'DIVISION_HQ',
    platforms: 7,
    kavach: true,
    dailyTrains: 290,
    activeBlocks: 0,
    liveTrains: [
      { number: '20901', name: 'Vande Bharat Express', status: 'ARRIVING', delay: 0 },
    ],
  },
  {
    id: 'ADI',
    code: 'ADI',
    name: 'Ahmedabad Junction (Kalupur)',
    zone: 'WR',
    coords: [23.0225, 72.6006],
    type: 'TERMINUS',
    platforms: 12,
    kavach: true,
    dailyTrains: 240,
    activeBlocks: 0,
    liveTrains: [
      { number: '20901', name: 'Vande Bharat Express', status: 'DESTINATION', delay: 0 },
    ],
  },
  {
    id: 'KOTA',
    code: 'KOTA',
    name: 'Kota Junction',
    zone: 'WCR',
    coords: [25.2138, 75.8648],
    type: 'DIVISION_HQ',
    platforms: 6,
    kavach: true,
    dailyTrains: 210,
    activeBlocks: 1,
    liveTrains: [
      { number: '12952', name: 'Mumbai Rajdhani', status: 'SPEED_130KMH', delay: 0 },
    ],
  },

  // Central Railway
  {
    id: 'CSMT',
    code: 'CSMT',
    name: 'Chhatrapati Shivaji Maharaj Terminus (HQ)',
    zone: 'CR',
    coords: [18.9400, 72.8354],
    type: 'TERMINUS',
    platforms: 18,
    kavach: true,
    dailyTrains: 520,
    activeBlocks: 1,
    liveTrains: [
      { number: '22223', name: 'Vande Bharat (CSMT-SNSI)', status: 'BERTHED', delay: 0 },
      { number: '12123', name: 'Deccan Queen Express', status: 'BOARDING', delay: 0 },
      { number: '12809', name: 'Mumbai-Howrah Mail', status: 'PREPARING', delay: 5 },
    ],
  },
  {
    id: 'KYN',
    code: 'KYN',
    name: 'Kalyan Junction',
    zone: 'CR',
    coords: [19.2437, 73.1355],
    type: 'MAJOR_JUNCTION',
    platforms: 8,
    kavach: true,
    dailyTrains: 460,
    activeBlocks: 1,
    liveTrains: [
      { number: '12123', name: 'Deccan Queen', status: 'APPROACHING_PF4', delay: 0 },
      { number: '12809', name: 'Howrah Mail', status: 'SCHEDULED', delay: 5 },
    ],
  },
  {
    id: 'PUNE',
    code: 'PUNE',
    name: 'Pune Junction',
    zone: 'CR',
    coords: [18.5284, 73.8739],
    type: 'DIVISION_HQ',
    platforms: 6,
    kavach: true,
    dailyTrains: 230,
    activeBlocks: 0,
    liveTrains: [
      { number: '12124', name: 'Deccan Queen (PUNE-CSMT)', status: 'STABLE_YARD', delay: 0 },
      { number: '20608', name: 'Vande Bharat Express', status: 'READY', delay: 0 },
    ],
  },
  {
    id: 'BSL',
    code: 'BSL',
    name: 'Bhusawal Junction',
    zone: 'CR',
    coords: [21.0478, 75.7950],
    type: 'DIVISION_HQ',
    platforms: 8,
    kavach: true,
    dailyTrains: 270,
    activeBlocks: 1,
    liveTrains: [
      { number: '12809', name: 'Mumbai-Howrah Mail', status: 'IN_TRANSIT', delay: 10 },
    ],
  },
  {
    id: 'NGP',
    code: 'NGP',
    name: 'Nagpur Junction (Diamond Crossing)',
    zone: 'CR',
    coords: [21.1528, 79.0882],
    type: 'MAJOR_JUNCTION',
    platforms: 8,
    kavach: true,
    dailyTrains: 310,
    activeBlocks: 1,
    liveTrains: [
      { number: '12615', name: 'Grand Trunk Express', status: 'THROUGH', delay: 15 },
      { number: '20825', name: 'Vande Bharat (BSP-NGP)', status: 'PF1_ARRIVED', delay: 0 },
    ],
  },

  // Eastern & South Eastern & ECR
  {
    id: 'HWH',
    code: 'HWH',
    name: 'Howrah Junction (Kolkata HQ)',
    zone: 'ER',
    coords: [22.5839, 88.3426],
    type: 'TERMINUS',
    platforms: 23,
    kavach: true,
    dailyTrains: 480,
    activeBlocks: 1,
    liveTrains: [
      { number: '12301', name: 'Howrah-New Delhi Rajdhani', status: 'DEPARTED_ON_TIME', delay: 0 },
      { number: '22301', name: 'Vande Bharat (HWH-NJP)', status: 'IN_RUN', delay: 0 },
      { number: '12841', name: 'Coromandel Express', status: 'BERTHED', delay: 0 },
    ],
  },
  {
    id: 'ASN',
    code: 'ASN',
    name: 'Asansol Junction',
    zone: 'ER',
    coords: [23.6871, 86.9746],
    type: 'DIVISION_HQ',
    platforms: 7,
    kavach: true,
    dailyTrains: 230,
    activeBlocks: 1,
    liveTrains: [
      { number: '12301', name: 'Howrah Rajdhani', status: 'PASSING_FAST', delay: 0 },
    ],
  },
  {
    id: 'DDU',
    code: 'DDU',
    name: 'Pt. Deen Dayal Upadhyaya Junction (Mughalsarai)',
    zone: 'ECR',
    coords: [25.2798, 83.1190],
    type: 'MAJOR_JUNCTION',
    platforms: 8,
    kavach: true,
    dailyTrains: 360,
    activeBlocks: 2,
    liveTrains: [
      { number: '12301', name: 'Howrah Rajdhani', status: 'CREW_CHANGE', delay: 0 },
      { number: 'DFC-BOXN-902', name: 'Heavy-Haul Coal Rake', status: 'DFC_PASS', delay: 0 },
    ],
  },
  {
    id: 'PNBE',
    code: 'PNBE',
    name: 'Patna Junction',
    zone: 'ECR',
    coords: [25.6022, 85.1376],
    type: 'DIVISION_HQ',
    platforms: 10,
    kavach: false,
    dailyTrains: 250,
    activeBlocks: 1,
    liveTrains: [
      { number: '22347', name: 'Vande Bharat (PNBE-HWH)', status: 'BOARDING', delay: 0 },
    ],
  },
  {
    id: 'TATA',
    code: 'TATA',
    name: 'Tatanagar Junction',
    zone: 'SER',
    coords: [22.7667, 86.2029],
    type: 'DIVISION_HQ',
    platforms: 6,
    kavach: true,
    dailyTrains: 170,
    activeBlocks: 1,
    liveTrains: [
      { number: '12809', name: 'Howrah Mail', status: 'APPROACHING', delay: 8 },
    ],
  },

  // Southern & South Central & SWR
  {
    id: 'MAS',
    code: 'MAS',
    name: 'MGR Chennai Central (HQ)',
    zone: 'SR',
    coords: [13.0827, 80.2707],
    type: 'TERMINUS',
    platforms: 17,
    kavach: true,
    dailyTrains: 310,
    activeBlocks: 1,
    liveTrains: [
      { number: '20607', name: 'Vande Bharat (MAS-MYS)', status: 'DEPARTED', delay: 0 },
      { number: '12615', name: 'Grand Trunk Express', status: 'BERTHED', delay: 0 },
      { number: '12842', name: 'Coromandel Express', status: 'APPROACHING', delay: 10 },
    ],
  },
  {
    id: 'BZA',
    code: 'BZA',
    name: 'Vijayawada Junction',
    zone: 'SCR',
    coords: [16.5186, 80.6200],
    type: 'MAJOR_JUNCTION',
    platforms: 10,
    kavach: true,
    dailyTrains: 330,
    activeBlocks: 1,
    liveTrains: [
      { number: '12841', name: 'Coromandel Express', status: 'HALTED_PF1', delay: 5 },
      { number: '12615', name: 'Grand Trunk Express', status: 'APPROACHING', delay: 12 },
    ],
  },
  {
    id: 'SC',
    code: 'SC',
    name: 'Secunderabad Junction (HQ)',
    zone: 'SCR',
    coords: [17.4344, 78.5011],
    type: 'DIVISION_HQ',
    platforms: 10,
    kavach: true,
    dailyTrains: 260,
    activeBlocks: 0,
    liveTrains: [
      { number: '20701', name: 'Vande Bharat (SC-TPTY)', status: 'READY_PF10', delay: 0 },
    ],
  },
  {
    id: 'SBC',
    code: 'SBC',
    name: 'KSR Bengaluru City Junction',
    zone: 'SWR',
    coords: [12.9784, 77.5694],
    type: 'TERMINUS',
    platforms: 10,
    kavach: true,
    dailyTrains: 220,
    activeBlocks: 0,
    liveTrains: [
      { number: '20607', name: 'Vande Bharat Express', status: 'HALTED_PF7', delay: 0 },
      { number: '12627', name: 'Karnataka Express', status: 'IN_TRANSIT', delay: 15 },
    ],
  },

  // East Coast Railway
  {
    id: 'BBS',
    code: 'BBS',
    name: 'Bhubaneswar Railway Station (HQ)',
    zone: 'ECoR',
    coords: [20.2644, 85.8436],
    type: 'DIVISION_HQ',
    platforms: 6,
    kavach: true,
    dailyTrains: 190,
    activeBlocks: 1,
    liveTrains: [
      { number: '22895', name: 'Vande Bharat (HWH-PURI)', status: 'TRANSITING', delay: 0 },
      { number: '12841', name: 'Coromandel Express', status: 'SCHEDULED', delay: 5 },
    ],
  },
  {
    id: 'VSKP',
    code: 'VSKP',
    name: 'Visakhapatnam Junction',
    zone: 'ECoR',
    coords: [17.7215, 83.2872],
    type: 'DIVISION_HQ',
    platforms: 8,
    kavach: true,
    dailyTrains: 210,
    activeBlocks: 1,
    liveTrains: [
      { number: '20833', name: 'Vande Bharat (VSKP-SC)', status: 'BOARDING', delay: 0 },
    ],
  },

  // DFCCIL Heavy-Haul Freight Terminals
  {
    id: 'DFC_DADRI',
    code: 'DDRI',
    name: 'Dadri WDFC Freight Terminal (DFCCIL)',
    zone: 'DFCCIL',
    coords: [28.5520, 77.5540],
    type: 'DFC_HUB',
    platforms: 4,
    kavach: true,
    dailyTrains: 110,
    activeBlocks: 0,
    liveTrains: [
      { number: 'DFC-CONT-101', name: 'Double-Stack Container Express (Dadri-Mundra)', status: 'RUNNING_100KMH', delay: 0 },
    ],
  },
  {
    id: 'DFC_JNPT',
    code: 'JNPT',
    name: 'JNPT Port DFC Terminal (Navi Mumbai)',
    zone: 'DFCCIL',
    coords: [18.9500, 72.9500],
    type: 'DFC_HUB',
    platforms: 4,
    kavach: true,
    dailyTrains: 95,
    activeBlocks: 0,
    liveTrains: [
      { number: 'DFC-CONT-102', name: 'Heavy Haul Maritime Rake', status: 'UNLOADING', delay: 0 },
    ],
  },
]

// National Corridors with Polyline Coordinates
interface NationalCorridorLine {
  id: string
  name: string
  code: string
  distance_km: number
  zones_traversed: string[]
  color: string
  coordinates: [number, number][]
  activeBlocksCount: number
  status: 'NORMAL' | 'MAINTENANCE_WINDOW' | 'CAUTION_ORDER'
}

const NATIONAL_CORRIDORS: NationalCorridorLine[] = [
  {
    id: 'NDLS-HWH-CORR',
    name: 'Golden Quadrilateral: New Delhi — Howrah (Grand Chord)',
    code: 'NDLS-HWH',
    distance_km: 1450,
    zones_traversed: ['NR', 'NCR', 'ECR', 'ER'],
    color: '#0B2545', // Deep Navy
    status: 'MAINTENANCE_WINDOW',
    activeBlocksCount: 2,
    coordinates: [
      [28.6143, 77.2090], // NDLS
      [26.4547, 80.3507], // CNB
      [25.4358, 81.8463], // PRYJ
      [25.2798, 83.1190], // DDU
      [23.6871, 86.9746], // ASN
      [22.5839, 88.3426], // HWH
    ],
  },
  {
    id: 'NDLS-MMCT-CORR',
    name: 'Golden Quadrilateral: New Delhi — Mumbai Western Trunk',
    code: 'NDLS-MMCT',
    distance_km: 1384,
    zones_traversed: ['NR', 'WCR', 'WR'],
    color: '#134074', // Blue
    status: 'NORMAL',
    activeBlocksCount: 1,
    coordinates: [
      [28.6143, 77.2090], // NDLS
      [25.2138, 75.8648], // KOTA
      [23.0225, 72.6006], // ADI
      [22.3107, 73.1812], // BRC
      [21.2050, 72.8407], // ST
      [18.9696, 72.8193], // MMCT
    ],
  },
  {
    id: 'NDLS-MAS-CORR',
    name: 'Grand Trunk Corridor: New Delhi — Chennai Central',
    code: 'NDLS-MAS',
    distance_km: 2182,
    zones_traversed: ['NR', 'NCR', 'WCR', 'CR', 'SCR', 'SR'],
    color: '#7C3AED', // Violet
    status: 'CAUTION_ORDER',
    activeBlocksCount: 3,
    coordinates: [
      [28.6143, 77.2090], // NDLS
      [26.4547, 80.3507], // CNB
      [21.1528, 79.0882], // NGP
      [16.5186, 80.6200], // BZA
      [13.0827, 80.2707], // MAS
    ],
  },
  {
    id: 'HWH-MAS-CORR',
    name: 'East Coast Corridor: Howrah — Chennai Central',
    code: 'HWH-MAS',
    distance_km: 1659,
    zones_traversed: ['ER', 'SER', 'ECoR', 'SCR', 'SR'],
    color: '#0D9488', // Teal
    status: 'NORMAL',
    activeBlocksCount: 1,
    coordinates: [
      [22.5839, 88.3426], // HWH
      [20.2644, 85.8436], // BBS
      [17.7215, 83.2872], // VSKP
      [16.5186, 80.6200], // BZA
      [13.0827, 80.2707], // MAS
    ],
  },
  {
    id: 'CSMT-HWH-CORR',
    name: 'Central Trans-Continental: Mumbai CSMT — Howrah',
    code: 'CSMT-HWH',
    distance_km: 1968,
    zones_traversed: ['CR', 'SECR', 'SER', 'ER'],
    color: '#C2410C', // Rust Orange
    status: 'MAINTENANCE_WINDOW',
    activeBlocksCount: 2,
    coordinates: [
      [18.9400, 72.8354], // CSMT
      [19.2437, 73.1355], // KYN
      [21.0478, 75.7950], // BSL
      [21.1528, 79.0882], // NGP
      [22.7667, 86.2029], // TATA
      [22.5839, 88.3426], // HWH
    ],
  },
  {
    id: 'CSMT-MAS-CORR',
    name: 'Central South Deccan: Mumbai CSMT — Chennai / Bengaluru',
    code: 'CSMT-MAS',
    distance_km: 1281,
    zones_traversed: ['CR', 'SCR', 'SWR', 'SR'],
    color: '#4338CA', // Indigo
    status: 'NORMAL',
    activeBlocksCount: 0,
    coordinates: [
      [18.9400, 72.8354], // CSMT
      [18.5284, 73.8739], // PUNE
      [17.4344, 78.5011], // SC
      [12.9784, 77.5694], // SBC
      [13.0827, 80.2707], // MAS
    ],
  },
  {
    id: 'WDFC-FREIGHT-CORR',
    name: 'Western Dedicated Freight Corridor (WDFC): Dadri — JNPT',
    code: 'WDFC',
    distance_km: 1504,
    zones_traversed: ['DFCCIL'],
    color: '#059669', // Emerald
    status: 'NORMAL',
    activeBlocksCount: 0,
    coordinates: [
      [28.5520, 77.5540], // Dadri
      [25.2138, 75.8648], // Kota alignment
      [22.3107, 73.1812], // Vadodara DFC Yard
      [21.2050, 72.8407], // Surat Gadhpur
      [18.9500, 72.9500], // JNPT Port
    ],
  },
]

// Geographic Views for Zone & National Presets
interface MapRegionPreset {
  id: string
  label: string
  subtitle: string
  center: [number, number]
  zoom: number
}

const REGION_PRESETS: MapRegionPreset[] = [
  {
    id: 'ALL_INDIA',
    label: 'All-India National Grid',
    subtitle: 'Pan-India 17 Railway Zones & Dedicated Freight Corridors',
    center: [22.5, 79.5],
    zoom: 5,
  },
  {
    id: 'NORTHERN',
    label: 'Northern & NCR Grid',
    subtitle: 'Delhi, Kanpur, Prayagraj, Varanasi, Lucknow (NR / NCR)',
    center: [26.8, 80.5],
    zoom: 7,
  },
  {
    id: 'WESTERN',
    label: 'Western Trunk (WR / WCR)',
    subtitle: 'Mumbai Central, Surat, Vadodara, Ahmedabad, Kota',
    center: [22.0, 74.5],
    zoom: 6,
  },
  {
    id: 'CENTRAL',
    label: 'Central Railway & Ghats (CR)',
    subtitle: 'CSMT, Kalyan, Pune, Bhusawal, Nagpur',
    center: [19.8, 75.5],
    zoom: 7,
  },
  {
    id: 'EASTERN',
    label: 'Eastern & Coal Belt (ER / SER / ECR)',
    subtitle: 'Howrah, Asansol, Tatanagar, Patna, DDU Junction',
    center: [24.0, 85.5],
    zoom: 7,
  },
  {
    id: 'SOUTHERN',
    label: 'Southern & Deccan (SR / SCR / SWR)',
    subtitle: 'Chennai Central, Bengaluru, Secunderabad, Vijayawada',
    center: [14.8, 79.2],
    zoom: 6,
  },
  {
    id: 'DFCCIL',
    label: 'Dedicated Freight Corridors',
    subtitle: 'WDFC (Dadri-JNPT) & EDFC Heavy-Haul Corridors',
    center: [24.5, 77.0],
    zoom: 6,
  },
]

export function Network() {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL_INDIA')
  const [activeLayer, setActiveLayer] = useState<'all' | 'stations' | 'corridors' | 'blocks' | 'kavach'>('all')
  const [selectedStation, setSelectedStation] = useState<StationNode | null>(null)
  const [selectedCorridor, setSelectedCorridor] = useState<NationalCorridorLine | null>(null)

  const currentPreset = useMemo(() => {
    return REGION_PRESETS.find((r) => r.id === selectedRegion) || REGION_PRESETS[0]
  }, [selectedRegion])

  // Filter stations based on selected region
  const filteredStations = useMemo(() => {
    if (selectedRegion === 'ALL_INDIA') return ALL_INDIA_STATIONS
    if (selectedRegion === 'NORTHERN') return ALL_INDIA_STATIONS.filter((s) => ['NR', 'NCR'].includes(s.zone))
    if (selectedRegion === 'WESTERN') return ALL_INDIA_STATIONS.filter((s) => ['WR', 'WCR'].includes(s.zone))
    if (selectedRegion === 'CENTRAL') return ALL_INDIA_STATIONS.filter((s) => s.zone === 'CR')
    if (selectedRegion === 'EASTERN') return ALL_INDIA_STATIONS.filter((s) => ['ER', 'SER', 'ECR'].includes(s.zone))
    if (selectedRegion === 'SOUTHERN') return ALL_INDIA_STATIONS.filter((s) => ['SR', 'SCR', 'SWR'].includes(s.zone))
    if (selectedRegion === 'DFCCIL') return ALL_INDIA_STATIONS.filter((s) => s.zone === 'DFCCIL' || ['NDLS', 'MMCT'].includes(s.id))
    return ALL_INDIA_STATIONS
  }, [selectedRegion])

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] font-sans bg-[#F4F6F9] overflow-hidden">
      {/* Top Banner: National GIS Command Header */}
      <div className="bg-white px-4 py-3 border-b border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3 shadow-xs relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#0B2545] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Globe2 className="h-3 w-3" /> All-India National GIS
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Indian Railways • Geospatial Network Operations Center (NROC)
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#0B2545] flex items-center gap-2 mt-0.5">
            <Navigation className="h-5 w-5 text-[#134074]" />
            National Rail Network Operations Center & GIS Corridor Tracker
          </h1>
        </div>

        {/* Live National Telemetry Counters */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>17 Zones Connected</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-slate-600 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Kavach 4.0 ATP Active</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-amber-700 font-semibold font-mono">
              <HardHat className="h-3.5 w-3.5" />
              <span>8 Active Block Windows</span>
            </div>
          </div>

          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 gap-1.5 py-1 text-xs font-bold">
            <Radio className="h-3 w-3 animate-pulse text-emerald-700" />
            Live GIS Feed
          </Badge>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar: Region Presets, Corridors & Layer Control */}
        <div className="w-full md:w-80 bg-white border-r border-[#CBD5E1] flex flex-col z-20 shadow-xs overflow-y-auto">
          {/* Region Switcher */}
          <div className="p-3 border-b border-slate-200 bg-[#F8FAFC]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-1.5 mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#134074]" /> Geographic Zone / Corridor Focus
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value)
                setSelectedStation(null)
                setSelectedCorridor(null)
              }}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[#0B2545] focus:outline-none focus:border-[#134074]"
            >
              {REGION_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">{currentPreset.subtitle}</p>
          </div>

          {/* Layer Controls */}
          <div className="p-3 border-b border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-1.5 mb-2">
              <Layers className="h-3.5 w-3.5 text-[#134074]" /> Visible Map Layers
            </h2>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All Layers' },
                { id: 'corridors', label: 'Trunk Corridors' },
                { id: 'stations', label: 'Major Junctions' },
                { id: 'kavach', label: '🛡️ Kavach ATP' },
              ].map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id as any)}
                  className={`px-2.5 py-1.5 text-left text-[11px] rounded transition-colors font-medium border ${
                    activeLayer === layer.id
                      ? 'bg-[#0B2545] text-white font-bold border-[#0B2545]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* National Corridors List */}
          <div className="p-3 border-b border-slate-200 flex-1 overflow-y-auto space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B2545]">
                Trunk Rail Corridors ({NATIONAL_CORRIDORS.length})
              </span>
              <span className="text-[10px] font-mono text-slate-500">68,000+ Route KM</span>
            </div>

            <div className="space-y-1.5">
              {NATIONAL_CORRIDORS.map((corridor) => (
                <div
                  key={corridor.id}
                  onClick={() => setSelectedCorridor(corridor)}
                  className={`p-2 rounded border text-xs cursor-pointer transition-all ${
                    selectedCorridor?.id === corridor.id
                      ? 'bg-blue-50/80 border-[#134074] shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[#0B2545] text-[11px]">{corridor.code}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        corridor.status === 'NORMAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : corridor.status === 'MAINTENANCE_WINDOW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {corridor.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 line-clamp-1 mt-0.5">{corridor.name}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>{corridor.distance_km} KM</span>
                    <span>Zones: {corridor.zones_traversed.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info Box */}
          <div className="p-3 bg-blue-50/70 border-t border-blue-200 text-xs text-[#0B2545]">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Train className="h-3.5 w-3.5 text-[#134074]" /> National Interlocking Telemetry
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Click any station junction or railway corridor polyline on the map to inspect live platforms, passing trains, and scheduled civil possession windows.
            </p>
          </div>
        </div>

        {/* Center: Leaflet Interactive GIS Map */}
        <div className="flex-1 bg-slate-100 relative z-0 min-h-[350px]">
          <MapContainer
            center={currentPreset.center}
            zoom={currentPreset.zoom}
            zoomControl={false}
            className="h-full w-full"
          >
            <ChangeMapView center={currentPreset.center} zoom={currentPreset.zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & Indian Railways GIS'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <ZoomControl position="bottomright" />

            {/* Render National Corridors as Polylines */}
            {(activeLayer === 'all' || activeLayer === 'corridors') &&
              NATIONAL_CORRIDORS.map((corridor) => (
                <Polyline
                  key={corridor.id}
                  positions={corridor.coordinates}
                  eventHandlers={{
                    click: () => setSelectedCorridor(corridor),
                  }}
                  pathOptions={{
                    color: corridor.color,
                    weight: selectedCorridor?.id === corridor.id ? 6 : 4,
                    dashArray: corridor.id.includes('DFC') ? '6, 6' : undefined,
                    opacity: selectedCorridor && selectedCorridor.id !== corridor.id ? 0.4 : 0.85,
                  }}
                />
              ))}

            {/* Render Major Junction / Station Markers */}
            {(activeLayer === 'all' || activeLayer === 'stations' || activeLayer === 'kavach') &&
              filteredStations.map((station) => {
                if (activeLayer === 'kavach' && !station.kavach) return null

                return (
                  <Marker
                    key={station.id}
                    position={station.coords}
                    eventHandlers={{
                      click: () => setSelectedStation(station),
                    }}
                  >
                    <Popup>
                      <div className="p-1 font-sans text-xs min-w-[200px]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[#0B2545] text-sm">{station.name}</span>
                          <span className="text-[10px] font-bold bg-[#0B2545] text-white px-1.5 py-0.2 rounded">
                            {station.zone}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Code: <strong className="text-slate-800">{station.code}</strong> • Platforms: {station.platforms}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          Daily Trains Handled: <strong>{station.dailyTrains}</strong>
                        </div>
                        {station.kavach && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="h-3 w-3" /> Kavach 4.0 ATP Commissioned
                          </div>
                        )}
                        <div className="mt-2 pt-1.5 border-t border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                            Live Passing Rakes ({station.liveTrains.length}):
                          </span>
                          {station.liveTrains.map((tr, idx) => (
                            <div key={idx} className="text-[10px] flex justify-between items-center font-mono py-0.5">
                              <span className="font-bold text-[#134074]">{tr.number}</span>
                              <span className="text-slate-600 truncate max-w-[110px]">{tr.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
          </MapContainer>

          {/* Floating Selected Station Inspector Deck */}
          {selectedStation && (
            <div className="absolute top-4 right-4 z-[1000] w-80 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-300 p-4 animate-in fade-in slide-in-from-right duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B2545] text-white px-2 py-0.5 rounded">
                    {selectedStation.zone} ZONE • {selectedStation.type.replace(/_/g, ' ')}
                  </span>
                  <h3 className="font-bold text-sm text-[#0B2545] mt-1">{selectedStation.name}</h3>
                  <div className="text-xs font-mono text-slate-500">
                    Station Code: <span className="font-bold text-slate-800">{selectedStation.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Platforms</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{selectedStation.platforms}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Daily Runs</span>
                  <span className="font-bold text-blue-800 font-mono text-sm">{selectedStation.dailyTrains}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Blocks</span>
                  <span className="font-bold text-amber-700 font-mono text-sm">{selectedStation.activeBlocks}</span>
                </div>
              </div>

              {selectedStation.kavach && (
                <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <div>
                    <span className="font-bold block">Kavach 4.0 Cab Signalling Active</span>
                    <span className="text-[10px] text-emerald-700">Continuous speed supervision & auto-braking</span>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold uppercase text-[#0B2545] block mb-1.5">
                  Live Train Movement
                </span>
                <div className="space-y-1">
                  {selectedStation.liveTrains.map((tr, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#0B2545]">{tr.number}</span>
                        <div className="text-[10px] text-slate-600">{tr.name}</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {tr.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Floating Selected Corridor Inspector Deck */}
          {selectedCorridor && !selectedStation && (
            <div className="absolute top-4 right-4 z-[1000] w-80 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-300 p-4 animate-in fade-in slide-in-from-right duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#134074] text-white px-2 py-0.5 rounded">
                    NATIONAL CORRIDOR
                  </span>
                  <h3 className="font-bold text-sm text-[#0B2545] mt-1">{selectedCorridor.name}</h3>
                  <div className="text-xs font-mono text-slate-500">
                    Route Distance: <span className="font-bold text-slate-800">{selectedCorridor.distance_km} KM</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCorridor(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="my-3 p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 font-semibold">Traversed Zones:</span>
                  <span className="font-bold text-[#0B2545]">{selectedCorridor.zones_traversed.join(' • ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Active Maintenance Windows:</span>
                  <span className="font-bold text-amber-700 font-mono">{selectedCorridor.activeBlocksCount} Approved</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed">
                Integrated in the CP-SAT Multi-Zonal optimizer. Dispatches across inter-zonal boundary stations are reconciled with zero deadlocks.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
