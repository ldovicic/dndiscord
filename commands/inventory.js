const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { doc, getDoc } = require('firebase/firestore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription('Displays inventory.')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('Selects user whose inventory will be displayed.')),
	async execute(interaction) {
		const target = interaction.options.getUser('target') ?? interaction.user;
		const targetId = target.id;

		const docSnap = await getDoc(doc(interaction.client.db, 'users', targetId));

		if (docSnap.exists()) {
			const embed = new EmbedBuilder()
				.setColor(0x5e9cff)
				.setTitle(`${docSnap.data().charName}'s inventory`)
				.setAuthor({ name: target.username, iconURL: target.displayAvatarURL() });
				// .addFields(
				// 	{ name: 'Current Level', value: docSnap.data().currentLvl.toString(), inline: true },
				// );

			if (!docSnap.data().items || docSnap.data().items.length == 0) {
				embed.addFields({ name: 'User has no items.', value: '\u200B' });
			}
			else {
				embed.addFields({ name: 'Items', value: docSnap.data().items.join(', ') });
			}

			await interaction.reply({
				embeds: [embed],
			});
		}
		else {
			await interaction.reply({
				content: 'Selected user does not have a character sheet. Create one by using `/create`',
				ephemeral: true,
			});
		}
	},
};