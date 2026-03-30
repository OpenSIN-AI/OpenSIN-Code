# Design Guidelines

**Module:** Design & UI  
**Version:** 1.0.0  
**Last Updated:** 2026-02-02

---

## 🎨 Design Principles

### 1. Mobile-First Approach
- Design für Mobile zuerst, dann Tablet, dann Desktop
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

### 2. Consistent Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Use Tailwind spacing utilities

### 3. Typography Scale
- Headings: font-bold, tracking-tight
- Body: font-normal, leading-relaxed
- Small: font-medium, text-sm

---

## 🧩 Component Guidelines

### Buttons
```tsx
// Primary Button
<Button variant="default" size="default">
  Action
</Button>

// Secondary Button
<Button variant="outline" size="default">
  Secondary
</Button>

// Destructive Button
<Button variant="destructive" size="default">
  Delete
</Button>
```

### Forms
- Always use labels
- Show validation errors inline
- Use appropriate input types
- Add helpful placeholder text

### Cards
- Consistent padding: p-6
- Subtle shadow: shadow-sm
- Rounded corners: rounded-lg
- Hover state for interactive cards

---

## 🎯 Best Practices

### DO
- ✅ Use Tailwind CSS for styling
- ✅ Follow shadcn/ui component patterns
- ✅ Maintain consistent spacing
- ✅ Use semantic HTML elements
- ✅ Ensure keyboard navigation works
- ✅ Test on multiple screen sizes

### DON'T
- ❌ Hardcode colors (use CSS variables)
- ❌ Use inline styles
- ❌ Skip accessibility attributes
- ❌ Ignore mobile users
- ❌ Create custom components when shadcn/ui exists

---

## 📚 Resources

- **Tailwind Docs:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Radix UI:** https://www.radix-ui.com

---

*This is a context module for the Context-Router system.*
