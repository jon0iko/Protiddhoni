# Component Migration Guide

## Quick Reference: Updating Components to Use Auto-Auth

### Before & After Examples

#### Example 1: Creating Content

**Before:**
```typescript
const CreateContent = () => {
  const { token } = useAuth();
  
  const handleSubmit = async (data) => {
    await api.content.create(data, token);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

**After:**
```typescript
const CreateContent = () => {
  // No need to get token from useAuth!
  
  const handleSubmit = async (data) => {
    await api.content.create(data);  // Token auto-injected
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

#### Example 2: Fetching User Data

**Before:**
```typescript
const MyBookmarks = () => {
  const { token } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  
  useEffect(() => {
    if (token) {
      api.bookmarks.getMyBookmarks(token)
        .then(data => setBookmarks(data));
    }
  }, [token]);
  
  return <div>...</div>;
};
```

**After:**
```typescript
const MyBookmarks = () => {
  // No need for token!
  const [bookmarks, setBookmarks] = useState([]);
  
  useEffect(() => {
    api.bookmarks.getMyBookmarks()  // Token auto-injected
      .then(data => setBookmarks(data));
  }, []);  // Dependency array simpler
  
  return <div>...</div>;
};
```

#### Example 3: Conditional Auth Actions

**Before:**
```typescript
const CommentForm = () => {
  const { user, token } = useAuth();
  
  const handleSubmit = async (content) => {
    if (!token) {
      alert('Please login');
      return;
    }
    await api.comments.create({ content }, token);
  };
  
  if (!user) return <div>Login to comment</div>;
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

**After:**
```typescript
const CommentForm = () => {
  const { user } = useAuth();  // Only need user for UI
  
  const handleSubmit = async (content) => {
    // API will handle auth automatically
    // Backend will return 401 if not authenticated
    try {
      await api.comments.create({ content });
    } catch (error) {
      if (error.status === 401) {
        alert('Please login');
      }
    }
  };
  
  if (!user) return <div>Login to comment</div>;
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

## Search and Replace Patterns

### Pattern 1: Remove Token Parameter
```typescript
// Find:
api.content.create(data, token)

// Replace:
api.content.create(data)
```

### Pattern 2: Remove Token from Dependency Array
```typescript
// Find:
useEffect(() => {
  if (token) {
    fetchData(token);
  }
}, [token]);

// Replace:
useEffect(() => {
  fetchData();
}, []);
```

### Pattern 3: Simplify useAuth Destructuring
```typescript
// Find:
const { user, token } = useAuth();

// Replace (if token not used for UI):
const { user } = useAuth();
```

## Components That Need Updates

Based on your codebase, these components likely need updates:

### High Priority (Uses token in API calls)
- `components/reader/ReviewForm.tsx` - Remove token from api.reviews.create
- `components/reader/ReviewCard.tsx` - Remove token from delete/update calls
- `components/reader/CommentForm.tsx` - Remove token from api.comments.create
- `components/reader/ReadingControls.tsx` - Remove token from bookmark operations
- `components/reader/RatingWidget.tsx` - Already uses optional token, but can simplify

### Medium Priority (May use token)
- Any editor components that create/update content
- Profile/settings pages that update user data
- Dashboard/admin components

## Testing After Migration

For each updated component:

1. **Test authenticated flow:**
   - Login
   - Perform action
   - Verify it works ✅

2. **Test unauthenticated flow:**
   - Logout
   - Try to perform action
   - Verify appropriate error/redirect

3. **Test page reload:**
   - Perform action
   - Refresh page
   - Perform action again
   - Verify still works ✅

## Common Pitfalls

### ❌ Don't Do This:
```typescript
// Still manually getting token from localStorage
const token = localStorage.getItem('auth_token');
await api.content.create(data, token);
```

### ✅ Do This Instead:
```typescript
// Let the API client handle it
await api.content.create(data);
```

### ❌ Don't Do This:
```typescript
// Checking token existence for auth
const { token } = useAuth();
if (!token) return <LoginPrompt />;
```

### ✅ Do This Instead:
```typescript
// Use isLoggedIn or user instead
const { isLoggedIn, user } = useAuth();
if (!isLoggedIn) return <LoginPrompt />;
```

## Gradual Migration Strategy

You can migrate gradually:

1. **Start with new components** - Build new features without manual token handling
2. **Update on touch** - When fixing bugs, remove manual token handling
3. **Batch update** - Use search/replace for similar patterns

Both old and new approaches will work during migration since the API client supports both!

## Need Help?

If you encounter issues during migration:

1. Check `AUTH_IMPLEMENTATION.md` for architecture details
2. Look at the browser console for auth-related errors
3. Verify localStorage has `auth_token` after login
4. Test API calls in browser console:
   ```javascript
   fetch('/api/content/published')
     .then(r => r.json())
     .then(console.log);
   ```

## Summary

The migration is simple:

1. Remove `token` from `useAuth()` (unless needed for UI)
2. Remove token parameters from API calls
3. Test that auth still works
4. Enjoy cleaner code! 🎉

```typescript
// FROM THIS:
const { user, token } = useAuth();
await api.action(data, token);

// TO THIS:
const { user } = useAuth();
await api.action(data);
```

That's it! The authentication system handles the rest automatically.
