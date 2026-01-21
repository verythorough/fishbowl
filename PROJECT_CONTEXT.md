# Triple Take - Project Context & History

This document captures the decision-making process and context from the initial development session.

## Session Overview

**Date:** January 2026
**Claude Version:** Sonnet 4.5
**Developer:** Jessica Parsons (worked at Netlify for 6 years)
**Repository:** verythorough/fishbowl (GitHub)
**Deploy:** Netlify

## Initial Requirements

### Game Concept
Based on Fishbowl/Monikers party game with specific customizations:
- Cooperative focus (not competitive teams)
- In-person mode (single device passed between players)
- Option for online mode (future phase with Supabase)
- Custom word lists (paste, upload, or LLM-generated)

### Technical Preferences
- **Minimal dependencies** - Avoid frameworks, keep it simple
- **Jamstack approach** - Build upfront, serve from CDN
- **TypeScript** - Learning opportunity
- **Netlify deployment** - Familiar platform, free hosting
- **Zero server cost** - No backend in Phase 1

### Design Preferences
- Fun, light, accessible design
- Harmonious/saturated colors (not too bright)
- Dark mode support
- Mobile-first (phones passed between players)

## Key Decisions Made

### Naming
**Final choice:** Triple Take
- Alternatives considered: Wordwave, Three Clues, Clued In, Round & Round
- Checked for conflicts: Found small Steam game, but different market (no issue)
- Repository remains "fishbowl" but app is "Triple Take"

### Round Order
**Monikers order** (reversed from traditional Fishbowl):
1. Any words/gestures
2. One word only
3. Charades
- User preference: This order feels better
- Optional bonus rounds: Bedsheet (4) and Sound Effects (5)

### Tech Stack
**Final:** Vite + TypeScript + Vanilla JS

**Considered:**
- React: Not needed, adds complexity
- Supabase vs PartyKit vs Firebase: Deferred to Phase 2
- Netlify Blobs vs Netlify DB: No real-time, polling would be needed
- Decision: Start with LocalStorage only, add backend later if needed

### State Management
**Centralized GameStateManager** (singleton)
- Single source of truth
- Subscriber pattern for reactivity
- Auto-save to LocalStorage
- Chosen over distributed state for simplicity and learning

## Implementation Journey

### Phase 1: Foundation
- Set up Vite + TypeScript with strict mode
- Created type system (GameState, Round, Turn, Word)
- Built design system with CSS custom properties
- Implemented base screen navigation

### Phase 2: Core State
- Built GameStateManager with all mutations
- Implemented LocalStorage with versioning
- Created word loading utilities (built-in, paste, upload)
- Added Fisher-Yates shuffle

### Phase 3: Setup Flow
- SetupScreen: Configure timer and rounds
- WordInputScreen: Three tabs for word sources
- ReviewScreen: Verify and edit words
- Connected to state management

### Phase 4: Gameplay
- Timer component with pause/resume
- RoundIntroScreen: Explain rules
- TurnIntroScreen: Pass device prompt
- PlayScreen: Live gameplay with timer, word display, buttons
- Wired up all game logic

### Phase 5: Completion
- TurnEndScreen: Turn statistics
- RoundEndScreen: Round results with encouragement
- GameEndScreen: Final summary with breakdown
- Full game loop working

## Bugs Fixed During Development

### Bug 1: Round Results Showing 0/0
**Problem:** Round End screen showed 0 words guessed, 0 turns
**Root cause:** `completeRound()` called without first calling `endTurn()` to record final turn stats
**Fix:** Call `endTurn()` before `completeRound()` when last word is guessed

### Bug 2: Duplicate Round After Completion
**Problem:** After marking last word correct, had to go through all words again
**Root cause:** `completeRound()` refilled words, subscriber saw words and didn't navigate
**Fix:** Check if last word BEFORE calling `markWordCorrect()`, navigate immediately after

### Bug 3: Only Last Round Shown in Game End
**Problem:** Game End screen only showed most recent round, not all rounds
**Root cause:** `endTurn()` overwrote previous round history instead of appending
**Fix:** Check if `lastRoundHistory.roundNumber !== state.currentRound` to detect new round

### Bug 4: TypeScript Build Errors for Netlify
**Problem:** Deployment failed on unused variables and async render signature
**Root cause:** Strict TypeScript mode caught errors not shown in dev
**Fix:** Removed unused imports, updated BaseScreen signature to support async

## Design Patterns Used

### State Management
- **Singleton pattern**: `getGameState()` returns same instance
- **Observer pattern**: Subscribe to state changes
- **Immutable updates**: Always create new objects
- **Debouncing**: Auto-save limited to once per second

### UI Architecture
- **Template Method pattern**: BaseScreen with concrete implementations
- **Factory pattern**: ScreenManager creates screens
- **Strategy pattern**: Different word loading strategies

### Code Organization
- **Separation of concerns**: State, UI, utilities cleanly separated
- **Single Responsibility**: Each screen handles one view
- **DRY principle**: Shared UI helpers in BaseScreen

## Lessons Learned

### What Worked Well
1. **Vanilla JS approach** - Simple, fast, no framework overhead
2. **Centralized state** - Easy to debug and reason about
3. **TypeScript strict mode** - Caught bugs early
4. **Clear screen flow** - Easy to navigate codebase
5. **Phase-by-phase development** - Incremental progress

### Challenges Encountered
1. **Race conditions** - State updates triggering premature navigation
2. **Async/sync mixing** - WordInputScreen needed async, others didn't
3. **History management** - Turn/round tracking required careful bookkeeping
4. **Build vs dev differences** - Strict mode errors only in build

### Best Practices Established
1. **Check before mutate** - Inspect state before calling mutations
2. **Cleanup on navigation** - Always stop timers and unsubscribe
3. **Immutable patterns** - Never mutate state directly
4. **Test full game loop** - Don't just test individual features

## Word List Curation

### Default Lists Created
- **classic.txt**: 50 well-known people/places/things
- **pop-culture.txt**: 50 modern references
- **mixed.txt**: 60 varied difficulty words

**Total:** 160 default words

### Sources Referenced
- Monikers PnP PDF (first 5 pages) - Provided by user
- Traditional Fishbowl game experience
- Pop culture relevance (2024-2026)

## Performance & Bundle Size

**Production build:**
- HTML: 0.54 kB
- CSS: 4.82 kB (gzipped: 1.42 kB)
- JS: 35.56 kB (gzipped: 8.93 kB)
- **Total:** ~11 kB gzipped

Very lightweight, fast loading!

## Deployment Strategy

### Netlify Configuration
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18+
- Auto-deploy from main branch

### No Server Requirements
- All client-side
- No environment variables
- No functions needed
- Zero ongoing cost

## Future Considerations

### Phase 2: Online Multiplayer
**When to implement:** After validating in-person mode works well

**Preferred approach:**
- Supabase for real-time database
- Room codes for joining games
- Device-to-device sync
- Row-level security to prevent abuse

**Netlify integration available**

### Additional Features (Prioritized)
1. **LLM word generation** - User provides API key (OpenAI/Anthropic)
2. **PWA manifest** - Install as app
3. **Sound effects** - Audio feedback
4. **More word lists** - Expand content
5. **Export stats** - Download results
6. **Confetti animation** - Game end celebration

## User Feedback Areas to Monitor

1. **Timer duration** - Is 60s the right default?
2. **Word list quality** - Are defaults engaging?
3. **Skip frequency** - Do people skip too much?
4. **Round difficulty** - Is progression good?
5. **Mobile UX** - Are buttons easy to tap during play?

## Recommended Next Steps

### Before Public Launch
- [ ] Test on multiple devices (iOS, Android)
- [ ] Get feedback from test game sessions
- [ ] Add more diverse word lists
- [ ] Consider accessibility features (larger text option, color blind mode)
- [ ] Add "How to Play" instructions on welcome screen

### Post-Launch Enhancements
- [ ] Analytics (privacy-respecting, like Plausible)
- [ ] Social sharing (share game URL)
- [ ] Custom word list sharing
- [ ] Community word list submissions

### Long-term Vision
- [ ] Online multiplayer mode
- [ ] Mobile app versions (iOS/Android)
- [ ] Internationalization (multiple languages)
- [ ] Tournament mode with scoring

## Code Maintenance Notes

### When Making Changes
1. Always test full game loop (all 3 rounds)
2. Test both timer expiration AND completing early
3. Check round statistics accuracy
4. Test on mobile, not just desktop
5. Run `npm run build` before committing

### Adding New Screens
1. Extend `BaseScreen`
2. Implement `render()` method
3. Register in `ScreenManager.registerScreens()`
4. Add to `Screen` union type in `types.ts`
5. Test navigation to/from the screen

### Adding New State Features
1. Update interfaces in `types.ts`
2. Add mutation method to `GameStateManager`
3. Update storage version if structure changes
4. Test state persistence (refresh during game)
5. Document in `claude.md`

## Acknowledgments

### Inspiration
- **Fishbowl** - Traditional party game (public domain)
- **Monikers** - Commercial adaptation by Alex Hague & Justin Vickers
- **fishbowl-game.com** - Online implementation by Avi Moondra

### Tools & Technologies
- **Claude Code** - AI pair programming
- **Vite** - Fast build tool
- **TypeScript** - Type safety
- **Netlify** - Hosting platform

## Contact for Questions

If continuing this project and you have questions:
1. Read `claude.md` thoroughly
2. Check `TECHNICAL_SUMMARY.md` for quick reference
3. Review `.claude/plans/deep-cooking-corbato.md` for original detailed plan
4. Look at git history for commit-by-commit story
5. Test the live game to understand UX flow

---

*This document captures the human decision-making and context that went into building Triple Take. It's meant to help future developers (including future you!) understand not just WHAT was built, but WHY.*

*Last updated: January 2026*
