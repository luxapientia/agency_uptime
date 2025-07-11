import { Router, Request, Response } from 'express';
import multer from 'multer';
import fileService from '../services/file.service';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { z } from 'zod';

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

// Validation schemas
const colorSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  error: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  info: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  success: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  text: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
  })
});

const borderRadiusSchema = z.object({
  borderRadius: z.number().min(0).max(24)
});

const fontFamilySchema = z.object({
  primary: z.string().min(1).optional(),
  secondary: z.string().min(1).optional()
});

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
});

// Get all theme settings
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const themeSettings = await prisma.themeSettings.findUnique({
      where: { userId: authReq.user.id }
    });

    if (!themeSettings) {
      // Return default settings if none exist
      return res.json({
        colors: {
          primary: '#1976d2',
          secondary: '#9c27b0',
          error: '#d32f2f',
          warning: '#ed6c02',
          info: '#0288d1',
          success: '#2e7d32',
          text: {
            primary: '#000000',
            secondary: '#666666'
          }
        },
        isDarkMode: false,
        borderRadius: 4,
        fontFamily: {
          primary: 'Roboto',
          secondary: 'Roboto'
        },
        favicon: 'favicon.png',
        logo: 'logo.png'
      });
    }

    // Transform the database model to the expected format
    res.json({
      colors: {
        primary: themeSettings.primaryColor,
        secondary: themeSettings.secondaryColor,
        error: themeSettings.errorColor,
        warning: themeSettings.warningColor,
        info: themeSettings.infoColor,
        success: themeSettings.successColor,
        text: {
          primary: themeSettings.textPrimary,
          secondary: themeSettings.textSecondary
        }
      },
      isDarkMode: themeSettings.isDarkMode,
      borderRadius: themeSettings.borderRadius,
      fontFamily: {
        primary: themeSettings.fontPrimary,
        secondary: themeSettings.fontSecondary
      },
      favicon: themeSettings.favicon,
      logo: themeSettings.logo
    });
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    res.status(500).json({ error: 'Failed to fetch theme settings' });
  }
});

// Toggle dark mode
router.post('/dark-mode', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const themeSettings = await prisma.themeSettings.findUnique({
      where: { userId: authReq.user.id }
    });

    const newDarkMode = !themeSettings?.isDarkMode;

    const updatedSettings = await prisma.themeSettings.upsert({
      where: { userId: authReq.user.id },
      update: { isDarkMode: newDarkMode },
      create: {
        userId: authReq.user.id,
        isDarkMode: newDarkMode
      }
    });

    res.json({ isDarkMode: updatedSettings.isDarkMode });
  } catch (error) {
    console.error('Error toggling dark mode:', error);
    res.status(500).json({ error: 'Failed to toggle dark mode' });
  }
});

// Update border radius
router.put('/border-radius', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { borderRadius } = borderRadiusSchema.parse(req.body);

    const updatedSettings = await prisma.themeSettings.upsert({
      where: { userId: authReq.user.id },
      update: { borderRadius },
      create: {
        userId: authReq.user.id,
        borderRadius
      }
    });

    res.json({ borderRadius: updatedSettings.borderRadius });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid border radius value' });
    }
    console.error('Error updating border radius:', error);
    res.status(500).json({ error: 'Failed to update border radius' });
  }
});

// Update font family
router.put('/font-family', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { primary, secondary } = fontFamilySchema.parse(req.body);

    const themeSettings = await prisma.themeSettings.findUnique({
      where: { userId: authReq.user.id }
    });

    const updatedSettings = await prisma.themeSettings.upsert({
      where: { userId: authReq.user.id },
      update: {
        fontPrimary: primary || themeSettings?.fontPrimary || 'Roboto',
        fontSecondary: secondary || themeSettings?.fontSecondary || 'Roboto'
      },
      create: {
        userId: authReq.user.id,
        fontPrimary: primary || 'Roboto',
        fontSecondary: secondary || 'Roboto'
      }
    });

    res.json({
      fontFamily: {
        primary: updatedSettings.fontPrimary,
        secondary: updatedSettings.fontSecondary
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid font family values' });
    }
    console.error('Error updating font family:', error);
    res.status(500).json({ error: 'Failed to update font family' });
  }
});

// Update colors
router.put('/colors', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const colors = colorSchema.parse(req.body);

    const updatedSettings = await prisma.themeSettings.upsert({
      where: { userId: authReq.user.id },
      update: {
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        errorColor: colors.error,
        warningColor: colors.warning,
        infoColor: colors.info,
        successColor: colors.success,
        textPrimary: colors.text.primary,
        textSecondary: colors.text.secondary
      },
      create: {
        userId: authReq.user.id,
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        errorColor: colors.error,
        warningColor: colors.warning,
        infoColor: colors.info,
        successColor: colors.success,
        textPrimary: colors.text.primary,
        textSecondary: colors.text.secondary
      }
    });

    res.json({
      colors: {
        primary: updatedSettings.primaryColor,
        secondary: updatedSettings.secondaryColor,
        error: updatedSettings.errorColor,
        warning: updatedSettings.warningColor,
        info: updatedSettings.infoColor,
        success: updatedSettings.successColor,
        text: {
          primary: updatedSettings.textPrimary,
          secondary: updatedSettings.textSecondary
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid color values. Colors must be valid hex codes (e.g. #FF0000)' });
    }
    console.error('Error updating colors:', error);
    res.status(500).json({ error: 'Failed to update colors' });
  }
});

// Upload favicon
router.post('/favicon', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get current theme settings
    let themeSettings = await prisma.themeSettings.findUnique({
      where: { userId: authReq.user.id }
    });

    // Delete old favicon if exists
    if (themeSettings?.favicon) {
      await fileService.deleteFavicon(themeSettings.favicon);
    }

    // Save new file
    const filePath = await fileService.saveFavicon(authReq.file);

    // Update or create theme settings
    themeSettings = await prisma.themeSettings.upsert({
      where: { userId: authReq.user.id },
      update: { favicon: filePath },
      create: {
        userId: authReq.user.id,
        favicon: filePath
      }
    });

    res.json({ filePath });
  } catch (error) {
    console.error('Error uploading favicon:', error);
    res.status(500).json({ error: 'Failed to upload favicon' });
  }
});

// Upload logo
router.post('/logo', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get current theme settings
    let themeSettings = await prisma.themeSettings.findUnique({
      where: { userId: authReq.user.id }
    });

    // Delete old logo if exists
    if (themeSettings?.logo) {
      await fileService.deleteLogo(themeSettings.logo);
    }

    // Save new file
    const filePath = await fileService.saveLogo(authReq.file);

    // Update or create theme settings
    themeSettings = await prisma.themeSettings.upsert({
      where: { userId: authReq.user.id },
      update: { logo: filePath },
      create: {
        userId: authReq.user.id,
        logo: filePath
      }
    });

    res.json({ filePath });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Reset favicon to default
router.delete('/favicon', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const themeSettings = await prisma.themeSettings.findUnique({
      where: { userId: authReq.user.id }
    });

    // Delete old favicon if exists
    if (themeSettings?.favicon) {
      await fileService.deleteFavicon(themeSettings.favicon);
    }

    // Reset to default
    await prisma.themeSettings.update({
      where: { userId: authReq.user.id },
      data: { favicon: 'favicon.png' }
    });

    res.json({ message: 'Favicon reset to default' });
  } catch (error) {
    console.error('Error resetting favicon:', error);
    res.status(500).json({ error: 'Failed to reset favicon' });
  }
});

// Reset logo to default
router.delete('/logo', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const themeSettings = await prisma.themeSettings.findUnique({
      where: { userId: authReq.user.id }
    });

    // Delete old logo if exists
    if (themeSettings?.logo) {
      await fileService.deleteLogo(themeSettings.logo);
    }

    // Reset to default
    await prisma.themeSettings.update({
      where: { userId: authReq.user.id },
      data: { logo: 'logo.png' }
    });

    res.json({ message: 'Logo reset to default' });
  } catch (error) {
    console.error('Error resetting logo:', error);
    res.status(500).json({ error: 'Failed to reset logo' });
  }
});

export default router;
