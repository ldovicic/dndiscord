const { SlashCommandBuilder } = require('discord.js');
const { doc, getDoc, updateDoc } = require('firebase/firestore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Displays or changes character sheet avatar.')
		.addStringOption(option =>
			option
				.setName('url')
				.setDescription('Enter URL to change your character sheet avatar.')),
	async execute(interaction) {
		const url = interaction.options.getString('url');

		const docRef = doc(interaction.client.db, 'users', interaction.user.id);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			if (url) {
				await updateDoc(docRef, {
					avatarUrl: url,
				});
				await interaction.reply({
					content: 'Successfully changed avatar.',
					ephemeral: true,
				});
			}
			else if (docSnap.data().avatarUrl) {
				await interaction.reply(docSnap.data().avatarUrl);
			}
			else {
				await interaction.reply({
					content: 'You did not set an avatar.',
					ephemeral: true,
				});
			}
		}
		else {
			await interaction.reply({
				content: 'You do not have a character sheet. Create one by using `/create`',
				ephemeral: true,
			});
		}
	},
};