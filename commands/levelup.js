const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const { doc, getDoc, updateDoc } = require('firebase/firestore');

// creates buttons with class names
const classButtonBuilder = (row, className) => {
	row.addComponents(
		new ButtonBuilder()
			.setCustomId(className)
			.setLabel(className)
			.setStyle(ButtonStyle.Primary),
	);
};

const classSelector = async (interaction) => {
	const classes = ['Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
	const rows = [];

	// dynamically creates rows of classes (due to discord limiting buttons to 5 per row)
	let classRow = new ActionRowBuilder();
	for (let i = 0; i < classes.length; i++) {
		classButtonBuilder(classRow, classes[i]);
		if (i % 5 === 4 || i + 1 === classes.length) {
			rows.push(classRow);
			classRow = new ActionRowBuilder;
		}
	}

	// replies with choices
	await interaction.reply({
		content: 'Choose class to level up:',
		ephemeral: true,
		components: rows,
	});

	// initiates interaction collector
	const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, max: 1 });

	collector.on('collect', async (i) => {
		if (!classes.includes(i.customId)) return;

		// updates the msg with confirmation ? and replaces buttons
		await interaction.deleteReply();
		classConfirm(i);
	});
};

const classConfirm = async (interaction) => {
	const docRef = doc(interaction.client.db, 'users', interaction.user.id);
	const docSnap = await getDoc(docRef);

	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('confirmClass')
				.setLabel('Yes')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('retryClass')
				.setLabel('No')
				.setStyle(ButtonStyle.Danger),
		);

	await interaction.reply({
		content: `You have chosen **${interaction.customId}**. Is that correct?`,
		ephemeral: true,
		components: [row],
	});

	const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, max: 1 });

	collector.on('collect', async (i) => {
		await interaction.deleteReply();
		if (i.customId === 'confirmClass') {
			const updateObject = {};
			updateObject.charClass = docSnap.data().charClass;
			updateObject.charClass[interaction.customId.toLowerCase()] = Object.hasOwn(updateObject.charClass, interaction.customId.toLowerCase()) ? updateObject.charClass[interaction.customId.toLowerCase()] + 1 : 1;

			let maxHp;
			if (interaction.customId === 'Barbarian') {
				maxHp = getRandomInt(12) + 1;
			}
			else if (interaction.customId === 'Fighter' || interaction.customId === 'Paladin' || interaction.customId === 'Ranger') {
				maxHp = getRandomInt(10) + 1;
			}
			else if (interaction.customId === 'Sorcerer' || interaction.customId === 'Wizard') {
				maxHp = getRandomInt(6) + 1;
			}
			else {
				maxHp = getRandomInt(8) + 1;
			}

			const conModifier = Math.floor((docSnap.data().abilityScores.con - 10) / 2);

			let hpIncreaseString;
			if (conModifier > 0) {
				hpIncreaseString = `**${maxHp}** (rolled) + **${conModifier}** (constitution modifier) = ${maxHp + conModifier}`;
			}
			else if (conModifier == 0) {
				hpIncreaseString = `**${maxHp}** (rolled)`;
			}
			else {
				hpIncreaseString = `**${maxHp}** (rolled) - **${Math.abs(conModifier)}** (constitution modifier) = **${maxHp + conModifier}**`;
			}

			updateObject.maxHp = docSnap.data().maxHp + maxHp + conModifier;
			updateObject.currentHp = docSnap.data().currentHp + maxHp + conModifier;

			await updateDoc(docRef, updateObject);
			await i.reply({ content: `Successfully leveled up **${interaction.customId}**. Max HP increased by ${hpIncreaseString}.`, ephemeral: true });
		}
		else if (i.customId === 'retryClass') {
			classSelector(i);
		}
	});
};

const getRandomInt = (max) => {
	return Math.floor(Math.random() * max);
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levelup')
		.setDescription('Levels up your character.'),
	async execute(interaction) {
		const docRef = doc(interaction.client.db, 'users', interaction.user.id);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			if (docSnap.data().currentLvl - Object.values(docSnap.data().charClass).reduce((a, b) => a + b, 0) > 0) {
				classSelector(interaction);
			}
			else {
				await interaction.reply({ content: 'You do not have any available level-ups.', ephemeral: true });
			}
		}
		else {
			await interaction.reply({ content: 'You do not have a character sheet. Create one by using `/create`.', ephemeral: true });
		}
	},
};