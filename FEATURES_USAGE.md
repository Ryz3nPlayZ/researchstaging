# How to Use the New Features (Frontend)

After running `./run-all.sh`, open **http://localhost:3000** in your browser. Log in if the app requires authentication.

---

## 1. AI Chat (bottom pill) and writing into documents

**What it is:** A global chat bar at the bottom of the screen. You can ask the AI to add or edit content in the current document, and it will perform the edits for you (Cursor-like).

**How to use:**

1. **Open a project**  
   Go to **Projects** and open an existing project (or create one).

2. **Open or create a document**  
   In the project, open the **Documents** tab and either open an existing document or create a new one (e.g. “My draft”).  
   The document opens in the **document editor** (split view: Source | Preview).

3. **Use the bottom pill**  
   At the bottom center of the screen you’ll see a pill-shaped bar (e.g. “Ask AI or request a task…”).

4. **Ask the AI to write**  
   - Click the pill to expand the chat if needed.  
   - Type a request that clearly asks for document content, for example:  
     - *“Add a short introduction paragraph about machine learning.”*  
     - *“Write a section titled Related Work and summarize three key papers.”*  
     - *“Add a paragraph explaining the methodology.”*  
   - Send the message (Enter or send button).

5. **Let the AI run the tool**  
   The AI will use the **write_to_document** tool. You’ll see a short “Executing…” state, then the new content will appear in your document.  
   - If you’re on the document page, the **Source** pane updates (and **Preview** re-renders).  
   - You can also say *“Create a new document titled X”* and the AI can use **create_document**; the new doc will show in the Documents list.

**Tips:**  
- Be specific (“add a paragraph about X”) so the AI writes into the doc instead of only replying in chat.  
- The AI sees the current document source (Markdown/LaTeX); it will write in the same format (including math with `$...$` and `$$...$$`).

---

## 2. LaTeX / Markdown document editor (source + live preview)

**What it is:** Each document has a **Source** pane (raw text: Markdown and LaTeX math) and a **Preview** pane that renders it live (including math). The AI and the bottom-pill chat write into this same source.

**How to use:**

1. **Open a document**  
   From a project, go to **Documents** and open a document (or create one).  
   You’ll see two panes: **Source** (left) and **Preview** (right).

2. **Edit in Source**  
   Type or paste in the **Source** pane. You can use:  
   - **Markdown:** `# Heading`, `**bold**`, lists, links, etc.  
   - **LaTeX math:**  
     - Inline: `$E = mc^2$`  
     - Block: `$$\int_0^1 x^2 dx$$`

3. **Preview updates live**  
   The **Preview** pane updates as you type. Math is rendered with KaTeX.

4. **AI toolbar (when in a document)**  
   Below the title you’ll see: **Write**, **Continue**, **Improve**, **Add Citations**.  
   - **Write** – AI writes the next section from where the document ends.  
   - **Continue** – AI continues from the current end.  
   - **Improve** – AI rewrites the full document for clarity/grammar.  
   - **Add Citations** – AI inserts `\cite{}`-style citations in the text.  
   Results appear in the **Source** pane and in **Preview**.

5. **Export to PDF**  
   Use **Export PDF** in the document header. The backend converts the source (Markdown/LaTeX math) to PDF via Pandoc (requires LaTeX on the server).

---

## 3. Literature search with ranking and explainability

**What it is:** In the **Literature** tab, search uses domain-adaptive intent, multi-source retrieval, and a multi-dimensional ranking. Each result can show a **relevance breakdown** (why it was ranked that way).

**How to use:**

1. **Open a project**  
   Go to **Projects** and open a project.

2. **Open the Literature tab**  
   In the project workspace, click the **Literature** tab (with the other tabs: Overview, Documents, etc.).

3. **Run a search**  
   In the search box at the top, type a natural-language query, e.g.:  
   - *“transformer models for image classification”*  
   - *“meta-analysis of mindfulness interventions”*  
   Then click **Search** (or press Enter).

4. **View results**  
   Results are ordered by a **final relevance score**. Each row shows title, authors, year, citation count, and (when ranking is used) a small **score** label.

5. **See why a paper was ranked that way**  
   For each result you can click **“Why ranked here?”** (with the chart icon).  
   A short breakdown appears, for example:  
   - Semantic alignment  
   - Attribute match  
   - Citation signal  
   - Recency  
   - Method / Dataset  
   So you can see why each paper was ranked where it was.

6. **Add papers to the project**  
   Use **Add** on a result to add that paper to **Project Literature** below. You can then use **Synthesize** for that set of papers if the feature is available.

**Note:** Ranking is on by default (`use_ranking=true`). The backend uses intent parsing, Semantic Scholar + arXiv (with expanded queries), OpenAlex for citation counts, and domain-weighted scoring before returning the list and breakdowns.

---

## Quick reference

| Feature              | Where                         | Action                                                                 |
|----------------------|-------------------------------|------------------------------------------------------------------------|
| AI chat (global)     | Bottom pill (any project page)| Type a request; AI can create/edit documents and run tools.            |
| Write into doc       | Bottom pill + document open   | Ask e.g. “Add a paragraph about X”; AI uses write_to_document.         |
| Document editor      | Project → Documents → a doc   | Edit **Source**; see **Preview**; use **Write/Continue/Improve/Cite**. |
| Export PDF           | Document header               | Click **Export PDF** (backend needs Pandoc + LaTeX).                   |
| Literature search    | Project → Literature tab       | Enter query → **Search** → open **“Why ranked here?”** on results.     |
| Add paper to project | Literature tab                | Click **Add** on a search result.                                     |

---

## Starting the app

From the project root:

```bash
./run-all.sh
```

- **Backend** runs on **http://localhost:8000** (API docs: http://localhost:8000/docs).  
- **Frontend** runs on **http://localhost:3000**.

Use **http://localhost:3000** for all of the above. Press **Ctrl+C** in the terminal to stop both servers.
