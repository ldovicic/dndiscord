const { SlashCommandBuilder } = require('discord.js');
const { doc, getDoc, updateDoc } = require('firebase/firestore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addgold')
		.setDescription('Adds gold to the specified user.')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('User to give gold to.')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('amount')
				.setDescription('Amount of gold to give to user. Use negative values to remove.')
				.setRequired(true)),
	async execute(interaction) {
		if (interaction.member.roles.cache.has('1069977254123290624')) {
			const targetId = interaction.options.getUser('target').id;
			const amount = Number(interaction.options.getString('amount'));

			const docRef = doc(interaction.client.db, 'users', targetId);
			const docSnap = await getDoc(docRef);

			if (!amount) {
				await interaction.reply({ content: 'Invalid amount.', ephemeral: true });
			}
			else if (docSnap.exists()) {
				if (docSnap.data().currentGp + amount >= 0) {
					await updateDoc(docRef, {
						currentGp: docSnap.data().currentGp + amount,
					});
					await interaction.reply({ content: 'Successfully added gold.', ephemeral: true });
				}
				else {
					await interaction.reply({ content: 'User does not have enough gold.', ephemeral: true });
				}
			}
			else {
				await interaction.reply({ content: 'User does not have a character sheet.', ephemeral: true });
			}
		}
		else {
			await interaction.reply({ content: 'You are not a DM.', ephemeral: true });
		}
	},
};