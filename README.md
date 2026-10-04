# Pianoboi (Web)

Save piano chords and organize them into sets.

Visit [pianoboi.site](https://pianoboi.site/) to see it in action.

## Developing

Install dependencies and start the React/Vite development server:

```bash
npm run dev
```

## Building

To type-check, test, and create a production version of the app:

```bash
npm run check
npm test
npm run build
```

## Live scratchpad

The app's right-side scratchpad reads Markdown from the `pianoboi-scratchpad` localStorage key.
It also supports safe piano helpers such as `<Key>C4</Key>`, `<Key note="C4" />`, and
`<Chord name="C major"><Keys>C4 E4 G4</Keys></Chord>`.

Agents and browser tools can update the open scratchpad immediately through the page API:

```js
window.pianoboiScratchpad.set('# Chorus\nPlay <Chord name="C"><Keys>C4 E4 G4</Keys></Chord>');
window.pianoboiScratchpad.append('Then move to <Key>F4</Key>.');
window.pianoboiScratchpad.clear();
```

Writing directly with `localStorage.setItem('pianoboi-scratchpad', content)` is also supported;
the drawer detects same-tab writes as well as updates from other browser contexts.
