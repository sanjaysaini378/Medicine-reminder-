import { MedicineCatalogItem, MedicineType } from '../types/medicine';

export const MEDICINE_CATALOG: MedicineCatalogItem[] = [
  {
    id: 'cat-paracetamol',
    name: 'Paracetamol 500 mg',
    genericName: 'Acetaminophen / Paracetamol',
    commonBrands: ['Dolo 650', 'Crocin', 'Calpol', 'Tylenol'],
    type: 'tablet',
    typicalDosage: '1 Tablet (500 mg)',
    category: 'Pain & Fever Reference',
    categoryHi: 'दर्द और बुखार संदर्भ',
    generalInfo: 'Commonly listed over-the-counter analgesic and antipyretic tablet. Follow exact dose limits on your label or prescription.',
    generalInfoHi: 'सामान्यतः उपयोग की जाने वाली दर्द और बुखार की गोली। हमेशा लेबल या डॉक्टर द्वारा बताई गई मात्रा का ही पालन करें।',
    administrationTip: 'Usually taken with water. Avoid exceeding total daily limit prescribed by your doctor.',
    administrationTipHi: 'सामान्यतः पानी के साथ ली जाती है। डॉक्टर द्वारा बताई गई दैनिक सीमा से अधिक न लें।',
    source: 'curated',
  },
  {
    id: 'cat-metformin',
    name: 'Metformin 500 mg',
    genericName: 'Metformin Hydrochloride',
    commonBrands: ['Glycomet', 'Glucophage', 'Obimet'],
    type: 'tablet',
    typicalDosage: '1 Tablet (500 mg)',
    category: 'Blood Sugar Management',
    categoryHi: 'ब्लड शुगर प्रबंधन',
    generalInfo: 'Prescription oral medication commonly prescribed in type 2 diabetes care plans.',
    generalInfoHi: 'प्रिस्क्रिप्शन दवाई जो आमतौर पर टाइप 2 डायबिटीज़ की देखभाल योजना में दी जाती है।',
    administrationTip: 'Commonly advised to take with or immediately after a meal to support stomach comfort.',
    administrationTipHi: 'पेट की सुविधा के लिए सामान्यतः भोजन के साथ या तुरंत बाद लेने की सलाह दी जाती है।',
    source: 'curated',
  },
  {
    id: 'cat-amlodipine',
    name: 'Amlodipine 5 mg',
    genericName: 'Amlodipine Besylate',
    commonBrands: ['Amlong', 'Stamlo', 'Norvasc'],
    type: 'tablet',
    typicalDosage: '1 Tablet (5 mg)',
    category: 'Blood Pressure Support',
    categoryHi: 'ब्लड प्रेशर सहायता',
    generalInfo: 'Prescription calcium-channel blocker tablet commonly prescribed as part of blood pressure management.',
    generalInfoHi: 'प्रिस्क्रिप्शन गोली जो सामान्यतः रक्तचाप प्रबंधन योजना में डॉक्टर द्वारा दी जाती है।',
    administrationTip: 'Usually taken once daily at the same time each day, with or without food.',
    administrationTipHi: 'आमतौर पर प्रतिदिन एक ही समय पर, भोजन के साथ या बिना ली जाती है।',
    source: 'curated',
  },
  {
    id: 'cat-atorvastatin',
    name: 'Atorvastatin 10 mg',
    genericName: 'Atorvastatin Calcium',
    commonBrands: ['Atorva', 'Lipitor', 'Storvas'],
    type: 'tablet',
    typicalDosage: '1 Tablet (10 mg)',
    category: 'Cholesterol Management',
    categoryHi: 'कोलेस्ट्रॉल प्रबंधन',
    generalInfo: 'Prescription statin medication frequently included in lipid and cardiovascular care regimens.',
    generalInfoHi: 'प्रिस्क्रिप्शन स्टैटिन गोली जो सामान्यतः कोलेस्ट्रॉल प्रबंधन में दी जाती है।',
    administrationTip: 'Often scheduled in the evening or at a consistent time daily as directed.',
    administrationTipHi: 'निर्देशानुसार अक्सर शाम को या प्रतिदिन एक निश्चित समय पर ली जाती है।',
    source: 'curated',
  },
  {
    id: 'cat-omeprazole',
    name: 'Omeprazole 20 mg',
    genericName: 'Omeprazole',
    commonBrands: ['Omez', 'Prilosec', 'Ocid'],
    type: 'capsule',
    typicalDosage: '1 Capsule (20 mg)',
    category: 'Acid & Stomach Care',
    categoryHi: 'एसिडिटी और पेट की देखभाल',
    generalInfo: 'Proton pump inhibitor capsule commonly used in acid reflux and stomach care prescriptions.',
    generalInfoHi: 'प्रोटॉन पंप अवरोधक कैप्सूल जो सामान्यतः एसिड रिफ्लक्स और पेट की देखभाल में दिया जाता है।',
    administrationTip: 'Commonly taken before a meal, typically in the morning. Swallow capsule whole.',
    administrationTipHi: 'आमतौर पर सुबह भोजन से पहले पूरा कैप्सूल पानी के साथ निगला जाता है।',
    source: 'curated',
  },
  {
    id: 'cat-pantoprazole',
    name: 'Pantoprazole 40 mg',
    genericName: 'Pantoprazole Sodium',
    commonBrands: ['Pan 40', 'Pantocid', 'Protonix'],
    type: 'tablet',
    typicalDosage: '1 Tablet (40 mg)',
    category: 'Acid & Stomach Care',
    categoryHi: 'एसिडिटी और पेट की देखभाल',
    generalInfo: 'Enteric-coated tablet prescribed for reducing stomach acid as part of digestive care.',
    generalInfoHi: 'एंटेरिक-कोटेड गोली जो पाचन और एसिडिटी नियंत्रण में डॉक्टर द्वारा दी जाती है।',
    administrationTip: 'Usually taken 30 minutes before breakfast. Do not crush or chew enteric-coated tablets.',
    administrationTipHi: 'आमतौर पर नाश्ते से 30 मिनट पहले ली जाती है। गोली को तोड़ें या चबाएँ नहीं।',
    source: 'curated',
  },
  {
    id: 'cat-vitamin-d3',
    name: 'Vitamin D3 1000 IU',
    genericName: 'Cholecalciferol',
    commonBrands: ['Uprise-D3', 'Calcirol', 'D-Rise'],
    type: 'capsule',
    typicalDosage: '1 Capsule',
    category: 'Daily Vitamin Supplement',
    categoryHi: 'विटामिन सप्लीमेंट',
    generalInfo: 'Dietary vitamin D3 softgel capsule taken daily or weekly per healthcare guidance.',
    generalInfoHi: 'विटामिन D3 सॉफ्टजेल कैप्सूल जो डॉक्टर के निर्देशानुसार दैनिक या साप्ताहिक लिया जाता है।',
    administrationTip: 'Fat-soluble vitamin often taken after a main meal.',
    administrationTipHi: 'आमतौर पर मुख्य भोजन के बाद लेने की सलाह दी जाती है।',
    source: 'curated',
  },
  {
    id: 'cat-amoxicillin',
    name: 'Amoxicillin 500 mg',
    genericName: 'Amoxicillin Trihydrate',
    commonBrands: ['Mox 500', 'Novamox', 'Amoxil'],
    type: 'capsule',
    typicalDosage: '1 Capsule (500 mg)',
    category: 'Prescription Antibiotic',
    categoryHi: 'प्रिस्क्रिप्शन एंटीबायोटिक',
    generalInfo: 'Prescription antibiotic capsule. Only use when specifically prescribed by a licensed physician.',
    generalInfoHi: 'प्रिस्क्रिप्शन एंटीबायोटिक कैप्सूल। केवल डॉक्टर के पर्चे पर ही उपयोग करें।',
    administrationTip: 'Take at evenly spaced intervals and complete the full prescribed course unless advised otherwise.',
    administrationTipHi: 'समान अंतराल पर लें और डॉक्टर द्वारा बताया गया पूरा कोर्स पूरा करें।',
    source: 'curated',
  },
  {
    id: 'cat-levothyroxine',
    name: 'Levothyroxine 50 mcg',
    genericName: 'Levothyroxine Sodium',
    commonBrands: ['Thyronorm', 'Eltroxin', 'Synthroid'],
    type: 'tablet',
    typicalDosage: '1 Tablet (50 mcg)',
    category: 'Thyroid Care',
    categoryHi: 'थायरॉइड देखभाल',
    generalInfo: 'Prescription thyroid hormone replacement tablet used under physician monitoring.',
    generalInfoHi: 'प्रिस्क्रिप्शन थायरॉइड दवाई जो डॉक्टर की निगरानी में ली जाती है।',
    administrationTip: 'Typically taken early in the morning on an empty stomach with plain water.',
    administrationTipHi: 'आमतौर पर सुबह खाली पेट सादे पानी के साथ ली जाती है।',
    source: 'curated',
  },
  {
    id: 'cat-cetirizine',
    name: 'Cetirizine 10 mg',
    genericName: 'Cetirizine Hydrochloride',
    commonBrands: ['Cetzine', 'Zyrtec', 'Alerid'],
    type: 'tablet',
    typicalDosage: '1 Tablet (10 mg)',
    category: 'Allergy Reference',
    categoryHi: 'एलर्जी संदर्भ',
    generalInfo: 'Antihistamine tablet commonly used for seasonal allergy symptoms per package or doctor directions.',
    generalInfoHi: 'एंटीहिस्टामाइन गोली जो सामान्यतः मौसमी एलर्जी के लक्षणों में निर्देशानुसार ली जाती है।',
    administrationTip: 'Often taken in the evening as it may cause mild drowsiness in some people.',
    administrationTipHi: 'अक्सर शाम को ली जाती है क्योंकि कुछ लोगों को हल्की नींद आ सकती है।',
    source: 'curated',
  },
  {
    id: 'cat-cough-syrup',
    name: 'Guaifenesin Cough Syrup',
    genericName: 'Guaifenesin Oral Solution',
    commonBrands: ['Benadryl', 'Grilinctus', 'Mucinex Liquid'],
    type: 'syrup',
    typicalDosage: '10 ml',
    category: 'Cough & Throat Syrup',
    categoryHi: 'खाँसी का सिरप',
    generalInfo: 'Oral liquid syrup formulation. Always measure with the provided dosage cup or oral syringe.',
    generalInfoHi: 'तरल सिरप दवाई। हमेशा साथ दिए गए मापने वाले कप या चम्मच से ही खुराक मापें।',
    administrationTip: 'Shake bottle gently before measuring. Follow age-specific dosing instructions on the bottle.',
    administrationTipHi: 'मापने से पहले बोतल को हल्के से हिलाएँ और बोतल पर लिखे निर्देश का पालन करें।',
    source: 'curated',
  },
  {
    id: 'cat-antacid-syrup',
    name: 'Antacid Oral Suspension',
    genericName: 'Magnesium Hydroxide + Simethicone',
    commonBrands: ['Digene Gel', 'Gelusil', 'Mucaine'],
    type: 'syrup',
    typicalDosage: '10 ml (2 tsp)',
    category: 'Digestive Suspension',
    categoryHi: 'पाचन सिरप',
    generalInfo: 'Oral liquid antacid suspension commonly used after meals as directed on package.',
    generalInfoHi: 'तरल एंटासिड सिरप जो सामान्यतः भोजन के बाद निर्देशानुसार लिया जाता है।',
    administrationTip: 'Shake well before pouring. Measure accurately using the dosing cup.',
    administrationTipHi: 'उपयोग से पहले बोतल अच्छी तरह हिलाएँ और मापक कप का उपयोग करें।',
    source: 'curated',
  },
  {
    id: 'cat-insulin-glargine',
    name: 'Insulin Glargine Pen',
    genericName: 'Insulin Glargine (100 units/ml)',
    commonBrands: ['Lantus', 'Basaglar', 'Glaritus'],
    type: 'injection',
    typicalDosage: '10 Units',
    category: 'Long-Acting Insulin Pen',
    categoryHi: 'इंसुलिन इंजेक्शन पेन',
    generalInfo: 'Prescription basal insulin injection pen. Exact unit dosage must always be confirmed with your physician.',
    generalInfoHi: 'प्रिस्क्रिप्शन इंसुलिन पेन। यूनिट की सही मात्रा हमेशा अपने डॉक्टर से सुनिश्चित करें।',
    administrationTip: 'Inject at the same time each day and rotate injection sites as trained by your healthcare provider.',
    administrationTipHi: 'प्रतिदिन एक ही समय पर लगाएँ और डॉक्टर द्वारा बताए अनुसार स्थान बदलते रहें।',
    source: 'curated',
  },
  {
    id: 'cat-vitamin-b12-inj',
    name: 'Methylcobalamin Injection',
    genericName: 'Vitamin B12 / Methylcobalamin',
    commonBrands: ['Neurobion', 'Methycobal'],
    type: 'injection',
    typicalDosage: '1 Ampoule (500 mcg)',
    category: 'Vitamin B12 Injection',
    categoryHi: 'विटामिन B12 इंजेक्शन',
    generalInfo: 'Injectable B12 formulation administered on a doctor-prescribed schedule.',
    generalInfoHi: 'इंजेक्शन रूप में विटामिन B12 जो डॉक्टर द्वारा निर्धारित शेड्यूल पर दिया जाता है।',
    administrationTip: 'To be administered only by or under instructions of a qualified medical professional.',
    administrationTipHi: 'केवल योग्य चिकित्सा कर्मी द्वारा या डॉक्टर के निर्देशानुसार ही लगवाएँ।',
    source: 'curated',
  },
  {
    id: 'cat-salbutamol-inhaler',
    name: 'Salbutamol Inhaler',
    genericName: 'Salbutamol / Albuterol Sulfate',
    commonBrands: ['Asthalin', 'Ventolin'],
    type: 'other',
    typicalDosage: '2 Puffs',
    category: 'Respiratory Inhaler',
    categoryHi: 'श्वास इनहेलर',
    generalInfo: 'Metered-dose inhaler device used per respiratory care plan.',
    generalInfoHi: 'मीटर्ड-डोज़ इनहेलर जो श्वास देखभाल योजना के अनुसार उपयोग किया जाता है।',
    administrationTip: 'Shake inhaler before each puff and rinse mouth if advised for your inhaler type.',
    administrationTipHi: 'प्रत्येक पफ से पहले इनहेलर हिलाएँ और निर्देशानुसार उपयोग करें।',
    source: 'curated',
  },
  {
    id: 'cat-lubricant-drops',
    name: 'Lubricating Eye Drops',
    genericName: 'Carboxymethylcellulose 0.5%',
    commonBrands: ['Refresh Tears', 'Systane'],
    type: 'other',
    typicalDosage: '1 Drop per eye',
    category: 'Eye Care Drops',
    categoryHi: 'आँखों के ड्रॉप्स',
    generalInfo: 'Sterile ophthalmic lubricating drops for everyday eye comfort.',
    generalInfoHi: 'आँखों की नमी और आराम के लिए स्टेराइल आई ड्रॉप्स।',
    administrationTip: 'Wash hands before use and avoid touching the dropper tip to the eye or fingers.',
    administrationTipHi: 'उपयोग से पहले हाथ धोएँ और ड्रॉपर की नोक को आँख या हाथ से न छुएँ।',
    source: 'curated',
  },
  {
    id: 'cat-aspirin-75',
    name: 'Aspirin 75 mg',
    genericName: 'Acetylsalicylic Acid (Low Dose)',
    commonBrands: ['Ecosprin 75', 'Disprin', 'Loprin'],
    type: 'tablet',
    typicalDosage: '1 Tablet (75 mg)',
    category: 'Cardiac Care Reference',
    categoryHi: 'हृदय देखभाल संदर्भ',
    generalInfo: 'Low-dose enteric-coated aspirin tablet commonly included in physician-guided cardiovascular regimens.',
    generalInfoHi: 'कम खुराक वाली एस्पिरिन गोली जो डॉक्टर के परामर्श पर हृदय देखभाल योजना में दी जाती है।',
    administrationTip: 'Often advised after food with water. Do not start or stop without medical guidance.',
    administrationTipHi: 'आमतौर पर भोजन के बाद पानी के साथ ली जाती है। डॉक्टर की सलाह के बिना बंद न करें।',
    source: 'curated',
  },
  {
    id: 'cat-calcium-d3',
    name: 'Calcium + Vitamin D3',
    genericName: 'Calcium Carbonate 500 mg + Cholecalciferol',
    commonBrands: ['Shelcal 500', 'Cipcal 500'],
    type: 'tablet',
    typicalDosage: '1 Tablet',
    category: 'Bone & Mineral Supplement',
    categoryHi: 'कैल्शियम और हड्डी सप्लीमेंट',
    generalInfo: 'Mineral and vitamin supplement tablet supporting daily dietary calcium intake.',
    generalInfoHi: 'दैनिक कैल्शियम और विटामिन D3 सप्लीमेंट की गोली।',
    administrationTip: 'Usually taken after meals for better absorption.',
    administrationTipHi: 'बेहतर अवशोषण के लिए सामान्यतः भोजन के बाद ली जाती है।',
    source: 'curated',
  },
];

function inferMedicineType(dosageForm?: string): MedicineType {
  const lower = (dosageForm || '').toLowerCase();
  if (lower.includes('capsule')) return 'capsule';
  if (lower.includes('syrup') || lower.includes('solution') || lower.includes('suspension') || lower.includes('liquid') || lower.includes('elixir')) {
    return 'syrup';
  }
  if (lower.includes('inject') || lower.includes('vial') || lower.includes('syringe')) {
    return 'injection';
  }
  if (lower.includes('tablet') || lower.includes('caplet') || lower.includes('lozenge')) {
    return 'tablet';
  }
  return 'other';
}

export async function searchOpenFDA(query: string): Promise<MedicineCatalogItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const sanitized = trimmed.replace(/[^a-zA-Z0-9\s-]/g, '');
  if (!sanitized) return [];

  const encoded = encodeURIComponent(sanitized);
  const url = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:${encoded}*+OR+openfda.generic_name:${encoded}*)&limit=8`;

  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    results?: Array<{
      id?: string;
      openfda?: {
        brand_name?: string[];
        generic_name?: string[];
        pharm_class_epc?: string[];
        route?: string[];
      };
      dosage_forms_and_strengths?: string[];
      dosage_and_administration?: string[];
      purpose?: string[];
    }>;
  };

  if (!Array.isArray(data.results)) return [];

  const seen = new Set<string>();
  const items: MedicineCatalogItem[] = [];

  for (const r of data.results) {
    const brand = r.openfda?.brand_name?.[0];
    const generic = r.openfda?.generic_name?.[0] || brand || trimmed;
    const displayName = brand ? `${brand}` : generic;
    const dedupKey = displayName.toLowerCase();
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const formText = r.dosage_forms_and_strengths?.[0] || r.openfda?.route?.[0] || '';
    const type = inferMedicineType(formText);
    const category = r.openfda?.pharm_class_epc?.[0] || r.purpose?.[0]?.slice(0, 60) || 'FDA Drug Label Reference';
    const rawInfo = (r.purpose?.[0] || r.dosage_forms_and_strengths?.[0] || 'Listed in OpenFDA drug label database. Refer to your prescription label for exact usage.').slice(0, 220);
    const rawTip = (r.dosage_and_administration?.[0] || 'Follow the dosing schedule provided by your prescribing doctor or pharmacist.').slice(0, 180);

    items.push({
      id: `fda-${r.id || Math.random().toString(36).slice(2)}`,
      name: displayName,
      genericName: generic,
      commonBrands: r.openfda?.brand_name?.slice(0, 3) || [],
      type,
      typicalDosage: type === 'syrup' ? '10 ml' : type === 'injection' ? '1 Dose' : type === 'capsule' ? '1 Capsule' : '1 Tablet',
      category,
      categoryHi: category,
      generalInfo: rawInfo,
      generalInfoHi: rawInfo,
      administrationTip: rawTip,
      administrationTipHi: rawTip,
      source: 'openfda',
    });
  }

  return items;
}
