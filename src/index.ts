// Import necessary modules
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Get input and output paths from command-line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error(
        "Usage: ts-node script.ts <input_json_path> <output_md_path>"
    );
    process.exit(1);
}
const inputFilePath = path.resolve(args[0]);
const outputFilePath = path.resolve(args[1]);
const inputDir = path.dirname(inputFilePath);

console.log("Input file:", inputFilePath);
console.log("Output file:", outputFilePath);
console.log("Input directory:", inputDir);

const mdFilesDir = path.join(path.dirname(outputFilePath), "md-files");
if (!fs.existsSync(mdFilesDir)) {
    fs.mkdirSync(mdFilesDir, { recursive: true });
    console.log("Created md-files directory:", mdFilesDir);
} else {
    console.log("md-files directory already exists:", mdFilesDir);
}

const copyAndRenameFile = (relativeFilePath: string): string => {
    const absoluteFilePath = path.resolve(inputDir, relativeFilePath);
    console.log("Processing file:", absoluteFilePath);
    
    if (!fs.existsSync(absoluteFilePath)) {
        console.warn("File not found:", absoluteFilePath);
        return relativeFilePath;
    }
    
    const hash = execSync(`shasum -a 256 "${absoluteFilePath}"`).toString().split(" ")[0];
    console.log("SHA-256 hash:", hash);
    
    const ext = path.extname(relativeFilePath);
    const newFileName = `${hash}${ext}`;
    const newFilePath = path.join(mdFilesDir, newFileName);
    
    if (!fs.existsSync(newFilePath)) {
        fs.copyFileSync(absoluteFilePath, newFilePath);
        console.log("Copied file to:", newFilePath);
    } else {
        console.log("File already exists, skipping copy:", newFilePath);
    }
    return `md-files/${newFileName}`;
};

const processSingleMessage = (msg: any) => {
    let messageContent = "";
    if (msg.text) {
        if (typeof msg.text === "string") {
            messageContent += msg.text;
        }
        if (Array.isArray(msg.text)) {
            messageContent = msg.text
                .map((part: any) => {
                    return part.text || "";
                })
                .join("");
        }
    }
    if (msg.file) {
        console.log("Message contains file:", msg.file);
        const newPath = copyAndRenameFile(msg.file);
        messageContent += `![${msg.file_name}${msg.media_type == "sticker"? "|200":""}](${newPath})`;
    }
    return messageContent;
};

// Function to process Telegram JSON dump to Markdown
const processChatToMarkdown = (filePath: string, outputFile: string) => {
    try {
        console.log("Reading chat JSON file...");
        const jsonData = fs.readFileSync(filePath, "utf-8");
        const chatData = JSON.parse(jsonData);
        console.log("Successfully parsed JSON data.");

        let markdownOutput = `# Chat Export\n\n`;

        chatData.messages.forEach((msg: any) => {
            console.log("Processing message from:", msg.from || "Unknown");
            markdownOutput += `${msg.id} ${msg.date}\n`;
            if (msg.reply_to_message_id) {
                markdownOutput += `Reply to: ${msg.reply_to_message_id}\n`;
            }
            markdownOutput += `**${
                msg.from || "Unknown"
            }**: ${processSingleMessage(msg)}\n\n`;
            markdownOutput += "---\n\n";
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