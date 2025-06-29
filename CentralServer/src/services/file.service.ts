import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import logger from '../utils/logger';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

class FileService {
  private staticPath: string;

  constructor() {
    this.staticPath = path.join(__dirname, '../../public');
  }

  /**
   * Generates a unique filename with the original extension
   */
  private generateUniqueFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}${ext}`;
  }

  /**
   * Ensures the target directory exists
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await mkdirAsync(dirPath, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Saves a file to the static directory
   * @param fileBuffer - The file buffer to save
   * @param originalFilename - The original filename
   * @param subdirectory - Optional subdirectory within the static folder
   * @returns The public URL of the saved file
   */
  async saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    subdirectory: string = ''
  ): Promise<string> {
    try {
      const targetDir = path.join(this.staticPath, subdirectory);
      await this.ensureDirectory(targetDir);

      const filename = this.generateUniqueFilename(originalFilename);
      const filePath = path.join(targetDir, filename);
      
      await writeFileAsync(filePath, fileBuffer);
      
      // Return the public URL (relative to /static)
      const publicPath = path.join('/static', subdirectory, filename);
      logger.info(`File saved successfully: ${publicPath}`);
      
      return publicPath;
    } catch (error) {
      logger.error('Error saving file:', error);
      throw new Error('Failed to save file');
    }
  }

  /**
   * Deletes a file from the static directory
   * @param publicUrl - The public URL of the file to delete
   */
  async deleteFile(publicUrl: string): Promise<void> {
    try {
      // Remove '/static' prefix and convert to filesystem path
      const relativePath = publicUrl.replace('/static', '');
      const filePath = path.join(this.staticPath, relativePath);

      // Ensure the file is within the static directory
      if (!filePath.startsWith(this.staticPath)) {
        throw new Error('Invalid file path');
      }

      await unlinkAsync(filePath);
      logger.info(`File deleted successfully: ${publicUrl}`);
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Validates file type based on allowed extensions
   * @param filename - The filename to validate
   * @param allowedExtensions - Array of allowed file extensions (e.g., ['.jpg', '.png'])
   */
  validateFileType(filename: string, allowedExtensions: string[]): boolean {
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  /**
   * Gets the absolute path of a file from its public URL
   * @param publicUrl - The public URL of the file
   * @returns The absolute file path
   */
  getAbsolutePath(publicUrl: string): string {
    const relativePath = publicUrl.replace('/static', '');
    return path.join(this.staticPath, relativePath);
  }
}

export default new FileService(); 