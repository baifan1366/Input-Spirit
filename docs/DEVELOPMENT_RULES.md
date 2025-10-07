# Input Spirit - Development Rules & Guidelines

## 🎯 Project Goals
1. **Hackathon Focus**: Build for Google Chrome Built-in AI Challenge 2025
2. **MVP First**: Deliver core features that showcase Chrome Web AI APIs
3. **Demo-Ready**: Prioritize features visible in 3-minute video demo
4. **Judging Criteria Alignment**: Optimize for Functionality, Purpose, Content, UX, and Technical Execution

## 📋 Development Principles

### 1. Chrome Web AI API Integration (CRITICAL)
**MUST USE** at least one (preferably multiple) Chrome Built-in AI APIs:
- ✅ Prompt API (multimodal) - PRIMARY API
- ✅ Proofreader API
- ✅ Summarizer API  
- ✅ Translator API
- ✅ Writer API
- ✅ Rewriter API

**Rules**:
- Never mock or simulate Chrome AI APIs - use actual implementation
- Implement proper error handling for API unavailability
- Always provide fallback behavior if API not available
- Test on Chrome Canary/Dev with AI features enabled
- Join Chrome Built-in AI Early Preview Program for latest APIs

### 2. Offline-First Architecture
**Rules**:
- Default to local AI processing (Gemini Nano)
- All core features must work without internet
- Cloud features are optional enhancements only
- Clearly indicate when feature requires network
- Implement proper offline state detection

### 3. Privacy by Design
**Rules**:
- No data leaves device unless explicitly configured
- Implement configurable sensitive data redaction
- No telemetry or analytics by default
- Clear privacy indicators in UI
- Document all data flows in README
- User consent required for any cloud features

### 4. Electron Application Structure
**Main Process Rules**:
- Handle system-level integrations (input monitoring, window management)
- Manage plugin lifecycle and loading
- Control MCP adapter and context sharing
- Never block main thread with heavy computation

**Renderer Process Rules**:
- Keep UI responsive with async operations
- Use React best practices (hooks, context, memo)
- Implement proper loading states
- Handle errors gracefully with user-friendly messages

**IPC Communication Rules**:
- Use typed IPC channels
- Validate all messages from renderer
- Implement timeout for long-running operations
- Never expose sensitive APIs to renderer without validation

### 5. Plugin System Guidelines
**Plugin Development**:
- Each plugin must be self-contained
- Implement timeout mechanism (default 8000ms)
- Support abort signals for cancellation
- Provide comprehensive logging
- Include error boundaries
- Document all plugin APIs with TypeScript types

**Plugin Security**:
- Sandbox plugin execution
- Validate all plugin inputs
- Limit plugin access to system resources
- Review plugins before enabling
- Implement plugin permission system

### 6. Code Quality Standards
**TypeScript**:
- Strict mode enabled
- No implicit any
- Comprehensive type definitions for all APIs
- Use interfaces for plugin contracts

**Code Style**:
- ESLint + Prettier configuration
- Consistent naming conventions:
  - camelCase for variables/functions
  - PascalCase for components/classes
  - UPPER_CASE for constants
- Maximum function length: 50 lines
- Maximum file length: 300 lines
- Meaningful comments for complex logic only

**Testing**:
- Unit tests for plugin system
- Integration tests for AI API usage
- E2E tests for critical user flows
- Manual testing on target platforms

### 7. UI/UX Requirements
**Design Principles**:
- Non-invasive overlay interface
- Fast feedback (< 200ms for interactions)
- Clear loading states
- Accessible keyboard shortcuts
- Visual feedback for all actions
- Support light/dark modes

**Tailwind CSS Usage**:
- Use Tailwind utility classes
- Create custom components for repeated patterns
- Maintain consistent spacing/sizing scale
- Responsive design (even for desktop)

**Component Standards**:
- Use modern UI component library (shadcn/ui recommended)
- Lucide icons for consistency
- Smooth animations (use Framer Motion if needed)
- Toast notifications for non-blocking feedback

### 8. Performance Optimization
**Rules**:
- Initial load time < 2 seconds
- Input detection latency < 100ms
- AI response streaming for long generations
- Debounce rapid user inputs
- Lazy load plugins
- Optimize bundle size (< 10MB unpacked)
- Monitor memory usage (especially for long sessions)

### 9. Configuration Management
**Rules**:
- Single JSON config file for user settings
- Validate config on load with schema
- Provide sensible defaults
- Support config hot-reload
- Version config format for migrations
- Document all config options

### 10. Workflow System
**Rules**:
- JSON-based workflow definitions
- Support conditional execution
- Implement proper error handling (stop/continue/retry)
- Pass context between workflow steps
- Allow workflow templates
- Provide workflow validation before execution

### 11. MCP Integration
**Rules**:
- Implement standard MCP protocol
- Expose configurable context
- Document MCP endpoints
- Test with Claude Desktop/Cursor
- Handle MCP connection failures gracefully
- Version MCP API for compatibility

### 12. Cross-Platform Support
**Primary Targets**: Windows 10+, macOS 12+

**Rules**:
- Test on both Windows and macOS
- Use platform-appropriate hotkeys
- Handle platform-specific permissions
- Adapt UI for platform conventions
- Document platform-specific requirements

### 13. Documentation Requirements
**Must Have**:
- README with quick start guide
- Installation instructions
- Configuration guide
- Plugin development guide
- API documentation (generated from TypeScript)
- Video demo (< 3 minutes)
- GitHub repository with clear structure

**Code Documentation**:
- JSDoc for all public APIs
- TypeScript types as documentation
- Examples for complex features
- Architecture decision records (ADRs) for major choices

### 14. Version Control & Repository
**Rules**:
- Clear commit messages (conventional commits)
- Feature branches for development
- Keep main branch stable
- Tag releases with semantic versioning
- Include open source license (MIT recommended)
- Comprehensive .gitignore
- Include demo screenshots/GIFs

### 15. Demo & Submission Preparation
**Video Demo Must Show**:
- Application launch and initialization
- Trigger detection in multiple apps (e.g., Notion, Gmail, VSCode)
- AI response generation with Chrome Built-in AI
- Plugin system in action
- Workflow execution
- Offline functionality demo
- Clear problem-solution narrative

**Submission Checklist**:
- [ ] Public GitHub repository with license
- [ ] Working demo (deployed or local with clear instructions)
- [ ] Demo video (< 3 minutes, YouTube/Vimeo)
- [ ] README with API usage description
- [ ] Problem statement clearly articulated
- [ ] All text and video content in English
- [ ] Test deployment on fresh system
- [ ] Verify all Chrome AI APIs are used correctly

## 🚫 Don'ts

1. **Don't** reuse 2024 hackathon project or concepts
2. **Don't** mock Chrome AI APIs - must use real implementation
3. **Don't** require internet for core features
4. **Don't** collect user data without explicit consent
5. **Don't** hard-code API keys or secrets
6. **Don't** over-engineer - focus on MVP for hackathon
7. **Don't** ignore error handling for AI API unavailability
8. **Don't** create huge monolithic files
9. **Don't** skip TypeScript types
10. **Don't** forget to test on actual Chrome with AI features

## ✅ Do's

1. **Do** prioritize features visible in demo
2. **Do** showcase multiple Chrome Web AI APIs
3. **Do** implement proper error handling and fallbacks
4. **Do** provide excellent user feedback
5. **Do** write clean, readable, maintainable code
6. **Do** document architectural decisions
7. **Do** test on real-world scenarios (Gmail, Notion, etc.)
8. **Do** optimize for judging criteria
9. **Do** make it easy for judges to test
10. **Do** have fun and be creative!

## 🎯 Success Metrics

### Technical Excellence
- Uses ≥3 Chrome Web AI APIs
- Full offline functionality
- Plugin system with ≥3 working plugins
- < 2s launch time
- < 100ms input detection latency

### User Experience
- Intuitive UI with clear feedback
- Works seamlessly in multiple apps
- Easy configuration
- Helpful error messages

### Demo Quality
- Clear problem statement
- Compelling use cases
- Smooth demonstration
- Professional video quality
- Engaging narrative

### Code Quality
- Well-structured TypeScript codebase
- Comprehensive documentation
- Clean git history
- Easy to build and run
- Proper error handling

---

## 📚 Reference Documentation

### Essential Reading
- [Chrome Built-in AI APIs Documentation](https://developer.chrome.com/docs/ai)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Google Chrome AI Challenge Rules](https://googlechromeai2025.devpost.com/rules)

### Join Early Preview Program
- [Chrome Built-in AI Early Preview Program](https://developer.chrome.com/docs/ai/join-epp)

---

**Last Updated**: 2025-10-07
**Project Phase**: Initial Development
**Target Submission**: Google Chrome Built-in AI Challenge 2025
