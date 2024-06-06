import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("data")
    .setDescription("Responds with data summary.");

let constituencyCmdId;
let candidatesCmdId;
let resultsCmdId;

async function fetchCommands(interaction) {
    const commands = await interaction.client.application.commands.fetch();
    
    commands.forEach(command => {
        if (command.name === "constituency") {
            constituencyCmdId = command.id;
        }
    
        if (command.name === "candidates") {
            candidatesCmdId = command.id;
        }

        if (command.name === "results") {
            resultsCmdId = command.id;
        }
    });
}

export async function execute(interaction) {
    
    if (!constituencyCmdId || !candidatesCmdId || !resultsCmdId) {
        await fetchCommands(interaction);
    }

    let summary = "## Data Summary\n";
    summary += "Loaded " + interaction.client.data.getConstituencyCount() + " constituencies.\n"; 
    summary += "Loaded " + interaction.client.data.getResultCount() + " notional party results.\n";   
    summary += "All data is sourced from the [UK Parliament Election Results API](<https://electionresults.parliament.uk/>). ";
    summary += "Notional result data was calculated by [Colin Rallings & MIchael Thrasher](<https://www.electionscentre.co.uk/>).\n";
    summary += `For more information, use the </constituency:${constituencyCmdId}>, </candidates:${candidatesCmdId}> or </results:${resultsCmdId}> command.`;

    await interaction.reply(summary);
}