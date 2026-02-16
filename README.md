# Interval Timer

A minimal, mobile-friendly interval timer with custom sounds and Web Workers for accurate countdown on iOS/Android.

## Features

- **Core Timer**: Total duration (N min) and interval alerts (M min). Alerts at each M-minute mark.
- **Web Workers**: Accurate countdown when screen is locked or tab is in background.
- **Custom Sounds**: Upload interval and finish sounds (.mp3, .wav, .m4a). Stored in IndexedDB.
- **Mobile Sound Unlock**: "Activate Sound & Notifications" button to unlock Web Audio API on iOS.
- **Notifications**: Web Notifications at each interval and when the timer finishes.
- **Circular Progress**: Visual countdown with interval markers.

## Setup

### Prerequisites

- Node.js 18+

### Install

```bash
cd interval-timer
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
npm run preview
```

### Telegram alerts (optional)

To send interval reminders to Telegram, run the server and set env vars:

```bash
set TELEGRAM_BOT_TOKEN=8580855158:AAH_6G1sxG8NZYb6Qfv8CGC7CECfDtHfajU
set TELEGRAM_CHAT_ID=875584140
npm run server
```

Then in another terminal run `npm run dev`. The timer will POST to `/api/alert` at each interval.

## Notes

- **iOS/Mobile**: Tap "Activate Sound & Notifications" before starting the timer so sounds play.
- **Silent mode**: Web Audio plays through the media channel; iOS may still respect silent switch.
