const fs = require('fs');
const { google } = require('googleapis');

// Fail closed: direct execution cannot publish unless the workflow/user explicitly approves.
if (process.env.PUBLISH_APPROVED !== 'APPROVE') {
  console.error('⛔ Publishing blocked. Explicit approval is required: set PUBLISH_APPROVED=APPROVE only after reviewing the video.');
  process.exit(1);
}

// SAFE - credentials are read only from GitHub Secrets.
const CLIENT_ID = process.env.YT_CLIENT_ID;
const CLIENT_SECRET = process.env.YT_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YT_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('❌ Missing YouTube secrets. Add them in GitHub Settings -> Secrets.');
  process.exit(1);
}

const videoPath = './video.mp4';
if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size === 0) {
  console.error('❌ video.mp4 is missing or empty. Nothing was uploaded.');
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
  const thumbPath = './thumbnail.jpg';
  console.log('🚀 Explicit approval received. Uploading DIABLOOON video...');

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
      videoId,
      media: { body: fs.createReadStream(thumbPath) }
    });
    console.log('✅ Thumbnail set with locked characters');
  }
}

upload().catch(err => {
  console.error('❌ FAILED:', err.response?.data || err.message);
  process.exitCode = 1;
});
