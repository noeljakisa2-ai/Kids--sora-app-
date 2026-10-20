import fetch from 'node-fetch';
import fs from 'fs';
const videoData = {
 title: "The Brave Baby Turtle Learns Rainbow Colors - 3D Pixar Story",
 scenes: ["In a bright jungle, baby turtle sees rainbow","Turtle tries to catch red color, funny fall","Friends help turtle learn all colors","Turtle happy, says Be kind!"]
};
fs.writeFileSync('pending_video.json', JSON.stringify(videoData));
await fetch(`https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`,{
 method:'POST', headers:{'Content-Type':'application/json'},
 body: JSON.stringify({chat_id:process.env.TG_CHAT, text:`🔥 TRENDING FOUND\n\n✨ ORIGINAL:\n${videoData.title}\n\n${videoData.scenes.join('\n')}\n\nReply APPROVE`})
});