const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { doc, getDoc, updateDoc } = require('firebase/firestore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setstat')
		.setDescription('Sets a stat to the specified value.')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('User whose stat to change.')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('stat')
				.setDescription('Choose which stat to adjust.')
				.setRequired(true)
				.addChoices(
					{ name: 'strength', value: 'str' },
					{ name: 'dexterity', value: 'dex' },
					{ name: 'constitution', value: 'con' },
					{ name: 'intelligence', value: 'int' },
					{ name: 'wisdom', value: 'wis' },
					{ name: 'charisma', value: 'cha' },
				))
		.addStringOption(option =>
			option
				.setName('value')
				.setDescription('Value to set the stat to.')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const targetId = interaction.options.getUser('target').id;
		const stat = interaction.options.getString('stat');
		const value = Number(interaction.options.getString('value'));

		const docRef = doc(interaction.client.db, 'users', targetId);
		const docSnap = await getDoc(docRef);

		if (!value) {
			await interaction.reply({ content: 'Invalid value.', ephemeral: true });
		}
		else if (docSnap.exists()) {
			const updateObject = {};
			updateObject.abilityScores = docSnap.data().abilityScores;
			updateObject.abilityScores[stat] = value;
			await updateDoc(docRef, updateObject);
			await interaction.reply({ content: 'Successfully set a stat.', ephemeral: true });
		}
		else {
			await interaction.reply({ content: 'User does not have a character sheet.', ephemeral: true });
		}
	},
};