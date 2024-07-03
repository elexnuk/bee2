import { SlashCommandBuilder } from "discord.js";

export const votedCommand = new SlashCommandBuilder()
    .setName("voted")
    .setDescription("Tell us you've voted in the election!");

// Time when you can no longer vote afterwards
const VOTING_ENDED = new Date(process.env.VOTING_ENDED) // "2024-07-03T22:05:00+00:00"

// ID for the "I Voted" role in the server
const VOTED_ROLE_ID = process.env.VOTED_ROLE_ID;

const exitPoll = process.env.EXIT_POLL_LINK;

export async function handleVoted(interaction) {
    // check user has the voted role
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (member.roles.cache.has(VOTED_ROLE_ID)) {
        await interaction.reply({ content: "🗳️ | You've already told us you've voted! Have you answered the exit poll?\n\n" + exitPoll, ephemeral: true });
        return;
    }
    
    let currentTime = new Date();
    if (currentTime > VOTING_ENDED) {
        await interaction.reply({ content: " 🗳️ | Voting has ended. You can no longer tell us you've voted. Keep an eye out for the results as they come in!", ephemeral: true });
        return;
    }

    // Add the "I Voted" role to the user
    await interaction.guild.members.addRole({ user: interaction.user.id, role: VOTED_ROLE_ID })
    
    // Reply to the user
    await interaction.reply({ content: " 🗳️ | Thank you for telling us you've voted! Why not answer our exit poll!\n\n" + exitPoll, ephemeral: true})
};