#!/usr/bin/env node

/**
 * Pre-processes Twitter archive JS files into standard JSON
 * Usage: node scripts/preprocess-twitter.js <twitter-archive-path>
 */

import fs from 'fs/promises';
import path from 'path';

async function preprocessTwitterArchive(archivePath) {
  const dataDir = path.join(archivePath, 'data');
  const outputDir = path.join(archivePath, 'data-json');
  
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    const files = await fs.readdir(dataDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    console.log(`Found ${jsFiles.length} JS files to process`);
    
    for (const file of jsFiles) {
      const content = await fs.readFile(path.join(dataDir, file), 'utf-8');
      
      // Extract JSON from window.YTD.*.part0 = [...]
      const match = content.match(/window\.YTD\.[^.]+\.part\d+\s*=\s*(\[[\s\S]*\])/);
      
      if (match) {
        const jsonData = JSON.parse(match[1]);
        const jsonFile = file.replace('.js', '.json');
        
        await fs.writeFile(
          path.join(outputDir, jsonFile),
          JSON.stringify(jsonData, null, 2)
        );
        
        console.log(`✓ Converted ${file} → ${jsonFile}`);
      } else {
        console.log(`✗ Skipped ${file} (no data found)`);
      }
    }
    
    console.log(`\nProcessed files saved to: ${outputDir}`);
    console.log('You can now run the validator on this directory');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv.length < 3) {
  console.error('Usage: node scripts/preprocess-twitter.js <twitter-archive-path>');
  process.exit(1);
}

preprocessTwitterArchive(process.argv[2]);