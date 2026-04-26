# Requirements - Image Cropper for Publish Modal

## Core Requirements

1. **Install and integrate react-easy-crop library** into the PublishModal component
2. **Show cropper UI** when user uploads a cover image
3. **Allow drag and resize** of crop area with real-time preview
4. **Provide aspect ratio presets**: 16:9, 4:3, 1:1, Free
5. **Apply crop** - generate cropped image file and update preview
6. **Cancel/Re-crop** - allow users to cancel or re-edit the crop
7. **Basic validation** - warn if dimensions < 400x300px, block if file > 5MB
8. **Mobile support** - touch gestures for drag/resize
9. **Integrate with existing upload flow** - use existing Supabase upload function

