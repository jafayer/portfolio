---
date: '2022-04-01T02:29:19+00:00'
draft: false
title: 'Runetunes'
summary: |
    RuneScape is a Massively Multiplayer Online Role-playing Game from the early 2000s. I built a web audio player that replicates and expands on the in-game music player’s functionality, look, and feel.
---

RuneScape is a Massively Multiplayer Online Role-Playing Game (MMORPG) from the early 2000s that still has a thriving community and playerbase. One of the things that any ‘scaper will recall fondly is the in-game music — there are hundreds of pleasant tunes that have specific places and memories attached to them.

{{< image src="runetunes.png" alt="A screenshot of the main Runetunes UI" width="300px" >}}

Runetunes builds off that nostalgia and lifts it into a music player built for the web, while taking care to replicate the in-game music player’s look, feel, and functionality.

It allows users to create, export, and share custom playlists and queues of songs, and to shuffle the entire RuneScape music library by visiting runetunes.com/shuffle.

## Technical Implementation

Though the app’s functionality is relatively simple, the development was quite iterative and I had to overcome a few key challenges. There are nearly 500 music tracks totaling about 20 GB of storage to store and load through the app — not an insignificant hurdle in terms of bandwidth, transfer, and disk size for a non-monetized application! In addition, web audio players can sometimes feel non-integrated, buggy, and not well-supported across devices, something I wanted to optimize for.

To clear the first hurdle, I sourced audio files directly from Archive.org, which had a fairly complete listing of tracks. I stored only JSON objects for every song, mapping the library to external mp3 files, and used the Fetch API to dynamically load and play the audio tracks. This dramatically reduced the hurdle of maintaining and hosting the application.

To help make using Runetunes feel a little more seamless, I utilized the experimental MediaSession API — this allows mobile devices and browsers that support the API to display notifications and more seamlessly control playback of content on Runetunes.

{{< image src="mediasession.png" alt="Utilizing the MediaSession API, we're able to get nice app-like audio controls and integrations with system APIs via the browser" width="250px" >}}