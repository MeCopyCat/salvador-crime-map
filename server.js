const express = require('express');
const https = require('https');
const http = require('http');
const { parseStringPromise } = require('xml2js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ========== Salvador Neighborhood Geocoding ==========
const NEIGHBORHOODS = [
  { name: 'Pelourinho', lat: -12.9714, lng: -38.5104, aliases: ['pelourinho', 'centro histórico', 'centro historico'] },
  { name: 'Liberdade', lat: -12.9437, lng: -38.4969, aliases: ['liberdade'] },
  { name: 'Sussuarana', lat: -12.9190, lng: -38.4480, aliases: ['sussuarana'] },
  { name: 'Itapuã', lat: -12.9390, lng: -38.3740, aliases: ['itapuã', 'itapua'] },
  { name: 'São Caetano', lat: -12.9305, lng: -38.4880, aliases: ['são caetano', 'sao caetano'] },
  { name: 'Valéria', lat: -12.8910, lng: -38.4370, aliases: ['valéria', 'valeria'] },
  { name: 'Cajazeiras', lat: -12.8820, lng: -38.4530, aliases: ['cajazeiras', 'cajazeira'] },
  { name: 'Fazenda Grande', lat: -12.9160, lng: -38.4680, aliases: ['fazenda grande', 'fazenda grande do retiro'] },
  { name: 'Nordeste de Amaralina', lat: -12.9850, lng: -38.4640, aliases: ['nordeste de amaralina', 'amaralina'] },
  { name: 'Bairro da Paz', lat: -12.9290, lng: -38.3820, aliases: ['bairro da paz'] },
  { name: 'Tancredo Neves', lat: -12.9550, lng: -38.4350, aliases: ['tancredo neves'] },
  { name: 'Castelo Branco', lat: -12.9060, lng: -38.4490, aliases: ['castelo branco'] },
  { name: 'Pau da Lima', lat: -12.9330, lng: -38.4270, aliases: ['pau da lima'] },
  { name: 'Pernambués', lat: -12.9700, lng: -38.4590, aliases: ['pernambués', 'pernambuês', 'pernambues'] },
  { name: 'Calabetão', lat: -12.9230, lng: -38.4590, aliases: ['calabetão', 'calabetao'] },
  { name: 'Mata Escura', lat: -12.9380, lng: -38.4550, aliases: ['mata escura'] },
  { name: 'Subúrbio Ferroviário', lat: -12.8990, lng: -38.5020, aliases: ['subúrbio', 'suburbio', 'subúrbio ferroviário'] },
  { name: 'Periperi', lat: -12.8790, lng: -38.5020, aliases: ['periperi'] },
  { name: 'Plataforma', lat: -12.8950, lng: -38.5080, aliases: ['plataforma'] },
  { name: 'Cosme de Farias', lat: -12.9600, lng: -38.4860, aliases: ['cosme de farias'] },
  { name: 'Águas Claras', lat: -12.9050, lng: -38.4400, aliases: ['águas claras', 'aguas claras'] },
  { name: 'Narandiba', lat: -12.9520, lng: -38.4600, aliases: ['narandiba'] },
  { name: 'Boca do Rio', lat: -12.9680, lng: -38.4240, aliases: ['boca do rio'] },
  { name: 'Pituba', lat: -12.9780, lng: -38.4480, aliases: ['pituba'] },
  { name: 'Brotas', lat: -12.9840, lng: -38.4900, aliases: ['brotas'] },
  { name: 'Paripe', lat: -12.8640, lng: -38.4990, aliases: ['paripe'] },
  { name: 'São Marcos', lat: -12.9140, lng: -38.4400, aliases: ['são marcos', 'sao marcos'] },
  { name: 'Mussurunga', lat: -12.9110, lng: -38.3780, aliases: ['mussurunga'] },
  { name: 'Lobato', lat: -12.9140, lng: -38.5050, aliases: ['lobato'] },
  { name: 'Uruguai', lat: -12.9240, lng: -38.5010, aliases: ['uruguai'] },
  { name: 'Engenho Velho de Brotas', lat: -12.9780, lng: -38.4940, aliases: ['engenho velho'] },
  { name: 'Saúde', lat: -12.9660, lng: -38.5060, aliases: ['saúde', 'saude'] },
  { name: 'Fazenda Coutos', lat: -12.8720, lng: -38.4830, aliases: ['fazenda coutos'] },
  { name: 'Pirajá', lat: -12.9100, lng: -38.4700, aliases: ['pirajá', 'piraja'] },
  { name: 'Cabula', lat: -12.9550, lng: -38.4620, aliases: ['cabula'] },
  { name: 'Imbuí', lat: -12.9720, lng: -38.4320, aliases: ['imbuí', 'imbui'] },
  { name: 'Barris', lat: -12.9800, lng: -38.5100, aliases: ['barris'] },
  { name: 'Garcia', lat: -12.9860, lng: -38.5040, aliases: ['garcia'] },
  { name: 'Ondina', lat: -12.9930, lng: -38.5090, aliases: ['ondina'] },
  { name: 'Rio Vermelho', lat: -12.9870, lng: -38.4870, aliases: ['rio vermelho'] },
  { name: 'Stella Maris', lat: -12.9320, lng: -38.3560, aliases: ['stella maris'] },
  { name: 'Itaigara', lat: -12.9780, lng: -38.4580, aliases: ['itaigara'] },
  { name: 'Caminho de Areia', lat: -12.9290, lng: -38.5000, aliases: ['caminho de areia'] },
  { name: 'Massaranduba', lat: -12.9350, lng: -38.5040, aliases: ['massaranduba'] },
  { name: 'Cidade Baixa', lat: -12.9550, lng: -38.5150, aliases: ['cidade baixa', 'comércio', 'comercio'] },
  { name: 'Salvador Centro', lat: -12.9400, lng: -38.4700, aliases: ['salvador'] },
];

// Inland-only neighborhoods for random assignment (exclude coastal ones that risk ocean placement)
const INLAND_NEIGHBORHOODS = NEIGHBORHOODS.filter(n =>
  !['Paripe', 'Periperi', 'Plataforma', 'Subúrbio Ferroviário', 'Lobato',
    'Uruguai', 'Cidade Baixa', 'Saúde', 'Barris', 'Ondina', 'Pelourinho',
    'Caminho de Areia', 'Massaranduba', 'Fazenda Coutos', 'Garcia',
    'Salvador Centro'].includes(n.name)
);

// Cities outside Salvador - if these appear in title WITHOUT a Salvador neighborhood, skip
const OTHER_CITIES = [
  'feira de santana', 'camaçari', 'camacari', 'simões filho', 'simoes filho',
  'lauro de freitas', 'candeias', 'ilhéus', 'ilheus', 'itabuna', 'vitória da conquista',
  'vitoria da conquista', 'jequié', 'jequie', 'juazeiro', 'alagoinhas',
  'porto seguro', 'teixeira de freitas', 'barreiras', 'santo antônio de jesus',
  'santo antonio de jesus', 'são paulo', 'sao paulo', 'rio de janeiro',
  'brasília', 'brasilia', 'recife', 'fortaleza', 'belo horizonte',
];

// ========== Crime Classification ==========
const CRIME_KEYWORDS = {
  homicidio: {
    keywords: ['homicídio', 'homicidio', 'assassinato', 'assassinado', 'assassina', 'matou', 'matar',
               'morto', 'morte', 'morta', 'óbito', 'obito', 'faleceu', 'cadáver', 'cadaver',
               'corpo encontrado', 'corpo foi encontrado', 'vítima fatal', 'vitima fatal',
               'executado', 'execução', 'execucao', 'chacina', 'feminicídio', 'feminicidio'],
    severity: 5,
    label: '凶杀',
    labelPt: 'Homicídio',
    radius: 14,
  },
  latrocinio: {
    keywords: ['latrocínio', 'latrocinio', 'roubo seguido de morte', 'assalto.*mort',
               'morreu durante assalto', 'morto durante roubo'],
    severity: 5,
    label: '抢劫致死',
    labelPt: 'Latrocínio',
    radius: 14,
  },
  sequestro: {
    keywords: ['sequestro', 'sequestrado', 'sequestrada', 'cárcere', 'carcere',
               'refém', 'refem', 'reféns', 'refens', 'rapto', 'raptado', 'raptada',
               'sequestro relâmpago', 'mantido em cativeiro'],
    severity: 4,
    label: '绑架',
    labelPt: 'Sequestro',
    radius: 12,
  },
  estupro: {
    keywords: ['estupro', 'estuprado', 'estuprada', 'abuso sexual', 'violência sexual',
               'violencia sexual', 'assédio sexual', 'assedio sexual', 'importunação sexual',
               'importunacao sexual', 'crime sexual'],
    severity: 4,
    label: '性侵',
    labelPt: 'Estupro',
    radius: 12,
  },
  tiroteio: {
    keywords: ['tiroteio', 'tiros', 'disparos', 'baleado', 'baleada', 'baleados',
               'tiro', 'atingido por tiro', 'alvejado', 'alvejada',
               'troca de tiros', 'fuzilamento'],
    severity: 4,
    label: '枪击',
    labelPt: 'Tiroteio',
    radius: 12,
  },
  trafico: {
    keywords: ['tráfico', 'trafico', 'traficante', 'drogas', 'droga', 'entorpecente',
               'cocaína', 'cocaina', 'crack', 'maconha', 'apreensão de drogas',
               'apreensao de drogas', 'boca de fumo', 'ponto de droga',
               'confronto.*polícia', 'confronto.*policia', 'operação policial',
               'operacao policial'],
    severity: 3,
    label: '毒品交火',
    labelPt: 'Tráfico/Confronto',
    radius: 10,
  },
  assalto: {
    keywords: ['assalto', 'assaltante', 'roubo', 'roubado', 'roubada', 'arrastão',
               'arrastao', 'mão armada', 'mao armada', 'armado', 'armada',
               'faca', 'facada', 'facão', 'esfaqueado', 'esfaqueada',
               'ônibus.*assalt', 'onibus.*assalt', 'roubo a ônibus',
               'saidinha de banco', 'furto', 'furtado'],
    severity: 3,
    label: '持械抢劫',
    labelPt: 'Assalto à mão armada',
    radius: 10,
  },
};

function classifyCrime(text) {
  const lower = text.toLowerCase();

  // Check latrocinio first (more specific than homicidio or assalto)
  for (const kw of CRIME_KEYWORDS.latrocinio.keywords) {
    if (new RegExp(kw, 'i').test(lower)) return 'latrocinio';
  }

  // Priority order for remaining types
  const typeOrder = ['homicidio', 'sequestro', 'estupro', 'tiroteio', 'trafico', 'assalto'];
  for (const type of typeOrder) {
    for (const kw of CRIME_KEYWORDS[type].keywords) {
      if (new RegExp(kw, 'i').test(lower)) return type;
    }
  }

  return null; // Not a crime article
}

function extractNeighborhood(text) {
  const lower = text.toLowerCase();
  let bestMatch = null;
  let bestLen = 0;

  for (const hood of NEIGHBORHOODS) {
    for (const alias of hood.aliases) {
      if (lower.includes(alias) && alias.length > bestLen) {
        bestMatch = hood;
        bestLen = alias.length;
      }
    }
  }
  return bestMatch;
}

// ========== News Fetching ==========
function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CrimeMapBot/1.0)' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function fetchGoogleNewsRSS(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  try {
    const xml = await fetch(url);
    const result = await parseStringPromise(xml, { explicitArray: false });
    const channel = result?.rss?.channel;
    if (!channel?.item) return [];
    const items = Array.isArray(channel.item) ? channel.item : [channel.item];
    return items.map(item => ({
      title: item.title || '',
      description: (item.description || '').replace(/<[^>]*>/g, ''),
      link: item.link || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      source: item.source?._ || item.source || 'Google News',
    }));
  } catch (e) {
    console.error(`Error fetching Google News RSS for "${query}":`, e.message);
    return [];
  }
}

async function fetchGDELT() {
  // GDELT GKG API: search for crime events in Salvador, Bahia
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=Salvador%20Bahia%20(crime%20OR%20homicidio%20OR%20assalto%20OR%20tiroteio%20OR%20violencia)&mode=artlist&maxrecords=50&format=json&sourcelang=por&timespan=1d';
  try {
    const data = await fetch(url);
    const json = JSON.parse(data);
    if (!json.articles) return [];
    return json.articles.map(a => ({
      title: a.title || '',
      description: '',
      link: a.url || '',
      pubDate: a.seendate ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')) : new Date(),
      source: a.domain || 'GDELT',
    }));
  } catch (e) {
    console.error('Error fetching GDELT:', e.message);
    return [];
  }
}

async function fetchAllNews() {
  const queries = [
    'Salvador Bahia homicídio crime',
    'Salvador Bahia assalto roubo',
    'Salvador Bahia tiroteio violência',
    'Salvador Bahia tráfico drogas operação policial',
    'Salvador Bahia sequestro estupro',
    'Salvador Bahia morte assassinato',
    'Salvador BA crime policia',
  ];

  const promises = [
    ...queries.map(q => fetchGoogleNewsRSS(q)),
    fetchGDELT(),
  ];

  const results = await Promise.allSettled(promises);
  const allArticles = [];
  const seenTitles = new Set();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        // Deduplicate by title similarity
        const titleKey = article.title.toLowerCase().trim().substring(0, 60);
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          allArticles.push(article);
        }
      }
    }
  }

  return allArticles;
}

function processCrimeData(articles) {
  const crimes = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000);

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const fullText = `${article.title} ${article.description}`;
    const crimeType = classifyCrime(fullText);

    if (!crimeType) continue; // Skip non-crime articles

    // Only include articles from last 24 hours
    if (article.pubDate < oneDayAgo) continue;

    const typeInfo = CRIME_KEYWORDS[crimeType];
    const hood = extractNeighborhood(fullText);

    // If no neighborhood matched, check if this news is about another city — skip it
    if (!hood) {
      const lowerText = fullText.toLowerCase();
      const isOtherCity = OTHER_CITIES.some(city => lowerText.includes(city));
      if (isOtherCity) continue;
    }

    let lat = null;
    let lng = null;
    let neighborhoodName = '位置未知';

    if (hood) {
      // Matched a neighborhood — use its coordinates with small offset
      lat = hood.lat + (Math.random() - 0.5) * 0.003;
      lng = hood.lng + (Math.random() - 0.5) * 0.003;
      neighborhoodName = hood.name;

      // Clamp to keep on land
      const westLimit = lat > -12.92 ? -38.505 : -38.515;
      if (lng < westLimit) lng = hood.lng + Math.random() * 0.003;
      if (lat < -13.005) lat = hood.lat + Math.random() * 0.003;
      if (lat < -13.02 || lat > -12.85 || lng < -38.52 || lng > -38.33) continue;
    }

    const hoursAgo = (now - article.pubDate) / 3600000;
    const h = Math.floor(hoursAgo);
    const m = Math.floor((hoursAgo - h) * 60);
    const timeStr = article.pubDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const timeAgo = h === 0 ? `${m}分钟前 (${timeStr})` : `${h}小时${m}分钟前 (${timeStr})`;

    crimes.push({
      id: crimes.length,
      type: crimeType,
      label: typeInfo.label,
      labelPt: typeInfo.labelPt,
      severity: typeInfo.severity,
      radius: typeInfo.radius,
      neighborhood: neighborhoodName,
      neighborhoodMatched: !!hood,
      title: article.title,
      description: article.description || article.title,
      link: article.link,
      source: article.source,
      lat,
      lng,
      time: article.pubDate.toISOString(),
      timeStr: timeAgo,
    });
  }

  // Sort by severity desc, then time desc
  crimes.sort((a, b) => b.severity - a.severity || new Date(b.time) - new Date(a.time));

  return crimes;
}

// ========== API Endpoint ==========
let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

app.get('/api/crimes', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedData && (now - cacheTime) < CACHE_TTL) {
      return res.json(cachedData);
    }

    console.log('Fetching fresh crime data from news sources...');
    const articles = await fetchAllNews();
    console.log(`Fetched ${articles.length} total articles`);

    const crimes = processCrimeData(articles);
    console.log(`Classified ${crimes.length} crime events`);

    const response = {
      success: true,
      count: crimes.length,
      fetchedAt: new Date().toISOString(),
      sources: ['Google News RSS', 'GDELT Project'],
      crimes,
    };

    cachedData = response;
    cacheTime = now;

    res.json(response);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Salvador Crime Map server running at http://localhost:${PORT}`);
  console.log('Fetching real-time crime data from news sources...');
});
