import fetch from 'node-fetch'; import fs from 'fs'; import { google } from 'googleapis'; import { execSync } from 'child_process';
const data = JSON.parse(fs.readFileSync('pending_video.json','utf8'));
for(let i=0;i<data.scenes.length;i++){
 const imgUrl=`https://image.pollinations.ai/prompt/${encodeURIComponent('3d pixar '+data.scenes[i])}?width=1280&height=720&nologo=true&seed=${i}`;
 const buf=await fetch(imgUrl).then(r=>r.arrayBuffer()); fs.writeFileSync(`scene${i}.jpg`, Buffer.from(buf));
}
execSync(`curl -L -o music.mp3 https://cdn.pixabay.com/audio/2022/03/24/audio_7d9bd4173c.mp3 && ffmpeg -y -framerate 0.25 -i scene%d.jpg -i music.mp3 -c:v libx264 -r 30 -pix_fmt yuv420p -shortest final_video.mp4`);
const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({refresh_token:process.env.GOOGLE_REFRESH_TOKEN});
const youtube = google.youtube({version:'v3', auth:oauth2Client});
const res=await youtube.videos.insert({ part:['snippet,status'], requestBody:{snippet:{title:data.title, description:data.scenes.join('\n')+" #Kids #3D", categoryId:"27"}, status:{privacyStatus:'private', selfDeclaredMadeForKids:true}}, media:{body:fs.createReadStream('final_video.mp4')}});
await fetch(`https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({chat_id:process.env.TG_CHAT, text:`🎬 VIDEO UPLOADED! https://youtube.com/watch?v=${res.data.id}`})});