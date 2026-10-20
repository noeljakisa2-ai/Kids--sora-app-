const fs = require('fs');
const { google } = require('googleapis');

// SAFE - No secrets here, reads from GitHub Secrets
const CLIENT_ID = process.env.YT_CLIENT_ID;
const CLIENT_SECRET = process.env.YT_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YT_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('❌ Missing Secrets! Add in GitHub Settings -> Secrets');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

const DIABLOOON_BRANDING = {
  characters: 'Diablooon, Bello, Luna, Tico, Sky - LOCKED DESIGN',
  tags: ['DIABLOOON', 'Diablooon', 'Bello', 'Luna', 'Tico', 'Sky']
};

async function upload() {
  const videoPath = './video.mp4';
  const thumbPath = './thumbnail.jpg';

  console.log('🚀 Uploading DIABLOOON - Characters LOCKED...');

  const res = await youtube.videos.insert({
    part: ['snippet,status'],
    requestBody: {
      snippet: {
        title: 'Diablooon & The Crew - Big Adventures!',
        description: `DIABLOOON - Big Adventures, Little Friends!
Meet OFFICIAL LOCKED CREW:
🐵 Diablooon - brave leader
🐘 Bello - strong friendly elephant
🐰 Luna - cheerful rabbit
🐢 Tico - smart turtle
🦜 Sky - fun parrot
Adventure • Friendship • Kindness`,
        tags: DIABLOOON_BRANDING.tags,
        categoryId: '24'
      },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: true }
    },
    media: { body: fs.createReadStream(videoPath) }
  });

  const videoId = res.data.id;
  console.log(`✅ UPLOADED: https://youtube.com/watch?v=${videoId}`);

  if (fs.existsSync(thumbPath)) {
    await youtube.thumbnails.set({
      videoId: videoId,
      media: { body: fs.createReadStream(thumbPath) }
    });
    console.log('✅ Thumbnail set with locked characters');
  }
}

upload().catch(err => {
  console.error('❌ FAILED:', err.response?.data || err.message);
});