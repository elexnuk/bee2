import { ChannelType, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { state } from "../../util/state.js";

export const data = new SlashCommandBuilder()
    .setName("nofication")
    .setDescription("Manage the notifications for the server.")
    .addSubcommandGroup(subcommandGroup => subcommandGroup.setName("channel")
        .setDescription("Manage the notification channel for the server.")
        .addSubcommand(subcommand => subcommand.setName("set")
            .setDescription("Set the notification channel for the server. Requires Manage Channels permissions.")
            .addChannelOption(option => 
                option.setName("channel")
                    .addChannelTypes(ChannelType.GuildAnnouncement)
                    .setDescription("The channel to publish election results to.")
                    .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand.setName("get")
            .setDescription("Get the notification channel for the server.")
        )
    );

export async function execute(interaction) {

    let subcommand = interaction.options.getSubcommand();
    if (subcommand == "set") {      
        let permissions = interaction.memberPermissions;
        if (!permissions.has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({ content: "You need `Manage Channels` permissions to set the notification channel.", ephemeral: true });
            return;
        }

        const channel = interaction.options.getChannel("channel");
        const guild = interaction.guild;

        let channels = await state.get("notification_channels") || [];

        // Update if the guild already has a channel set
        for (let c of channels) {
            if (c.guild === guild.id) {
                c.channel = channel.id;
                console.log(`Updated Guild ${guild.id} Channel ${channel.id} in election channels.`);
                await state.set("notification_channels", channels);
                await interaction.reply({ content: "Notification channel has been updated.", ephemeral: true });
                return;
            }
        }
        
        // Add the channel if it doesn't exist
        channels.push({ guild: guild.id, channel: channel.id });
        console.log(`Added Guild ${guild.id} Channel ${channel.id} to election channels.`);
        await state.set("notification_channels", channels);
        await interaction.reply({ content: "Notification channel has been set.", ephemeral: true });

    } else if (subcommand == "get") {
        let guild = interaction.guild.id;
        const election_channels = await state.get("notification_channels");
        for (let c of election_channels) {
            if (c.guild === guild) {
                await interaction.reply({ content: `The notification channel in this server is: <#${c.channel}>` });
                return;
            }
        }

        await interaction.reply({ content: "Couldn't find a notification channel for this server. Use the set command to set one.", ephemeral: true });
    } else {
        await interaction.reply({ content: "Invalid subcommand.", ephemeral: true });
    }
}