// Precise boundary polygon coordinates [lat, lng] for Universitas Sebelas Maret (UNS) campuses

export interface CampusBoundary {
  id: string;
  name: string;
  polygon: [number, number][];
}

export const UNS_CAMPUS_BOUNDARIES: CampusBoundary[] = [
  // 1. Kampus Utama Kentingan (Jebres)
  {
    id: 'kentingan',
    name: 'Kampus Kentingan',
    polygon: [
      [-7.5562, 110.8542], // Barat Laut (Dekat Gerbang Belakang Sutami)
      [-7.5568, 110.8596], // Timur Laut (Kawasan Workshop FT / Bengawan Solo)
      [-7.5592, 110.8618], // Batas Timur (Tepian Hijau FMIPA / Jurug)
      [-7.5632, 110.8605], // Tenggara (Kawasan FK / Danau Selatan)
      [-7.5652, 110.8578], // Ujung Selatan (Belakang Stadion UNS)
      [-7.5645, 110.8545], // Barat Daya (Kawasan Selatan FKIP / Lapangan)
      [-7.5620, 110.8532], // Barat (Dekat MNH & Pintu Gerbang Barat)
      [-7.5585, 110.8538], // Barat Menengah (Dekat Boulevard Barat)
      [-7.5568, 110.8548], // Menuju Gerbang Depan Sutami
    ],
  },
  // 2. Kampus Manahan FKOR (Jl. Menteri Supeno)
  {
    id: 'manahan',
    name: 'Kampus Manahan FKOR',
    polygon: [
      [-7.5518, 110.8078],
      [-7.5518, 110.8108],
      [-7.5540, 110.8108],
      [-7.5540, 110.8078],
    ],
  },
  // 3. Kampus Kleco FKIP II (Jl. Slamet Riyadi No. 449)
  {
    id: 'kleco',
    name: 'Kampus Kleco FKIP',
    polygon: [
      [-7.5583, 110.7828],
      [-7.5583, 110.7858],
      [-7.5605, 110.7858],
      [-7.5605, 110.7828],
    ],
  },
  // 4. Kampus Mesen Sekolah Vokasi (Jl. Urip Sumoharjo)
  {
    id: 'mesen',
    name: 'Kampus Mesen Vokasi',
    polygon: [
      [-7.5610, 110.8340],
      [-7.5610, 110.8368],
      [-7.5632, 110.8368],
      [-7.5632, 110.8340],
    ],
  },
  // 5. Rumah Sakit UNS Pabelan (Jl. Ahmad Yani)
  {
    id: 'pabelan',
    name: 'RS UNS Pabelan',
    polygon: [
      [-7.5574, 110.7698],
      [-7.5574, 110.7726],
      [-7.5598, 110.7726],
      [-7.5598, 110.7698],
    ],
  },
];
