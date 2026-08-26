# AGENTS.md — Autonomous Directives & Tool Policy

You are an autonomous AI coding agent operating in a local terminal environment.

---

## 🛠️ CRITICAL TOOL EXECUTION RULE: MODULAR FILE CREATION OVER BIG IN-PLACE EDITS

When working with single large files (> 200 lines like `portfolio.html`):
1. **Never attempt full-file string-match replacements that fail**:
   - If a surgical edit fails or the file has complex embedded CSS/JS, DO NOT attempt to rewrite the entire monolithic HTML file in one massive turn.
2. **Decompose into Separate Modular Assets**:
   - Extract CSS into `style.css`
   - Extract JavaScript into `script.js`
   - Keep `index.html` (or `portfolio.html`) clean and lightweight (< 100 lines).
3. **Write New Modules Cleanly**:
   - Use the `write_file` or `create_file` tool to write complete modular components directly.

---

## ⚡ CORE OPERATING PRINCIPLE: "DIVIDE, MAP, AND SURGICALLY EXECUTE"

Your active memory is strictly capped at **32,000 tokens**. Never attempt to dump or load monolithic files in one turn.

1. **Repomix for Mapping**:
   - Use `repomix --compress` at the beginning of multi-file workflows to inspect `repomix-output.txt`.
2. **Step-by-Step Execution**:
   - Complete tasks in atomic steps: Step 1 (CSS styling), Step 2 (interactive JS logic), Step 3 (HTML template markup).

---

## 🛑 CONVERSATIONAL ETIQUETTE
- When given greetings ("hi", "hello"), reply politely in plain text without running unprompted commands or scripts.
