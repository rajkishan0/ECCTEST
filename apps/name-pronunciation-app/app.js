(function () {
  "use strict";

  const form = document.getElementById("name-form");
  const nameInput = document.getElementById("name-input");
  const resultsSection = document.getElementById("results");
  const resultsTitle = document.getElementById("results-title");
  const cardGrid = document.getElementById("card-grid");
  const emptyState = document.getElementById("empty-state");
  const voiceWarning = document.getElementById("voice-warning");
  const playbackControls = document.getElementById("playback-controls");
  const rateRange = document.getElementById("rate-range");
  const rateValue = document.getElementById("rate-value");

  const synth = window.speechSynthesis;
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  let voices = [];
  let currentlyPlayingBtn = null;

  function loadVoices() {
    voices = synth ? synth.getVoices() : [];
  }

  if (speechSupported) {
    loadVoices();
    if (typeof synth.onvoiceschanged !== "undefined") {
      synth.onvoiceschanged = loadVoices;
    }
  } else {
    voiceWarning.hidden = false;
    voiceWarning.textContent =
      "Your browser doesn't support speech synthesis, so pronunciations can't be played aloud here. Try Chrome, Edge, or Safari.";
  }

  function findVoice(langTag) {
    if (!voices.length) return null;
    const exact = voices.find((v) => v.lang.toLowerCase() === langTag.toLowerCase());
    if (exact) return exact;
    const prefix = langTag.split("-")[0].toLowerCase();
    return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) || null;
  }

  const BADGE_COLORS = [
    "#e0645a", "#e0945a", "#d9b64a", "#8fbf5a", "#4fae8a",
    "#4fa3ae", "#5a8fe0", "#7c8cff", "#9d6bff", "#c264c9", "#d9578f",
  ];

  function badgeColor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return BADGE_COLORS[hash % BADGE_COLORS.length];
  }

  function badgeCode(langTag) {
    return (langTag.split("-")[1] || langTag.split("-")[0]).toUpperCase().slice(0, 2);
  }

  function speak(text, langTag, button) {
    if (!speechSupported) return;

    synth.cancel();
    if (currentlyPlayingBtn) {
      currentlyPlayingBtn.classList.remove("playing");
    }

    const voice = findVoice(langTag);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice ? voice.lang : langTag;
    if (voice) utterance.voice = voice;
    utterance.rate = parseFloat(rateRange.value) || 0.9;

    utterance.onstart = () => {
      currentlyPlayingBtn = button;
      button.classList.add("playing");
    };
    utterance.onend = utterance.onerror = () => {
      button.classList.remove("playing");
      if (currentlyPlayingBtn === button) currentlyPlayingBtn = null;
    };

    synth.speak(utterance);
  }

  function buildCard(name, locale) {
    const card = document.createElement("article");
    card.className = "card";

    const hasExactVoice = !!findVoice(locale.lang);
    if (!hasExactVoice) card.classList.add("approx");

    card.innerHTML = `
      <div class="card-badge" style="background:${badgeColor(locale.country + locale.language)}">${badgeCode(locale.lang)}</div>
      <div class="card-body">
        <h3>${locale.country}</h3>
        <p class="card-language">${locale.language} <span class="locale-tag">${locale.lang}</span>${
          hasExactVoice ? "" : '<span class="approx-tag">closest available voice</span>'
        }</p>
      </div>
      <button type="button" class="play-btn" aria-label="Play pronunciation for ${locale.country}, ${locale.language}">
        🔊
      </button>
    `;

    const button = card.querySelector(".play-btn");
    if (!speechSupported) {
      button.disabled = true;
      button.title = "Speech synthesis isn't supported in this browser";
    } else {
      button.addEventListener("click", () => speak(name, locale.lang, button));
    }

    return card;
  }

  function render(name) {
    cardGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    NAME_LOCALES.forEach((locale) => fragment.appendChild(buildCard(name, locale)));
    cardGrid.appendChild(fragment);

    resultsTitle.textContent = `"${name}" — ${NAME_LOCALES.length} pronunciations`;
    resultsSection.hidden = false;
    emptyState.hidden = true;
    playbackControls.hidden = !speechSupported;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    render(name);
  });

  rateRange.addEventListener("input", () => {
    rateValue.textContent = `${parseFloat(rateRange.value).toFixed(1)}x`;
  });
})();
