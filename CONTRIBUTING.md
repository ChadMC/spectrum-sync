# Contributing to Odd Ball Out

Thank you for your interest in contributing to Odd Ball Out! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help maintain a positive community

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/ChadMC/odd-ball-out/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos if applicable
   - Browser, OS, and device information
   - Console errors if any

### Suggesting Features

1. Check [Issues](https://github.com/ChadMC/odd-ball-out/issues) for existing suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Example implementation if possible
   - Any potential drawbacks

### Contributing Code

#### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/odd-ball-out.git
   cd odd-ball-out
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ChadMC/odd-ball-out.git
   ```
4. Install dependencies:
   ```bash
   npm run install-all
   ```

#### Development Workflow

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/bug-description
   ```

2. Make your changes:
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
   - Test your changes thoroughly

3. Test your changes:
   ```bash
   npm run dev
   ```
   Follow the manual testing checklist in [TESTING.md](TESTING.md)

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Clear description of changes"
   ```
   
   Good commit messages:
   - "Add emoji-only mode for kids"
   - "Fix timer not resetting between rounds"
   - "Update README with deployment instructions"

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request:
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Link related issues

#### Pull Request Guidelines

**PR Title:**
- Clear and descriptive
- Start with verb (Add, Fix, Update, Remove)
- Examples:
  - "Add sound effects to game events"
  - "Fix reconnection token not persisting"
  - "Update API documentation with new endpoints"

**PR Description:**
- What changes were made
- Why these changes were needed
- How to test the changes
- Screenshots/videos for UI changes
- Link related issues with "Fixes #123"

**Before Submitting:**
- [ ] Code follows existing style
- [ ] All tests pass (if applicable)
- [ ] Documentation updated
- [ ] No console errors
- [ ] Builds successfully
- [ ] Tested on multiple browsers
- [ ] No security vulnerabilities introduced

### Code Style

#### JavaScript/React

- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Destructure props and state
- Keep functions small and focused
- Add JSDoc comments for complex functions

**Example:**
```javascript
/**
 * Calculate score for players based on votes
 * @param {Map} votes - Player votes
 * @param {string} oddPlayerId - ID of odd player
 * @returns {Object} Score changes per player
 */
function calculateScores(votes, oddPlayerId) {
  // Implementation
}
```

#### CSS

- Use meaningful class names
- Follow BEM convention where appropriate
- Keep selectors simple
- Use CSS variables for colors/spacing
- Mobile-first approach

#### File Organization

```
client/src/
  components/      # React components
  hooks/          # Custom hooks
  utils/          # Utility functions
  styles/         # Global styles

server/
  routes/         # Express routes (future)
  models/         # Data models (future)
  utils/          # Utility functions
```

### Testing

#### Manual Testing

Follow the checklist in [TESTING.md](TESTING.md) for all changes.

#### Future: Automated Tests

We plan to add:
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)

### Documentation

Update documentation when:
- Adding new features
- Changing existing behavior
- Adding API endpoints
- Updating configuration

Files to consider:
- `README.md` - Main documentation
- `API.md` - API changes
- `DEPLOYMENT.md` - Deployment changes
- `TESTING.md` - Testing procedures
- `CHANGELOG.md` - Version history

### Areas for Contribution

#### High Priority

- [ ] Automated test suite
- [ ] Database integration for game history
- [ ] User authentication system
- [ ] Mobile app (React Native)
- [ ] Admin dashboard

#### Medium Priority

- [ ] Additional question packs
- [ ] Custom question pack creator
- [ ] Game statistics and analytics
- [ ] Sound effects and animations
- [ ] Internationalization (i18n)

#### Low Priority

- [ ] Chat functionality
- [ ] Game replays
- [ ] Achievement system
- [ ] Themes/skins
- [ ] Accessibility improvements

### Question Pack Contributions

To add a new question pack:

1. Edit `server/questionPacks.js`
2. Add a new pack following this structure:
   ```javascript
   packName: [
     {
       normalClue: "Clue for normal players",
       oddClue: "Different clue for odd player",
       question: "Question to answer",
       type: "text", // or "emoji" or "multiple_choice"
       options: [] // for emoji/MC types
     },
     // More questions...
   ]
   ```
3. Ensure 10+ questions per pack
4. Test thoroughly with multiple players
5. Submit PR with pack description

### Security

**Report security vulnerabilities privately:**
- Do NOT create public issues
- Email: [security contact]
- We'll respond within 48 hours

**Security guidelines:**
- Never commit secrets or API keys
- Validate and sanitize all user input
- Use HTTPS/WSS in production
- Follow OWASP guidelines
- Keep dependencies updated

### Getting Help

**Stuck on something?**
- Check existing documentation
- Search closed issues
- Ask in issue comments
- Join discussions

**Learning resources:**
- [React Docs](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Vite Documentation](https://vitejs.dev/)

### Review Process

1. **Initial Review**: Maintainer checks PR basics
2. **Code Review**: Detailed review of changes
3. **Testing**: Manual testing of functionality
4. **Feedback**: Comments and requested changes
5. **Approval**: PR approved when ready
6. **Merge**: Maintainer merges to main branch

**Timeline:**
- Initial review within 2-3 days
- Full review within 1 week
- May take longer for complex changes

### Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- README acknowledgments (for major features)

## Questions?

Feel free to:
- Open a discussion on GitHub
- Comment on related issues
- Reach out to maintainers

## Thank You!

Every contribution helps make Odd Ball Out better for everyone. We appreciate your time and effort! 🎉

---

**Happy Contributing!** 🚀
