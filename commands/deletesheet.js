const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionCollector, InteractionType } = require('discord.js');
const { doc, getDoc, deleteDoc } = require('firebase/firestore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Deletes YOUR character sheet.'),
	async execute(interaction) {
		const docSnap = await getDoc(doc(interaction.client.db, 'users', interaction.user.id));

		if (docSnap.exists()) {
			const delModal = new ModalBuilder()
				.setCustomId('delModal')
				.setTitle('Confirm deletion');

			const delConfirm = new TextInputBuilder()
				.setCustomId('delConfirm')
				.setLabel('Type "DELETE" to delete your character sheet.')
				.setStyle(TextInputStyle.Short);

			const actionRow = new ActionRowBuilder().addComponents(delConfirm);

			delModal.addComponents(actionRow);

			await interaction.showModal(delModal);

			const collector = new InteractionCollector(interaction.client, { channel: interaction.channel, interactionType: InteractionType.ModalSubmit, max: 1, time: 60000 });

			collector.on('collect', async (i) => {
				const answer = i.fields.getTextInputValue('delConfirm');

				if (answer.toLowerCase() === 'delete') {
					await deleteDoc(doc(i.client.db, 'users', i.user.id));
					await i.reply({ content: 'Your character sheet has been deleted.', ephemeral: true });
					const roles = [
						'1070079703261651036',
						'1070079893871788163',
						'1070079896296112201',
						'1070079897369849858',
						'1070079898934312990',
						'1070079900192612473',
						'1070079901098594334',
						'1070079902403014706',
						'1070079903556456468',
						'1070079904495960115',
						'1070079905695531091',
						'1070079906710560859',
						'1070079908296016012',
						'1070079909554307212',
						'1070079910590296206',
						'1070079911500464148',
						'1070080220859744407',
						'1070080222810079295',
						'1070080224290684978',
						'1070080283308720191',
					];

					for (const roleId of roles) {
						interaction.guild.roles.fetch(roleId).then(removeRole => {
							interaction.member.roles.remove(removeRole);
						});
					}
				}
				else {
					await i.reply({ content: 'Failed to delete character sheet.', ephemeral: true });
				}
			});
		}
		else {
			interaction.reply({ content: 'You don\'t have a character sheet. Create one using `/create`.', ephemeral: true });
		}
	},
};