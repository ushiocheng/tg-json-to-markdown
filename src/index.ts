// Import necessary modules
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Get input and output paths from command-line arguments
const args = process.argv.slice(2);
const verbose = args.includes("-v");
const filteredArgs = args.filter((arg) => arg !== "-v");

if (filteredArgs.length < 2) {
    console.error(
        "Usage: ts-node script.ts <input_json_path> <output_md_path> [-v]"
    );
    process.exit(1);
}
const inputFilePath = path.resolve(filteredArgs[0]);
const outputFilePath = path.resolve(filteredArgs[1]);
const inputDir = path.dirname(inputFilePath);

if (verbose) {
    console.log("Input file:", inputFilePath);
    console.log("Output file:", outputFilePath);
    console.log("Input directory:", inputDir);
}

const mdFilesDir = path.join(path.dirname(outputFilePath), "md-files");
if (!fs.existsSync(mdFilesDir)) {
    fs.mkdirSync(mdFilesDir, { recursive: true });
    if (verbose) console.log("Created md-files directory:", mdFilesDir);
} else if (verbose) {
    console.log("md-files directory already exists:", mdFilesDir);
}

const escapeMarkdown = (text: string): string => {
    return text.replace(/([*_`~|<>\[\]\\])/g, "\\$1");
};

const copyAndRenameFile = (relativeFilePath: string): string => {
    const absoluteFilePath = path.resolve(inputDir, relativeFilePath);
    if (verbose) console.log("Processing file:", absoluteFilePath);

    if (!fs.existsSync(absoluteFilePath)) {
        console.warn("File not found:", absoluteFilePath);
        return relativeFilePath;
    }

    const hash = execSync(`shasum -a 256 "${absoluteFilePath}"`)
        .toString()
        .split(" ")[0];
    if (verbose) console.log("SHA-256 hash:", hash);

    const ext = path.extname(relativeFilePath);
    const newFileName = `${hash}${ext}`;
    const newFilePath = path.join(mdFilesDir, newFileName);

    if (!fs.existsSync(newFilePath)) {
        fs.copyFileSync(absoluteFilePath, newFilePath);
        if (verbose) console.log("Copied file to:", newFilePath);
    } else if (verbose) {
        console.log("File already exists, skipping copy:", newFilePath);
    }
    return `md-files/${newFileName}`;
};

const processSingleMessage = (msg: any) => {
    let messageContent = "";
    if (msg.reply_to_message_id) {
        messageContent += `\\> Reply to message ID: ${msg.reply_to_message_id}\n`;
    }
    if (msg.forward_from) {
        messageContent += `\\> Forwarded from: ${msg.forward_from}\n`;
    }
    if (msg.photo) {
        if (verbose) console.log("Message contains photo:", msg.photo);
        const newPath = copyAndRenameFile(msg.photo);
        messageContent += `![](${newPath})\n`;
    }
    if (msg.text) {
        if (typeof msg.text === "string") {
            messageContent += escapeMarkdown(msg.text);
        }
        if (Array.isArray(msg.text)) {
            messageContent += msg.text
                .map((part: any) => {
                    return escapeMarkdown(part.text || "");
                })
                .join("");
        }
    }
    if (msg.file) {
        if (verbose) console.log("Message contains file:", msg.file);
        const newPath = copyAndRenameFile(msg.file);
        messageContent += `${msg.media_type == "sticker" ? "!" : ""}[${
            msg.file_name
        }${msg.media_type == "sticker" ? "|200" : ""}](${newPath})`;
    }
    return messageContent;
};

// Function to process Telegram JSON dump to Markdown
const processChatToMarkdown = (filePath: string, outputFile: string) => {
    try {
        if (verbose) console.log("Reading chat JSON file...");
        const jsonData = fs.readFileSync(filePath, "utf-8");
        const chatData = JSON.parse(jsonData);
        if (verbose) console.log("Successfully parsed JSON data.");

        let markdownOutput = `# Chat Export\n\n`;

        chatData.messages.forEach((msg: any) => {
            if (verbose)
                console.log("Processing message from:", msg.from || "Unknown");
            markdownOutput += `\\[${msg.id}\\] `;
            markdownOutput += `From: ${msg.from || "Unknown"}`;
            markdownOutput += `    At: ${msg.date}\n`;
            markdownOutput += processSingleMessage(msg);
            markdownOutput += `\n\n---\n\n`;
        });

        // Write to Markdown file
        fs.writeFileSync(outputFile, markdownOutput);
        console.log("Markdown file created:", outputFile);
    } catch (error) {
        console.error("Error processing chat:", error);
    }
};

// Run the processing function
processChatToMarkdown(inputFilePath, outputFilePath);
