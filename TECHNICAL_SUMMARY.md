# Triple Take - Technical Summary

Quick reference for developers continuing this project.

## Stack
- Vite + TypeScript (strict mode)
- Vanilla JS (no framework)
- CSS with custom properties
- LocalStorage for persistence

## Build & Deploy
```bash
npm run build          # Builds to dist/
# Deploy dist/ to Netlify or any static host
```

## Architecture

### State Management
**Singleton pattern:** `getGameState()` returns centralized `GameStateManager`
- Subscriber pattern for reactive updates
- Immutable state updates
- Auto-saves to LocalStorage (debounced)

### Navigation
**ScreenManager** routes between screens
- All screens extend `BaseScreen`
- Can return sync or async HTMLElement

### Key State Flow
```
startNewGame()
  → startTurn()
  → markWordCorrect() / skipWord()
  → endTurn() (records stats)
  → completeRound() (when all words guessed)
  → Next round or game end
```

## Critical Implementation Notes

### Round Completion Race Condition
**Check BEFORE state updates:**
```typescript
const willCompleteRound = state.remainingWords.length === 1;
gameState.markWordCorrect();
if (willCompleteRound) {
  navigate('round-end');
}
```

### Turn History Management
**Detect new round to avoid overwriting:**
```typescript
const isNewRound = !lastRoundHistory ||
  lastRoundHistory.roundNumber !== state.currentRound;
```

### Skip Logic
Shuffle word into RANDOM position (not end of array)

## File Structure Priority

**Must understand:**
1. `src/types.ts` - All interfaces
2. `src/state/GameState.ts` - Core logic
3. `src/screens/PlayScreen.ts` - Gameplay

**Supporting:**
- `src/constants.ts` - Round definitions
- `src/components/Timer.ts` - Countdown
- `src/screens/ScreenManager.ts` - Navigation

## Common Issues

**Build errors:** Check for unused imports/variables (strict mode)

**Round stats wrong:** Verify `endTurn()` is called before `completeRound()`

**Navigation loops:** Check screen transition logic in PlayScreen

**Timer issues:** Ensure cleanup() stops timers on navigation

## Testing Focus

1. Complete full game (3 rounds)
2. Test round completion (guess last word)
3. Test skip functionality
4. Test pause/resume
5. Test persistence (refresh mid-game)
6. Test mobile layout

## Next Steps for Development

**Quick wins:**
- Add more word lists
- Sound effects
- Confetti on game end

**Major features:**
- PWA manifest
- LLM word generation
- Online multiplayer (Supabase)

## References
- Full docs: `claude.md`
- Original plan: `.claude/plans/deep-cooking-corbato.md`
- GitHub: Check commits for detailed history
