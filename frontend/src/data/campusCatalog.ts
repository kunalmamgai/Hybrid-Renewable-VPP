export interface CampusOption {
  id: string;
  shortName: string;
  city: string;
  category: string;
}

export const CAMPUS_OPTIONS: CampusOption[] = [
  { id: 'vit-bhopal', shortName: 'VIT Bhopal', city: 'Kothri Kalan, Madhya Pradesh', category: 'Reference campus' },
  { id: 'mnit-jaipur', shortName: 'MNIT Jaipur', city: 'Jaipur', category: 'NIT / Technical' },
  { id: 'mbm-jodhpur', shortName: 'MBM University', city: 'Jodhpur', category: 'State Technical' },
  { id: 'rtu-kota', shortName: 'RTU Kota', city: 'Kota', category: 'State Technical' },
  { id: 'aiims-jodhpur', shortName: 'AIIMS Jodhpur', city: 'Jodhpur', category: 'Medical' },
  { id: 'sms-jaipur', shortName: 'SMS Medical College', city: 'Jaipur', category: 'Medical' },
  { id: 'snmc-jodhpur', shortName: 'Dr. S.N. Medical', city: 'Jodhpur', category: 'Medical' },
  { id: 'uniraj-jaipur', shortName: 'University of Rajasthan', city: 'Jaipur', category: 'State University' },
  { id: 'jnvu-jodhpur', shortName: 'JNVU Jodhpur', city: 'Jodhpur', category: 'State University' },
  { id: 'mlsu-udaipur', shortName: 'MLSU Udaipur', city: 'Udaipur', category: 'State University' },
  { id: 'iit-jodhpur', shortName: 'IIT Jodhpur', city: 'Karwar, Jodhpur', category: 'IIT / Technical' },
];
