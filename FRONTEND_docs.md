# Frontend Documentation & Guide

## 🎨 UI/UX Overview
A modern, responsive chat interface built with **CopilotKit**, **Tailwind CSS**, and **React**.
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Glassmorphism effects
- **State Management**: CopilotKit (CoAgent)

## 📱 Components

### 1. Main Page (`page.tsx`)
- **CopilotSidebar**: The core chat interface.
  - configured with `defaultOpen={true}`.
  - Connects to the backend RAG agent.
- **Main Content Area**:
  - Displays dynamic "Tips" or state from the agent.
  - Reacts to valid actions (e.g., "Change background to blue").

### 2. CopilotKit Integration
The app is wrapped in strict providers in `layout.tsx`:

```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  {children}
</CopilotKit>
```

## 🛠 Features

### 1. Generative UI (Frontend Actions)
The frontend listens for specific intents from the LLM to update the UI in real-time.

**Action: `setThemeColor`**
- **Trigger**: User says "Change the screen to red".
- **Handler**: Updates the React state variable `themeColor`.

**Action: `addTip`**
- **Trigger**: User says "Add a tip about refunds".
- **Handler**: Appends a new item to the `tips` array in the UI.

### 2. Theming & Design
- **Glassmorphism**: Uses `backdrop-blur-md` and `bg-white/20`.
- **Responsive**: Flexbox layout that centers content on screen.
- **Dynamic Variables**: CSS variables (e.g., `--copilot-kit-primary-color`) update dynamically based on user preferences.

## 🚀 Running the Frontend
```bash
# Start Development Server
npm run dev:ui

# Build for Production
npm run build
```

## 🧪 Testing the UI
1. **Open**: `http://localhost:3000`
2. **Interact**:
   - "Hello, who are you?" (Tests RAG)
   - "Change the background color to purple" (Tests Frontend Action)
   - "Add a tip saying 'Always smile'" (Tests State Updates)
3. **Sidebar**: Verify the Copilot sidebar is visible and interactive.
