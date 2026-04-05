# Riffle 🎬

> Watch. Earn. Grow. — A platform for small creators to get real exposure.

Riffle is an MVP video discovery platform where users submit YouTube videos, watch others' content to earn points, and spend those points to promote their own videos.

---

## Features

- **Video Feed** — Scrollable feed of YouTube embeds, promoted videos first
- **Watch Timer** — 30s watch = 10 points earned (de-duplicated per user per video)
- **Points System** — Earn by watching, spend to promote
- **Promotion Queue** — Spend 30pts for a 24-hour top-of-feed boost
- **User Accounts** — Email/password auth with nicknames
- **Invite System** — Shareable links; earn 100pts per successful referral
- **Ad Placements** — Non-intrusive banners ready for Google AdSense
- **Ad Impression Tracking** — Every ad view logged to Firestore

---

## Tech Stack

| Layer      | Technology                      |
|------------|----------------------------------|
| Frontend   | React 18 + Vite                  |
| Routing    | React Router v6                  |
| Auth       | Firebase Authentication          |
| Database   | Firebase Firestore               |
| Hosting    | Netlify (frontend)               |
| Styling    | CSS Modules (no external UI lib) |

---

## Database Schema

### `users/{uid}`
```json
{
  "uid": "string",
  "email": "string",
  "nickname": "string",
  "points": 50,
  "videosSubmitted": 0,
  "totalWatchTime": 0,
  "inviteCode": "ABC12345",
  "invitedBy": "XYZ98765 | null",
  "createdAt": "timestamp"
}
```

### `videos/{videoId}`
```json
{
  "submittedBy": "uid",
  "submitterNickname": "string",
  "url": "https://youtube.com/...",
  "youtubeId": "dQw4w9WgXcQ",
  "title": "string",
  "description": "string",
  "thumbnail": "string",
  "views": 0,
  "promoted": false,
  "promotedUntil": "timestamp | null",
  "promotionScore": 0,
  "lastPromotedAt": "timestamp | null",
  "submittedAt": "timestamp"
}
```

### `watchEvents/{userId_videoId}`
```json
{
  "userId": "uid",
  "videoId": "vid",
  "pointsEarned": 10,
  "watchedAt": "timestamp"
}
```

### `promotionEvents/{autoId}`
```json
{
  "userId": "uid",
  "videoId": "vid",
  "pointsSpent": 30,
  "promotedAt": "timestamp"
}
```

### `inviteEvents/{code_newUserId}`
```json
{
  "referrerId": "uid",
  "newUserId": "uid",
  "pointsAwarded": 100,
  "createdAt": "timestamp"
}
```

### `adImpressions/{autoId}`
```json
{
  "slotId": "feed_inline | feed_banner_top | sidebar",
  "userId": "uid | anonymous",
  "timestamp": "timestamp"
}
```

### `adStats/{date_slotId}`
```json
{
  "date": "2024-01-01",
  "slotId": "feed_inline",
  "impressions": 142
}
```

---

## Points Reference

| Action               | Points  |
|----------------------|---------|
| Sign up              | +50     |
| Submit a video       | +5      |
| Watch 30s of a video | +10     |
| Invite someone       | +100    |
| Promote a video      | −30     |

---

## Setup

### 1. Clone and install
```bash
git clone <your-repo>
cd riffle
npm install
```

### 2. Create a Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. `riffle-app`)
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (start in production mode)
5. Go to Project Settings → Your Apps → Add Web App
6. Copy the config values

### 3. Configure environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase config values
```

### 4. Deploy Firestore rules and indexes
```bash
npm install -g firebase-tools
firebase login
firebase init  # Select Firestore, use existing project
firebase deploy --only firestore
```

### 5. Run locally
```bash
npm run dev
# Open http://localhost:5173
```

---

## Deploying to Netlify

### Option A: Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Option B: Netlify Dashboard
1. Push your code to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → New site from Git
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables (copy from `.env.local`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. Deploy!

The `netlify.toml` handles SPA routing automatically.

---

## Adding Google AdSense (Future)

1. Sign up at [adsense.google.com](https://adsense.google.com)
2. Add this to `index.html`:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID" crossorigin="anonymous"></script>
   ```
3. In `src/components/AdBanner.jsx`, replace the placeholder `<div>` with:
   ```jsx
   <ins className="adsbygoogle"
     style={{ display: 'block' }}
     data-ad-client="ca-pub-YOUR_ID"
     data-ad-slot="YOUR_SLOT_ID"
     data-ad-format="auto"
     data-full-width-responsive="true" />
   ```
4. The impression tracking in `adService.js` remains intact.

---

## Future: Leaderboard System

When ready to add the leaderboard:

1. **Schema additions** to `users` document:
   ```json
   {
     "weeklyPoints": 0,
     "monthlyPoints": 0,
     "leaderboardOptIn": true
   }
   ```

2. **New collection**: `leaderboardSnapshots/{week|month}`
   ```json
   {
     "period": "2024-W12",
     "type": "weekly",
     "rankings": [
       { "rank": 1, "userId": "uid", "nickname": "...", "points": 420 }
     ],
     "prizes": { "rank1": "72h_promo", "rank2": "48h_promo", "rank3": "24h_promo" }
   }
   ```

3. **Firebase Cloud Function** (weekly cron) to snapshot and reset weekly points

4. **UI**: Add leaderboard widget to `FeedPage.jsx` sidebar and a full `/leaderboard` route

The `comingSoon` widget in the sidebar and `leaderboardTeaser` in the dashboard are already placeholder slots for this.

---

## Project Structure

```
riffle/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx / .module.css
│   │   ├── VideoCard.jsx / .module.css
│   │   └── AdBanner.jsx / .module.css
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── FeedPage.jsx / .module.css
│   │   ├── AuthPage.jsx / .module.css
│   │   ├── SubmitPage.jsx / .module.css
│   │   └── DashboardPage.jsx / .module.css
│   ├── services/
│   │   ├── videoService.js
│   │   ├── pointsService.js
│   │   └── adService.js
│   ├── styles/
│   │   └── global.css
│   ├── firebase.js
│   ├── App.jsx
│   └── main.jsx
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── netlify.toml
├── .env.example
└── package.json
```

---

## License

MIT
