# Telegram JSON to Markdown Converter

> [!warn]
> This repo is for personal use, RTFC (read that fantastic code) before running  
> As is anything for personal use. This script works on my machine running linux.  
> LLM is used heavily to make this in under an hour. Errors may exist and I didn't proof read everything.

## Overview
This repo converts Telegram JSON chat exports into a Markdown file while preserving media and stickers. It also organizes and deduplicates media files using SHA-256 hashes.

## Features
- Converts Telegram's `result.json` into a readable Markdown format.
- Copies and renames media files (photos, videos, stickers) into an organized `md-files/` directory.
- Deduplicates media files using their SHA-256 hash.
- Works with Telegram's exported directory structure dynamically.

## Prerequisites
- Node.js installed
- `ts-node` installed globally (`npm install -g ts-node`)
- The Telegram chat export folder (contains `result.json` and media subfolders)
- Linux/macOS system with `shasum` command available (for hashing)

## Installation
```sh
npm install
```

## Usage
Run the script using:
```sh
ts-node script.ts <input_json_path> <output_md_path>
```

### Example
```sh
ts-node script.ts /path/to/telegram_export/result.json /path/to/output/chat.md
```

### What Happens?
1. The script reads `result.json` and processes messages.
2. Media files (photos, videos, stickers) referenced in the chat are copied to `md-files/`.
3. Files are renamed based on their SHA-256 hash to remove duplicates.
4. The Markdown file is created with links to the deduplicated media files.

## Output Structure
```
/output_folder/
  ├── chat.md             # Markdown file with the chat log
  ├── md-files/           # Folder containing deduplicated media files
      ├── <SHA256>.jpg    # Example renamed media file
      ├── <SHA256>.mp4
```

## Notes
- The script dynamically resolves paths, so it works regardless of Telegram's folder structure.
- If files are missing, ensure `result.json` contains valid relative paths to media files.

## Troubleshooting
- **Media not found?** Check that the paths inside `result.json` correctly match files in the Telegram export.
- **Permission errors?** Try running the script with proper read/write permissions for the output folder.
- **SHA-256 command not found?** Ensure you have `shasum` installed (default on macOS/Linux). If using Windows, install an equivalent hashing tool.

## License
MIT License

