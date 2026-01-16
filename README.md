🧠 Research Pulse

Turn Doomscrolling into Discovery

Research Pulse is a Firefox extension that intercepts short-form distraction (YouTube Shorts, Instagram Reels, TikTok) and replaces it with real academic curiosity. Instead of blocking your time, it redirects your attention to cutting-edge research from arXiv, personalized to your interests.

This is not a productivity nanny.
It’s an intervention.

⸻

🚀 What It Does

When you open a known distraction site:
	•	🔕 Instantly silences autoplaying media
	•	🛑 Temporarily hides the page
	•	🧠 Launches a full-screen Research Intervention UI
	•	📄 Presents a randomly selected arXiv paper based on your interests
	•	📊 Tracks time reclaimed, papers read, streaks, and academic “rank”
	•	🔍 Redirects curiosity into structured research searches

You can still opt out — but you’ll have to own that decision.

⸻

✨ Core Features

🧬 Intelligent Distraction Detection

Automatically triggers on:
	•	YouTube Shorts
	•	Instagram Reels
	•	TikTok

No permissions beyond page access. No background spying.

⸻

📚 Personalized Research Feed
	•	Choose your academic domains during onboarding
	•	Pulls fresh papers directly from arXiv
	•	Randomized selection to encourage exploration
	•	Abstracts rendered with MathJax (LaTeX supported)

Supported fields include:
	•	Condensed Matter Physics
	•	High Energy Physics
	•	Quantum Physics
	•	Computer Science
	•	Mathematics
	•	Electrical Engineering
	•	Quantitative Biology
	•	Quantitative Finance
	•	Statistics

⸻

🧠 Research Gamification (Done Right)

Progress is measured by time reclaimed, not streak anxiety.

Academic Ranks
	•	Lab Assistant
	•	Undergrad
	•	Graduate
	•	Postdoc
	•	Professor
	•	Nobel

Includes:
	•	🔥 Daily streak tracking
	•	⏱ Minutes saved
	•	📄 Papers read
	•	📈 Progress bar per rank

All data is stored locally only via localStorage.

⸻

🔍 Curiosity Redirection

Instead of “search dopamine”:
	•	Ask a research question
	•	Redirects to Consensus.app for evidence-based answers
	•	Remembers your last 3 topics for quick re-entry

⸻

🧯 Grace Mode
	•	If you really want to doomscroll, you can
	•	Grants a 5-minute grace window
	•	No shame — just accountability

⸻

🛠 How It Works (Technical Overview)
	•	Runs entirely as a content script
	•	Uses DOM scraping on arXiv /list/{category}/new
	•	Injects MathJax dynamically when needed
	•	Uses MutationObserver to lock tab title
	•	Uses favicon injection for visual context switching
	•	No external libraries
	•	No analytics
	•	No tracking
	•	No backend

⸻

🔐 Privacy & Ethics
	•	❌ No user data collection
	•	❌ No remote servers
	•	❌ No analytics
	•	✅ 100% local storage
	•	✅ Open source by design

Your research habits stay yours.
