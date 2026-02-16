import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';

const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

export interface TmpFile {
  path: string;
  cleanup: () => Promise<void>;
}

export interface TmpDir {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Create a temporary file in the specified directory
 * @param tmpDir - Base temporary directory (from environment variable)
 * @param prefix - Prefix for the temp file name
 * @param postfix - File extension (e.g., '.zip')
 * @returns Object with path and cleanup function
 */
export async function createTmpFile(
  tmpDir: string,
  prefix: string = 'tmp-',
  postfix: string = '',
): Promise<TmpFile> {
  // Ensure tmp directory exists
  await ensureDirExists(tmpDir);

  // Generate unique filename
  const fileName = `${prefix}${randomUUID()}${postfix}`;
  const filePath = path.join(tmpDir, fileName);

  // Create empty file
  await fs.promises.writeFile(filePath, '');

  const cleanup = async () => {
    try {
      await unlink(filePath);
    } catch (err) {
      // File might already be deleted, ignore error
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to cleanup tmp file ${filePath}:`, err);
      }
    }
  };

  return { path: filePath, cleanup };
}

/**
 * Create a temporary directory in the specified directory
 * @param tmpDir - Base temporary directory (from environment variable)
 * @param prefix - Prefix for the temp directory name
 * @returns Object with path and cleanup function
 */
export async function createTmpDir(
  tmpDir: string,
  prefix: string = 'tmp-',
): Promise<TmpDir> {
  // Ensure tmp directory exists
  await ensureDirExists(tmpDir);

  // Generate unique directory name
  const dirName = `${prefix}${randomUUID()}`;
  const dirPath = path.join(tmpDir, dirName);

  // Create directory
  await mkdir(dirPath, { recursive: true });

  const cleanup = async () => {
    try {
      await fs.promises.rm(dirPath, { recursive: true, force: true });
    } catch (err) {
      // Directory might already be deleted, ignore error
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to cleanup tmp directory ${dirPath}:`, err);
      }
    }
  };

  return { path: dirPath, cleanup };
}

/**
 * Ensure a directory exists, create it if it doesn't
 * @param dirPath - Directory path to ensure exists
 */
async function ensureDirExists(dirPath: string): Promise<void> {
  try {
    await stat(dirPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      // Directory doesn't exist, create it
      await mkdir(dirPath, { recursive: true });
    } else {
      throw err;
    }
  }
}
