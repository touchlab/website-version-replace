import * as core from '@actions/core'
import fs from "fs/promises";
import {parse, Tree} from "dot-properties";
import * as path from "path";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const file: string = core.getInput('file')
    const src = await fs.readFile(file, 'utf8')

    const allProperties = parse(src)

    await processDir(".", allProperties)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function processDir(basePath: string, allProperties: Tree) {
  const dirFiles = await fs.readdir(basePath, { withFileTypes: true })
  for (const entryPath of dirFiles) {
    const joinedPath = path.join(basePath, entryPath.name)

    if(entryPath.isDirectory()){
      processDir(joinedPath, allProperties)
    }else {
      if(entryPath.path.endsWith(".md") || entryPath.path.endsWith(".mdx")){
        const src = await fs.readFile(joinedPath, 'utf8')
        let replacedSrc = src
        for (const [key, value] of Object.entries(allProperties)) {
          console.log(`${key}: ${value}`);
          replacedSrc = replacedSrc.replaceAll(`{{${key}}}`, `${value}`)
        }
        await fs.writeFile(joinedPath, replacedSrc, 'utf8')
      }
    }
  }
}