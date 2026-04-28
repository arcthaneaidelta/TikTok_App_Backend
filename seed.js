/**
 * Seed script for Loopz
 * Usage:  node seed.js [--reset]
 *   --reset  : wipes existing users/videos/comments before seeding
 *
 * Creates:
 *   - 1 Super Admin
 *   - 2 Content Creators (active)
 *   - 1 Content Creator (pending — for admin approval testing)
 *   - 2 End Users
 *   - 6 sample videos (uploaded to Cloudinary from public sample URLs)
 *   - 8 sample comments
 */
require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const connectDB = require('./config/db');
const User = require('./models/User');
const Video = require('./models/Video');
const Comment = require('./models/Comment');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SAMPLE_VIDEOS = [
  {
    title: 'Big Buck Bunny — Classic Animation',
    sourceUrl: 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
    musicName: 'Sintel Theme — OpenMovie',
    creator: 'creator_demo',
  },
  {
    title: 'Butterfly in Slow Motion',
    sourceUrl: 'https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4',
    musicName: 'Nature Sounds — AmbientFM',
    creator: 'creator_demo',
  },
  {
    title: 'Quick Coffee Recipe ☕',
    sourceUrl: 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
    musicName: 'Morning Beats — JazzCafe',
    creator: 'foodie_jane',
  },
  {
    title: 'Sunset Time-lapse 🌅',
    sourceUrl: 'https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4',
    musicName: 'Chill Vibes — LoFi',
    creator: 'foodie_jane',
  },
  {
    title: 'Dance Challenge 💃',
    sourceUrl: 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
    musicName: 'Pop Hit 2026 — DanceFloor',
    creator: 'creator_demo',
  },
  {
    title: 'Cute Pet Tricks 🐶',
    sourceUrl: 'https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4',
    musicName: 'Happy Tunes — KidsBeats',
    creator: 'foodie_jane',
  },
];

async function uploadToCloudinary(sourceUrl) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      sourceUrl,
      {
        folder: 'loopz/videos',
        resource_type: 'video',
        transformation: [{ duration: '60' }, { quality: 'auto' }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}

async function seed() {
  const reset = process.argv.includes('--reset');

  await connectDB();

  if (reset) {
    console.log('🗑️  Resetting database...');
    await Promise.all([
      User.deleteMany({}),
      Video.deleteMany({}),
      Comment.deleteMany({}),
    ]);
    console.log('   ✓ Cleared all collections');
  }

  console.log('👤 Creating users...');
  const usersData = [
    { username: 'admin', email: 'admin@loopz.com', password: 'admin123', role: 'superAdmin', status: 'active' },
    { username: 'creator_demo', email: 'creator@loopz.com', password: 'creator123', role: 'contentCreator', status: 'active' },
    { username: 'foodie_jane', email: 'jane@loopz.com', password: 'jane123', role: 'contentCreator', status: 'active' },
    { username: 'pending_creator', email: 'pending@loopz.com', password: 'pending123', role: 'contentCreator', status: 'pending' },
    { username: 'john_doe', email: 'john@loopz.com', password: 'user123', role: 'endUser', status: 'active' },
    { username: 'sara_smith', email: 'sara@loopz.com', password: 'user123', role: 'endUser', status: 'active' },
  ];

  const users = {};
  for (const u of usersData) {
    let existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`   - ${u.username} already exists, skipping`);
    } else {
      existing = await User.create(u);
      console.log(`   ✓ Created ${u.role}: ${u.username}`);
    }
    users[u.username] = existing;
  }

  // Skip videos if any already exist (avoid Cloudinary duplicates on rerun)
  const existingVideoCount = await Video.countDocuments();
  let createdVideos = [];

  if (existingVideoCount > 0 && !reset) {
    console.log(`📹 Skipping videos — ${existingVideoCount} already in DB. Use --reset to recreate.`);
    createdVideos = await Video.find();
  } else {
    console.log('📹 Uploading sample videos to Cloudinary (this takes ~30s)...');
    for (const v of SAMPLE_VIDEOS) {
      try {
        const creator = users[v.creator];
        if (!creator) continue;

        process.stdout.write(`   → Uploading: ${v.title}... `);
        const cloud = await uploadToCloudinary(v.sourceUrl);

        const video = await Video.create({
          title: v.title,
          videoUrl: cloud.secure_url,
          thumbnailUrl: cloud.secure_url.replace(/\.(mp4|mov|avi|mkv|webm)$/i, '.jpg'),
          cloudinaryPublicId: cloud.public_id,
          creator: creator._id,
          creatorUsername: creator.username,
          musicName: v.musicName,
          durationSeconds: cloud.duration || 0,
          views: Math.floor(Math.random() * 50000) + 1000,
          likes: Math.floor(Math.random() * 5000) + 50,
          shares: Math.floor(Math.random() * 200) + 5,
        });
        createdVideos.push(video);
        console.log('✓');
      } catch (err) {
        console.log(`✗ (${err.message})`);
      }
    }
  }

  console.log('💬 Creating comments...');
  const commentSeeds = [
    { vIdx: 0, user: 'john_doe', text: 'This is amazing! 🔥' },
    { vIdx: 0, user: 'sara_smith', text: 'How did you film this?' },
    { vIdx: 1, user: 'john_doe', text: 'Beautiful butterfly 🦋' },
    { vIdx: 2, user: 'sara_smith', text: 'Trying this tomorrow!' },
    { vIdx: 2, user: 'john_doe', text: 'Looks delicious 😋' },
    { vIdx: 3, user: 'creator_demo', text: 'Where was this filmed?' },
    { vIdx: 4, user: 'sara_smith', text: 'I love this song!' },
    { vIdx: 5, user: 'john_doe', text: 'Such a cute dog! ❤️' },
  ];

  let commentCreated = 0;
  for (const c of commentSeeds) {
    const video = createdVideos[c.vIdx];
    const user = users[c.user];
    if (!video || !user) continue;
    const exists = await Comment.findOne({ video: video._id, user: user._id, text: c.text });
    if (exists) continue;
    await Comment.create({
      video: video._id,
      user: user._id,
      username: user.username,
      text: c.text,
    });
    commentCreated++;
  }

  // Update commentCount on videos
  for (const v of createdVideos) {
    const count = await Comment.countDocuments({ video: v._id });
    await Video.findByIdAndUpdate(v._id, { commentCount: count });
  }

  console.log(`   ✓ Created ${commentCreated} new comments`);

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Super Admin:      admin@loopz.com / admin123');
  console.log('  Content Creator:  creator@loopz.com / creator123');
  console.log('  Content Creator:  jane@loopz.com / jane123');
  console.log('  Pending Creator:  pending@loopz.com / pending123  (awaiting approval)');
  console.log('  End User:         john@loopz.com / user123');
  console.log('  End User:         sara@loopz.com / user123');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
