# Frontend Implementation Guide
## Research Platform - Engineer's Handbook

---

## 🎯 Mission

Build a **calm, intelligent, and friction-free** research platform that feels like a conversation with a knowledgeable colleague. Every interaction should be **instant, predictable, and delightful**.

---

## 📐 Design System

### Color Palette

```css
/* Primary Colors */
--color-primary: #4A90E2;        /* Calm Blue - Trust, Intelligence */
--color-primary-light: #6BA3E8;
--color-primary-dark: #3A7BC8;

/* Secondary Colors */
--color-secondary: #FF6B6B;      /* Warm Coral - Energy, Creativity */
--color-secondary-light: #FF8787;
--color-secondary-dark: #E85555;

/* Semantic Colors */
--color-success: #51CF66;
--color-warning: #FFA94D;
--color-error: #FF6B6B;
--color-info: #4A90E2;

/* Neutral Palette */
--color-gray-50: #F8F9FA;
--color-gray-100: #F1F3F5;
--color-gray-200: #E9ECEF;
--color-gray-300: #DEE2E6;
--color-gray-400: #CED4DA;
--color-gray-500: #ADB5BD;
--color-gray-600: #868E96;
--color-gray-700: #495057;
--color-gray-800: #343A40;
--color-gray-900: #212529;

/* Background & Surface */
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F8F9FA;
--color-bg-tertiary: #F1F3F5;
--color-surface: #FFFFFF;
--color-surface-hover: #F8F9FA;

/* Text Colors */
--color-text-primary: #212529;
--color-text-secondary: #495057;
--color-text-tertiary: #868E96;
--color-text-disabled: #ADB5BD;
--color-text-inverse: #FFFFFF;
```

### Typography

```css
/* Font Families */
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

/* Font Sizes (1.25 ratio) */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.25rem;    /* 20px */
--font-size-xl: 1.563rem;   /* 25px */
--font-size-2xl: 1.953rem;  /* 31px */
--font-size-3xl: 2.441rem;  /* 39px */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line Heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Spacing System

```css
/* Base: 8px */
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.5rem;   /* 24px */
--space-6: 2rem;     /* 32px */
--space-7: 2.5rem;   /* 40px */
--space-8: 3rem;     /* 48px */
--space-9: 4rem;     /* 64px */
--space-10: 5rem;    /* 80px */
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### Transitions

```css
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
--transition-slower: 500ms ease-in-out;
```

### Z-Index Scale

```css
--z-dropdown: 1000;
--z-sticky: 1100;
--z-modal-backdrop: 1200;
--z-modal: 1300;
--z-popover: 1400;
--z-tooltip: 1500;
```

---

## 🏗️ Component Library

### 1. Button Component

**Variants:** Primary, Secondary, Ghost, Danger

```tsx
// Example usage
<Button variant="primary" size="md" onClick={handleClick}>
  Create Project
</Button>
```

**Specifications:**
- **Sizes:** `sm` (32px), `md` (40px), `lg` (48px)
- **States:** Default, Hover, Active, Disabled, Loading
- **Hover:** Scale 1.02, lift shadow
- **Active:** Scale 0.98
- **Loading:** Show spinner, disable interaction
- **Transition:** 200ms ease-in-out

**CSS Example:**
```css
.button {
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  cursor: pointer;
}

.button-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.button-primary:hover {
  background: var(--color-primary-dark);
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}

.button-primary:active {
  transform: scale(0.98);
}
```

---

### 2. Input Component

**Types:** Text, Email, Search, Textarea

```tsx
<Input 
  type="text" 
  placeholder="Project name..." 
  value={value}
  onChange={handleChange}
  error={errorMessage}
/>
```

**Specifications:**
- **Height:** 40px (md), 48px (lg)
- **Padding:** 12px horizontal
- **Border:** 1px solid gray-300
- **Focus:** Border color-primary, shadow
- **Error:** Border color-error, red text below
- **Disabled:** Gray background, cursor not-allowed

---

### 3. Card Component

**Used for:** Project cards, document cards, paper cards

```tsx
<Card hover clickable>
  <CardHeader>
    <CardTitle>Project Name</CardTitle>
    <CardActions>...</CardActions>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

**Specifications:**
- **Background:** White
- **Border:** 1px solid gray-200
- **Radius:** 12px
- **Padding:** 16px
- **Hover (if clickable):** Lift shadow, scale 1.01
- **Transition:** 200ms ease-in-out

---

### 4. Modal Component

```tsx
<Modal isOpen={isOpen} onClose={handleClose}>
  <ModalHeader>Title</ModalHeader>
  <ModalBody>Content</ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

**Specifications:**
- **Backdrop:** Semi-transparent black (rgba(0,0,0,0.5))
- **Modal:** Centered, max-width 600px
- **Animation:** Fade in backdrop + scale modal from 0.95 to 1
- **Close:** Click backdrop, ESC key, X button
- **Focus trap:** Tab cycles through modal elements only

---

### 5. Sidebar Navigation

```tsx
<Sidebar>
  <SidebarItem icon={DocumentIcon} label="Documents" active />
  <SidebarItem icon={FileIcon} label="Files" />
  <SidebarItem icon={BookIcon} label="Literature" badge={3} />
  <SidebarItem icon={ChartIcon} label="Analyses" />
  <SidebarItem icon={GraphIcon} label="Graph" />
  <SidebarItem icon={SettingsIcon} label="Settings" />
</Sidebar>
```

**Specifications:**
- **Width:** 200px (fixed)
- **Background:** gray-50
- **Item height:** 40px
- **Active:** Primary color background (light), left border accent
- **Hover:** gray-100 background
- **Icon size:** 20px
- **Badge:** Small circle with number, primary color

---

### 6. Toast Notification

```tsx
toast.success('Document saved!');
toast.error('Failed to upload file');
toast.info('AI is processing your request');
```

**Specifications:**
- **Position:** Top-right corner
- **Width:** 320px
- **Auto-dismiss:** 5 seconds (error: 7 seconds)
- **Animation:** Slide in from right + fade
- **Types:** Success (green), Error (red), Info (blue), Warning (amber)
- **Icon:** Matching type icon on left
- **Close button:** X on right

---

### 7. Loading States

**Skeleton Screens (preferred over spinners):**

```tsx
<SkeletonCard />
<SkeletonText lines={3} />
<SkeletonCircle size={40} />
```

**Specifications:**
- **Background:** Animated gradient (gray-200 → gray-300 → gray-200)
- **Animation:** 1.5s ease-in-out infinite
- **Shape:** Match content being loaded

**Spinner (for inline loading):**
- **Size:** 16px (sm), 24px (md), 32px (lg)
- **Color:** Primary or white (on colored backgrounds)
- **Animation:** Smooth rotation

---

### 8. Dropdown Menu

```tsx
<Dropdown trigger={<Button>Options</Button>}>
  <DropdownItem onClick={handleRename}>Rename</DropdownItem>
  <DropdownItem onClick={handleDuplicate}>Duplicate</DropdownItem>
  <DropdownDivider />
  <DropdownItem danger onClick={handleDelete}>Delete</DropdownItem>
</Dropdown>
```

**Specifications:**
- **Position:** Below trigger, aligned left (or right if overflow)
- **Shadow:** xl shadow
- **Border:** 1px solid gray-200
- **Radius:** 8px
- **Item height:** 36px
- **Hover:** gray-100 background
- **Divider:** 1px solid gray-200
- **Danger item:** Red text on hover

---

## 📱 Layout System

### Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large Desktop */
```

### Grid System

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(12, 1fr);
}
```

### Workspace Layout

```css
.workspace {
  display: grid;
  grid-template-columns: 200px 1fr 350px;
  grid-template-rows: 60px 1fr;
  height: 100vh;
}

.workspace-header {
  grid-column: 1 / -1;
}

.workspace-sidebar {
  grid-row: 2;
  overflow-y: auto;
}

.workspace-main {
  grid-row: 2;
  overflow-y: auto;
}

.workspace-ai-panel {
  grid-row: 2;
  overflow-y: auto;
  border-left: 1px solid var(--color-gray-200);
}

/* Responsive */
@media (max-width: 1024px) {
  .workspace {
    grid-template-columns: 1fr 350px;
  }
  
  .workspace-sidebar {
    position: fixed;
    left: -200px;
    transition: left var(--transition-base);
  }
  
  .workspace-sidebar.open {
    left: 0;
  }
}
```

---

## 🎨 Page-Specific Implementations

### 1. Waitlist Landing Page

**File:** `pages/index.tsx` or `pages/waitlist.tsx`

**Structure:**
```tsx
<LandingPage>
  <HeroSection background="/images/helicopter-landscape.jpg">
    <HeroContent>
      <Tagline>
        Your AI-powered research companion that turns ideas into peer-reviewed insights
      </Tagline>
      <EmailForm onSubmit={handleWaitlistSubmit}>
        <Input type="email" placeholder="email@example.com" />
        <SubmitButton>→</SubmitButton>
      </EmailForm>
      <SuccessMessage show={submitted}>
        You're on the list! 🎉
      </SuccessMessage>
    </HeroContent>
  </HeroSection>
</LandingPage>
```

**Styling Notes:**
- Full viewport height
- Background image with gradient overlay (dark bottom → transparent top)
- Center-aligned content
- Email input: 400px wide, 48px height
- Submit arrow: Circular button, 48px, primary color
- Success: Fade out form, fade in message with checkmark animation

---

### 2. Login Page

**File:** `pages/login.tsx`

**Structure:**
```tsx
<LoginPage>
  <HeroSection background="/images/helicopter-landscape.jpg">
    <LoginCard>
      <Logo />
      <GoogleLoginButton onClick={handleGoogleLogin}>
        <GoogleIcon />
        Continue with Google
      </GoogleLoginButton>
    </LoginCard>
  </HeroSection>
</LoginPage>
```

**Styling Notes:**
- Same background as waitlist
- Card: 400px wide, centered, glass morphism effect
- Glass morphism: `backdrop-filter: blur(10px); background: rgba(255,255,255,0.9);`
- Google button: Official Google colors, 48px height

---

### 3. Project Home

**File:** `pages/projects.tsx`

**Structure:**
```tsx
<ProjectsPage>
  <Header>
    <Logo />
    <UserMenu />
  </Header>
  
  <Container>
    {projects.length === 0 ? (
      <EmptyState>
        <Illustration src="/images/empty-projects.svg" />
        <Heading>Ready to start researching?</Heading>
        <CreateProjectButton />
        <ImportProjectButton />
      </EmptyState>
    ) : (
      <>
        <CreateProjectButton />
        
        <Section>
          <SectionTitle>Recent Projects</SectionTitle>
          <ProjectGrid>
            {recentProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </ProjectGrid>
        </Section>
        
        <Section>
          <SectionTitle>All Projects ({allProjects.length})</SectionTitle>
          <ProjectGrid>
            {allProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </ProjectGrid>
        </Section>
      </>
    )}
  </Container>
</ProjectsPage>
```

**ProjectCard Component:**
```tsx
<Card hover clickable onClick={() => navigate(`/project/${project.id}`)}>
  <CardHeader>
    <ProjectIcon>{project.emoji}</ProjectIcon>
    <ProjectTitle>{project.name}</ProjectTitle>
    <DropdownMenu>
      <MenuItem onClick={handleRename}>Rename</MenuItem>
      <MenuItem onClick={handleDuplicate}>Duplicate</MenuItem>
      <MenuItem onClick={handleArchive}>Archive</MenuItem>
      <MenuItem danger onClick={handleDelete}>Delete</MenuItem>
    </DropdownMenu>
  </CardHeader>
  <CardContent>
    <LastEdited>Last edited: {formatRelativeTime(project.updatedAt)}</LastEdited>
    <Stats>
      {project.documentCount} documents • {project.paperCount} papers
    </Stats>
  </CardContent>
</Card>
```

---

### 4. Project Workspace

**File:** `pages/project/[projectId].tsx`

**Structure:**
```tsx
<WorkspaceLayout>
  <WorkspaceHeader>
    <Logo />
    <ProjectName editable>{project.name}</ProjectName>
    <UserMenu />
  </WorkspaceHeader>
  
  <WorkspaceSidebar>
    <SidebarNav>
      <SidebarItem 
        icon={DocumentIcon} 
        label="Documents" 
        active={section === 'documents'}
        onClick={() => setSection('documents')}
      />
      <SidebarItem 
        icon={FileIcon} 
        label="Files" 
        active={section === 'files'}
        onClick={() => setSection('files')}
      />
      <SidebarItem 
        icon={BookIcon} 
        label="Literature" 
        badge={newPapersCount}
        active={section === 'literature'}
        onClick={() => setSection('literature')}
      />
      <SidebarItem 
        icon={ChartIcon} 
        label="Analyses" 
        active={section === 'analyses'}
        onClick={() => setSection('analyses')}
      />
      <SidebarItem 
        icon={GraphIcon} 
        label="Graph" 
        active={section === 'graph'}
        onClick={() => setSection('graph')}
      />
      <SidebarItem 
        icon={SettingsIcon} 
        label="Settings" 
        active={section === 'settings'}
        onClick={() => setSection('settings')}
      />
    </SidebarNav>
  </WorkspaceSidebar>
  
  <WorkspaceMain>
    {section === 'documents' && <DocumentsView />}
    {section === 'files' && <FilesView />}
    {section === 'literature' && <LiteratureView />}
    {section === 'analyses' && <AnalysesView />}
    {section === 'graph' && <GraphView />}
    {section === 'settings' && <SettingsView />}
  </WorkspaceMain>
  
  <AIPanel collapsed={aiPanelCollapsed}>
    <AIPanelHeader>
      <Title>AI Assistant</Title>
      <CollapseButton onClick={() => setAIPanelCollapsed(!aiPanelCollapsed)}>
        {aiPanelCollapsed ? '←' : '→'}
      </CollapseButton>
    </AIPanelHeader>
    <ChatMessages>
      {messages.map(msg => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
    </ChatMessages>
    <ChatInput 
      placeholder="Ask me anything..."
      onSend={handleSendMessage}
    />
  </AIPanel>
</WorkspaceLayout>
```

---

### 5. Document Editor

**File:** `components/DocumentEditor.tsx`

**Use a rich text editor library:**
- **Recommended:** Tiptap, Slate, or Lexical
- **Features needed:**
  - WYSIWYG editing
  - Formatting toolbar
  - Citation insertion
  - Auto-save
  - Collaborative editing (future)

**Structure:**
```tsx
<EditorContainer>
  <EditorHeader>
    <BackButton onClick={() => navigate('/project/documents')}>
      ← Back to Documents
    </BackButton>
    <DocumentTitle 
      value={title}
      onChange={handleTitleChange}
      placeholder="Untitled Document"
    />
    <SaveIndicator status={saveStatus} />
  </EditorHeader>
  
  <EditorToolbar>
    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}>
      <BoldIcon />
    </ToolbarButton>
    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}>
      <ItalicIcon />
    </ToolbarButton>
    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()}>
      <UnderlineIcon />
    </ToolbarButton>
    <ToolbarDivider />
    <ToolbarButton onClick={handleInsertLink}>
      <LinkIcon />
    </ToolbarButton>
    <ToolbarButton onClick={handleInsertCitation}>
      <CitationIcon />
    </ToolbarButton>
    <ToolbarDropdown>
      <HeadingIcon />
      <DropdownMenu>
        <MenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          Heading 1
        </MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          Heading 2
        </MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          Heading 3
        </MenuItem>
      </DropdownMenu>
    </ToolbarDropdown>
  </EditorToolbar>
  
  <EditorContent editor={editor} />
  
  <BibliographySection>
    <BibliographyTitle>References</BibliographyTitle>
    <BibliographyList>
      {citations.map((citation, index) => (
        <BibliographyItem key={citation.id}>
          [{index + 1}] {formatCitation(citation)}
        </BibliographyItem>
      ))}
    </BibliographyList>
  </BibliographySection>
</EditorContainer>
```

**Auto-save Implementation:**
```tsx
// Debounced auto-save
useEffect(() => {
  const timer = setTimeout(() => {
    if (hasChanges) {
      saveDocument(content);
      setSaveStatus('saving');
    }
  }, 2000);
  
  return () => clearTimeout(timer);
}, [content]);
```

---

### 6. Files View

**File:** `components/FilesView.tsx`

**Structure:**
```tsx
<FilesContainer>
  <FilesHeader>
    <Title>Files</Title>
    <UploadButton onClick={handleUploadClick}>
      📤 Upload Files
    </UploadButton>
  </FilesHeader>
  
  <DropZone 
    onDrop={handleFileDrop}
    isDragging={isDragging}
  >
    {isDragging ? (
      <DropZoneActive>
        Drop files here
      </DropZoneActive>
    ) : (
      <DropZoneDefault>
        Drag and drop files here or click to browse
      </DropZoneDefault>
    )}
  </DropZone>
  
  {uploadingFiles.length > 0 && (
    <UploadProgress>
      {uploadingFiles.map(file => (
        <UploadItem key={file.id}>
          <FileName>{file.name}</FileName>
          <ProgressBar progress={file.progress} />
        </UploadItem>
      ))}
    </UploadProgress>
  )}
  
  <FilesSection>
    <SectionTitle>Recent Uploads</SectionTitle>
    <FilesList>
      {files.map(file => (
        <FileCard key={file.id} file={file} />
      ))}
    </FilesList>
  </FilesSection>
</FilesContainer>
```

**FileCard Component:**
```tsx
<Card hover clickable onClick={() => handleFileClick(file)}>
  <FileIcon type={file.type} />
  <FileName>{file.name}</FileName>
  <FileSize>{formatFileSize(file.size)}</FileSize>
  <FileDate>Uploaded {formatRelativeTime(file.uploadedAt)}</FileDate>
  <DropdownMenu>
    <MenuItem onClick={handlePreview}>Preview</MenuItem>
    <MenuItem onClick={handleDownload}>Download</MenuItem>
    <MenuItem onClick={handleLinkToDocument}>Link to Document</MenuItem>
    <MenuItem onClick={handleLinkToAnalysis}>Link to Analysis</MenuItem>
    <MenuDivider />
    <MenuItem danger onClick={handleDelete}>Delete</MenuItem>
  </DropdownMenu>
</Card>
```

---

### 7. Literature View

**File:** `components/LiteratureView.tsx`

**Structure:**
```tsx
<LiteratureContainer>
  <LiteratureHeader>
    <Title>Literature</Title>
    <FindPapersButton onClick={handleFindPapers}>
      🔍 Find Papers
    </FindPapersButton>
  </LiteratureHeader>
  
  <LiteratureStats>
    {papers.length} papers in your library
  </LiteratureStats>
  
  <FilterBar>
    <FilterDropdown label="Filter by">
      <MenuItem onClick={() => setFilter('all')}>All Papers</MenuItem>
      <MenuItem onClick={() => setFilter('used')}>Used in Documents</MenuItem>
      <MenuItem onClick={() => setFilter('unused')}>Not Yet Used</MenuItem>
    </FilterDropdown>
    <SortDropdown label="Sort by">
      <MenuItem onClick={() => setSort('relevance')}>Relevance</MenuItem>
      <MenuItem onClick={() => setSort('date')}>Publication Date</MenuItem>
      <MenuItem onClick={() => setSort('citations')}>Citation Count</MenuItem>
    </SortDropdown>
    <SearchInput 
      placeholder="Search library..."
      value={searchQuery}
      onChange={setSearchQuery}
    />
  </FilterBar>
  
  <PapersList>
    {papers.map(paper => (
      <PaperCard key={paper.id} paper={paper} />
    ))}
  </PapersList>
</LiteratureContainer>
```

**PaperCard Component:**
```tsx
<Card expandable>
  <PaperHeader onClick={() => setExpanded(!expanded)}>
    <PaperTitle>{paper.title}</PaperTitle>
    <ExpandIcon expanded={expanded} />
  </PaperHeader>
  
  <PaperMeta>
    <Authors>{formatAuthors(paper.authors)}</Authors>
    <Publication>
      {paper.journal} • {paper.year}
    </Publication>
    <DOI>DOI: {paper.doi}</DOI>
  </PaperMeta>
  
  {expanded && (
    <PaperDetails>
      <KeyClaimsSection>
        <SectionTitle>Key Claims:</SectionTitle>
        {paper.claims.map(claim => (
          <ClaimItem key={claim.id}>
            <ClaimText>"{claim.text}"</ClaimText>
            <ClaimUsage onClick={() => showClaimUsage(claim)}>
              Used in: {claim.usedInDocuments.join(', ')}
            </ClaimUsage>
          </ClaimItem>
        ))}
      </KeyClaimsSection>
      
      <PaperActions>
        <Button variant="secondary" onClick={() => viewFullPaper(paper)}>
          View Full Paper
        </Button>
        <Button variant="primary" onClick={() => citeInDocument(paper)}>
          Cite in Document
        </Button>
      </PaperActions>
    </PaperDetails>
  )}
</Card>
```

---

### 8. AI Chat Panel

**File:** `components/AIPanel.tsx`

**Structure:**
```tsx
<AIPanelContainer collapsed={collapsed}>
  <AIPanelHeader>
    <Title>AI Assistant</Title>
    <CollapseButton onClick={toggleCollapse}>
      {collapsed ? '←' : '→'}
    </CollapseButton>
  </AIPanelHeader>
  
  <ChatMessagesContainer ref={messagesRef}>
    {messages.map(message => (
      <ChatMessage key={message.id} message={message} />
    ))}
    {isTyping && <TypingIndicator />}
  </ChatMessagesContainer>
  
  <ChatInputContainer>
    <ChatTextarea
      value={input}
      onChange={setInput}
      onKeyDown={handleKeyDown}
      placeholder="Ask me anything..."
      rows={1}
      autoResize
    />
    <SendButton 
      onClick={handleSend}
      disabled={!input.trim() || isSending}
    >
      {isSending ? <Spinner /> : <SendIcon />}
    </SendButton>
  </ChatInputContainer>
</AIPanelContainer>
```

**ChatMessage Component:**
```tsx
<MessageContainer role={message.role}>
  {message.role === 'assistant' && <AIAvatar />}
  
  <MessageBubble role={message.role}>
    {message.type === 'text' && (
      <MessageText>{message.content}</MessageText>
    )}
    
    {message.type === 'confirmation' && (
      <ConfirmationCard>
        <ConfirmationTitle>I'll {message.action}</ConfirmationTitle>
        <ConfirmationDetails>
          {message.details.map(detail => (
            <DetailItem key={detail}>• {detail}</DetailItem>
          ))}
        </ConfirmationDetails>
        <ConfirmationTime>
          This will take ~{message.estimatedTime}
        </ConfirmationTime>
        <ConfirmationActions>
          <Button variant="primary" onClick={message.onApprove}>
            Approve
          </Button>
          <Button variant="ghost" onClick={message.onCancel}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={message.onModify}>
            Modify
          </Button>
        </ConfirmationActions>
      </ConfirmationCard>
    )}
    
    {message.type === 'code' && (
      <CodeBlock language={message.language}>
        {message.code}
      </CodeBlock>
    )}
  </MessageBubble>
  
  {message.role === 'user' && <UserAvatar />}
</MessageContainer>
```

**Streaming Implementation:**
```tsx
// Server-Sent Events for streaming responses
useEffect(() => {
  if (!streamingMessageId) return;
  
  const eventSource = new EventSource(`/api/chat/stream/${streamingMessageId}`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    setMessages(prev => prev.map(msg => 
      msg.id === streamingMessageId
        ? { ...msg, content: msg.content + data.chunk }
        : msg
    ));
  };
  
  eventSource.onerror = () => {
    eventSource.close();
    setStreamingMessageId(null);
  };
  
  return () => eventSource.close();
}, [streamingMessageId]);
```

---

## ⚡ Performance Optimizations

### 1. Code Splitting

```tsx
// Lazy load heavy components
const DocumentEditor = lazy(() => import('./components/DocumentEditor'));
const GraphView = lazy(() => import('./components/GraphView'));
const AnalysisViewer = lazy(() => import('./components/AnalysisViewer'));

// Use with Suspense
<Suspense fallback={<SkeletonLoader />}>
  <DocumentEditor />
</Suspense>
```

### 2. Virtual Scrolling

For long lists (files, papers, documents):

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={papers.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <PaperCard paper={papers[index]} />
    </div>
  )}
</FixedSizeList>
```

### 3. Debouncing & Throttling

```tsx
// Auto-save debounce
const debouncedSave = useMemo(
  () => debounce((content) => saveDocument(content), 2000),
  []
);

// Search throttle
const throttledSearch = useMemo(
  () => throttle((query) => searchPapers(query), 300),
  []
);
```

### 4. Optimistic Updates

```tsx
const handleCreateDocument = async (name) => {
  const tempId = generateTempId();
  
  // Optimistically add to UI
  setDocuments(prev => [...prev, { id: tempId, name, status: 'creating' }]);
  
  try {
    const newDoc = await api.createDocument(name);
    // Replace temp with real
    setDocuments(prev => prev.map(doc => 
      doc.id === tempId ? newDoc : doc
    ));
  } catch (error) {
    // Rollback on error
    setDocuments(prev => prev.filter(doc => doc.id !== tempId));
    toast.error('Failed to create document');
  }
};
```

---

## ♿ Accessibility Checklist

### Keyboard Navigation
- [ ] All interactive elements focusable with Tab
- [ ] Logical tab order
- [ ] Visible focus indicators
- [ ] Keyboard shortcuts documented
- [ ] Modal focus trapping
- [ ] Escape key closes modals/dropdowns

### Screen Readers
- [ ] Semantic HTML (`<nav>`, `<main>`, `<article>`, etc.)
- [ ] ARIA labels on icon-only buttons
- [ ] ARIA live regions for dynamic content
- [ ] Alt text on all images
- [ ] Form labels properly associated

### Visual
- [ ] Color contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Text resizable up to 200%
- [ ] No information conveyed by color alone
- [ ] Focus indicators visible

### Motion
- [ ] Respect `prefers-reduced-motion`
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Component rendering
- User interactions (clicks, typing)
- State management
- Utility functions

```tsx
// Example with React Testing Library
test('creates new document on button click', async () => {
  render(<DocumentsView />);
  
  const createButton = screen.getByText('+ New Document');
  fireEvent.click(createButton);
  
  await waitFor(() => {
    expect(screen.getByPlaceholderText('Untitled Document')).toBeInTheDocument();
  });
});
```

### Integration Tests
- User flows (create project → add document → cite paper)
- API integration
- State persistence

### E2E Tests
- Critical user journeys
- Cross-browser compatibility
- Performance benchmarks

**Recommended tools:**
- Jest + React Testing Library (unit/integration)
- Playwright or Cypress (E2E)

---

## 📦 Recommended Tech Stack

### Core
- **Framework:** Next.js 14+ (App Router) or Vite + React
- **Language:** TypeScript
- **Styling:** CSS Modules or Styled Components or Tailwind (if user prefers)

### State Management
- **Server State:** TanStack Query (React Query)
- **Client State:** Zustand or Jotai
- **Forms:** React Hook Form

### Rich Text Editor
- **Tiptap** (recommended) or Lexical or Slate

### Data Visualization
- **Charts:** Recharts or Chart.js
- **Graph:** D3.js or React Flow

### File Upload
- **react-dropzone**

### PDF Viewer
- **react-pdf** or **@react-pdf-viewer/core**

### Utilities
- **Date formatting:** date-fns
- **Classnames:** clsx
- **Icons:** Lucide React or Heroicons

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project structure
- [ ] Implement design system (CSS variables, base components)
- [ ] Create layout components (Header, Sidebar, Container)
- [ ] Build authentication flow (Google OAuth)
- [ ] Implement routing

### Phase 2: Core Features (Week 3-4)
- [ ] Project home page
- [ ] Project workspace layout
- [ ] Documents view + basic editor
- [ ] Files view + upload
- [ ] AI chat panel (UI only, mock responses)

### Phase 3: Advanced Features (Week 5-6)
- [ ] Literature view
- [ ] Analyses view
- [ ] Graph view
- [ ] Settings page
- [ ] Global search

### Phase 4: Polish & Integration (Week 7-8)
- [ ] Connect to backend APIs
- [ ] Real-time features (auto-save, streaming AI)
- [ ] Error handling
- [ ] Loading states
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## 🐛 Common Pitfalls to Avoid

1. **Don't use inline styles** - Use CSS modules or styled-components
2. **Don't skip loading states** - Always show feedback
3. **Don't forget error boundaries** - Catch and display errors gracefully
4. **Don't ignore accessibility** - Build it in from the start
5. **Don't over-optimize early** - Get it working first, then optimize
6. **Don't skip TypeScript types** - Properly type all props and state
7. **Don't forget mobile** - Test on small screens regularly
8. **Don't hardcode values** - Use design tokens from the start

---

## 📚 Resources

### Design Inspiration
- [Notion](https://notion.so) - Document editor, clean UI
- [Linear](https://linear.app) - Keyboard shortcuts, speed
- [Superhuman](https://superhuman.com) - Email UX, AI integration
- [Perplexity](https://perplexity.ai) - AI chat interface

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tiptap Docs](https://tiptap.dev)
- [TanStack Query Docs](https://tanstack.com/query)

### Tools
- [Figma](https://figma.com) - Design mockups
- [Storybook](https://storybook.js.org) - Component development
- [Chromatic](https://chromatic.com) - Visual testing

---

## ✅ Definition of Done

A feature is complete when:
- [ ] Matches design specifications
- [ ] Works on desktop, tablet, and mobile
- [ ] Keyboard accessible
- [ ] Screen reader friendly
- [ ] Has loading and error states
- [ ] Includes unit tests
- [ ] Performs well (no jank, fast load)
- [ ] Code reviewed and approved
- [ ] Documented (if complex)

---

## 🎯 Success Metrics

Track these to ensure quality:
- **Performance:**
  - First Contentful Paint < 1.5s
  - Time to Interactive < 3s
  - Lighthouse score > 90
  
- **Accessibility:**
  - WCAG AA compliance
  - Keyboard navigation 100% functional
  - Screen reader tested
  
- **User Experience:**
  - Auto-save success rate > 99%
  - AI response time < 500ms (first token)
  - Zero data loss incidents

---

**Remember:** The goal is to create an interface that feels **calm, intelligent, and effortless**. Every interaction should be smooth, predictable, and delightful. When in doubt, prioritize **clarity** over cleverness, **speed** over features, and **user trust** over everything else.

Good luck building! 🚀
