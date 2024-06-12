import { state } from "../util/state.js";
import { ActionRowBuilder, ApplicationCommandType, ContextMenuCommandBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder } from "discord.js";
import "dotenv/config";

export const slashCommand = new SlashCommandBuilder()
    .setName("sandra")
    .setDescription("Speak to Sandra");

export const messageCommand = new ContextMenuCommandBuilder()
    .setName("Speak to Sandra")
    .setType(ApplicationCommandType.Message);

export const userCommand = new ContextMenuCommandBuilder()
    .setName("Speak to Sandra")
    .setType(ApplicationCommandType.User);

const usernameInput = new TextInputBuilder()
    .setCustomId("sandra_username")
    .setLabel("Optional: Enter a username")
    .setRequired(false)
    .setPlaceholder("Anonymous BEcord User")
    .setStyle(1);

const messageInput = new TextInputBuilder()
    .setCustomId("sandra_message")
    .setLabel("Enter your message")
    .setRequired(true)
    .setPlaceholder("Dear Sandra, I have a question about the BEcord server...")
    .setStyle(2);

export const sandraModal = new ModalBuilder()
    .setCustomId("sandra")
    .setTitle("Speak to Sandra")
    .addComponents(
        new ActionRowBuilder().addComponents(messageInput), 
        new ActionRowBuilder().addComponents(usernameInput)
    );

// const guildID = await state.get("sandra_guild_id");
// const channelID = await state.get("sandra_channel_id");

const guildID = process.env.DISCORD_GUILD_ID;
const channelID = process.env.DISCORD_CHANNEL_ID;

function splitTextIntoChunks(text) {
    const chunks = [];
    let currentChunk = "";
    const lines = text.split(" ");

    for (const line of lines) {
        if (currentChunk.length + line.length + 1 <= 2000) {
            currentChunk += line + " ";
        } else {
            chunks.push(currentChunk);
            currentChunk = line + " ";
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.substring(0, 2000));
        currentChunk = currentChunk.substring(2000);
        chunks.push(currentChunk);
    }

    return chunks;
}

// Respond with a modal
export async function showModal(interaction) {
    if (interaction.guildId != guildID) return;

    await interaction.showModal(sandraModal);
}

// respond to the modal submit
export async function handleModalResponse(interaction) {
    let username = interaction.fields.getTextInputValue("sandra_username");
    if (username == "") {
        username = "[Anonymous BEcord User]";
    }

    const message = interaction.fields.getTextInputValue("sandra_message");
    if (message == "") {
        await interaction.reply({ content: "Sandra message not submitted. Reason: You must enter a message.", ephemeral: true });
        return;
    }

    const channel = await interaction.client.channels.fetch(channelID);

    let content = `### New Speak To Sandra\n__Username__: ${username}\n__Message__: ${message}`
    let chunks = splitTextIntoChunks(content);

    for (let chunk of chunks) {
        if (chunk == "") continue; 
        await channel.send({ content: chunk });
    }
    await interaction.reply({ content: "Your message has been sent to Sandra.", ephemeral: true });
}

// export async function 