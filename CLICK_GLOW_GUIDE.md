# Click Glow Effect - Implementation Guide

## What is it?

A subtle golden glow animation that appears when users click/tap buttons, cards, and other interactive elements.

## How to Use

Simply add the `click-glow` class to any interactive element:

### Examples

#### Basic Button
```tsx
<button className="bg-brand-gold text-brand-bg px-4 py-2 rounded click-glow">
  Click Me
</button>
```

#### Card/Plan Selection
```tsx
<div className="border border-brand-border rounded p-6 cursor-pointer click-glow glow-card">
  <h3>Investment Plan</h3>
  <p>Details here...</p>
</div>
```

#### Icon Button
```tsx
<button className="p-2 rounded-full hover:bg-brand-surface click-glow">
  <Settings className="w-5 h-5" />
</button>
```

## Combining with Existing Effects

The click-glow works alongside other existing effects:

### With Hover Glow
```tsx
<button className="glow-gold click-glow">
  <!-- Has both hover and click effects -->
</button>
```

### With Card Hover
```tsx
<div className="glow-card click-glow">
  <!-- Glows on hover and click -->
</div>
```

## Where to Apply

### Recommended Elements:
- ✅ All primary action buttons (Sign Up, Invest, Deposit, Withdraw)
- ✅ Secondary buttons (View More, Learn More)
- ✅ Navigation buttons
- ✅ Investment plan cards
- ✅ Tier selection cards
- ✅ Sector selection cards
- ✅ Settings options
- ✅ Modal action buttons

### Not Recommended:
- ❌ Text inputs (already have focus states)
- ❌ Static text or labels
- ❌ Disabled buttons
- ❌ Links in paragraphs (unless they're button-styled)

## Implementation Priority

### High Priority (User-facing actions):
1. Landing page: "Get Started", "View Prospectus" buttons
2. Login/Signup: "Sign In", "Create Account" buttons
3. Dashboard: "Deposit Funds", "Withdraw", "New Investment" buttons
4. Investment plans: All three plan cards
5. Sector cards: All investment sector cards

### Medium Priority:
6. Navigation items (mobile and desktop)
7. Modal buttons (Confirm, Cancel, Close)
8. Settings buttons (Save Profile, Update Theme)
9. Admin panel action buttons

### Low Priority:
10. Icon-only buttons
11. Dropdown menu items
12. Secondary/tertiary actions

## Technical Details

### CSS Animation
```css
@keyframes clickGlow {
  0% {
    box-shadow: 0 0 0 0 rgba(242, 202, 80, 0.6);
  }
  50% {
    box-shadow: 0 0 20px 6px rgba(242, 202, 80, 0.3);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(242, 202, 80, 0);
  }
}

.click-glow:active {
  animation: clickGlow 0.4s ease-out;
}
```

### Animation Properties:
- **Duration:** 0.4s (400ms)
- **Timing:** ease-out (smooth deceleration)
- **Trigger:** :active state (on click/tap)
- **Color:** Gold (#f2ca50) with opacity
- **Max spread:** 20px blur, 6px spread radius

## Mobile Considerations

The effect works on touch devices:
- Triggers on touch-start
- Complements existing touch feedback
- No performance impact (CSS-only animation)
- Works with existing `.click-glow:active` rule

## Accessibility

✅ The effect is purely visual and doesn't affect:
- Screen readers
- Keyboard navigation
- Focus states
- ARIA attributes

## Browser Support

✅ Works in all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (iOS and macOS)
- Opera

⚠️ Fallback: Older browsers ignore the animation (graceful degradation)

## Performance

✅ Optimized for performance:
- Pure CSS animation (no JavaScript)
- Uses box-shadow (GPU-accelerated)
- No layout reflow
- Minimal battery impact on mobile

## Example Implementation

### Before:
```tsx
<button onClick={handleInvest} className="bg-brand-gold text-brand-bg px-6 py-3 rounded">
  Invest Now
</button>
```

### After:
```tsx
<button onClick={handleInvest} className="bg-brand-gold text-brand-bg px-6 py-3 rounded click-glow">
  Invest Now
</button>
```

That's it! Just add `click-glow` to the className.
