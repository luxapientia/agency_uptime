import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class FileService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(__dirname, '../../public/uploads/theme');
    this.ensureDirectory(this.uploadDir);
  }

  private ensureDirectory(targetPath: string) {
    // Split the path into parts
    const parts = targetPath.split(path.sep);
    let currentPath = '';

    // Create each directory level if it doesn't exist
    parts.forEach(part => {
      currentPath = currentPath ? path.join(currentPath, part) : part;
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath);
        console.log(`Created directory: ${currentPath}`);
      }
    });
  }

  async saveFile(file: Express.Multer.File, fileDir: string): Promise<string> {
    try {
      this.ensureDirectory(fileDir);
      const ext = path.extname(file.originalname);
      const filename = `${file.fieldname}-${uuidv4()}${ext}`;
      const filePath = path.join(fileDir, filename);

      // Write buffer to file
      fs.writeFileSync(filePath, file.buffer);

      return filename;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Failed to save file');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      console.log(filePath);
      // Don't delete default files
      if (filePath.includes('favicon.png') || filePath.includes('logo.png')) {
        return;
      }
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        console.log('File not found');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  async saveFavicon(file: Express.Multer.File): Promise<string> {
    const filename = await this.saveFile(file, path.join(__dirname, '../../public/uploads/theme'));
    return `uploads/theme/${filename}`;
  }

  async saveLogo(file: Express.Multer.File): Promise<string> {
    const filename = await this.saveFile(file, path.join(__dirname, '../../public/uploads/theme'));
    return `uploads/theme/${filename}`;
  }

  async deleteFavicon(filePath: string): Promise<void> {
    await this.deleteFile(path.join(__dirname, '../../public', filePath));
  }

  async deleteLogo(filePath: string): Promise<void> {
    await this.deleteFile(path.join(__dirname, '../../public', filePath));
  }
}

export default new FileService(); 