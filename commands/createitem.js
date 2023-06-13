const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionCollector, InteractionType } = require('discord.js');
const { doc, getDoc, setDoc } = require('firebase/firestore');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('createitem')
		.setDescription('Creates a new item.'),
	async execute(interaction) {
		const modal = new ModalBuilder()
			.setCustomId('newItem')
			.setTitle('New Item');

		const itemNameInput = new TextInputBuilder()
			.setCustomId('nameInput')
			.setLabel('Item Name')
			.setStyle(TextInputStyle.Short);

		const descriptionInput = new TextInputBuilder()
			.setCustomId('descriptionInput')
			.setLabel('Item Description')
			.setStyle(TextInputStyle.Paragraph);

		const costInput = new TextInputBuilder()
			.setCustomId('costInput')
			.setLabel('Item Cost')
			.setStyle(TextInputStyle.Short);

		const nameRow = new ActionRowBuilder().addComponents(itemNameInput);
		const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
		const costRow = new ActionRowBuilder().addComponents(costInput);

		modal.addComponents(nameRow, descriptionRow, costRow);

		await interaction.showModal(modal);

		const collector = new InteractionCollector(interaction.client, { channel: interaction.channel, interactionType: InteractionType.ModalSubmit, time: 60000 });

		collector.on('collect', async (i) => {
			if (interaction.user == i.user) {
				collector.stop();
			}

			const itemName = i.fields.getTextInputValue('nameInput');
			const itemDescription = i.fields.getTextInputValue('descriptionInput');
			const itemCost = Number(i.fields.getTextInputValue('costInput'));

			const docSnap = await getDoc(doc(interaction.client.db, 'items', itemName.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-')));

			if (docSnap.exists()) {
				return await i.reply({
					content: 'Item with this name already exists.',
					ephemeral: true,
				});
			}
			else if (!itemCost) {
				return await i.reply({
					content: 'Invalid cost.',
					ephemeral: true,
				});
			}
			else {
				const newItem = {
					itemName: itemName,
					itemDescription: itemDescription,
					itemCost: itemCost,
					createdBy: i.user.id,
				};
				await setDoc(doc(interaction.client.db, 'items', i.fields.getTextInputValue('nameInput').toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-')), newItem);
				await i.reply({
					content: `**${i.fields.getTextInputValue('nameInput')}** successfully created.`,
					ephemeral: true,
				});
			}
		});
	},
};