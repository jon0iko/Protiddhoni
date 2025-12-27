# Paywall Implementation - Decorator Pattern

## Overview
Implemented a paywall system using the **Decorator Pattern** to protect premium content (where `is_premium` flag is true) from unauthorized access.

## Design Pattern: Decorator
The Decorator Pattern allows us to add new functionality (paywall checking) to existing content access logic without modifying the base code structure.

### Pattern Structure
```
ContentAccess (Base)
    ↓
PaywallDecorator (Wraps base and adds paywall logic)
```

## Backend Implementation

### 1. Content Access Decorator (`backend/middleware/contentAccessDecorator.js`)
**Purpose**: Implements the Decorator Pattern for content access control

**Key Features**:
- `ContentAccess`: Base class that grants access by default
- `PaywallDecorator`: Wraps base access and adds premium content checks

**Paywall Logic**:
1. Checks if content exists and retrieves `is_premium` flag
2. If not premium → Grant access immediately
3. If premium and no user logged in → Deny with auth required message
4. If premium and user is the author → Grant access (authors can view their own content)
5. If premium and user logged in → Check `purchases` table for completed payment
6. If purchase found → Grant access
7. Otherwise → Deny with payment required message

**Response Format**:
```javascript
{
  granted: boolean,
  requiresPayment: boolean,
  reason: string,
  message: string,
  contentDetails: {
    title: string,
    price: number
  }
}
```

### 2. Content Controller (`backend/controllers/contentController.js`)
**Updated `getBySlug` function**:
- Integrates PaywallDecorator before returning content
- Creates decorator chain: `BaseAccess → PaywallDecorator`
- Calls `checkAccess()` with user ID and content ID
- Returns 403 error with paywall details if access denied
- Includes `isPremiumBlocked: true` flag in response

```javascript
const db = new DatabaseConnection();
const baseAccess = new ContentAccess();
const paywallAccess = new PaywallDecorator(baseAccess, db);

const accessCheck = await paywallAccess.checkAccess(req.user?.id, content.id);

if (!accessCheck.granted) {
    return res.status(403).json({ 
        success: false, 
        error: accessCheck.message,
        reason: accessCheck.reason,
        requiresPayment: accessCheck.requiresPayment,
        contentDetails: accessCheck.contentDetails,
        isPremiumBlocked: true
    });
}
```

## Frontend Implementation

### 1. Paywall Block Component (`frontend/protiddhoni/components/reader/PaywallBlock.tsx`)
**Purpose**: Beautiful UI component displayed when premium content is blocked

**Features**:
- Premium badge with crown icon
- Locked content indicator
- Content title and price display
- Different actions based on login status:
  - **Not logged in**: Shows "Login" and "Register" buttons
  - **Logged in**: Shows "Buy Now" button (currently disabled with message)
- Informational cards about benefits:
  - Lifetime access
  - Full content unlock
  - Support the author
- Bengali language support

**Props**:
```typescript
interface PaywallBlockProps {
  contentTitle: string;
  price: number;
  onLogin?: () => void;
  isLoggedIn?: boolean;
}
```

### 2. Read Page (`frontend/protiddhoni/app/(reader)/read/[slug]/page.tsx`)
**Updated to handle paywall**:

**New State Variables**:
- `isBlocked`: Whether content is blocked by paywall
- `paywallInfo`: Details about the blocked content (title, price, reason)

**Enhanced `loadContent` function**:
```typescript
// Check if response indicates paywall block
if (!response.success && response.isPremiumBlocked) {
    setIsBlocked(true);
    setPaywallInfo({
        title: response.contentDetails?.title,
        price: response.contentDetails?.price,
        reason: response.reason,
        message: response.error
    });
    return;
}
```

**Conditional Rendering**:
```typescript
// Show paywall if content is blocked
if (isBlocked && paywallInfo) {
    return (
        <PaywallBlock
            contentTitle={paywallInfo.title}
            price={paywallInfo.price}
            onLogin={handleLogin}
            isLoggedIn={isLoggedIn}
        />
    );
}
```

### 3. Story Page (`frontend/protiddhoni/app/story/[slug]/page.tsx`)
**Updated to handle paywall and show premium indicators**:

**Similar paywall handling** as Read page

**Visual Premium Indicators**:
1. **Premium badge** in header (yellow-orange gradient)
2. **Price display** with crown icon in stats section
3. **Styled "Read Now" button** with gradient background for premium content:
   ```tsx
   <Link
       href={`/read/${slug}`}
       className={`${
           content.is_premium 
               ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
               : 'bg-white text-blue-600'
       }`}
   >
       {content.is_premium && <Crown />}
       পড়া শুরু করুন
   </Link>
   ```

## User Experience Flow

### For Non-Premium Content:
1. User navigates to content
2. Backend checks: `is_premium = false`
3. Content loads normally
4. User can read freely

### For Premium Content (Not Logged In):
1. User navigates to premium content
2. Backend checks: `is_premium = true`, no user session
3. Backend returns 403 with `isPremiumBlocked: true`
4. Frontend displays `PaywallBlock` component
5. Shows "Login" and "Register" buttons
6. User must login to proceed

### For Premium Content (Logged In, Not Purchased):
1. User navigates to premium content
2. Backend checks: `is_premium = true`, user logged in, no purchase record
3. Backend returns 403 with `isPremiumBlocked: true`
4. Frontend displays `PaywallBlock` component
5. Shows "Buy Now" button (currently disabled)
6. Displays price and benefits

### For Premium Content (Author):
1. Author navigates to their own premium content
2. Backend checks: `is_premium = true`, user is author
3. Backend grants access (authors can view their own content)
4. Content loads normally

### For Premium Content (Purchased):
1. User navigates to purchased premium content
2. Backend checks: `is_premium = true`, purchase record exists with `payment_status = 'completed'`
3. Backend grants access
4. Content loads normally

## Database Schema Usage

### Tables Involved:
1. **`content`**: Contains `is_premium` flag and `price`
2. **`purchases`**: Tracks user purchases with `payment_status`

### Purchase Check Query:
```sql
SELECT id, payment_status, amount
FROM purchases
WHERE user_id = ? 
  AND content_id = ?
  AND payment_status = 'completed'
```

## Next Steps (Payment Gateway Integration)

When ready to add payment processing:

1. **Update PaywallBlock component**:
   - Enable the "Buy Now" button
   - Add payment method selection
   - Integrate with payment gateway (bKash, Nagad, etc.)

2. **Create payment endpoints**:
   - `POST /api/payments/initiate`: Start payment process
   - `POST /api/payments/verify`: Verify payment completion
   - `POST /api/payments/webhook`: Handle payment gateway callbacks

3. **Update purchases table**:
   - Add payment gateway transaction IDs
   - Record payment timestamps
   - Handle refunds if needed

4. **Add purchase confirmation flow**:
   - Show success message after payment
   - Automatically unlock content
   - Send email/notification to user

## Testing Checklist

- [ ] Try accessing free content (should work)
- [ ] Try accessing premium content without login (should show login prompt)
- [ ] Try accessing premium content with login but no purchase (should show buy prompt)
- [ ] Try accessing own premium content as author (should work)
- [ ] Verify premium badges display correctly on story pages
- [ ] Test error handling for invalid content IDs

## Benefits of Decorator Pattern

1. **Extensibility**: Easy to add more access checks (e.g., subscription tiers, time-limited access)
2. **Separation of Concerns**: Paywall logic is separate from core content logic
3. **Single Responsibility**: Each decorator has one clear purpose
4. **Open/Closed Principle**: Can extend behavior without modifying existing code
5. **Testability**: Each decorator can be tested independently

## Example: Adding More Decorators

```javascript
// Future: Add subscription decorator
class SubscriptionDecorator extends ContentAccess {
    async checkAccess(userId, contentId) {
        const baseAccess = await this.wrappedAccess.checkAccess(userId, contentId);
        if (!baseAccess.granted) return baseAccess;
        
        // Check if user has active subscription
        const hasSubscription = await checkUserSubscription(userId);
        return hasSubscription 
            ? { granted: true }
            : { granted: false, reason: 'subscription_required' };
    }
}

// Chain decorators
const baseAccess = new ContentAccess();
const paywallAccess = new PaywallDecorator(baseAccess, db);
const subscriptionAccess = new SubscriptionDecorator(paywallAccess, db);
```

## Files Modified/Created

### Backend:
- ✅ `backend/middleware/contentAccessDecorator.js` - Enhanced with detailed paywall logic
- ✅ `backend/controllers/contentController.js` - Integrated decorator in getBySlug

### Frontend:
- ✅ `frontend/protiddhoni/components/reader/PaywallBlock.tsx` - New component
- ✅ `frontend/protiddhoni/app/(reader)/read/[slug]/page.tsx` - Added paywall handling
- ✅ `frontend/protiddhoni/app/story/[slug]/page.tsx` - Added paywall handling and premium indicators

## Notes

- Payment gateway integration is pending (button disabled with "আসছে শীঘ্রই" message)
- Authors can always access their own premium content
- All text is in Bengali (বাংলা) for better user experience
- Responsive design works on mobile and desktop
- Uses Tailwind CSS for styling with gradient effects
