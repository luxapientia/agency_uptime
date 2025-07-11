import { Router, Request, Response } from 'express';
import multer from 'multer';
import fileService from '../services/file.service';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

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
