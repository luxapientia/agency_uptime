import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export async function initializePrompts() {
  try {
    // Read prompts from JSON file
    const promptsPath = path.join(__dirname, '../../prisma/aiPrompt.json');
    const promptsData = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));

    for (const promptData of promptsData) {
      await prisma.aIPrompt.upsert({
        where: { name: promptData.name },
        update: {
          title: promptData.title,
          description: promptData.description,
          systemPrompt: promptData.systemPrompt,
          userPromptTemplate: promptData.userPromptTemplate,
          isActive: promptData.isActive
        },
        create: {
          name: promptData.name,
          title: promptData.title,
          description: promptData.description,
          systemPrompt: promptData.systemPrompt,
          userPromptTemplate: promptData.userPromptTemplate,
          isActive: promptData.isActive
        }
      });
    }

    console.log('✅ AI prompts initialized successfully from aiPrompt.json');
  } catch (error) {
    console.error('❌ Failed to initialize AI prompts:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializePrompts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 