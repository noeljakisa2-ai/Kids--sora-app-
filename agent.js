const fs = require('fs');
const { google } = require('googleapis');

const env = process.env;
const required = ['YT_CLIENT_ID', 'YT_CLIENT_SECRET', 'YT_REFRESH_TOKEN', 'TG_TOKEN', 'TG_CHAT'];
const missing = required.filter(key => !env[key]);
if (missing.length) {
  console.error('Missing required GitHub Secrets:', missing.join(', '));
  process.exit(1);
}

const auth = new google.auth.OAuth2(
  env.YT_CLIENT_ID,
  env.YT_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);
auth.setCredentials({ refresh_token: env.YT_REFRESH_TOKEN });
const youtube = google.youtube({ version: 'v3', auth });

const escapeHtml = value => String(value ?? '').replace(/[&<>"]/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
}[ch]));

async function getPopularVideos(categoryId) {
  const response = await youtube.videos.list({
    part: ['snippet', 'statistics'],
    chart: 'mostPopular',
    regionCode: 'UG',
    videoCategoryId: categoryId,
    maxResults: 20
  });
  return response.data.items || [];
}

function chooseTheme(videos) {
  const text = videos.map(v => v.snippet?.title || '').join(' ').toLowerCase();
  const themes = [
    { words: ['treasure', 'gold', 'lost', 'mystery'], theme: 'a silly jungle treasure mystery' },
    { words: ['animal', 'monkey', 'cat', 'dog', 'baby', 'pet'], theme: 'a funny animal friendship adventure' },
    { words: ['song', 'music', 'dance', 'sing'], theme: 'a musical animal adventure with a catchy original song' },
    { words: ['challenge', 'race', 'fast', 'competition'], theme: 'a playful jungle challenge where teamwork wins' },
    { words: ['rainbow', 'color', 'magic', 'rain'], theme: 'a colorful magical animal adventure' }
  ];
  const ranked = themes.map(item => ({
    ...item,
    score: item.words.reduce((sum, word) => sum + (text.match(new RegExp('\\b' + word + '\\b', 'g')) || []).length, 0)
  })).sort((a, b) => b.score - a.score);
  return ranked[0].score > 0 ? ranked[0].theme : 'a funny animal adventure about helping a friend';
}

async function main() {
  // Use current popular videos only as broad signals. Never copy their titles, characters, or plots.
  const videos = [
    ...await getPopularVideos('15'), // Pets & Animals
    ...await getPopularVideos('1')   // Film & Animation
  ];
  if (!videos.length) throw new Error('YouTube returned no popular videos for the selected categories.');

  const idea = chooseTheme(videos);
  const topSignals = videos
    .sort((a, b) => Number(b.statistics?.viewCount || 0) - Number(a.statistics?.viewCount || 0))
    .slice(0, 5)
    .map(v => ({
      title: v.snippet?.title || '',
      channel: v.snippet?.channelTitle || '',
      publishedAt: v.snippet?.publishedAt || '',
      views: Number(v.statistics?.viewCount || 0),
      videoId: v.id
    }));

  const result = {
    researchedAt: new Date().toISOString(),
    source: 'YouTube Data API mostPopular; region UG; categories Pets & Animals and Film & Animation',
    trendSignals: topSignals,
    originalIdea: `DIABLOOON: ${idea[0].toUpperCase() + idea.slice(1)}`,
    originalityRule: 'Use trend signals only for broad themes. Do not reuse another creator’s characters, title, dialogue, or plot.',
    scenes: [
      'Opening gag: Diablooon discovers a strange clue and reacts with a funny expression.',
      'The team investigates; each friend contributes a different skill.',
      'A harmless obstacle causes a surprising, funny mix-up.',
      'The friends sing a short original teamwork song.',
      'They solve the problem by cooperating, not by fighting.',
      'A cheerful payoff, a kindness lesson, and a playful goodbye.'
    ],
    approvalRequired: true,
    publishingAllowed: false
  };
  fs.writeFileSync('pending_video.json', JSON.stringify(result, null, 2));

  const summary = [
    '🎬 <b>DIABLOOON TREND RESEARCH</b>',
    `Checked: ${escapeHtml(result.researchedAt)}`,
    `Signals reviewed: ${videos.length} popular videos across two categories`,
    '',
    `💡 <b>Original concept:</b> ${escapeHtml(result.originalIdea)}`,
    '',
    '<b>Top trend signals (research only):</b>',
    ...topSignals.map((v, i) => `${i + 1}. ${escapeHtml(v.title)} — ${escapeHtml(v.channel)} (${v.views.toLocaleString()} views)`),
    '',
    '<b>Important:</b> This is research, not a copied script. No video was generated or published.',
    'Reply APPROVE in your review process only after you inspect the finished video.'
  ].join('\n');

  const response = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TG_CHAT, text: summary, parse_mode: 'HTML' })
  });
  const telegram = await response.json();
  if (!response.ok || !telegram.ok) throw new Error('Telegram notification failed.');
  console.log(`Trend research complete: reviewed ${videos.length} popular videos; saved pending_video.json. Nothing was published.`);
}

main().catch(error => {
  console.error('Trend research failed:', error.response?.data || error.message);
  process.exitCode = 1;
});
